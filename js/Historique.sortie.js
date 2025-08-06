document.addEventListener("DOMContentLoaded", () => {
    const clearBtn = document.getElementById("clear-history");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.removeItem("history");
            updateHistoryDisplay();
            console.log("🚮 Historique vidé !");
        });
    }
});

function updateHistoryDisplay() {
    const tbody = document.querySelector("#history-table tbody");
    if (!tbody) {
        console.info("ℹ️ Aucun tableau à mettre à jour ici.");
        return;
    }
    tbody.innerHTML = "";

    const history = JSON.parse(localStorage.getItem("history")) || [];
    console.log("🔎 Historique chargé :", history);

    history.forEach(entry => {
        const row = document.createElement("tr");

        row.innerHTML = `
      <td>${entry.date}</td>
      <td><strong>${entry.action}</strong></td>
      <td>${entry.nom}</td>
      <td>${entry.utilisateur || "—"}</td>
      <td>${entry.dlc ? `DLC : ${entry.dlc}` : "—"}</td>
    `;

        row.classList.add(`history-${entry.action.toLowerCase()}`); // utile pour styliser par type d'action
        tbody.appendChild(row);
    });
}

// Ajouter à l'historique
function addToHistory(action, nom, date, dlc, utilisateur = "inconnu") {
    const history = JSON.parse(localStorage.getItem("history")) || [];

    history.push({ action, nom, date, dlc, utilisateur });

    if (history.length > 50) history.shift();
    if (typeof updateHistoryDisplay === "function") {
        updateHistoryDisplay();
    }

    localStorage.setItem("history", JSON.stringify(history));
    updateHistoryDisplay();
}


// ✅ Fonction pour afficher l'historique au démarrage


// ✅ Charger l'historique automatiquement au démarrage
document.addEventListener("DOMContentLoaded", updateHistoryDisplay);