// 🔔 Affichage des icônes selon le type
function getIcon(type) {
    switch (type) {
        case 'warning': return '⚠️';
        case 'error': return '❌';
        case 'success': return '✅';
        case 'info': default: return '🔔';
    }
}

// 🎨 Rendu d'une notification unique
function renderNotification(notification) {
    const div = document.createElement("div");
    div.className = `notification ${notification.type || "info"} ${notification.severity || ""}`;
    div.innerHTML = `
        <p>${getIcon(notification.type)} <strong>${notification.message}</strong></p>
        <small>${new Date(notification.created_at).toLocaleString()}</small><br>
        <button onclick="markAsRead(${notification.id})">✔ Marquer comme lu</button>
    `;
    return div;
}

// 🔁 Récupération et affichage dans la boîte
function getNotifications() {
    fetch("http://localhost/entrepot/Info/php/get_notifications.php")
        .then(response => response.json())
        .then(data => {
            const notificationList = document.getElementById("notifications");

            if (!data.success || !notificationList) {
                console.error("⚠️ Problème de récupération ou élément HTML manquant.");
                return;
            }

            notificationList.innerHTML = "";

            if (data.notifications.length === 0) {
                notificationList.innerHTML = `<p class="no-notif">Aucune notification pour le moment.</p>`;
                return;
            }

            data.notifications.forEach(n => {
                notificationList.appendChild(renderNotification(n));
            });
        })
        .catch(error => {
            console.error("❌ Erreur lors de la récupération des notifications :", error);
        });
}

// 📬 Création d'une notification enrichie
function createNotification({
    user_id = null,
    product_id = null,
    message,
    type = 'info',
    severity = null,
    category = null,
    context = {},
    refreshUI = true
}) {
    fetch("http://localhost/entrepot/Info/php/add_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id,
            product_id,
            message,
            type,
            severity,
            category,
            context: JSON.stringify(context)
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("✅ Notification créée :", data.message);
                if (refreshUI) getNotifications();
            } else {
                console.error("❌ Erreur lors de la création :", data.message);
            }
        })
        .catch(error => {
            console.error("❌ Connexion échouée :", error);
        });
}

// ✅ Marquer une notification comme lue
function markAsRead(notificationId) {
    fetch("http://localhost/entrepot/Info/php/notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId, action: "mark_read" })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const button = document.querySelector(`button[onclick="markAsRead(${notificationId})"]`);
                if (button) button.parentElement.style.display = "none";
            } else {
                alert("❌ Erreur : " + data.message);
            }
        })
        .catch(error => console.error("❌ Échec mise à jour :", error));
}

// 🔄 Optionnel : auto-refresh toutes les 30 secondes
setInterval(getNotifications, 30000);

document.addEventListener("DOMContentLoaded", () => {
    // Bouton refresh
    const refreshButton = document.getElementById("refresh-btn");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            location.reload();
        });
    }

    // 📥 Charger les notifications automatiquement
    getNotifications();
});
//le BOUTON DE RAFFRAICHISSEMENT
document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh-btn");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            location.reload(); // 🔄 Recharge toute la page
        });
    }
});

// 🔄 Charger la liste depuis l'API
function loadSeuils() {
    fetch("http://localhost/entrepot/Info/php/seuils_stock_api.php?action=get")
        .then(r => r.json())
        .then(data => {
            const tbody = document.querySelector("#seuils-table tbody");
            tbody.innerHTML = ""; // On vide la table avant d’ajouter

            // Si le backend renvoie un tableau, on le parcourt
            if (Array.isArray(data)) {
                data.forEach(item => {
                    tbody.innerHTML += `
            <tr>
              <td>${item.categorie}</td>
              <td><input type="number" value="${item.seuil}" onchange="updateSeuil('${item.categorie}', this.value)"></td>
              <td><button onclick="deleteSeuil('${item.categorie}')">🗑️ Delete</button></td>
            </tr>
          `;
                });
            } else {
                console.warn("⚠️ Réponse inattendue :", data);
            }
        })
        .catch(error => {
            console.error("❌ Erreur lors du chargement des seuils :", error);
        });
}

