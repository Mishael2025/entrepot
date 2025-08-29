// Connexion
const loginPage = document.getElementById("login-page");

const loginBtn = document.getElementById("login-btn");

// Base d’utilisateurs pour la connexion (remplacez cela avec une API si nécessaire)


document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    // 🔐 Connexion
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                alert("⚠️ Veuillez remplir tous les champs.");
                return;
            }

            try {
                const res = await fetch("http://localhost/entrepot/Info/php/Authentification.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (data.success) {
                    SessionManager.set("username", data.username);
                    SessionManager.set("userRole", data.role);
                    SessionManager.set("user_id", data.id);

                    alert("✅ Connexion réussie !");
                    window.location.href = "/entrepot/Info/html/acceuil.html";
                } else {
                    alert("❌ " + data.message);
                }
            } catch (error) {
                console.error("Erreur lors de la connexion :", error);
                alert("❌ Erreur serveur. Veuillez réessayer.");
            }
        });
    }

    // 🚪 Déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            SessionManager.clear("username");
            alert("👋 Vous avez été déconnecté.");
            window.location.href = "/entrepot/Info/html/PageConnexion.html";
        });
    }

    // 🔐 Application des restrictions selon le rôle
    const role = SessionManager.get("userRole") || "invité";
    if (window.rolePermissions?.[role]) {
        applyRoleRestrictionsByPage(role);
    }
});

// ✅ Fonction d’application des permissions
function configureRoleAccess(role) {
    applyRoleRestrictionsByPage(role);
}

// 🔁 Si on est sur la page de connexion, appliquer les restrictions
if (window.location.pathname.includes("PageConnexion.html")) {
    const role = SessionManager.get("userRole") || "invité";
    if (window.rolePermissions?.[role]) {
        configureRoleAccess(role);
    }
}






// ✅ Fonction pour gérer l'affichage selon le rôle
function configureRoleAccess(role) {
    applyRoleRestrictionsByPage(role);
}
if (window.location.pathname.includes("PageConnexion.html")) {
    const role = SessionManager.get("userRole") || "invité";
    const permissions = window.rolePermissions[role];
    if (permissions) configureRoleAccess(role);
}



