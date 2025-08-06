console.log("✅ Script utilisateurs.js chargé !");
const userRole = sessionStorage.getItem("userRole") || "guest";
console.log("Rôle utilisateur :", userRole);

let users = []; // Tableau pour stocker les utilisateurs

// Vérifier si l'utilisateur est admin et rediriger si nécessaire
document.addEventListener("DOMContentLoaded", function () {
    const userRole = sessionStorage.getItem("userRole");
    if (userRole !== "admin" && userRole !== "manager") {
        alert("⛔ Accès réservé à l'administrateur ou au manager !");
        window.location.href = "../html/acceuil.html"; // Redirige vers l'accueil
    }


    chargerUtilisateurs(); // Charge les utilisateurs depuis la base de données
});



// Fonction pour afficher les utilisateurs dans le tableau HTML
function renderTable() {
    const tableBody = document.querySelector("#user-table tbody");

    if (!tableBody) {
        console.error("❌ Erreur : Table HTML introuvable !");
        return;
    }

    tableBody.innerHTML = "";

    if (users.length === 0) {
        console.warn("⚠️ Aucun utilisateur trouvé !");
        tableBody.innerHTML = "<tr><td colspan='4'>Aucun utilisateur enregistré.</td></tr>";
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.nom || "Inconnu"}</td>
            <td>${user.email || "Inconnu"}</td>
            <td>${user.role && user.role.trim() !== "" ? user.role : "Non défini"}</td>
            <td>
                <button onclick="modifierUtilisateur(${user.id})">Modifier</button>
            </td>
        `;
        tableBody.appendChild(row);
        // console.log("Utilisateur :", user.nom, "Email :", user.email, "Rôle :", user.role);

    });

    //console.log("✅ Table mise à jour :", tableBody.innerHTML);
}

function modifierUtilisateur(userId) {
    console.log(`✅ Envoi de la requête UPDATE à : http://localhost/entrepot/Info/php/update_utilisateur.php?id=${userId}`);
    console.log(userId);

    fetch(`http://localhost/entrepot/Info/php/get_utilisateur.php?id=${userId}`)
        .then(response => response.json())
        .then(utilisateur => {
            if (!utilisateur || !utilisateur.nom) {
                alert("Utilisateur introuvable !");
                return;
            }

            // Remplir les champs du formulaire avec ses infos
            document.getElementById("user-name").value = utilisateur.nom;
            document.getElementById("user-email").value = utilisateur.email;
            document.getElementById("user-role").value = utilisateur.role;
            document.getElementById("user-password").value = utilisateur.password;


            // Ajouter un bouton de mise à jour
            const updateBtn = document.getElementById("update-user-btn");
            if (!updateBtn) {
                const newUpdateBtn = document.createElement("button");
                newUpdateBtn.textContent = "Mettre à jour";
                newUpdateBtn.id = "update-user-btn";
                newUpdateBtn.onclick = function () {
                    mettreAJourUtilisateur(userId);

                };
                document.getElementById("user-form").appendChild(newUpdateBtn);
            }
        })
        .catch(error => console.error("Erreur lors de la récupération de l'utilisateur :", error));
}

// Mettre en jour les utilisateurs
function mettreAJourUtilisateur(userId) {
    const utilisateur = {
        id: userId,
        nom: document.getElementById("user-name").value,
        email: document.getElementById("user-email").value,
        role: document.getElementById("user-role").value,
        password: document.getElementById("user-password").value
    };

    console.log("📤 Données envoyées :", utilisateur);

    fetch("http://localhost/entrepot/Info/php/update_utilisateur.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(utilisateur)
    })
        .then(response => response.json())
        .then(data => {
            console.log("📥 Réponse du serveur :", data);
            alert(data.message);
        })
        .catch(error => console.error("❌ Erreur lors de la mise à jour :", error));
    console.log(utilisateur);

}

// Fonction pour charger les utilisateurs depuis MySQL via PHP
function chargerUtilisateurs() {

    fetch("http://localhost/entrepot/Info/php/lister_utilisateurs.php", {
        method: "GET",  // Définir la méthode GET
        headers: { "Content-Type": "application/json" }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Utilisateurs reçus :", data);
            users = data; // Met à jour la liste des utilisateurs
            renderTable(); // Affiche les utilisateurs dans la table
        })
        .catch(error => console.error("Erreur de chargement des utilisateurs :", error));
}
function isStrongPassword(pwd) {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
}
// Fonction pour ajouter un utilisateur
document.getElementById("add-user-btn").addEventListener("click", () => {
    const nom = document.getElementById("user-name").value;
    const email = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;
    const role = document.getElementById("user-role").value;

    console.log("📤 Envoi des données : ", { nom, email, password, role });

    fetch("http://localhost/entrepot/Info/php/ajouter_utilisateur.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ nom, email, mot_de_passe: password, role })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            isStrongPassword(email) ? console.log("✅ Mot de passe fort") : console.warn("⚠️ Mot de passe faible");
            console.log("📥 Réponse du serveur :", data);
            chargerUtilisateurs(); // Recharge la liste des utilisateurs
        })
        .catch(error => console.error("❌ Erreur Fetch:", error));

    resetInputs();
});

// Fonction pour supprimer un utilisateur
document.getElementById("res-user-btn").addEventListener("click", () => {

    let userId = parseInt(prompt("Entrez l'ID de l'utilisateur à supprimer :"));

    if (userId) {
        console.log(`✅ Envoi de la requête DELETE à : http://localhost/entrepot/Info/php/supprimer_utilisateur.php?id=${userId}`);
        console.log("📤 ID à supprimer :", userId);

        fetch(`http://localhost/entrepot/Info/php/delete_user.php?id=${(userId)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: parseInt(userId, 10) })  // ✅ Envoi du JSON avec l'ID
        })
            .then(response => response.json())
            .then(data => {
                console.log("📥 Réponse du serveur :", data);
                alert(data.message);
                chargerUtilisateurs(); // Met à jour la liste après suppression
            })
            .catch(error => console.error("❌ Erreur lors de la suppression :", error));
    }
});

// Fonction pour réinitialiser les champs du formulaire
function resetInputs() {
    document.getElementById("user-name").value = "";
    document.getElementById("user-email").value = "";
    document.getElementById("user-password").value = "";
    document.getElementById("user-role").value = "";
}
console.log("Test manuel d'affichage...");
renderTable();