// Entrepôt Info JS - Emplacements.js
// This script fetches and displays available storage spots in the warehouse.
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost/entrepot/Info/php/emplacements-stock.php")
        .then(res => res.json())
        .then(res => {
            if (!res.success || !res.data) return;

            const ul = document.getElementById("available-spots");
            if (!ul) return;

            ul.innerHTML = "";

            res.data.forEach(pos => {
                const li = document.createElement("li");
                li.textContent = `${pos.position_stock} — ${pos.nb_produits} produit(s)`;

                if (pos.etat === "saturé") {
                    li.classList.add("sature");
                    li.innerHTML += " 🔴 (saturé)";
                } else {
                    li.classList.add("libre");
                    li.innerHTML += " 🟢 (libre)";
                }

                ul.appendChild(li);
            });
        })
        .catch(err => console.error("Erreur chargement emplacements :", err));
});
