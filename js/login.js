// Connexion
const loginPage = document.getElementById("login-page");

const loginBtn = document.getElementById("login-btn");

// Base d’utilisateurs pour la connexion (remplacez cela avec une API si nécessaire)


document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("login-btn");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
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
                        alert("✅ Connexion réussie !");
                        SessionManager.set("username", username);
                        SessionManager.set("userRole", data.role);

                        window.location.href = "/entrepot/Info/html/acceuil.html";
                    } else {
                        alert("❌ " + data.message);
                    }
                })
                .catch(error => console.error("Erreur lors de la connexion :", error));
        });
    }

    // 🔐 Appliquer les restrictions si déjà connecté
    const role = SessionManager.get("userRole") || "invité";
    if (window.rolePermissions[role]) {
        applyRoleRestrictionsByPage(role);
    }

    // 🚪 Déconnexion
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            SessionManager.clear();
            alert("👋 Vous avez été déconnecté.");
            window.location.href = "/entrepot/Info/html/PageConnexion.html";
        });
    }
});





// ✅ Fonction pour gérer l'affichage selon le rôle
function configureRoleAccess(role) {
   applyRoleRestrictionsByPage(role);
}
if (window.location.pathname.includes("PageConnexion.html")) {
    const role = SessionManager.get("userRole") || "invité";
    const permissions = window.rolePermissions[role];
    if (permissions) configureRoleAccess(role);
}