// ✅ Ajouter une nouvelle catégorie
document.getElementById("add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    fetch("http://localhost/entrepot/Info/php/seuils_stock_api.php?action=add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            categorie: document.getElementById("categorie").value,
            seuil: document.getElementById("seuil").value
        })
    }).then(() => {
        loadSeuils(); // recharge après ajout
        this.reset();
    });
});

// ✏️ Modifier un seuil
function updateSeuil(categorie, newSeuil) {
    fetch("http://localhost/entrepot/Info/php/seuils_stock_api.php?action=update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorie, seuil: newSeuil })
    });
}

// 🗑️ Supprimer une catégorie
function deleteSeuil(categorie) {
    if (confirm("Supprimer cette catégorie ?")) {
        fetch("seuils_stock_api.php?action=delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categorie })
        }).then(() => loadSeuils());
    }
}

loadSeuils(); // 🚀 Initialiser

document.getElementById("edit-btn").addEventListener("click", () => {
    const modal = document.getElementById("modal-seuil");
    modal.style.display = "block";
    loadSeuils(); // Charge les données au moment de l’ouverture
});

document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("modal-seuil").style.display = "none";
});

/* Rapport sur les seuilles critique*/

function getCriticiteClass(qte, seuil) {
    qte = parseInt(qte);
    seuil = parseInt(seuil);
    if (qte === 0) return "danger";
    if (qte < seuil / 2) return "warning";
    return "attention";
}


function getDateClass(date) {
    if (!date) return "";
    const aujourdHui = new Date();
    const dateProd = new Date(date);

    // Calcul de 7 jours plus tard
    const semaineProchaine = new Date(aujourdHui);
    semaineProchaine.setDate(semaineProchaine.getDate() + 7);

    if (dateProd < aujourdHui) return "perime";                // 🟥 périmé
    if (dateProd <= semaineProchaine) return "bientot-perime"; // 🟨 expire dans 7 jours ou moins
    return "";                                                  // ✅ bon état
}

