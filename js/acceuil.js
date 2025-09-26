document.addEventListener("DOMContentLoaded", () => {
    // 🕒 Horloge en temps réel
    const clock = document.getElementById("clock");
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toLocaleString("fr-FR");
    }, 1000);

    

    fetch("http://localhost/entrepot/Info/php/acceuil_api.php")
        .then(res => res.json())
        .then(data => {
            // 🔢 Indicateurs globaux
            document.getElementById("total-produits").textContent = data.totalProduits ?? "--";
            document.getElementById("total-fournisseurs").textContent = data.totalFournisseurs ?? "--";

            // 📊 Volume global
            if (document.getElementById("volume-stock")) {
                const total = Object.values(data.volumes).reduce((a, b) => a + b, 0);
                document.getElementById("volume-stock").textContent = total;
            }

            // 🔔 Notifications
            const notifList = document.getElementById("notif-list");
            notifList.innerHTML = "";
            data.notifications.forEach(msg => {
                const li = document.createElement("li");
                li.textContent = msg;
                notifList.appendChild(li);
            });

            // 📈 Sparkline des sorties
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

            const jours = data.sparkline.labels.length || 1;

            // 🧠 Produits à surveiller
            const surveillerList = document.getElementById("produits-a-surveiller-list");
            surveillerList.innerHTML = "";
            Object.entries(data.produits).forEach(([nom, p]) => {
                if (p.critique || p.bientot_perime) {
                    const li = document.createElement("li");
                    let badgeHTML = "";
                    if (p.critique && p.bientot_perime) {
                        badgeHTML = `<span class="badge badge-double"><i class="fas fa-triangle-exclamation"></i> <i class="fas fa-clock"></i> Critique + Péremption</span>`;
                    } else if (p.critique) {
                        badgeHTML = `<span class="badge badge-critique"><i class="fas fa-triangle-exclamation"></i> Stock critique</span>`;
                    } else if (p.bientot_perime) {
                        badgeHTML = `<span class="badge badge-bientot"><i class="fas fa-clock"></i> Bientôt périmé</span>`;
                    }
                    li.innerHTML = `<strong>${nom}</strong> — ${p.quantite} ${p.unite} (${p.categorie})<br/>${badgeHTML}`;
                    surveillerList.appendChild(li);
                }
            });

            // 🔝 Produits les plus sortis cette semaine
            const evolutionContainer = document.getElementById("evolution-produits");
            evolutionContainer.innerHTML = "";

            // 🔢 Trier les produits par sortie décroissante
            const produitsSortants = Object.entries(data.produits)
                .filter(([_, p]) => p.sortie > 0)
                .sort((a, b) => b[1].sortie - a[1].sortie);

            // 🎨 Générateur de couleurs pastel
            const generateColor = (index) => {
                const hue = (index * 47) % 360;
                return `hsl(${hue}, 70%, 60%)`;
            };

            // 📊 Barre globale
            const barre = document.createElement("div");
            barre.className = "barre-globale";

            const totalSortie = produitsSortants.reduce((sum, [_, p]) => sum + p.sortie, 0);

            produitsSortants.forEach(([nom, p], index) => {
                const couleur = generateColor(index);
                const largeur = Math.round((p.sortie / totalSortie) * 100);

                const segment = document.createElement("div");
                segment.className = "segment";
                segment.style.backgroundColor = couleur;
                segment.style.width = `${largeur}%`;
                barre.appendChild(segment);
            });

            evolutionContainer.appendChild(barre);

            // 🏷️ Légende avec pastille à gauche
            const legende = document.createElement("div");
            legende.className = "legende-produits";

            produitsSortants.forEach(([nom, p], index) => {
                const couleur = generateColor(index);
                const item = document.createElement("div");
                item.className = "legende-item";
                item.innerHTML = `
    <div class="pastille" style="background-color: ${couleur};"></div>
    <strong>${nom}</strong> — ${p.sortie} ${p.unite}
  `;
                legende.appendChild(item);
            });

            evolutionContainer.appendChild(legende);
    

            //  Fournisseurs
            const fournisseurList = document.getElementById("total-fournisseurs");
            fournisseurList.innerHTML = "";
            if (Array.isArray(data.fournisseurs)) {
                data.fournisseurs.forEach(f => {
                    const li = document.createElement("li");
                    li.textContent = `${f.nom} — ${f.contact} (${f.categorie})`;
                    fournisseurList.appendChild(li);
                });
            }

            //  Volumes par unité
            const container = document.getElementById("volume-par-unite");
            container.innerHTML = "";
            const icones = {
                kg: "fas fa-weight",
                l: "fas fa-tint",
                pcs: "fas fa-cube",
                box: "fas fa-box-open"
            };
            const regroupement = {};
            Object.entries(data.produits).forEach(([nom, p]) => {
                const unite = p.unite;
                if (!regroupement[unite]) regroupement[unite] = [];
                regroupement[unite].push({ nom, quantite: p.quantite });
            });
            Object.entries(regroupement).forEach(([unite, produits]) => {
                const bloc = document.createElement("div");
                bloc.className = "unite-bloc";
                const titre = document.createElement("h3");
                titre.innerHTML = `<i class="${icones[unite] || 'fas fa-box'}"></i> ${unite.toUpperCase()}`;
                bloc.appendChild(titre);
                const grid = document.createElement("div");
                grid.className = "dashboard-grid";
                produits.forEach(({ nom, quantite }) => {
                    const card = document.createElement("div");
                    card.className = "stat-card";
                    card.innerHTML = `<h4>${nom}</h4><p><strong>${quantite} ${unite}</strong></p>`;
                    grid.appendChild(card);
                });
                bloc.appendChild(grid);
                container.appendChild(bloc);
            });

            // 🧭 Cockpit analytique par produit
            const cockpitContainer = document.getElementById("cockpit-par-produit");
            cockpitContainer.innerHTML = "";
            Object.entries(data.produits).forEach(([nom, p]) => {
                const bloc = document.createElement("div");
                bloc.className = "stat-card produit-cockpit";

                const sorties = p.sortie;
                const entrees = p.entree;
                const pression = sorties > entrees ? "Haute" : "Stable";
                const frequence = Math.round(sorties / jours);
                const badgeClass = pression === "Haute" ? "badge badge-pression" : "badge badge-ok";

                bloc.innerHTML = `
                  <div class="produit-header">
                    <h4><i class="fas fa-cube"></i> ${nom}</h4>
                  </div>
                  <div class="produit-grid">
                    <div class="cell">
                      <strong>${sorties}</strong><br/>Sorties cette semaine
                    </div>
                    <div class="cell">
                      ${entrees} / ${sorties}<br/>Entrées vs Sorties
                    </div>
                    <div class="cell">
                      <span class="${badgeClass}">Pression : ${pression}</span>
                    </div>
                    <div class="cell">
                      ${sorties} sur ${jours} jours<br/>
                      <span class="badge badge-frequence">
                        <i class="fas fa-calendar-day"></i> ${frequence}/jour
                      </span>
                    </div>
                  </div>
`;
                cockpitContainer.appendChild(bloc);
            });
        })
        .catch(err => console.error("❌ Erreur API :", err));



  
});