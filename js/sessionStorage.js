window.SessionManager = {
    set: function (key, value) {
        sessionStorage.setItem(key, value);
    },
    get: function (key) {
        return sessionStorage.getItem(key);
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
});


