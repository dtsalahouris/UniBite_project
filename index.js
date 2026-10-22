const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const auth = require("./middleware/auth");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req,file,cb)=>{
    cb(null,Date.now()+path.extname(file.originalname));
  }
});
const upload = multer({storage});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads',express.static('uploads'));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

// Test DB Connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS solution");
    res.json({ message: "Database connected!", solution: rows[0].solution });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Database connection failed", details: error.message });
  }
});

app.get("/api/allergens", async (req,res) => {
  try {
    const [allergens] = await db.query("SELECT * FROM allergens ORDER BY name ASC");
    res.json(allergens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Meals feed
app.get("/api/meals", async (req, res) => {
  const { lat, lng, radius } = req.query;

  try {
    let distanceSql = "0";
    let havingClause = "";

    if (lat && lng) {
      distanceSql = `( 6371 * acos( cos( radians(${db.escape(lat)}) ) * cos( radians( m.latitude ) ) * cos( radians( m.longitude ) - radians(${db.escape(lng)}) ) + sin( radians(${db.escape(lat)}) ) * sin( radians( m.latitude ) ) ) )`;
      
      if (radius) {
         havingClause = `HAVING distance < ${db.escape(radius)}`;
      }
    }

    const [meals] = await db.query(`
            SELECT
                m.*,
                ${distanceSql} as distance,
                u.full_name as cook_name,
                GROUP_CONCAT(a.name SEPARATOR ', ') as allergens,
                COALESCE((SELECT AVG(r.rating_value) FROM ratings r WHERE r.cook_id = m.cook_id), 0) as cook_avg_rating,
                (SELECT COUNT(r.rating_value) FROM ratings r WHERE r.cook_id = m.cook_id) as
                cook_rating_count
            FROM meals m
            JOIN users u ON m.cook_id = u.id
            LEFT JOIN meal_allergens ma ON m.id = ma.meal_id
            LEFT JOIN allergens a ON ma.allergen_id = a.id
            WHERE m.created_at >= NOW() - INTERVAL 48 HOUR
            AND m.deleted_at IS NULL
            GROUP BY m.id
            ${havingClause}
            ORDER BY distance ASC, m.created_at DESC
        `);
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/meals/:id",auth,async(req,res)=>
{
  if(req.user.role !== 'cook')return res.status(403).json({error:"Only cooks can delete meals"});
  try{
    const[meal]=await db.query("SELECT cook_id FROM meals WHERE id = ?",[req.params.id]);
    if(meal.length === 0)return res.status(404).json({error:"Meal not found"});
    if(meal[0].cook_id !== req.user.id) return res.status(403).json({error:"Not your meal"});

    await db.query("UPDATE meals SET deleted_at = NOW() WHERE id = ?",[req.params.id]);
    res.json({message:"Meal deleted succesfully"});
  }catch(error){
    res.status(500).json({error:error.message});
  }
});

app.post("/api/requests",auth, async (req, res) => {
  const {meal_id} = req.body;
  const consumer_id =req.user.id;

  try {
    const [user] = await db.query("SELECT points FROM users WHERE id = ?",[consumer_id]);
    if(user[0].points <= 0){
      return res.status(403).json({error: "Insufficient points to request a meal."});
    }
  
    const [meal] = await db.query("SELECT portions_available FROM meals WHERE id = ?",[meal_id]);
    if(meal[0].portions_available <= 0){
      return res.status(400).json({error: "This meal is currently sold out."});
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        "INSERT INTO requests (meal_id,consumer_id,status,requested_at) VALUES (?,?,'pending',NOW())",
        [meal_id,consumer_id]
      );
      await connection.query("UPDATE users SET points = points - 1 WHERE id = ?", [consumer_id]);
      await connection.query(
        "INSERT INTO point_transactions(user_id,request_id,change_amount,reason) VALUES (?,?,-1,'meal_request')",
        [consumer_id, result.insertId]
      );
      await connection.commit();
      res.status(201).json({message:"Request sent succesfully!"});
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }catch(error){
    res.status(500).json({error:error.message});
  }
});

app.post("/api/meals", auth, upload.single('image'), async(req,res)=>{
  if(req.user.role !== 'cook'){
    return res.status(403).json({error: "only cooks can post meals"});
  }
  const{title,notes,portions_total,pickup_location,pickup_time, latitude, longitude}=req.body;
  
  let allergens = [];
  if (req.body.allergens) {
    allergens = JSON.parse(req.body.allergens);
  }
  
  const photo_path = req.file ? 'uploads/' + req.file.filename : null;

  try{
    const[result]=await db.query(
      `INSERT INTO meals(cook_id,title,photo_path,notes,portions_total,portions_available,pickup_location,pickup_time,latitude,longitude)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
       [req.user.id,title,photo_path,notes,portions_total,portions_total,pickup_location,pickup_time, latitude || null, longitude || null]
    );
    const mealId = result.insertId;
    if(allergens && allergens.length>0){
      for(const allergenId of allergens){
        await db.query("INSERT INTO meal_allergens(meal_id,allergen_id) VALUES(?,?)", [mealId,allergenId]);
      }
    }
    res.status(201).json({message: "Meal posted succesfully!",mealId});
  }catch(error){
    res.status(500).json({error:error.message});
  }
});

app.put("/api/meals/:id", auth, async (req, res) => {
  if (req.user.role !== 'cook') {
    return res.status(403).json({error: "Only cooks can edit meals"});
  }
  
  const { title, notes, pickup_location, pickup_time, latitude, longitude } = req.body;
  const mealId = req.params.id;

  try {
    const [meal] = await db.query("SELECT cook_id FROM meals WHERE id = ?", [mealId]);
    if (meal.length === 0) return res.status(404).json({error: "Meal not found"});
    if (meal[0].cook_id !== req.user.id) return res.status(403).json({error: "Not your meal"});

    await db.query(
      "UPDATE meals SET title=?, notes=?, pickup_location=?, pickup_time=?, latitude=?, longitude=? WHERE id=?",
      [title, notes, pickup_location, pickup_time, latitude || null, longitude || null, mealId]
    );
    res.json({ message: "Meal updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Requests for a Cook's Dashboard
app.get("/api/requests/cook", auth, async (req, res) => {
  if (req.user.role !== "cook") {
    return res.status(403).json({ error: "Access denied. Cooks only." });
  }

  try {
    const [requests] = await db.query(
      `SELECT 
        r.id, r.status, r.requested_at, r.meal_id,
        m.title as meal_title, m.portions_available,
        u.full_name as consumer_name, u.email as consumer_email
      FROM requests r
      JOIN meals m ON r.meal_id = m.id
      JOIN users u ON r.consumer_id = u.id
      WHERE m.cook_id = ?
      ORDER BY r.requested_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/requests/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  const requestId = req.params.id;

  try {
    const [requestData] = await db.query(
      `SELECT r.*, m.cook_id, m.portions_available 
       FROM requests r 
       JOIN meals m ON r.meal_id = m.id 
       WHERE r.id = ?`,
      [requestId]
    );

    if (requestData.length === 0) return res.status(404).json({ error: "Request not found." });
    if (requestData[0].cook_id !== req.user.id) return res.status(403).json({ error: "Not your meal." });

    const currentRequest = requestData[0];

    if (status === "picked_up") {
      if (currentRequest.status !== "approved") return res.status(400).json({ error: "Must be approved first." });
      
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE requests SET status = 'picked_up', picked_up_at = NOW() WHERE id = ?", [requestId]);
        
        await connection.query("UPDATE users SET points = points + 1 WHERE id = ?", [currentRequest.cook_id]);
        await connection.query(
          "INSERT INTO point_transactions(user_id,request_id,change_amount,reason) VALUES (?,?,1,'meal_pickup')",
          [currentRequest.cook_id,requestId]
        );
        
        await connection.commit();
        res.json({ message: "Pick-up confirmed!, the points are transferred!" });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally { connection.release(); }
    } else if (status === "not_picked_up") {
      if (currentRequest.status !== "approved") return res.status(400).json({ error: "Must be approved first." });
      
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE requests SET status = 'not_picked_up' WHERE id = ?", [requestId]);
        
        await connection.query("UPDATE meals SET portions_available = portions_available + 1 WHERE id = ?", [currentRequest.meal_id]);

        await connection.query("UPDATE users SET points = points + 1 WHERE id = ?", [currentRequest.consumer_id]);
        await connection.query(
          "INSERT INTO point_transactions(user_id,request_id,change_amount,reason) VALUES (?,?,1,'request_refund')",
          [currentRequest.consumer_id,requestId]
        );
        await connection.query("UPDATE users SET points = points - 1 WHERE id = ?", [currentRequest.consumer_id]);
        await connection.query(
          "INSERT INTO point_transactions(user_id,request_id,change_amount,reason) VALUES (?,?,-1,'no_show_penalty')",
          [currentRequest.consumer_id,requestId]
        );
        
        await connection.commit();
        res.json({ message: "Marked as not picked up. Consumer penalized." });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally { connection.release(); }
    } else if (status === "approved") {
      if (currentRequest.status !== "pending") return res.status(400).json({ error: "Only pending requests can be approved." });
      if (currentRequest.portions_available <= 0) return res.status(400).json({ error: "No portions available." });
      
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE requests SET status = 'approved', approved_at = NOW() WHERE id = ?", [requestId]);
        await connection.query("UPDATE meals SET portions_available = portions_available - 1 WHERE id = ?", [currentRequest.meal_id]);
        await connection.commit();
        res.json({ message: "Request approved." });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally { connection.release(); }
    } else if (status === "rejected") {
      if (currentRequest.status !== "pending") return res.status(400).json({ error: "Only pending requests can be rejected." });
      
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE requests SET status = 'rejected' WHERE id = ?", [requestId]);

        await connection.query("UPDATE users SET points = points + 1 WHERE id = ?", [currentRequest.consumer_id]);
        await connection.query(
          "INSERT INTO point_transactions(user_id,request_id,change_amount,reason) VALUES (?,?,1,'request_rejected')",
          [currentRequest.consumer_id,requestId]
        );
        
        await connection.commit();
        res.json({ message: "Request rejected." });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally { connection.release(); }
    } else {
       res.status(400).json({ error: "Invalid status update." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ratings",auth,async(req,res) => {
  const {requestId,rating,comment } = req.body;

  const ratingValue = Number(rating);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return res.status(400).json({error: "Rating must be a whole number between 1 and 5."});
  }

  try {
    const [requestData] = await db.query("SELECT * FROM requests WHERE id = ?", [requestId]);
    if (requestData.length === 0){
      return res.status(404).json({error: "Request not found."});

    }
    const {meal_id,consumer_id,status} = requestData[0];

    if (consumer_id !== req.user.id) {
      return res.status(403).json({error: "You can only rate your own requests."});
    }

    if (status !== 'picked_up') {
      return res.status(400).json({error: "You can only rate a meal after you have picked it up."});
    }

    const [mealData] = await db.query("SELECT cook_id FROM meals WHERE id = ?", [meal_id]);

    await db.query(
      "INSERT INTO ratings( request_id, meal_id,consumer_id,cook_id,rating_value,comment) VALUES (?,?,?,?,?,?)",
      [requestId,meal_id,consumer_id,mealData[0].cook_id,rating,comment]
    );
    await db.query("UPDATE requests SET status ='rated' WHERE id = ?",[requestId]);
    if (Number(rating) > 3) {
      await db.query("UPDATE users SET points = points + 1 WHERE id = ?", [mealData[0].cook_id]);
      await db.query(
        "INSERT INTO point_transactions (user_id, request_id, change_amount, reason) VALUES (?,?,1,'high_rating_bonus')",
        [mealData[0].cook_id, requestId]
      );
    }
    res.json({message:"Rated successfully!"});
  }catch (error){
    res.status(500).json({error:error.message});
  }
});

app.get("/api/requests/me",auth,async(req,res)=>{
  try{
    const[requests]= await db.query(
      `SELECT r.*, m.title as meal_title
       FROM requests r
       JOIN meals m ON r.meal_id = m.id
       WHERE r.consumer_id = ?`,
       [req.user.id]
    );
    res.json(requests);
  }catch(error){
    res.status(500).json({error:error.message});
  }
});

// === ADMIN & POINTS ENDPOINTS ===

app.get("/api/admin/stats", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only." });

  try {
    const [[{ total_portions_shared }]] = await db.query(
      `SELECT COUNT(*) as total_portions_shared 
       FROM requests 
       WHERE status IN ('picked_up', 'rated') 
       AND requested_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );

    const [[{ total_meals }]] = await db.query(
      `SELECT COUNT(*) as total_meals FROM meals 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) AND deleted_at IS NULL`
    );

    const [[{ total_users }]] = await db.query("SELECT COUNT(*) as total_users FROM users");

    const [[{ total_requests }]] = await db.query(
      `SELECT COUNT(*) as total_requests FROM requests 
       WHERE requested_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );

    res.json({ total_portions_shared, total_meals, total_users, total_requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/leaderboard", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only." });

  try {
    const [leaderboard] = await db.query(`
      SELECT 
        u.id, u.full_name, u.points,
        COALESCE(SUM(m.portions_total - m.portions_available), 0) as portions_shared,
        (SELECT AVG(r.rating_value) FROM ratings r WHERE r.cook_id = u.id) as avg_rating
      FROM users u
      LEFT JOIN meals m ON u.id = m.cook_id AND m.deleted_at IS NULL
      WHERE u.role = 'cook' 
      GROUP BY u.id
      ORDER BY portions_shared DESC, avg_rating DESC
      LIMIT 10
    `);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/points/history", auth, async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT pt.*, m.title as meal_title
       FROM point_transactions pt
       LEFT JOIN requests r ON pt.request_id = r.id
       LEFT JOIN meals m ON r.meal_id = m.id
       WHERE pt.user_id = ?
       ORDER BY pt.created_at DESC`,
      [req.user.id]
    );

    const [[{ total }]] = await db.query(
      "SELECT points as total FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({ total, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

setInterval(async () => {
  try {
    const [expiredRequests] = await db.query(
      `SELECT id, consumer_id FROM requests 
       WHERE status = 'picked_up' 
       AND picked_up_at < NOW() - INTERVAL 48 HOUR`
    );

    for (let req of expiredRequests) {
      await db.query("UPDATE users SET points = points - 1 WHERE id = ?", [req.consumer_id]);
      await db.query(
        "INSERT INTO point_transactions (user_id, request_id, change_amount, reason) VALUES (?, ?, -1, 'rating_timeout_penalty')",
        [req.consumer_id, req.id]
      );
      await db.query("UPDATE requests SET status = 'rated' WHERE id = ?", [req.id]);
    }
  } catch (error) {
    console.error("Error in rating penalty cron:", error);
  }
}, 60 * 60 * 1000);

