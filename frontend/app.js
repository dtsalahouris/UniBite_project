const API_BASE = `http://${window.location.hostname || "localhost"}:3000`;

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authSection = document.getElementById("authSection");
const userInfo = document.getElementById("userInfo");
const loadMealsBtn = document.getElementById("loadMealsBtn");
const mealsContainer = document.getElementById("mealsContainer");
const statusMessage = document.getElementById("statusMessage");
const postMealBtn = document.getElementById("postMealBtn");

document.getElementById("showRegister").onclick = () => {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
};

document.getElementById("showLogin").onclick = () => {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
};

loginBtn.onclick =async () => {
  const email = document.getElementById("loginEmail").value; 
  const password = document.getElementById("loginPassword").value;
  
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({email,password})
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    alert("Login successful!");
    location.reload();
  } else {
    alert("Error: " + data.error);
  }
};

registerBtn.onclick =async () => {
  const full_name = document.getElementById("regFullName").value;
  const email = document.getElementById("regEmail").value; 
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value; 

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({full_name,email,password,role})
  });

  if (res.ok) {
    alert("Registration successful! Please login.");
    document.getElementById("showLogin").click();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
};

logoutBtn.onclick = () => {
  localStorage.clear();
  location.reload();
};

window.onload = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if(user){
    authSection.style.display = "none";
    userInfo.style.display = "block";
    document.getElementById("userNameDisplay").textContent = user.full_name;
    document.getElementById("userPointsDisplay").textContent = "...";
    fetchLatestPoints();
    
    if(user.role === 'cook'){
      document.getElementById("cookTools").style.display = "block";
      loadAllergens();
      loadCookRequests();
    } else if(user.role === 'consumer'){
      document.getElementById("consumerTools").style.display = "block";
      loadMyRequests();
    } else if(user.role === 'admin'){
      document.getElementById("adminSection").style.display = "block";
      loadAdminData();
    }
  }
};

async function loadAdminData(){
  const token = localStorage.getItem("token");

  const statRes = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { "Authorization" : `Bearer ${token}`}
  });

  if (statRes.ok) {
    const stats = await statRes.json();
    document.getElementById("adminStats").innerHTML = `
    <p>Total Meals: ${stats.total_meals}</p>
    <p>Total Portions Shared: ${stats.total_portions_shared}</p>
    <p>Total Requests: ${stats.total_requests}</p>
    <p>Total User: ${stats.total_users}</p>
    `;
  }

  const leadRes = await fetch(`${API_BASE}/api/admin/leaderboard`, {
    headers: { "Authorization": `Bearer ${token}`}
  });
  if (leadRes.ok) {
    const cooks = await leadRes.json();
    document.getElementById("adminLeaderboard").innerHTML = cooks.map((c, index) => `
    <p>#${index + 1} <b>${c.full_name}</b> - Shared: ${c.portions_shared} | Rating:
    ${Number(c.avg_rating).toFixed(1)}/5</p>
    `).join('');
  }
}



async function loadAllergens() {
  const container = document.getElementById("allergensContainer");
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/api/allergens`);
    const allergens = await res.json();
    container.innerHTML = allergens.map(a => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${a.id}" id="allergen-${a.id}">
        <label class="form-check-label" for="allergen-${a.id}">${a.name}</label>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = '<span class="text-danger small">Could not load allergens.</span>';
    console.error("Failed to load allergens", error);
  }
}

async function fetchLatestPoints() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/points/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById("userPointsDisplay").textContent = data.total;
      
      let user = JSON.parse(localStorage.getItem("user"));
      user.points = data.total;
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to sync points", error);
  }
}

async function loadMyRequests(){
  const container = document.getElementById("myRequestsContainer");
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}/api/requests/me`,{
      headers: {"Authorization": `Bearer ${token}`}
    });
    const requests = await res.json();
    container.innerHTML = requests.map(r => `
      <div class="list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm rounded border">
        <div>
            <p class="mb-1">Meal: <strong>${r.meal_title}</strong></p>
            <p class="mb-0 text-muted small">Status: <span class="badge bg-secondary">${r.status}</span></p>
        </div>
        ${r.status === 'picked_up' ? `<button class="btn btn-sm btn-primary" onclick="openRatingModal(${r.id})">Rate Meal</button>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error("Error loading requests:", error);
  }
}

