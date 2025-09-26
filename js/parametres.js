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
// Parametres 
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("parametres-form");
  const themeSelect = document.getElementById("theme-select");
  const message = document.getElementById("message");

  // 🖌️ Appliquer le thème au chargement
  fetch("http://localhost/entrepot/Info/php/parametres.php")
    .then(res => res.json())
    .then(data => {
      const theme = data.parametres?.theme || "clair";
      document.body.classList.remove("theme-clair", "theme-sombre", "theme-bleu");
      document.body.classList.add("theme-" + theme);
      themeSelect.value = theme;
    });

  // 🎯 Changement de thème instantané
  themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;

    // 🎨 Appliquer le thème immédiatement
    document.body.classList.remove("theme-clair", "theme-sombre", "theme-bleu");
    document.body.classList.add("theme-" + theme);

    // 💾 Enregistrer le thème en base
    fetch("http://localhost/entrepot/Info/php/parametres.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.textContent = "🎨 Thème appliqué automatiquement.";
          message.style.color = "green";
        } else {
          message.textContent = "❌ Erreur d'enregistrement du thème.";
          message.style.color = "red";
        }
      })
      .catch(err => {
        console.error("❌ Erreur JS :", err);
        message.textContent = "❌ Erreur réseau.";
        message.style.color = "red";
      });
  });

  // 🧠 Enregistrement des autres paramètres via submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (key !== "theme") {
        payload[key] = value === "on" ? true : value;
      }
    });

    fetch("http://localhost/entrepot/Info/php/parametres.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.textContent = "✅ Paramètres enregistrés.";
          message.style.color = "green";
        } else {
          message.textContent = "❌ Erreur d'enregistrement.";
          message.style.color = "red";
        }
      });
  });
});

