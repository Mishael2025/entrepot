document.addEventListener("DOMContentLoaded", () => {
    // 🕒 Horloge en temps réel
    const clock = document.getElementById("clock");
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toLocaleString("fr-FR");
    }, 1000);

    // 🎖️ Rôle connecté
    const role = SessionManager.get("userRole") || "invité";
    const roleLabel = document.getElementById("role-label");
    if (roleLabel) {
        roleLabel.innerHTML = getRoleBadge(role);
    }

    // 📡 Chargement des données synthétiques
    fetch("dashboard_api.php")
        .then(res => res.json())
        .then(data => {
            document.getElementById("total-produits").textContent = data.totalProduits;
            document.getElementById("volume-stock").textContent = data.volumeStock;
            document.getElementById("stock-critique").textContent = data.critique;
            document.getElementById("peremption").textContent = data.peremption;

            const notifList = document.getElementById("notif-list");
            data.notifications.forEach(msg => {
                const li = document.createElement("li");
                li.textContent = msg;
                notifList.appendChild(li);
            });

            // 📈 Mini graphique (sparkline)
            const ctx = document.getElementById("sparkline").getContext("2d");
            new Chart(ctx, {
                type: "line",
                data: {
                    labels: data.sparkline.labels,
                    datasets: [{
                        label: "Sorties",
                        data: data.sparkline.values,
                        borderColor: "#3498db",
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                }
            });
        });
});

// 🎖️ Fonction badge rôle
function getRoleBadge(role) {
    const badges = {
        admin: '<i class="fas fa-user-shield"></i> Admin',
        employé: '<i class="fas fa-user-cog"></i> Employé',
        auditeur: '<i class="fas fa-user-secret"></i> Auditeur',
        manager: '<i class="fas fa-user-tie"></i> Manager',
        invité: '<i class="fas fa-user"></i> Invité'
    };
    return badges[role] || `<i class="fas fa-user-slash"></i> Inconnu`;
}
