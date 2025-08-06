// Connexion
const loginPage = document.getElementById("login-page");

const loginBtn = document.getElementById("login-btn");

// Base d’utilisateurs pour la connexion (remplacez cela avec une API si nécessaire)


document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("http://localhost/entrepot/Info/php/Authentification.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                
                alert("Connexion réussie !");
                SessionManager.set("username", username); // Enregistrer le nom d'utilisateur
                SessionManager.set("userRole", data.role);

                console.log("🔑 Rôle de l'utilisateur :", data.role);
                window.location.href = "/entrepot/Info/html/acceuil.html";

                configureRoleAccess(data.role); // ✅ Appliquer les restrictions
            } else {
                alert("❌ " + data.message);
            }
        })
        .catch(error => console.error("Erreur lors de la connexion :", error));
});

// ✅ Fonction pour gérer l'affichage selon le rôle
function configureRoleAccess(role) {
    console.log("🔎 Rôle connecté :", role);

    if (role === "employee") {
        // Masquer les champs de saisie
        document.querySelectorAll("input").forEach(input => input.style.display = "none");

        // Masquer tous les boutons sauf ceux autorisés
        document.querySelectorAll(".method-btn").forEach(btn => btn.style.display = "none");

        // Masquer la colonne "Actions"
        const actionColumn = document.querySelector(".actions-column");
        if (actionColumn) actionColumn.style.display = "none";

        // Masquer les cellules d'action du tableau
        document.querySelectorAll(".actions-cell").forEach(cell => cell.style.display = "none");

        // Masquer le bouton "Ajouter"
        const addButton = document.getElementById("add-product-btn");
        if (addButton) addButton.style.display = "none";

    }
}

// Logout functionality
//document.addEventListener("DOMContentLoaded", function() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            sessionStorage.removeItem("userRole");
            alert("Vous avez été déconnecté.");
            window.location.href = "/entrepot/Info/html/login.html";
        });
    }


