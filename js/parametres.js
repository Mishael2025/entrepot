// parametres.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("parametres-form");
    const message = document.getElementById("message");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const payload = {};

        formData.forEach((value, key) => {
            payload[key] = value === "on" ? true : value;
        });

        fetch("parametres_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    message.textContent = "✅ Paramètres enregistrés avec succès.";
                    message.style.color = "green";
                } else {
                    message.textContent = "❌ Erreur lors de l'enregistrement.";
                    message.style.color = "red";
                }
            })
            .catch(err => {
                console.error("Erreur JS :", err);
                message.textContent = "❌ Erreur réseau.";
                message.style.color = "red";
            });
    });
});
