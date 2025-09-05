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
            fetch("http://localhost/entrepot/Info/php/acceuil_api.php")
                .then(res => res.json())
                .then(data => {
                    const list = document.getElementById("total-fournisseurs");
                    list.innerHTML = "";

                    if (data.fournisseurs && Array.isArray(data.fournisseurs)) {
                        data.fournisseurs.forEach(f => {
                            const li = document.createElement("li");
                            li.textContent = `${f.nom} — ${f.contact} (${f.adresse})`;
                            list.appendChild(li);
                        });
                    } else {
                        list.innerHTML = "<li>Aucun fournisseur disponible.</li>";
                    }
                    const container = document.getElementById("volume-par-unite");
                    container.innerHTML = "";

                    const icones = {
                        kg: "fas fa-weight",
                        l: "fas fa-tint",
                        pcs: "fas fa-cube",
                        box: "fas fa-box-open"
                    };

                    // Regrouper les produits par unité
                    const regroupement = {};
                    Object.entries(data.volumesParProduit).forEach(([produit, info]) => {
                        const unite = info.unite;
                        if (!regroupement[unite]) regroupement[unite] = [];
                        regroupement[unite].push({ produit, quantite: info.quantite });
                    });

                    // Injecter chaque groupe dans un bloc
                    Object.entries(regroupement).forEach(([unite, produits]) => {
                        const bloc = document.createElement("div");
                        bloc.className = "unite-bloc";

                        const titre = document.createElement("h3");
                        titre.innerHTML = `<i class="${icones[unite] || 'fas fa-box'}"></i> ${unite.toUpperCase()}`;
                        bloc.appendChild(titre);

                        const grid = document.createElement("div");
                        grid.className = "dashboard-grid";

                        produits.forEach(({ produit, quantite }) => {
                            const card = document.createElement("div");
                            card.className = "stat-card";
                            card.innerHTML = `
                             <h4>${produit}</h4>
                            <p><strong>${quantite} ${unite}</strong></p>
        `;
                            grid.appendChild(card);
                        });

                        bloc.appendChild(grid);
                        container.appendChild(bloc);
                    });
                });

            // 🔢 Indicateurs globaux
            document.getElementById("total-produits").textContent = data.totalProduits ?? "--";
            document.getElementById("produits-critique").textContent = data.critique ?? "--";
            document.getElementById("total-fournisseurs").textContent = data.totalFournisseurs ?? "--";
            document.getElementById("total-sorties").textContent = data.totalSorties ?? "--";


            if (document.getElementById("volume-stock")) {
                document.getElementById("volume-stock").textContent = data.volumeStock ?? "--";
            }



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