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
             <i class="fas fa-money-bill-wave text-success"></i>${valeurFC} FC
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
            console.error(" Erreur lors du fetch :", err);
        });
});

document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh-btn");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            location.reload(); //  Recharge toute la page
        });
    }
});
document.addEventListener("DOMContentLoaded", async () => {
    await renderCharts()
});

async function renderCharts() {
    console.log("🔄 Chargement des graphiques par produit...");

    const chartContainer = document.getElementById("chart-section");
    const produitSelector = document.getElementById("produit-selector");

    if (!chartContainer || !produitSelector) {
        console.error("❌ Conteneurs introuvables !");
        return;
    }

    chartContainer.innerHTML = "";
    produitSelector.innerHTML = "";

    const getJsonData = async (url) => {
        try {
            const res = await fetch(url);
            const text = await res.text();
            const json = JSON.parse(text);
            return Array.isArray(json.data) ? json.data : [];
        } catch (err) {
            console.error("❌ Erreur Fetch ou JSON :", err);
            return [];
        }
    };

    const entriesRaw = await getJsonData("http://localhost/entrepot/Info/php/produits_api.php");
    const movementsRaw = await getJsonData("http://localhost/entrepot/Info/php/sortie_api.php?mode=timeline");

    const formatToMonthKey = (dateStr) => dateStr.split("-").slice(0, 2).join("-");
    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split("-");
        const moisNoms = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
        return `${moisNoms[parseInt(month) - 1]} ${year}`;
    };

    const produitsMap = {};

    entriesRaw.forEach(p => {
        const date = p.created_at?.split(" ")[0];
        const moisKey = formatToMonthKey(date);
        const qte = parseFloat(p.quantite) || 0;
        const id = p.id;
        const nom = p.nom;

        if (!produitsMap[id]) produitsMap[id] = { nom, entrees: {}, sorties: {} };
        produitsMap[id].entrees[moisKey] = (produitsMap[id].entrees[moisKey] || 0) + qte;
    });

    movementsRaw.forEach(mvt => {
        const date = mvt.date_mouvement?.split(" ")[0];
        const moisKey = formatToMonthKey(date);
        const qte = parseFloat(mvt.quantite) || 0;
        const id = mvt.produit_id;
        const nom = mvt.nom;

        if (!produitsMap[id]) produitsMap[id] = { nom, entrees: {}, sorties: {} };
        if (mvt.type === "entrée") {
            produitsMap[id].entrees[moisKey] = (produitsMap[id].entrees[moisKey] || 0) + qte;
        } else if (mvt.type === "sortie") {
            produitsMap[id].sorties[moisKey] = (produitsMap[id].sorties[moisKey] || 0) + qte;
        }
    });

    const produitIds = Object.keys(produitsMap);
    const maxAffichage = 6;

    produitIds.forEach(id => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = produitsMap[id].nom;
        produitSelector.appendChild(option);
    });

    const afficherProduit = (id) => {
        chartContainer.innerHTML = "";

        const produit = produitsMap[id];
        const mois = Array.from(new Set([
            ...Object.keys(produit.entrees),
            ...Object.keys(produit.sorties)
        ])).sort();

        const moisLabels = mois.map(formatMonthLabel);
        const entrees = mois.map(m => produit.entrees[m] || 0);
        const sorties = mois.map(m => produit.sorties[m] || 0);

        const totalEntrees = entrees.reduce((a, b) => a + b, 0);
        const totalSorties = sorties.reduce((a, b) => a + b, 0);
        const tendance = totalEntrees > totalSorties ? "📈 Stock en hausse"
            : totalSorties > totalEntrees ? "📉 Stock en baisse"
                : "🔁 Stock stable";

        // 📦 Bloc produit
        const bloc = document.createElement("div");
        bloc.style.marginBottom = "40px";

        const titre = document.createElement("h3");
        titre.textContent = `🧺 ${produit.nom} — ${tendance}`;
        bloc.appendChild(titre);

        // 📊 Graphique bar
        const canvasBar = document.createElement("canvas");
        canvasBar.height = 300;
        bloc.appendChild(canvasBar);

        new Chart(canvasBar.getContext("2d"), {
            type: "bar",
            data: {
                labels: moisLabels,
                datasets: [
                    { label: "Entrées", data: entrees, backgroundColor: "#27ae60" },
                    { label: "Sorties", data: sorties, backgroundColor: "#c0392b" }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: "📊 Flux mensuel" },
                    legend: { position: "bottom" }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });

        // 📈 Graphique dent de scie (stock net)
        const canvasLine = document.createElement("canvas");
        canvasLine.height = 300;
        bloc.appendChild(canvasLine);

        const stockLevels = [];
        let cumul = 0;
        mois.forEach(m => {
            cumul += (produit.entrees[m] || 0) - (produit.sorties[m] || 0);
            cumul = Math.max(cumul, 0);
            stockLevels.push(cumul);
        });

        new Chart(canvasLine.getContext("2d"), {
            type: "line",
            data: {
                labels: moisLabels,
                datasets: [{
                    label: "📦 Stock net",
                    data: stockLevels,
                    borderColor: "#2980b9",
                    backgroundColor: "rgba(52, 152, 219, 0.2)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: "📈 Évolution du stock" },
                    legend: { position: "bottom" }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        chartContainer.appendChild(bloc);
    };

    // 🧠 Affichage initial des 6 premiers
    produitIds.slice(0, maxAffichage).forEach(id => afficherProduit(id));

    // 🔄 Sélection manuelle
    produitSelector.addEventListener("change", e => {
        const selectedId = e.target.value;
        if (selectedId) afficherProduit(selectedId);
    });

    console.log("✅ Graphiques générés avec filtre produit.");
}
//Bouton pour imprimer le rapport journalier
document.getElementById("print-btn").addEventListener("click", () => {
    const rapport = document.getElementById("rapport-container");
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = rapport.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
});



//chargement des rapports journaliers
async function chargerListeProduits() {
    const res = await fetch("http://localhost/entrepot/Info/php/produits_actifs.php");
    const data = await res.json();
    if (!data.success) return;

    const select = document.getElementById("produit-select");
    data.data.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nom;
        select.appendChild(option);
    });
}

async function chargerRapport() {
    const id = document.getElementById("produit-select").value;
    const date = document.getElementById("date-select").value;
    if (!id || !date) return;

    const res = await fetch(`http://localhost/entrepot/Info/php/journalier.php?id=${id}&date=${date}`);
    const data = await res.json();
    if (!data.success) return;

    const container = document.getElementById("rapport-container");
    container.innerHTML = `
    <header>
     
      <p>Date : ${data.date}</p>
      <p>Produit : ${data.produit.nom} (ID: ${data.produit.id})</p>
    </header>
    <section>
      <h2><i class="fas fa-chart-pie text-info"></i>  Synthèse</h2>
      <table>
        <tr><th>Type</th><th>Quantité</th><th>Heures</th><th>Utilisateurs</th></tr>
        <tr>
          <td>Entrées</td>
          <td>${data.stats.entrees}</td>
          <td>${data.stats.heures_entrees.join(', ')}</td>
          <td>${data.stats.users_entrees.join(', ')}</td>
        </tr>
        <tr>
          <td>Sorties</td>
          <td>${data.stats.sorties}</td>
          <td>${data.stats.heures_sorties.join(', ')}</td>
          <td>${data.stats.users_sorties.join(', ')}</td>
        </tr>
      </table>
    </section>
    <section>
      <h2><i class="fas fa-list-check text-secondary"></i>  Détail des mouvements</h2>
      <table>
        <tr><th>Heure</th><th>Type</th><th>Quantité</th><th>Motif</th><th>Utilisateur</th><th>Réf.</th></tr>
        ${data.mouvements.map(m => `
          <tr>
            <td>${m.date_mouvement.slice(11, 16)}</td>
            <td>${m.type}</td>
            <td>${m.quantite} ${m.unit}</td>
            <td>${m.raison}</td>
            <td>${m.utilisateur}</td>
            <td>${m.valeur} FC</td>
          </tr>
        `).join('')}
      </table>
    </section>
    <section>
      <h2><i class="fas fa-box text-warning"></i>  Stock en fin de journée</h2>
      <p>Théorique : ${data.stock.theorique} unités</p>
      <p>Réel : ${data.stock.reel} unités</p>
      <p>Écart : ${data.stock.ecart} unités</p>
    </section>
    <footer>
      <p class="badge-stock"><i class="fas fa-circle-check text-success"></i> Stock conforme</p>
    </footer>
  `;
}

// 🔄 Initialisation
chargerListeProduits();

document.getElementById("produit-select").addEventListener("change", () => chargerRapport());
document.getElementById("date-select").addEventListener("change", () => chargerRapport());