function fetchData() {
    fetch("http://localhost/entrepot/Info/php/rapport_stock.php")
        .then(r => r.json())
        .then(data => {
            const tbody = document.getElementById("rapport-body");
            tbody.innerHTML = "";

            data.forEach(p => {
                const criticiteClass = getCriticiteClass(p.quantite, p.seuil); // Niveau de stock
                const dateClass = getDateClass(p.date_peremption);             // Péremption
                const classes = `${criticiteClass} ${dateClass}`.trim();       // Classe combinée

                // 🔄 Génération de la pastille
                let pastilleClass = "", pastilleText = "";
                if (dateClass === "perime") {
                    pastilleClass = "alert";
                    pastilleText = "❌ Périmé";
                } else if (dateClass === "bientot-perime") {
                    pastilleClass = "warn";
                    pastilleText = "⏰ Bientôt (≤ 7j)";
                } else {
                    pastilleClass = "ok";
                    pastilleText = "✅ OK";
                }

                tbody.innerHTML += `
                    <tr class="${classes}">
                      <td>${p.nom}</td>
                      <td>${p.categorie}</td>
                      <td>${p.quantite}</td>
                      <td>${p.seuil}</td>
                      <td>
                        ${p.date_peremption || '—'}
                        <span class="pastille ${pastilleClass}">${pastilleText}</span>
                      </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("❌ Erreur de chargement :", err));
}
// 🟢 Appel automatique au chargement

document.getElementById("search").addEventListener("input", function () {
    const term = this.value.toLowerCase();
    document.querySelectorAll("#rapport-body tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
    });
});

/*SUJESTION DE REAPROVISIONNEMENT*/
// Définition de la fonction
function fetchSuggestions() {
    fetch("http://localhost/entrepot/Info/php/suggestions_stock.php")
        .then(r => r.json())
        .then(data => {
            const tbody = document.getElementById("suggestion-body");
            tbody.innerHTML = "";

            data.forEach(item => {
                const info = item.quantite !== undefined
                    ? `${item.quantite} unités`
                    : item.date_peremption || "—";
                const fournisseurs = Array.isArray(item.fournisseurs) && item.fournisseurs.length > 0
                    ? item.fournisseurs.join(", ")
                    : item.fournisseur || "Aucun fournisseur";
                tbody.innerHTML += `
            <tr>
            <td>${item.nom}</td>
            <td>${item.raison}</td>
            <td>${info}</td>
            <td>${item.suggestion}</td>
            <td>${fournisseurs}</td>
            </tr>
            `;
            });
        })
        .catch(error => console.error("❌ Erreur :", error));
}
fetch("http://localhost/entrepot/Info/php/suggestions_stock.php")
    .then(r => r.json())
    .then(data => {
        if (Array.isArray(data)) {
            console.log(`📦 ${data.length} suggestions reçues`);
        } else {
            console.warn("⚠️ Format inattendu :", data);
        }
    });
// Gestion des fournisseurs
function chargerFournisseurs() {
    fetch("http://localhost/entrepot/Info/php/fournisseur_api.php")
        .then(r => r.json())
        .then(data => {
            console.log("✅ Fournisseur charges:", data);

            const container = document.querySelector(".fournisseur-card");
            container.innerHTML = "";

            data.forEach(f => {
                const card = document.createElement("div");
                card.classList.add("fournisseur-card");
                card.innerHTML = `
                <h3>${f.nom}</h3>
                <p><strong>Contact :</strong> ${f.contact || "—"}</p>
                <p><strong>Email :</strong> ${f.email || "—"}</p>
                <p><strong>Adresse :</strong> ${f.adresse || "—"}</p>
                <p><strong>Catégorie :</strong> ${f.categorie}</p>
                <div class="actions">
                <button onclick="modifierFournisseur(${f.id})">✏️ Modifier</button>
                <button onclick="supprimerFournisseur(${f.id})">🗑️ Supprimer</button>
                </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => console.error("❌ Erreur chargement fournisseurs :", err));
}

window.onload = function () {
    chargerFournisseurs();
    fetchSuggestions();
    fetchData(); // Charger les fournisseurs au démarrage
}
document.getElementById("fournisseur-form").addEventListener("submit", e => {
    e.preventDefault();
    const data = {
        nom: document.getElementById("nom").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        email: document.getElementById("email").value.trim(),
        adresse: document.getElementById("adresse").value.trim(),
        categorie: document.getElementById("categorie-select").value.trim()
    };

    fetch("http://localhost/entrepot/Info/php/fournisseur_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                alert("✅ Fournisseur ajouté !");

                document.getElementById("fournisseur-form").reset();
                console.log("✅ Fournisseur ajouté :", data);

            } else {
                alert("❌ Échec ajout : " + res.error);
            }
        })
        .catch(err => console.error("❌ Erreur ajout :", err));
});
function modifierFournisseur(id) {
    fetch(`http://localhost/entrepot/Info/php/fournisseur_api.php?id=${id}`)
        .then(r => r.json())
        .then(f => {
            document.getElementById("nom").value = f.nom;
            document.getElementById("contact").value = f.contact;
            document.getElementById("email").value = f.email;
            document.getElementById("adresse").value = f.adresse;
            document.getElementById("categorie-select").value = f.categorie;

            const bouton = document.querySelector("#fournisseur-form button");
            bouton.textContent = "Mettre à jour";
            bouton.onclick = function (e) {
                e.preventDefault();
                const maj = {
                    id: id,
                    nom: document.getElementById("nom").value.trim(),
                    contact: document.getElementById("contact").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    adresse: document.getElementById("adresse").value.trim(),
                    categorie: document.getElementById("categorie-select").value.trim()
                };

                fetch("http://localhost/entrepot/Info/php/fournisseur_api.php", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(maj)
                })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            alert("✅ Fournisseur mis à jour !");
                            document.getElementById("fournisseur-form").reset();
                            bouton.textContent = "Ajouter";
                            bouton.onclick = null;

                        } else {
                            alert("❌ Échec mise à jour : " + res.error);
                        }
                    });
            };
        });
}

