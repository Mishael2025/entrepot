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
        option.textContent = `${p.nom} (${p.quantite})`;
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
const quantiteObservee = document.getElementById("quantite-reelle");
const quantiteTheorique = document.getElementById("quantite-theorique");
//  Enregistrement du constat
document.getElementById("constat-ecart-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    //  Récupération des valeurs
    const produitId = parseInt(document.getElementById("produit").value);
    const quantiteTheorique = parseFloat(document.getElementById("quantite-theorique").textContent);
    const quantiteObservee = parseFloat(document.getElementById("quantite-reelle").value);
    if (isNaN(quantiteObservee)) {
        alert("Veuillez saisir une quantité observée valide");
        return;
    }

    const corps = {
        produit_id: produitId,
        quantite_theorique: quantiteTheorique,
        quantite_observee: quantiteObservee,
        ecart: quantiteObservee - quantiteTheorique,
        justification: document.getElementById("justification").value.trim(),
        utilisateur_id: SessionManager.getInt("user_id")

    };
    console.log("utilisateur", SessionManager.get("username"));

    try {

        const res = await fetch("http://localhost/entrepot/Info/php/Iventaire_.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corps)
        });

        const contentType = res.headers.get("content-type");
        const raw = await res.text();
        console.log("Réponse brute :", raw);

        let json;
        if (contentType && contentType.includes("application/json")) {
            try {
                json = JSON.parse(raw);
            } catch (err) {
                console.error("❌ Erreur de parsing JSON :", err);
                alert("Réponse serveur invalide : " + err.message);
                return;
            }
        } else {
            console.warn("⚠️ Réponse non JSON :", raw);
            alert("Réponse serveur inattendue.");
            return;
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
        alert("Impossible de contacter le serveur : " + err.message);
    }
});
//  Chargement de l'historique d'inventaire

//  Initialisation
document.addEventListener("DOMContentLoaded", chargerProduits);
document.getElementById("produit").addEventListener("change", () => {
    const produitId = parseInt(document.getElementById("produit").value);
    document.querySelector("button[type='submit']").disabled = !produitId;
});



document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost/entrepot/Info/php/Iventaire_.php?action=get_historique")
        .then(res => res.json())
        .then(data => {
            const historiqueTable = document.getElementById("historique-inventaire").querySelector("tbody");
            historiqueTable.innerHTML = "";

            data.forEach(entry => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.produit_nom || "?"}</td>
                    <td>${entry.quantite_theorique ?? "?"}</td>
                    <td>${entry.quantite_reelle ?? "?"}</td>
                    <td>${entry.ecart ?? "?"}</td>
                    <td>${entry.justification || "N/A"}</td>
                    <td>${entry.date_inventaire || "?"}</td>
                    <td>${entry.utilisateur_nom || "?"}</td>
                `;
                historiqueTable.appendChild(row);
            });
        })
        .catch(err => {
            console.error("❌ Erreur chargement historique :", err);
            alert("Impossible de charger l'historique");
        });
});

// Enregistrer et charger les planifications


// 🔁 Chargement des produits dans le select
async function chargerProduits1() {
    fetch("http://localhost/entrepot/Info/php/test.php?action=get_produits")
        .then(res => res.json())
        .then(response => {
            if (response.success && Array.isArray(response.data)) {
                const select = document.getElementById("produit-planifie");
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



}

// 📤 Enregistrement d'une planification
// 📦 Chargement des fournisseurs dans le select
async function chargerFournisseurs() {
    const res = await fetch("http://localhost/entrepot/Info/php/fournisseur_api.php");
    const fournisseurs = await res.json();
    const select = document.getElementById("fournisseur-planifie");
    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    fournisseurs.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = f.nom;
        select.appendChild(opt);
    });
}

//  Soumission du formulaire de planification
document.getElementById("planification-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    let fournisseurId = null;

    const type = document.getElementById("type").value;
    if (type === "entrée") {
        const raw = document.getElementById("fournisseur-planifie").value;
        fournisseurId = raw !== "" ? parseInt(raw) : null;
    }


    const payload = {
        produit_id: parseInt(document.getElementById("produit-planifie").value),
        type,
        quantite: parseFloat(document.getElementById("quantite-planifiee").value),
        date_prevue: document.getElementById("date-prevue").value,
        commentaire: document.getElementById("commentaire").value.trim(),
        fournisseur_id: fournisseurId,
        utilisateur_id: SessionManager.getInt("user_id")
    };
    if (type === "entrée" && fournisseurId === null) {
        alert("❌ Fournisseur requis pour une entrée.");
        return;
    }

    const res = await fetch("http://localhost/entrepot/Info/php/planification.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success) {
        alert("✅ Planification enregistrée !");
        console.log(" Données envoyées :", payload);
        document.getElementById("planification-form").reset();
        afficherPlanifications();
    } else {
        alert("❌ Échec : " + (json.message || "Erreur inconnue"));
    }
});

document.getElementById("filtrer-produit").addEventListener("input", e => {
    const filtre = e.target.value.toLowerCase();
    const options = document.querySelectorAll("#produit-planifie option");
    options.forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(filtre) ? "block" : "none";
    });
});
document.getElementById("filtrer-produits").addEventListener("input", e => {
    const filtre = e.target.value.toLowerCase();
    const options = document.querySelectorAll("#produit option");
    options.forEach(opt => {
        const visible = opt.textContent.toLowerCase().includes(filtre) || opt.value === "";
        opt.style.display = visible ? "block" : "none";
    });
});

// 📅 Affichage des planifications
async function afficherPlanifications() {
    const res = await fetch("/entrepot/Info/php/planification.php?upcoming=true");
    const data = await res.json();

    const container = document.getElementById("calendrier-planifications");
    container.innerHTML = "<h3> Livraisons prévues</h3>";

    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>Produit</th><th>Type</th><th>Quantité</th><th>Date</th><th>Commentaire</th><th>Fournisseur</th>
        </tr>
    `;
    table.id = "table-planifications";
    data.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.produit_nom}</td>
            <td>${p.type}</td>
            <td>${p.quantite} kg</td>
            <td>${new Date(p.date_prevue).toLocaleString()}</td>
            <td>${p.commentaire || "-"}</td>
            <td>${p.fournisseur_nom || "-"}</td>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
}
// Afficher les planifications
let planifications = []; // Stock global pour filtrage et tri

async function afficherPlanification() {
    const res = await fetch("/entrepot/Info/php/planification.php?upcoming=true");
    const data = await res.json();
    planifications = data; // Stocker pour filtrage

    const tbody = document.querySelector("#table-planification tbody");
    tbody.innerHTML = "";

    data.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${new Date(p.date_prevue).toLocaleString()}</td>
            <td>${p.type}</td>
            <td>${p.produit_nom}</td>
            <td>${p.quantite} kg</td>
            <td>${p.statut}</td>
        `;
        tbody.appendChild(row);
    });
}
document.querySelectorAll("#table-planification tbody tr").forEach(row => {
    const labels = [" Date", " Type", " Produit", " Quantité", " Statut"];
    row.querySelectorAll("td").forEach((td, i) => {
        td.setAttribute("data-label", labels[i]);
    });
});

// 🚀 Initialisation
window.addEventListener("DOMContentLoaded", () => {
    chargerFournisseurs();
    afficherPlanifications();

    afficherPlanification();
    // 🚀 Initialisation
    chargerProduits1();
});



