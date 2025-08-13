// 🔐 Afficher le rôle de l'utilisateur
document.addEventListener("DOMContentLoaded", function () {
    const role = SessionManager.get("userRole") || "invité";
    applyRoleRestrictionsByPage(role);

    const roleLabel = document.getElementById("role-label");
    if (roleLabel) {
        roleLabel.textContent = `Rôle : ${role}`;
    }
    roleLabel.style.display = "block"; // S'assurer que le label est visible
});

let produits = []; // Liste des produits récupérés depuis la base

// 🔄 Charger les produits et leurs quantités théoriques
async function chargerProduits() {
    const res = await fetch("http://localhost/entrepot/Info/php/lister_produit.php");
    const data = await res.json();

    if (!data.success) {
        alert("❌ Impossible de charger les produits");
        return;
    }

    produits = data.data;

    const select = document.getElementById("produit");
    select.innerHTML = `<option value="">-- Choisir un produit --</option>`;

    produits.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nom} (${p.quantite} kg)`;
        select.appendChild(option);
    });
}

// 🔍 Mettre à jour la quantité théorique quand un produit est sélectionné
document.getElementById("produit").addEventListener("change", () => {
    const produitId = parseInt(document.getElementById("produit").value);
    const produit = produits.find(p => p.id == produitId);

    if (produit) {
        document.getElementById("quantite-theorique").textContent = produit.quantite;
        calculerEcart(); // recalcul immédiat si quantité observée déjà saisie
    } else {
        document.getElementById("quantite-theorique").textContent = "0";
        document.getElementById("ecart-affichage").textContent = "Écart : 0 kg";
    }
});

// 🔄 Calcul dynamique de l’écart
document.getElementById("quantite-reelle").addEventListener("input", calculerEcart);

function calculerEcart() {
    const theorique = parseFloat(document.getElementById("quantite-theorique").textContent);
    const observee = parseFloat(document.getElementById("quantite-reelle").value);

    if (isNaN(observee)) {
        document.getElementById("ecart-affichage").textContent = "Écart : ?";
        return;
    }

    const ecart = observee - theorique;
    document.getElementById("ecart-affichage").textContent = `Écart : ${ecart} kg`;
}

// 📤 Enregistrement du constat
document.getElementById("constat-ecart-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🔍 Récupération des valeurs
    const produitId = parseInt(document.getElementById("produit").value);
    const quantiteTheorique = parseFloat(document.getElementById("quantite-theorique").textContent);
    const quantiteObservee = parseFloat(document.getElementById("quantite-reelle").value);
    const ecart = quantiteObservee - quantiteTheorique;
    const justification = document.getElementById("justification").value.trim();
    const utilisateurId = SessionManager.get("username"); // ou SessionManager.get("user_id") selon ton système

    // ✅ Logs de debug
    console.log("📤 Données envoyées :", {
        produit_id: produitId,
        quantite_theorique: quantiteTheorique,
        quantite_observee: quantiteObservee,
        ecart,
        justification,
        utilisateur_id: utilisateurId
    });

    // 🧪 Validation des données
    if (!produitId || isNaN(produitId)) return alert("❌ Aucun produit sélectionné.");
    if (isNaN(quantiteObservee)) return alert("❌ Quantité réelle invalide.");
    if (ecart !== 0 && justification === "") return alert("⚠️ Justification requise pour un écart.");

    try {
        const res = await fetch("http://localhost/entrepot/Info/php/Iventaire_.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                produit_id: produitId,
                quantite_theorique: quantiteTheorique,
                quantite_observee: quantiteObservee,
                ecart,
                justification,
                utilisateur_id: utilisateurId
            })
        });

        const text = await res.text();
        console.log("🧾 Réponse brute :", text);

        let json;
        try {
            json = JSON.parse(text);
        } catch (err) {
            console.error("❌ Erreur de parsing JSON :", err);
            return alert("Réponse serveur invalide.");
        }

        if (json.success) {
            alert("✅ Constat enregistré !");
            document.getElementById("constat-ecart-form").reset();
            document.getElementById("quantite-theorique").textContent = "0";
            document.getElementById("ecart-affichage").textContent = "Écart : 0 kg";
        } else {
            alert("❌ Échec : " + (json.message || "Erreur inconnue"));
        }

    } catch (err) {
        console.error("❌ Erreur réseau ou serveur :", err);
        alert("Impossible de contacter le serveur.");
    }
});


// 🚀 Initialisation
document.addEventListener("DOMContentLoaded", chargerProduits, chargerHistoriqueInventaire);
document.getElementById("produit").addEventListener("change", () => {
    const produitId = parseInt(document.getElementById("produit").value);
    document.querySelector("button[type='submit']").disabled = !produitId;
});


function afficherMessageErreur(message) {
    const container = document.getElementById("produits-container");
    container.innerHTML = `<div class="message-erreur">${message}</div>`;
}

fetch("http://localhost/entrepot/Info/php/test.php?action=get_produits")
    .then(res => res.json())
    .then(response => {
        if (response.success && Array.isArray(response.data)) {
            const select = document.getElementById("produit");
            response.data.forEach(produit => {
                // Ton code d'affichage ici
                const option = document.createElement("option");
                option.value = produit.id;
                option.textContent = produit.nom; //  correction ici
                select.appendChild(option);
                console.log("Produit :", produit.nom);
                console.log("ID Produit :", produit.id);
            });
        } else {
            console.warn("Format inattendu :", response);
            afficherMessageErreur("Format de données invalide.");
        }
    })
    .catch(error => {
        console.error("Erreur fetch :", error);
        afficherMessageErreur("Impossible de charger les produits.");
    });

function chargerHistoriqueInventaire() {
    fetch("http://localhost/entrepot/Info/php/Inventaire_api.php?action=get_historique")
        .then(res => res.json())
        .then(data => {
            const historiqueTable = document.getElementById("historique-inventaire");
            historiqueTable.innerHTML = ""; // Réinitialiser le tableau

            data.forEach(entry => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.date}</td>
                    <td>${entry.produit_nom}</td>
                    <td>${entry.quantite_theorique}</td>
                    <td>${entry.quantite_reelle}</td>
                    <td>${entry.ecart}</td>
                    <td>${entry.justification || "N/A"}</td>
                    <td>${entry.utilisateur_nom}</td>
                `;
                historiqueTable.appendChild(row);
            });
        })
        .catch(err => {
            console.error("❌ Erreur chargement historique :", err);
            alert("Impossible de charger l'historique");
        });
}
