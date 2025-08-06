function chargerProduitsEnCartes() {
    fetch("http://localhost/entrepot/Info/php/produits_api.php")
        .then(res => res.json())
        .then(data => {
            if (!data.success || !Array.isArray(data.data)) return;

            const grid = document.getElementById("produits-stock-grid");
            grid.innerHTML = "";

            data.data.forEach(prod => {
                const card = document.createElement("div");
                card.classList.add("carte-produit");

                card.innerHTML = `
                    <div class="titre-produit">${prod.nom}</div>
                    <div class="info-produit">
                      <strong>Quantité :</strong> ${prod.quantite} ${prod.unit}<br>
                      <strong>Catégorie :</strong> ${prod.categorie}<br>
                      <strong>Position :</strong> ${prod.position}
                    </div>
                `;

                grid.appendChild(card);
            });
        })
        .catch(err => console.error("Erreur chargement :", err));
}
chargerProduitsEnCartes(); // Appel initial pour charger les produits


function attendreUpdateTable() {
    if (typeof window.updateTable === "function") {
        updateTable();
    } else {
        setTimeout(attendreUpdateTable, 500); // Réessaie toutes les 500ms
    }
}

attendreUpdateTable(); // Appelle cette fonction dans sortie.js

//Chargement des cartes de produits pour l'historique
function chargerHistoriqueSorties() {
    fetch("http://localhost/entrepot/Info/php/get_sorties.php")
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;

            const container = document.querySelector(".cards-container");
            container.innerHTML = "";

            data.data.forEach(sortie => {
                const card = document.createElement("div");
                card.classList.add("historique-carte");
                card.innerHTML = `
                    <div class="titre-sortie">${sortie.produit_nom}</div>
                    <div class="details-sortie">
                        <strong>Quantité :</strong> ${sortie.quantite} ${sortie.unit}<br>
                        <strong>Motif :</strong> ${sortie.raison}<br>
                        <strong>Par :</strong> ${sortie.utilisateur}<br>
                        <strong>Valeur :</strong> ${sortie.valeur} FC<br>
                        <strong>Date :</strong> ${sortie.date_mouvement}
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => console.error("❌ Erreur chargement historique :", err));
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-product");
    const grid = document.getElementById("produits-stock-grid");
    const message = document.getElementById("no-results");

    if (!searchInput || !grid || !message) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        const cartes = grid.querySelectorAll(".carte-produit");
        let visibles = 0;

        cartes.forEach(carte => {
            const titre = carte.querySelector(".titre-produit")?.textContent.toLowerCase() || "";
            const details = carte.querySelector(".info-produit")?.textContent.toLowerCase() || "";
            const match = titre.includes(query) || details.includes(query);

            carte.style.display = match ? "block" : "none";
            if (match) visibles++;
        });

        message.style.display = visibles === 0 ? "block" : "none";
    });
});


document.addEventListener("DOMContentLoaded", () => {
    // chargerHistoriqueSorties();
});


document.addEventListener("DOMContentLoaded", () => {
    const boutonRetrait = document.getElementById("remove-product-btn");

    boutonRetrait?.addEventListener("click", () => {


        const quantiteRaw = document.getElementById("quantity-out").value.trim();
        if (!quantiteRaw) {
            alert("❌ Veuillez remplir le champ quantité");
            return;
        }
        const quantiteParsee = parseFloat(quantiteRaw);
        if (isNaN(quantiteParsee)) {
            alert("❌ Format de quantité invalide");
            return;
        }


        const product = {
            nom: document.getElementById("product-name-out").value.trim(),
            quantite: quantiteParsee,
            unit: document.getElementById("unit").value.trim() || "pcs",
            raison: document.getElementById("reason-out").value.trim(),
            utilisateur: sessionStorage.getItem("username") || "inconnu",
            valeur: parseFloat(document.getElementById("valeur")?.value.trim()) || 0,
            date: document.getElementById("date-mouvement")?.value.trim() || "",
            type: document.getElementById("type-mouvement")?.value.trim() || "sortie"
        };

        console.log("🔎 Données envoyées :", product);

        fetch("http://localhost/entrepot/Info/php/sortie_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        })
            .then(response => response.json())
            .then(data => {
                console.log("🔎 Réponse API :", data);

                if (data.success) {
                    const utilisateur = SessionManager.get("username");
                    const nom = product.nom;
                    const date = product.date || new Date().toLocaleString();
                    console.log("utilisateur connecté :", utilisateur);

                    addToHistory("Sortie", nom, date, "—", product.quantite, utilisateur);

                    alert("✅ Produit retiré avec succès !");
                    document.getElementById("stock-out-form").reset();
                    updateTable?.();
                    renderCharts?.();
                    chargerHistoriqueSorties();
                } else {
                    alert(`❌ Erreur : ${data.error || "Retrait impossible"}`);
                }
            })
            .catch(error => {
                console.error("❌ Erreur JS :", error);
                alert("Erreur réseau : " + error.message);
            });
    });
});
console.log(
    sessionStorage.getItem("username") ?
    `👤 Utilisateur connecté : ${sessionStorage.getItem("username")}` :
    "👤 Aucun utilisateur connecté"
);


setTimeout(() => {
    console.log("🔎 Mise à jour du tableau après sortie !");
    //updateTable();
}, 1000); // ✅ Attendre 1 seconde pour assurer la mise à jour

//Evaluations des performances de sorties
const CONVERSION = {
    box: 12, // Exemple : 1 box = 12 pcs
    kg: 1,
    L: 1,
    pcs: 1
};
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost/entrepot/Info/php/stats_motifs.php")
        .then(res => res.text())
        .then(text => {
            const badges = [];
            try {
                const stat = JSON.parse(text);

                for (const [raison, info] of Object.entries(stat.data)) {
                    const valeurFC = info.valeur.toLocaleString(undefined, { minimumFractionDigits: 2 });
                    const classe = {
                        vente: "badge-success",
                        perte: "badge-danger",
                        donation: "badge-warning",
                        transfert: "badge-info"
                    }[raison] || "badge-default";

                    badges.push(`
            <span class="badge ${classe}">
              ${raison} : ${info.percent}%<br>
              💰 Valeur totale : ${valeurFC} FC
            </span>
          `);
                }

                document.getElementById("badges-container").innerHTML = badges.join("");

                // ✅ Graphique déplacé ici
                const labels = Object.keys(stat.data);
                const data = labels.map(label => stat.data[label].percent);
                const couleurs = labels.map(label =>
                ({
                    vente: "#2ecc71",
                    perte: "#e74c3c",
                    donation: "#f1c40f",
                    transfert: "#3498db"
                }[label] || "#bdc3c7")
                );

                const ctx = document.getElementById("motif-chart");
                if (ctx) {
                    new Chart(ctx.getContext("2d"), {
                        type: "doughnut",
                        data: {
                            labels,
                            datasets: [{
                                data,
                                backgroundColor: couleurs
                            }]
                        },
                        options: {
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Répartition des sorties (Total : ${stat.total.toLocaleString()} FC)`
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            const motif = context.label;
                                            const val = stat.data[motif]?.valeur || 0;
                                            return `${motif} : ${val.toLocaleString()} FC`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.warn("📉 Canvas motif-chart introuvable.");
                }

            } catch (e) {
                console.error("❌ La réponse n'était pas du JSON :", text);
                document.getElementById("badges-container").innerHTML = `
          <div class="alert alert-danger">
            Erreur serveur : ${text.slice(0, 300)}...
          </div>
        `;
            }
        })
        .catch(err => {
            console.error("🚫 Erreur lors du fetch :", err);
        });
});

