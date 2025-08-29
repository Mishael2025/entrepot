console.log("✅ Script utilisateurs.js chargé !");
const userRole = sessionStorage.getItem("userRole") || "guest";
console.log("Rôle utilisateur :", userRole);



// Vérifier si l'utilisateur est admin et rediriger si nécessaire
document.addEventListener("DOMContentLoaded", function () {
    const userRole = sessionStorage.getItem("userRole");
    if (userRole == "admin" && userRole !== "manager") {
        alert("⛔ Accès réservé à l'administrateur ou au manager !");
        window.location.href = "../html/acceuil.html"; // Redirige vers l'accueil
    }


    chargerUtilisateurs(); // Charge les utilisateurs depuis la base de données
});

let utilisateurs = [];

// 🔄 Charger les utilisateurs depuis l’API
async function chargerUtilisateurs() {
    try {
        const res = await fetch("http://localhost/entrepot/Info/php/lister_utilisateurs.php");
        const data = await res.json();
        console.log("📦 Données reçues :", data);
        if (!data.success || !Array.isArray(data.data)) {
            throw new Error("Format de données invalide");
        }

        utilisateurs = data.data;
        renderTable();
    } catch (err) {
        console.error("❌ Erreur chargement utilisateurs :", err);
    }
}

// 🧱 Afficher les utilisateurs dans le tableau
function renderTable() {
    const tbody = document.querySelector("#user-table tbody");
    tbody.innerHTML = "";

    if (!utilisateurs.length) {
        tbody.innerHTML = `<tr><td colspan="6">Aucun utilisateur enregistré.</td></tr>`;
        return;
    }

    utilisateurs.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.nom}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td>${user.actif == 1 ? "✅ Actif" : "❌ Inactif"}</td>
            <td><pre>${user.permissions || "-"}</pre></td>
            <td>
                <button class="btn-edit" onclick="modifierUtilisateur(${user.id})">✏️</button>
                <button class="btn-delete" onclick="supprimerUtilisateur(${user.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ➕ Ajouter un utilisateur
async function ajouterUtilisateur() {
    const nom = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const mot_de_passe = document.getElementById("user-password").value;
    const roles = Array.from(document.getElementById("user-role").selectedOptions).map(opt => opt.value).join(",");
    const permissions = document.getElementById("user-permissions").value.trim();
    const actif = document.getElementById("user-active").checked ? 1 : 0;

    if (!nom || !email || !mot_de_passe || !roles) {
        alert("⚠️ Tous les champs obligatoires doivent être remplis");
        return;
    }

    try {
        const res = await fetch("http://localhost/entrepot/Info/php/ajouter_utilisateur.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom, email, mot_de_passe, role: roles, permissions, actif })
        });

        const data = await res.json();
        alert(data.message);
        chargerUtilisateurs();
        resetForm();
    } catch (err) {
        console.error("❌ Erreur ajout utilisateur :", err);
    }
}

// ✏️ Modifier un utilisateur
async function modifierUtilisateur(id) {
    try {
        const res = await fetch(`http://localhost/entrepot/Info/php/get_utilisateur.php?id=${id}`);
        const user = await res.json();

        document.getElementById("user-name").value = user.nom;
        document.getElementById("user-email").value = user.email;
        document.getElementById("user-password").value = "";
        document.getElementById("user-permissions").value = user.permissions || "";
        document.getElementById("user-active").checked = user.actif == 1;

        const roleSelect = document.getElementById("user-role");
        Array.from(roleSelect.options).forEach(opt => {
            opt.selected = user.role.includes(opt.value);
        });

        injectUpdateButton(id);
    } catch (err) {
        console.error("❌ Erreur chargement utilisateur :", err);
    }
}

// 💾 Injecter le bouton de mise à jour
function injectUpdateButton(id) {
    let btn = document.getElementById("update-user-btn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "update-user-btn";
        btn.textContent = "💾 Mettre à jour";
        btn.className = "btn-update";
        btn.onclick = () => mettreAJourUtilisateur(id);
        document.querySelector(".form-actions").appendChild(btn);
    }
}

// 🔁 Mettre à jour un utilisateur
async function mettreAJourUtilisateur(id) {
    const nom = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const mot_de_passe = document.getElementById("user-password").value;
    const roles = Array.from(document.getElementById("user-role").selectedOptions).map(opt => opt.value).join(",");
    const permissions = document.getElementById("user-permissions").value.trim();
    const actif = document.getElementById("user-active").checked ? 1 : 0;

    try {
        const res = await fetch("http://localhost/entrepot/Info/php/update_utilisateur.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, nom, email, mot_de_passe, role: roles, permissions, actif })
        });

        const data = await res.json();
        alert(data.message);
        chargerUtilisateurs();
        resetForm();
    } catch (err) {
        console.error("❌ Erreur mise à jour :", err);
    }
}

// 🗑️ Supprimer un utilisateur
async function supprimerUtilisateur(id) {
    if (!confirm("🗑️ Confirmer la suppression ?")) return;

    try {
        const res = await fetch(`http://localhost/entrepot/Info/php/delete_user.php?id=${id}`, {
            method: "DELETE"
        });

        const data = await res.json();
        alert(data.message);
        chargerUtilisateurs();
    } catch (err) {
        console.error("❌ Erreur suppression :", err);
    }
}

// 🔄 Réinitialiser le formulaire
function resetForm() {
    document.getElementById("user-form").reset();
    const updateBtn = document.getElementById("update-user-btn");
    if (updateBtn) updateBtn.remove();
}

// 🚀 Initialisation
document.getElementById("add-user-btn").addEventListener("click", ajouterUtilisateur);
document.getElementById("res-user-btn").addEventListener("click", () => alert("Utilisez les boutons 🗑️ dans la table"));
document.addEventListener("DOMContentLoaded", chargerUtilisateurs);



// Fonction pour réinitialiser les champs du formulaire
function resetInputs() {
    document.getElementById("user-name").value = "";
    document.getElementById("user-email").value = "";
    document.getElementById("user-password").value = "";
    document.getElementById("user-role").value = "";
}
console.log("Test manuel d'affichage...");
renderTable();