window.applyRoleRestrictionsByPage = function (role) {
    const permissions = window.rolePermissions[role];
    if (!permissions) return;

    const pageKey = getPageKey();

    // 🔒 Masquer les boutons de suppression
    if (!permissions.canDelete) {
        document.querySelectorAll(".btn-delete").forEach(btn => btn.style.display = "none");
    }

    // ✏️ Désactiver les champs d’édition spécifiques à la page
    if (!permissions.canEdit) {
        document.querySelectorAll(`.field-${pageKey}`).forEach(el => el.disabled = true);
    }

    // 👁️ Masquer les modules non accessibles
    if (!permissions.canView) {
        document.querySelectorAll(".module-protected").forEach(el => el.style.display = "none");
    }

    // ➕ Masquer les boutons d’ajout
    if (!permissions.canAdd) {
        document.querySelectorAll(".btn-add").forEach(btn => btn.style.display = "none");
    }

    console.log(`🔐 Restrictions appliquées pour le rôle "${role}" sur la page "${pageKey}"`);
}

function getPageKey() {
    const path = window.location.pathname;
    const filename = path.split("/").pop().replace(".html", "").toLowerCase();

    const mapping = {
        "acceuil": "acceuil",
        "dashboard": "dashboard",
        "html": "entreposage",
        "sortie": "sortie",
        "Iventaire": "inventaire"
    };

    return mapping[filename] || "unknown";
}
document.addEventListener("DOMContentLoaded", function () {
    const role = SessionManager.get("userRole") || "invité";
    applyRoleRestrictionsByPage(role);

    const roleLabel = document.getElementById("role-label");
    if (roleLabel) {
        roleLabel.textContent = `Rôle : ${role}`;
    }
    //roleLabel.style.display = "block"; // S'assurer que le label est visible
});



window.rolePermissions = {
    admin: {
        canDelete: true,
        canEdit: true,
        canView: true
    },
    operateur: {
        canDelete: false,
        canEdit: true,
        canView: true
    },
    auditeur: {
        canDelete: false,
        canEdit: false,
        canView: true
    },
    invite: {
        canDelete: false,
        canEdit: false,
        canView: false
    }
};
window.SessionManager = {

    get: function (key) {
        return sessionStorage.getItem(key);
    },

    set: function (key, val) {
        sessionStorage.setItem(key, val.toString());
    },
    getInt: function (key) {
        const val = sessionStorage.getItem(key);
        return val !== null ? parseInt(val) : null;
    },

    clear: function () {
        sessionStorage.clear();
    },
    remove: function (key) {
        sessionStorage.removeItem(key);
    },
    exists: function (key) {
        return sessionStorage.getItem(key) !== null;
    }
};
document.addEventListener("DOMContentLoaded", function () {
    const username = SessionManager.get("username");
    if (username) {
        console.log(`👤 Utilisateur connecté : ${username}`);
    } else {
        console.log("👤 Aucun utilisateur connecté");
    }
    const role = SessionManager.get("userRole") || "invité";
    const permissions = window.rolePermissions[role];

    if (!permissions) {
        console.warn(`⚠️ Rôle inconnu ou non défini : ${role}`);
        return;
    }

    // 👤 Affichage du rôle
    const roleLabel = document.getElementById("role-label");
    if (roleLabel) {
        roleLabel.textContent = `Rôle : ${role}`;
    }

    // 🔐 Appliquer les restrictions spécifiques à la page
    applyRoleRestrictionsByPage(role);
});