document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh-btn");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            location.reload(); // 🔄 Recharge toute la page
        });
    }
});
document.addEventListener("DOMContentLoaded", async () => {
    await renderCharts()
});
async function renderCharts() {
    console.log("📊 Rechargement des graphiques...");

    const ctxLine = document.getElementById("line-chart")?.getContext("2d");
    const ctxBar = document.getElementById("bar-chart")?.getContext("2d");
    const ctxScatter = document.getElementById("scatter-chart")?.getContext("2d");

    if (!ctxLine || !ctxBar || !ctxScatter) {
        console.error("❌ Canvas introuvables !");
        return;
    }

    try {
        // 🔄 Charger les entrées (produits)
        const getJsonData = async (url) => {
            try {
                const res = await fetch(url);
                const text = await res.text();

                let json;
                try {
                    json = JSON.parse(text);
                } catch (e) {
                    console.error("❌ Erreur JSON : réponse non parsable");
                    console.warn(text);
                    return [];
                }

                if (!Array.isArray(json.data)) {
                    console.warn("⚠️ Clé 'data' manquante ou incorrecte dans la réponse");
                    return [];
                }

                return json.data;

            } catch (err) {
                console.error("❌ Erreur Fetch réseau :", err);
                return [];
            }
        };
        const entriesRaw = await getJsonData("http://localhost/entrepot/Info/php/produits_api.php");
        const movementsRaw = await getJsonData("http://localhost/entrepot/Info/php/sortie_api.php?mode=timeline");



        const dates = [];
        const entreesParDate = {};
        const sortiesParDate = {};

        // 🧮 Traiter les entrées (produits créés)
        entriesRaw.forEach(produit => {
            const date = produit.created_at?.split(" ")[0];
            const qte = parseFloat(produit.quantite) || 0;
            if (!date) return;

            if (!dates.includes(date)) dates.push(date);
            entreesParDate[date] = (entreesParDate[date] || 0) + qte;
        });

        // 🧮 Traiter les sorties (mouvements)
        movementsRaw.forEach(mvt => {
            const date = mvt.date_mouvement?.split(" ")[0];
            const qte = parseFloat(mvt.quantite) || 0;
            if (!date) return;

            if (!dates.includes(date)) dates.push(date);
            if (mvt.type === "sortie") {
                sortiesParDate[date] = (sortiesParDate[date] || 0) + qte;
            } else if (mvt.type === "entrée") {
                entreesParDate[date] = (entreesParDate[date] || 0) + qte;
            }
        });

        dates.sort();

        // 🧠 Calcul du stock cumulatif
        const stockLevels = [];
        let cumul = 0;
        dates.forEach(date => {
            cumul += (entreesParDate[date] || 0) - (sortiesParDate[date] || 0);
            cumul = Math.max(cumul, 0); // 🔐 Empêche les stocks négatifs
            stockLevels.push(cumul);
        });

        // 📈 Graphique d’évolution
        new Chart(ctxLine, {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    label: "📦 Stock net",
                    data: stockLevels,
                    borderColor: "#2980b9",
                    backgroundColor: "rgba(52, 152, 219, 0.2)",
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "📈 Évolution du stock dans le temps"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true // 🛠️ Ajout ici
                    }
                }
            }

        })

        // 📊 Graphique flux entrées / sorties
        new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: dates,
                datasets: [
                    {
                        label: "Entrées",
                        data: dates.map(d => entreesParDate[d] || 0),
                        backgroundColor: "#27ae60"
                    },
                    {
                        label: "Sorties",
                        data: dates.map(d => sortiesParDate[d] || 0),
                        backgroundColor: "#c0392b"
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "📊 Flux de stock par date"
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                }
            }
        });

        // 📍 Graphique de corrélation
        const points = dates.map(date => ({
            x: sortiesParDate[date] || 0,
            y: entreesParDate[date] || 0
        }));

        const totalEntrees = points.reduce((sum, p) => sum + p.y, 0);
        const totalSorties = points.reduce((sum, p) => sum + p.x, 0);

        const tendance =
            totalEntrees > totalSorties ? "📈 Stock en hausse" :
                totalSorties > totalEntrees ? "📉 Stock en baisse" :
                    "🔁 Stock stable";

        console.log("🧠 Tendance :", tendance);

        new Chart(ctxScatter, {
            type: "scatter",
            data: {
                datasets: [{
                    label: "Corrélation des flux",
                    data: points,
                    borderColor: "#8e44ad",
                    backgroundColor: "rgba(155, 89, 182, 0.2)",
                    showLine: true,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "📍 Corrélation Entrées vs Sorties"
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `Sorties: ${ctx.parsed.x}, Entrées: ${ctx.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: "Sorties (unités)" }, min: 0 },
                    y: { title: { display: true, text: "Entrées (unités)" }, min: 0 }
                }
            }
        });

    } catch (error) {
        console.error("❌ Erreur API :", error);
    }
}