function openRatingModal(requestId){
  document.getElementById("ratingModal").style.display = "block";
  document.getElementById("submitRatingBtn").onclick = async () => {
    const rating = document.getElementById("ratingValue").value;
    const comment = document.getElementById("ratingComment").value;
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/ratings`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ requestId, rating, comment })
    });

    if (res.ok) {
      alert("Rated successfully!");
      document.getElementById("ratingModal").style.display = "none";
      loadMyRequests();
    } else {
      const data = await res.json();
      alert("Error: " + data.error);
    }
  };
}

function createMealCard(meal) {
  const cardCol = document.createElement("div");
  cardCol.classList.add("col-md-6", "col-lg-4");

  const card = document.createElement("div");
  card.classList.add("card", "h-100", "shadow-sm", "border-0");

  const user = JSON.parse(localStorage.getItem("user"));
  const isInactive = Number(meal.portions_available) == 0;

  if (isInactive) {
    card.classList.add("meal-card-inactive");
  }
  const badgeClass = isInactive ? "bg-secondary" : "bg-success";
  const badgeText = isInactive ? "Unavailable" : "Available";

  const formattedDate = new Date(meal.pickup_time).toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  card.innerHTML = `
    ${meal.photo_path ? `<img src="${API_BASE}/${meal.photo_path}" class="card-img-top" alt="${meal.title}" style="height: 180px; object-fit: cover;" onerror="this.remove()">` : ''}
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title text-primary fw-bold mb-0" style="color: #ce7961 !important;">${meal.title}</h5>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <p class="card-text text-muted small mb-3">Cook: ${meal.cook_name}</p>
      
      <p class="card-text mb-1"><strong>Notes:</strong> ${meal.notes}</p>
      <p class="card-text mb-1"><strong>Allergens:</strong> ${meal.allergens ? meal.allergens : "None declared"}</p>
      <p class="card-text mb-1"><strong>Total portions:</strong> ${meal.portions_total}</p>
      <p class="card-text mb-3"><strong>Available:</strong> <span class="badge bg-info text-dark">${meal.portions_available}</span></p>
      
      <div class="mt-auto pt-3 border-top">
        <p class="mb-1"><small><strong>📍 Location:</strong> ${meal.pickup_location}</small></p>
        <p class="mb-3"><small><strong>🕒 Time:</strong> ${formattedDate}</small></p>
        
        ${user && user.id !== meal.cook_id && !isInactive ? `
          ${user.points > 0 ? 
            `<button class="btn w-100 text-white shadow-sm" style="background-color: #ce7961;" onclick="requestMeal(${meal.id})">Request Portion</button>` : 
            `<button class="btn btn-secondary w-100" disabled title="You have 0 points left">Out of Points</button>`
          }
        ` : ''}
        ${user && user.id === meal.cook_id ? `
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary w-100" onclick="openEditModal(${meal.id}, '${meal.title.replace(/'/g, "\\'")}', '${meal.notes ? meal.notes.replace(/'/g, "\\'") : ''}', '${meal.pickup_location.replace(/'/g, "\\'")}', '${meal.pickup_time}')">Edit Meal</button>
            <button class="btn btn-outline-danger w-100" onclick="deleteMeal(${meal.id})">Delete</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  cardCol.appendChild(card);
  return cardCol;
}

async function deleteMeal(mealId){
  if(!confirm("Are you sure you want to delete this meal?")) return;
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/meals/${mealId}`,{
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}`}
  });

  if (res.ok) {
    alert("Meal deleted!");
    loadMeals();
  }else {
    alert("Error deleting meal.");
  }
}

async function requestMeal(mealId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login to request a meal.");
    return;
  }

  const res = await fetch(`${API_BASE}/api/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ meal_id: mealId })
  });

  const data = await res.json();
  if (res.ok) {
    alert("Request sent successfully!");
    fetchLatestPoints();
    loadMyRequests();
    loadMeals();
  } else {
    alert("Error: " + data.error);
  }
}

