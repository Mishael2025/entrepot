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


    fetch("http://localhost/entrepot/Info/php/acceuil_api.php")
        .then(res => res.json())
        .then(data => {
            // 🔢 Indicateurs globaux
            document.getElementById("total-produits").textContent = data.totalProduits ?? "--";
            document.getElementById("produits-critique").textContent = data.critique ?? "--";
            document.getElementById("total-fournisseurs").textContent = data.totalFournisseurs ?? "--";
            document.getElementById("total-sorties").textContent = data.totalSorties ?? "--";

            // ⚖️ Volume total (si tu veux l'afficher)
            if (document.getElementById("volume-stock")) {
                document.getElementById("volume-stock").textContent = data.volumeStock ?? "--";
            }

            // 📦 Volumes par unité
            document.getElementById("volume-kg").textContent = data.volumes.kg ?? "--";
            document.getElementById("volume-l").textContent = data.volumes.l ?? "--";
            document.getElementById("volume-pcs").textContent = data.volumes.pcs ?? "--";
            document.getElementById("volume-box").textContent = data.volumes.box ?? "--";

            // 🔔 Notifications
            const notifList = document.getElementById("notif-list");
            notifList.innerHTML = "";
            data.notifications.forEach(msg => {
                const li = document.createElement("li");
                li.textContent = msg;
                notifList.appendChild(li);
            });

            // 📈 Sparkline (si tu veux l'afficher)
            const ctx = document.getElementById("sparkline")?.getContext("2d");
            if (ctx) {
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
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        })
        .catch(err => console.error("❌ Erreur API :", err));





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
});