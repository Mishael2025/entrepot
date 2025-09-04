window.currentUserRole = "employé"; // à adapter dynamiquement selon l'utilisateur
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

function getRoleBadge(role) {
    const badges = {
        admin: '<span class="role-badge admin"><i class="fas fa-user-shield"></i> Admin</span>',
        employé: '<span class="role-badge employe"><i class="fas fa-user-cog"></i> Employé</span>',
        auditeur: '<span class="role-badge auditeur"><i class="fas fa-user-secret"></i> Auditeur</span>',
        manager: '<span class="role-badge manager"><i class="fas fa-user-tie"></i> Manager</span>',
        invité: '<span class="role-badge invite"><i class="fas fa-user"></i> Invité</span>'
    };
    return badges[role] || `<span class="role-badge inconnu"><i class="fas fa-user-slash"></i> Inconnu</span>`;
}



document.addEventListener("DOMContentLoaded", function () {
    const username = SessionManager.get("username");
    const role = SessionManager.get("userRole") || "invité";
    const permissions = window.rolePermissions?.[role];

    if (username) {
        console.log(`👤 Utilisateur connecté : ${username}`);
    } else {
        console.log("👤 Aucun utilisateur connecté");
    }

    if (!permissions) {
        console.warn(`⚠️ Rôle inconnu ou non défini : ${role}`);
        return;
    }

    ;

    // 🎖️ Affichage du badge rôle
    const roleLabel = document.getElementById("role-label");
    if (roleLabel) {
        roleLabel.innerHTML = getRoleBadge(role);
        roleLabel.title = `Rôle : ${role}`;
    }
});




window.rolePermissions = {
    admin: {
        canDelete: true,
        canEdit: true,
        canView: true
    },
    employé: {
        canDelete: false,
        canEdit: true,
        canView: true
    },
    auditeur: {
        canDelete: false,
        canEdit: false,
        canView: true
    },
    gestionnaire: {
        canDelete: false,
        canEdit: false,
        canView: true
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


});