async function loadMeals(lat = null, lng = null, radius = null) {
  mealsContainer.innerHTML = "";
  statusMessage.textContent = "Loading meals from server...";

  if (!map) initMap();
  else document.getElementById("map").style.display = "block";
  
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  try {
    let url = `${API_BASE}/api/meals`;
    if (lat && lng && radius) {
      url += `?lat=${lat}&lng=${lng}&radius=${radius}`;
    }
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch meals.");
    }
    const meals = await response.json();

    if (meals.length == 0) {
      statusMessage.textContent = "No meals found near you.";
      updateMapPins([], lat, lng);
      return;
    }

    statusMessage.textContent = `Loaded ${meals.length} meals successfully.`;

    meals.forEach((meal) => {
      const card = createMealCard(meal);
      mealsContainer.appendChild(card);
    });
    updateMapPins(meals, lat, lng);
  } catch (error) {
    statusMessage.textContent = "Error loading meals: " + error.message;
  }
}

function openEditModal(id, title, notes, location, time) {
  document.getElementById("editModal").style.display = "block";
  document.getElementById("editMealId").value = id;
  document.getElementById("editMealTitle").value = title;
  document.getElementById("editMealNotes").value = notes;
  document.getElementById("editMealLocation").value = location;
  document.getElementById("editMealTime").value = new Date(time).toISOString().slice(0, 16);
}

