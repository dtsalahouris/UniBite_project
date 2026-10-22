const API_BASE = `http://${window.location.hostname || "localhost"}:3000`;

window.onload = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!user || user.role !== "admin") {
        document.getElementById("adminAuth").style.display = "block";
        return;
    }

    document.getElementById("adminAuth").style.display = "none";
    document.getElementById("adminContent").style.display = "block";

    try {
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const stats = await statsRes.json();
        document.getElementById("statsContainer").innerHTML = `
        <div class="col-md-3 col-sm-6"><div class="card shadow-sm text-center border-0 h-100"><div class="card-body"><h3 class="text-primary fw-bold" style="color: #ce7961 !important;">${stats.total_portions_shared}</h3><p class="text-muted mb-0">Portions shared (this month)</p></div></div></div>
        <div class="col-md-3 col-sm-6"><div class="card shadow-sm text-center border-0 h-100"><div class="card-body"><h3 class="text-primary fw-bold" style="color: #ce7961 !important;">${stats.total_meals}</h3><p class="text-muted mb-0">Meals posted (this month)</p></div></div></div>
        <div class="col-md-3 col-sm-6"><div class="card shadow-sm text-center border-0 h-100"><div class="card-body"><h3 class="text-primary fw-bold" style="color: #ce7961 !important;">${stats.total_users}</h3><p class="text-muted mb-0">Registered users</p></div></div></div>
        <div class="col-md-3 col-sm-6"><div class="card shadow-sm text-center border-0 h-100"><div class="card-body"><h3 class="text-primary fw-bold" style="color: #ce7961 !important;">${stats.total_requests}</h3><p class="text-muted mb-0">Total requests</p></div></div></div>
        `;
    } catch (e) { console.error(e); }

    try {
        const lbRes = await fetch(`${API_BASE}/api/admin/leaderboard`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const leaderboard = await lbRes.json();
        const tbody = document.getElementById("leaderboardBody");
        tbody.innerHTML = leaderboard.map((entry, i) => `
        <tr>
        <td class="fw-bold">${i + 1}</td>
        <td class="text-start fw-semibold">${entry.full_name}</td>
        <td><span class="badge bg-success rounded-pill px-3 py-2">${entry.portions_shared}</span></td>
        <td>${entry.avg_rating ? '<span class="text-warning fs-5">★</span> ' + Number(entry.avg_rating).toFixed(1) : '<span class="text-muted">N/A</span>'}</td>
        <td class="fw-bold text-primary">${entry.points}</td>
        </tr>
        `).join('');
    } catch (e) { console.error(e); }
};
