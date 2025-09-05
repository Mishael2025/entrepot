//Telecharger le rapport
document.getElementById("download-report").addEventListener("click", () => {
    window.open("http://localhost/entrepot/Info/php/generate_stock_repport.php", "_blank");
});



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
                li.classList.add("spot-item");

                const badge = document.createElement("span");
                badge.classList.add("badge");

                if (pos.etat === "saturé") {
                    badge.classList.add("badge-danger");
                    badge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Saturé`;
                    li.classList.add("sature");
                } else {
                    badge.classList.add("badge-success");
                    badge.innerHTML = `<i class="fas fa-check-circle"></i> Libre`;
                    li.classList.add("libre");
                }

                li.innerHTML = `<strong>${pos.position_stock}</strong> — ${pos.nb_produits} produit(s) `;
                li.appendChild(badge);
                ul.appendChild(li);
            });
        })
        .catch(err => console.error("Erreur chargement emplacements :", err));
});

