
// Historique des actions de sortie
const clearBtn = document.getElementById("clear-history");
clearBtn.addEventListener("click", (e) => {
  e.preventDefault(); // ← évite tout comportement par défaut
  if (confirm("Voulez-vous vraiment effacer l'historique ?")) {
    localStorage.removeItem("history");
    window.updateHistoryDisplay();
    console.log("🚮 Historique vidé !");
  }
});

window.updateHistoryDisplay = function () {
    const tbody = document.querySelector("#history-table tbody");
    if (!tbody) {
        console.info("ℹ Aucun tableau à mettre à jour ici.");
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
updateHistoryDisplay(); // Appel initial pour afficher l'historique au chargement
// Ajouter à l'historique
window.addToHistory = function (action, nom, date, dlc, utilisateur = SessionManager.get("username") || "inconnu") {
    const history = JSON.parse(localStorage.getItem("history")) || [];

    history.push({ action, nom, date, dlc, utilisateur });

    if (history.length > 70) history.shift();
    console.log("Historique actuel :", history);

    localStorage.setItem("history", JSON.stringify(history));
    window.updateHistoryDisplay();
    console.log(`📜 Historique mis à jour : ${action} - ${nom} (${date}) par ${utilisateur}${dlc ? `, DLC : ${dlc}` : ""}`);

};
// ✅ Fonction pour afficher l'historique au démarrage


// ✅ Charger l'historique automatiquement au démarrage
document.addEventListener("DOMContentLoaded", updateHistoryDisplay);