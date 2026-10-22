const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // new users start with 5 points
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, role, points) VALUES (?, ?, ?, ?, 5)',
            [full_name, email, hashedPassword, role || 'consumer']
        );
        const userId = result.insertId;
        await db.query(
            `INSERT INTO point_transactions (user_id,
            change_amount, reason)VALUES(?,5,
            "initial_bonus")`,
                    [userId]
            );
        res.status(201).json({ message: 'User registered!', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        
        // Lazy Hashing Logic
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        let isMatch = false;
        
        if (isHashed) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
            if (isMatch) {
                const newHash = await bcrypt.hash(password, 10);
                await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            }
        }

        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // Sign JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                points: user.points
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