document.getElementById("submitEditBtn")?.addEventListener("click", async () => {
  const mealId = document.getElementById("editMealId").value;
  const title = document.getElementById("editMealTitle").value;
  const notes = document.getElementById("editMealNotes").value;
  const pickup_location = document.getElementById("editMealLocation").value;
  const pickup_time = document.getElementById("editMealTime").value;

  let latitude = null;
  let longitude = null;
  try {
    const locRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup_location)}`);
    const locData = await locRes.json();
    if (locData && locData.length > 0) {
      latitude = locData[0].lat;
      longitude = locData[0].lon;
    }
  } catch (err) { console.error("Geocoding failed", err); }

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/meals/${mealId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ title, notes, pickup_location, pickup_time, latitude, longitude })
  });

  if (res.ok) {
    alert("Meal updated successfully!");
    document.getElementById("editModal").style.display = "none";
    loadMeals();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
});

postMealBtn.onclick = async() => {
  const formData = new FormData();
  formData.append("title", document.getElementById("mealTitle").value);
  formData.append("notes", document.getElementById("mealNotes").value);
  formData.append("portions_total", document.getElementById("mealPortions").value);
  
  const pickup_location = document.getElementById("mealLocation").value;
  formData.append("pickup_location", pickup_location);
  formData.append("pickup_time", document.getElementById("mealTime").value);
  
  try {
    const locRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup_location)}`);
    const locData = await locRes.json();
    if (locData && locData.length > 0) {
      formData.append("latitude", locData[0].lat);
      formData.append("longitude", locData[0].lon);
    }
  } catch (err) { console.error("Geocoding failed", err); }
  
  const imageFile = document.getElementById("mealImage").files[0];
  if (imageFile) formData.append("image", imageFile);

  const selectedAllergens = Array.from(document.querySelectorAll("#allergensContainer input:checked")).map(cb => cb.value);
  formData.append("allergens", JSON.stringify(selectedAllergens));

  const token = localStorage.getItem("token");
  const res=await fetch(`${API_BASE}/api/meals`, {
    method:"POST",
    headers:{
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });
  
  if(res.ok){
    alert("Meal posted!");
    loadMeals();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
};

loadMealsBtn?.addEventListener("click", () => loadMeals());

document.getElementById("findNearMeBtn")?.addEventListener("click", () => {
  if (navigator.geolocation) {
    statusMessage.textContent = "Finding your location...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const radius = document.getElementById("searchRadius").value;
        loadMeals(lat, lng, radius);
      },
      (error) => {
        alert("Geolocation error or denied.");
        loadMeals();
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

let cookRequestTimeout;

async function loadCookRequests() {
  const container = document.getElementById("requestsContainer");
  if (!container) return;
  const token = localStorage.getItem("token");
  
  try {
    const res = await fetch(`${API_BASE}/api/requests/cook`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const requests = await res.json();
    container.innerHTML = "";

    if (!Array.isArray(requests) || requests.length === 0) {
      container.innerHTML = "<p>No pending requests yet.</p>";
      return;
    }

    requests.forEach(req => {
      const div = document.createElement("div");
      div.className = "list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center shadow-sm rounded border mb-2";
      div.innerHTML = `
        <div class="mb-2 mb-md-0">
            <p class="mb-1"><strong>${req.consumer_name}</strong> wants <strong>${req.meal_title}</strong></p>
            <p class="mb-0 text-muted small">Status: <span class="badge bg-secondary">${req.status}</span></p>
        </div>
        <div class="d-flex gap-2">
            ${req.status === 'pending' ? `
            <button class="btn btn-sm btn-success shadow-sm" onclick="updateRequestStatus(${req.id}, 'approved')">Approve</button>
            <button class="btn btn-sm btn-danger shadow-sm" onclick="updateRequestStatus(${req.id}, 'rejected')">Reject</button>
            ` : ''}
            ${req.status === 'approved' ? `
            <button class="btn btn-sm btn-primary shadow-sm" onclick="updateRequestStatus(${req.id}, 'picked_up')">Confirm Pick-up</button>
            <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="updateRequestStatus(${req.id}, 'not_picked_up')">Not Picked Up</button>
            ` : ''}
        </div>
      `;
      container.appendChild(div);
    });
    
    clearTimeout(cookRequestTimeout);
    cookRequestTimeout = setTimeout(loadCookRequests, 5000);
  } catch (e) { console.error(e); }
}

async function updateRequestStatus(requestId, status) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/requests/${requestId}/status`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (res.ok) {
    alert("Status updated!");
    loadCookRequests();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
}

let map;
let markers = [];
function initMap(){
  document.getElementById("map").style.display = "block";
  if (!map) {
    map = L.map('map').setView([38.2466,21.7346], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  }
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

function updateMapPins(meals, userLat = null, userLng = null) {
  if(!map) initMap();
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  meals.forEach(meal => {
    if (meal.latitude && meal.longitude) {
      const marker = L.marker([meal.latitude, meal.longitude]).addTo(map).bindPopup(`<b>${meal.title}</b>
        <br>${meal.portions_available} portions left`);
        markers.push(marker);
    }
  });
  
  if (userLat && userLng) {
      const userMarker = L.circleMarker([userLat, userLng], {
          color: '#0d6efd',
          fillColor: '#0d6efd',
          fillOpacity: 0.6,
          radius: 12
      }).addTo(map).bindPopup("<b>📍 Your Location</b>").openPopup();
      markers.push(userMarker);
  }
  
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

document.getElementById("togglePostMealBtn")?.addEventListener("click", () => {
  const section = document.getElementById("postMealSection");
  if (section.style.display === "none") {
    section.style.display = "block";
    document.getElementById("incomingRequestsSection").style.display = "none";
  } else {
    section.style.display = "none";
  }
});

document.getElementById("toggleRequestsBtn")?.addEventListener("click", () => {
  const section = document.getElementById("incomingRequestsSection");
  if (section.style.display === "none") {
    section.style.display = "block";
    document.getElementById("postMealSection").style.display = "none";
  } else {
    section.style.display = "none";
  }
});