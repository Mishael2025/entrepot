

document.addEventListener("DOMContentLoaded", () => {

    const productTableBody = document.querySelector("#product-table tbody");
    const historyList = document.getElementById("history-list");
    const addProductBtn = document.getElementById("add-product-btn");
    let updateProductBtn = document.getElementById("update-product-btn");

    //const inventoryData = [];
    let editingProductId = null;
    let inventoryData = []; // ✅ Déclaration globale pour éviter qu’elle soit vide après un rafraîchissement


    // ✅ Charger l'historique automatiquement au démarrage
    document.addEventListener("DOMContentLoaded", function () {
        updateHistoryDisplay();
    });
    const editModal = document.getElementById("edit-modal");
    if (editModal) {
        editModal.style.display = "none";

        window.addEventListener("DOMContentLoaded", () => {
            document.getElementById("edit-modal").style.display = "none";
            document.getElementById("history-modal").style.display = "none";
        });
    }
    //le BOUTON DE RAFFRAICHISSEMENT
    document.addEventListener("DOMContentLoaded", () => {
        const refreshButton = document.getElementById("refresh-btn");
        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                location.reload(); // 🔄 Recharge toute la page
            });
        }
    });

 

    document.addEventListener("DOMContentLoaded", () => {
        const clearBtn = document.getElementById("clear-history");
        if (!clearBtn) {
            console.error("❌ Le bouton avec id='clear-history' est introuvable !");
        } else {
            clearBtn.addEventListener("click", () => {
                localStorage.removeItem("history");
                updateHistoryDisplay();
                console.log("🚮 Historique vidé !");
            });
        }

    });
    // export en fichier excel
    document.addEventListener("DOMContentLoaded", () => {
        const downloadBtn = document.getElementById("download-excel");

        if (!downloadBtn) {
            console.error("❌ Le bouton 'download-excel' est introuvable !");
            return;
        }

        downloadBtn.addEventListener("click", () => {
            console.log("✅ Bouton cliqué !");
            window.open("http://localhost/entrepot/Info/Php/generate_stock_repport.php", "_blank");
        });
    });

    function saveToLocalStorage() {
        try {
            localStorage.setItem("inventoryData", JSON.stringify(inventoryData));
            console.log("Données sauvegardées :", inventoryData);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
        }
    }

    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem("inventoryData");
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                inventoryData.push(...parsedData);
                console.log("Données chargées :", parsedData);
                updateTable();
            } else {
                console.log("Aucune donnée trouvée dans le localStorage.");
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données :", error);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        console.log("Chargement du DOM terminé.");
        loadFromLocalStorage();
        console.log(localStorage.getItem("inventoryData")); // Devrait afficher les données sauvegardées.


    });
    document.addEventListener("DOMContentLoaded", function () {
        updateTable(); // ✅ Exécuter après le chargement complet de la page
    });
    window.addEventListener("beforeunload", saveToLocalStorage);

    // Fonction pour réinitialiser les champs du formulaire
    function clearInputs() {
        const inputs = document.querySelectorAll('input'); // Sélectionner tous les champs de saisie
        inputs.forEach(input => {
            input.value = ""; // Réinitialiser la valeur des champs à une chaîne vide
        });

        const selects = document.querySelectorAll('select'); // Sélectionner tous les menus déroulants
        selects.forEach(select => {
            select.selectedIndex = 0; // Réinitialiser la sélection au premier élément
        });

        const textareas = document.querySelectorAll('textarea'); // Sélectionner tous les zones de texte
        textareas.forEach(textarea => {
            textarea.value = ""; // Réinitialiser la valeur des zones de texte
        });
    }

    // Supprimer un produit
    window.deleteProduct = function (id) {
        if (!id || isNaN(parseInt(id, 10))) {
            console.error("❌ ID invalide :", id);
            alert("ID invalide. Impossible de supprimer le produit.");
            return;
        }
        console.log("🔎 ID reçu pour suppression :", id);

        // ✅ Vérifier si `inventoryData` contient les produits
        if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
            console.error("❌ `inventoryData` est vide ou invalide !");
            alert("Les produits ne sont pas chargés correctement. Recharge la page !");
            return;
        }
        if (!confirm("❗Es-tu sûr de vouloir supprimer ce produit ?")) {
            return;
        }

        // ✅ Chercher le produit dans `inventoryData`
        const product = inventoryData.find(item => item.id == id);

        if (!product) {
            console.error(`❌ Produit avec ID ${id} introuvable avant suppression !`);
            alert("Le produit n'existe pas.");
            return;
        }

        const productName = product.name;
        const expiryDate = product.expiryDate;

        console.log("🔎 Produit trouvé :", productName, "| Expiry Date :", expiryDate);

        // ✅ Envoi de la requête DELETE à l’API
        fetch(`http://localhost/entrepot/Info/Php/produits_api.php?id=${parseInt(id, 10)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
            .then(response => response.json())
            .then(data => {
                console.log("🔎 Réponse API après suppression :", data);

                if (data.success) {
                    alert("✅ Produit supprimé avec succès !");

                    // ✅ Met à jour `inventoryData` après suppression
                    inventoryData = inventoryData.filter(item => item.id != id);
                    console.log("🔎 Mise à jour du tableau...");
                    updateTable();// ✅ Rafraîchir l'affichage après suppression
                    console.log("✅ Tableau mis à jour !");

                    // ✅ Ajout à l'historique APRES confirmation API
                    addToHistory("Suppression", productName, new Date().toLocaleString(), expiryDate);
                } else {
                    console.error("❌ Erreur API :", data.error);
                    alert(`Erreur : ${data.error}`);
                }
            })
            .catch(error => console.error("❌ Erreur lors de la suppression :", error));
    };


    // Bouton Ajouter
    if (addProductBtn) {
        addProductBtn.addEventListener("click", () => {
            const product = getProductInput();
            console.log("🔎 Produit récupéré :", product);

            if (!product || !product.name) {
                alert("❌ Le nom du produit est obligatoire.");
                return;
            }

            const fileInput = document.getElementById("edit-photo");
            const file = fileInput.files[0];

            // ✅ Prévisualisation locale
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById("preview-photo").src = e.target.result;
                    document.getElementById("preview-photo").style.display = "block";
                };
                reader.readAsDataURL(file);
            }

            const formData = new FormData();
            formData.append("nom", product.name);
            formData.append("quantite", product.quantity);
            formData.append("unit", product.unit);
            formData.append("categorie", product.category);
            formData.append("date_peremption", product.expiryDate || "");
            formData.append("position", product.position);
            formData.append("prix_unitaire", product.prixUnit);

            // ✅ Ajout des champs supplémentaires

            formData.append("statut", document.getElementById("edit-status").value.trim());

            if (file) {
                formData.append("photo", file);
            }

            fetch("http://localhost/entrepot/Info/Php/produits_api.php", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) throw new Error("Réponse HTTP invalide : " + response.status);
                    return response.json();
                })
                .then(data => {
                    console.log("🔎 Réponse de l'API après ajout :", data);
                    if (data.success) {
                        addToHistory("Ajout", product.name, new Date().toLocaleString(), product.expiryDate);

                        const newProduct = {
                            ...product,
                            id: data.id || Date.now(),
                            photo: file ? file.name : product.Photo || "Food2.jpg",
                            lot: document.getElementById("edit-lot").value.trim(),
                            code_barre: document.getElementById("edit-barcode").value.trim(),
                            statut: document.getElementById("edit-status").value.trim()
                        };

                        inventoryData.push(newProduct);
                        localStorage.setItem("inventoryData", JSON.stringify(inventoryData));
                        updateTable();
                        console.log("✅ Produit ajouté et tableau mis à jour !");
                    } else {
                        console.error("❌ Erreur API :", data.error);
                        alert(`Erreur : ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error("❌ Erreur lors de l'ajout :", error);
                    alert("Erreur serveur : " + error.message);
                });
        });

    }

    // Bouton Modifier
    if (updateProductBtn) {


        updateProductBtn.addEventListener("click", () => {
            const product = getProductInput();
            console.log("🔎 Produit récupéré :", product);

            if (!product || !product.name || editingProductId === null) {
                alert("❌ Données invalides ou ID manquant.");
                return;
            }


            const formData = new FormData();
            formData.append("id", editingProductId);
            formData.append("nom", product.name);
            formData.append("quantite", product.quantity);
            formData.append("unit", product.unit);
            formData.append("categorie", product.category);
            formData.append("date_peremption", product.expiryDate || "");
            formData.append("prix_unitaire", product.prixUnit);
            formData.append("position", product.position);

            formData.append("statut", document.getElementById("edit-status").value.trim());

            // ✅ Ajout de la photo

            const fileInput = document.getElementById("edit-photo");
            const file = fileInput.files[0];
            if (file) {
                formData.append("photo", file); // 🖼️ Fichier actif
            } else {
                const currentImage = document.getElementById("preview-photo")?.getAttribute("src");
                const imageName = currentImage?.split("/").pop().trim() || "Food2.jpg";
                formData.append("photo_existante", imageName); // 📝 Image existante en texte
            }
            // ✅ Envoi de la requête de modification
            console.log("🔎 Envoi des données de modification :", Array.from(formData.entries()));

            fetch("http://localhost/entrepot/Info/Php/produits_api.php", {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    console.log("🔎 Réponse API après modification :", data);
                    if (data.success) {
                        alert("✅ Produit modifié avec succès !");
                        updateTable();
                        addToHistory("Modification", product.name, new Date().toLocaleString(), product.expiryDate);
                        document.getElementById("edit-modal").style.display = "none";
                    } else {
                        console.error("❌ Erreur API :", data.error);
                        alert(`Erreur : ${data.error}`);
                    }
                })
                .catch(error => console.error("❌ Erreur lors de la modification :", error));

            clearInputs();
            resetButtons();
        });
    }
    // Fonction pour basculer en mode modification
    window.editProduct = function (id) {
        if (!id || isNaN(parseInt(id, 10))) {
            alert("ID invalide. Impossible de modifier le produit.");
            return;
        }

        const button = document.querySelector(`.edit-btn[data-id="${id}"]`);
        const card = button?.closest(".product-card");

        if (!card) {
            console.error(`❌ Carte produit introuvable pour ID ${id}`);
            return;
        }

        // 🧠 Extraction des données depuis la carte
        const nom = card.querySelector("h3")?.textContent.trim() || "";
        const imageSrc = card.querySelector(".product-img")?.getAttribute("src") || "";
        const infos = Array.from(card.querySelectorAll("p"));

        const quantiteText = infos[0]?.textContent.replace("Quantité :", "").trim();
        const [quantite, unit] = quantiteText?.split(" ") || ["", ""];

        const categorie = infos[1]?.textContent.replace("Catégorie :", "").trim() || "";
        const datePeremption = infos[2]?.textContent.replace("Péremption :", "").trim() || "";
        const prix = infos[3]?.textContent.replace("Prix :", "").replace("FC", "").trim() || "";
        const position = infos[4]?.textContent.replace("Position :", "").trim() || "";


        const statut = infos[7]?.textContent.replace("Statut :", "").trim() || "";

        // ✅ Remplir le formulaire d'édition
        document.querySelector(".product-name").value = nom;
        document.querySelector(".quantity").value = quantite;
        document.getElementById("edit-unit").value = unit;
        document.querySelector(".category").value = categorie;
        document.querySelector(".expiry-date").value = datePeremption;
        document.getElementById("product-position").value = position;
        document.getElementById("edit-price").value = prix;
        //document.getElementById("edit-lot").value = product.lot || "";
        //document.getElementById("edit-barcode").value = product.code_barre || "";

        document.getElementById("edit-status").value = statut;

        // 🖼️ Prévisualisation image existante
        const preview = document.getElementById("preview-photo");
        if (preview && imageSrc) {
            preview.src = imageSrc;
            preview.style.display = "block";
        }

        // 📷 Prévisualisation locale avec FileReader
        const fileInput = document.getElementById("edit-photo");
        fileInput.onchange = function () {
            const file = this.files[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result + "?t=" + new Date().getTime();
                    preview.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        };

        // 🪟 Affiche le modal d'édition
        document.getElementById("edit-modal").style.display = "flex";

        // 🔁 Rafraîchit le bouton de mise à jour
        const updateBtn = document.getElementById("update-product-btn");
        updateBtn.replaceWith(updateBtn.cloneNode(true));
        const freshBtn = document.getElementById("update-product-btn");

        freshBtn.addEventListener("click", () => {
            const file = fileInput.files[0];
            const formData = new FormData();

            formData.append("id", id);
            formData.append("nom", document.querySelector(".product-name").value.trim());
            formData.append("quantite", document.querySelector(".quantity").value.trim());
            formData.append("unit", document.getElementById("edit-unit").value.trim());
            formData.append("categorie", document.querySelector(".category").value.trim());
            formData.append("date_peremption", document.querySelector(".expiry-date").value.trim());
            formData.append("position", document.getElementById("product-position").value.trim());
            formData.append("prix_unitaire", document.getElementById("edit-price").value.trim());

            formData.append("statut", document.getElementById("edit-status").value.trim());

            if (file) {
                formData.append("photo", file);
            } else {
                const currentPhotoUrl = document.getElementById("preview-photo").getAttribute("src");
                const imageName = currentPhotoUrl.split("/").pop(); // Extrait le nom du fichier
                formData.append("photo_existante", imageName);

            }

            // 📡 Envoi AJAX
            fetch("http://localhost/entrepot/Info/Php/produits_api.php", {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert("✅ Produit modifié !");
                        updateTable();
                        //document.querySelector("#codeBarreAffiche").textContent = data.code_barre;
                        document.getElementById("edit-modal").style.display = "none";
                        addToHistory("Modification", formData.get("nom"), new Date().toLocaleString(), formData.get("date_peremption"));
                        resetButtons();
                        preview.src = "../Images/" + (data.photo || "Food2.jpg") + "?" + Date.now();
                        if (data.photo) {
                            const preview = document.getElementById("preview-photo");
                            preview.src = `../Images/${data.photo}?${Date.now()}`; // 🧽 bust cache
                            preview.style.display = "block";
                        }

                    } else {
                        alert(`❌ Erreur : ${data.error}`);
                    }
                })
                .catch(error => console.error("❌ Erreur modification :", error));
        });
    };

    // Fonction corrigée pour pré-remplir les champs du formulaire
    function populateFormForEdit(productId) {
        fetch(`http://localhost/entrepot/Info/Php/produits_api.php?id=${productId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const produit = data.data;
                    console.log("Données du produit récupérées :", produit);

                    // Pré-remplir les champs du formulaire avec les données du produit récupéré
                    document.getElementById("product-name").value = produit.nom || "";
                    document.getElementById("quantity").value = produit.quantite || "";
                    document.getElementById("category").value = produit.categorie || "";
                    document.getElementById("expiry-date").value = produit.date_peremption || "";
                } else {
                    alert("Erreur : Produit introuvable !");
                }
            })
            .catch(error => console.error("Erreur lors de la récupération :", error));
    }

    // Fonction pour réinitialiser les boutons après modification
    function resetButtons() {
        editingProductId = null;
        addProductBtn.style.display = "inline-block"; // Réafficher le bouton Ajouter
        updateProductBtn.style.display = "none"; // Cacher le bouton Modifier

    }


    // Entrer les données
    function getProductInput() {
        const name = document.getElementById("product-name").value.trim();
        const quantity = parseInt(document.getElementById("quantity").value.trim(), 10);
        const unit = document.getElementById("unit").value.trim(); // ✅ Ajout de l'unité de mesure
        const category = document.getElementById("category").value.trim();
        const expiryDate = document.getElementById("expiry-date").value.trim();
        const position = document.getElementById("product-position").value.trim(); // ✅ Ajout de la position
        const prixUnit = document.getElementById("prix-unitaire").value.trim();
        const Photo = document.getElementById("edit-photo").value.trim();
        // ✅ Vérification des valeurs avant retour
        if (!name || isNaN(quantity) || !unit || !category || !position || !prixUnit || !Photo) {
            alert("❌ Veuillez remplir tous les champs obligatoires s'il vous plait.");
            return null;
        }

        return { name, quantity, unit, category, expiryDate, position, prixUnit, Photo };
    }

    function loadInventoryData() {
        const savedData = localStorage.getItem("inventoryData");
        if (savedData) {
            inventoryData = JSON.parse(savedData);
            console.log("✅ InventoryData chargé depuis localStorage :", inventoryData);
            updateTable(); // ✅ Rafraîchir l'affichage avec les données récupérées
        }
        fetch("http://localhost/entrepot/Info/Php/produits_api.php")
            .then(response => response.json())
            .then(data => {
                console.log("🔎 Réponse API :", data); // ✅ Vérification

                if (data.success && Array.isArray(data.data)) {
                    inventoryData = [...data.data]; // ✅ Stocke les produits
                    console.log("✅ InventoryData chargé :", inventoryData);

                    updateTable(); // ✅ Mise à jour du tableau avec les données
                    setTimeout(attachDeleteEvents, 500); // ✅ Ajout d'un délai léger pour éviter les erreurs
                } else {
                    console.error("❌ Impossible de charger les produits !");
                }
            })
            .catch(error => console.error("❌ Erreur de chargement des produits :", error));
    }
    // Mettre à jour le tableau

    window.updateTable = function () {

        const productGrid = document.getElementById("product-grid");

        if (window.location.pathname.includes("html.html")) {
            const productGrid = document.getElementById("product-grid");
            if (!productGrid) {
                console.warn("ℹ️ productGrid absent, code ignoré.");
                return;
            }

            // Ton code ici
        }


        updateHistoryDisplay();

        const userRole = sessionStorage.getItem("userRole");

        const savedData = localStorage.getItem("inventoryData");
        if (savedData && savedData !== "[]") {
            inventoryData = JSON.parse(savedData);
            console.log("✅ InventoryData chargé depuis localStorage :", inventoryData);
        }

        fetch("http://localhost/entrepot/Info/Php/produits_api.php")
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error("❌ Erreur API :", data.error);
                    return;
                }

                inventoryData = [...data.data];
                localStorage.setItem("inventoryData", JSON.stringify(inventoryData));
                console.log("✅ InventoryData mis à jour :", inventoryData);

                productGrid.innerHTML = "";

                if (inventoryData.length === 0) {
                    productGrid.innerHTML = `<p style="text-align:center; background:#ffecec; padding:10px;">Aucun produit disponible 📦</p>`;
                    return;
                }

                const today = new Date();

                inventoryData.forEach(product => {
                    const card = document.createElement("div");
                    card.className = "product-card";
                    card.dataset.id = product.id;

                    const expiryDate = new Date(product.date_peremption);
                    let badge = "";

                    const quantite = product.quantite || "N/A";
                    const unit = product.unit || "";

                    if (parseInt(quantite) < 5) {
                        badge += `<span class="badge warning">⚠️ Stock faible</span>`;
                        fetch("http://localhost/entrepot/Info/Php/add_notifications.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ product_id: product.id, message: "⚠️ Stock faible pour " + product.nom, type: "warning" })
                        });
                    }

                    const oneDayBefore = new Date(expiryDate);
                    oneDayBefore.setDate(expiryDate.getDate() - 1);

                    if (expiryDate < today) {
                        badge += `<span class="badge expired">⛔ Expiré</span>`;
                    } else if (oneDayBefore.toDateString() === today.toDateString()) {
                        badge += `<span class="badge warning">⏳ Expire demain</span>`;
                        fetch("http://localhost/entrepot/Info/Php/add_notifications.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ product_id: product.id, message: "⏳ Le produit " + product.nom + " expire demain !", type: "warning" })
                        });
                    }
                    const imageFile = product.photo?.trim() || "Food2.jpg";
                    const imageSrc = `../Images/${imageFile}`;;
                    card.innerHTML = `
                        <h3>${product.nom}</h3>
                        <p><strong>Quantité :</strong> ${quantite} ${unit}</p>
                        <p><strong>Catégorie :</strong> ${product.categorie}</p>
                        <p><strong>Péremption :</strong> ${product.date_peremption || "–"}</p>
                        <p><strong>Prix :</strong> ${product.prix_unitaire || "–"} FC</p>
                        <p><strong>Position :</strong> ${product.position}</p>
                        <div class="badges">
                         <span class="badge badge-warning">Lot: ${product.lot}</span>
                         <span class="badge badge-dark">Code-barres: ${product.code_barre}</span>
                        </div>
                        <p><strong>Statut :</strong> ${product.statut || "inactif"}</${badge}${userRole !== "employee" ? `
                        <div class="product-actions">
                           <button class="edit-btn" data-id="${product.id}">✏️</button>
                           <button class="delete-btn" data-id="${product.id}">🗑️</button>
                        </div>` : ""}
                 `;

                    const img = document.createElement("img");
                    img.src = `../Images/${product.photo}?${Date.now()}`;
                    img.alt = product.nom;
                    img.className = "product-img";
                    card.prepend(img); // ou card.insertBefore(img, card.firstChild);
                    productGrid.appendChild(card);


                });


                // ✅ Ajout des événements pour "Modifier" et "Supprimer"
                document.querySelectorAll(".edit-btn").forEach(button => {
                    button.addEventListener("click", function () {
                        editProduct(this.dataset.id);
                    });
                    populateFormForEdit();
                });

                document.querySelectorAll(".delete-btn").forEach(button => {
                    button.addEventListener("click", function () {
                        deleteProduct(this.dataset.id);
                    });
                });


                //setTimeout(getProductInput, 300);
            })
            .catch(error => {
                console.error("❌ Erreur lors de la récupération des produits :", error);
            });
    };


    // ✅ Charger les données AVANT que l’utilisateur puisse supprimer
    document.addEventListener("DOMContentLoaded", function () {
        console.log("✅ DOM chargé, exécution de loadInventoryData()...");
        loadInventoryData();
    });



    function attachDeleteEvents() {
        console.log("🔎 Attachement des événements de suppression...");

        const buttons = document.querySelectorAll(".delete-btn");
        if (buttons.length === 0) {
            console.warn("⚠️ Aucun bouton de suppression trouvé !");
            return;
        }

        buttons.forEach(button => {
            button.addEventListener("click", function () {
                const productId = this.getAttribute("data-id");
                if (productId) {
                    console.log("🗑️ Tentative de suppression du produit ID :", productId);
                    deleteProduct(parseInt(productId, 10));
                } else {
                    console.error("❌ ID du produit manquant !");
                }
            });
        });
    }

    // ✅ Exécuter `attachDeleteEvents()` après chaque mise à jour du tableau
    updateTable(); // Rafraîchissement des produits
    attachDeleteEvents(); // ✅ Fixe les événements `click` sur les boutons de suppression

    // ✅ Fonction pour afficher l'historique sauvegardé
    function updateHistoryDisplay() {
        const tbody = document.querySelector("#history-table tbody");
        if (!tbody) {
            console.error("⚠️ Le tableau avec id='history-table' est introuvable !");
            return;
        }
        tbody.innerHTML = "";

        const history = JSON.parse(localStorage.getItem("history")) || [];
        console.log("🔎 Historique chargé :", history);

        history.forEach(entry => {
            const row = document.createElement("tr");
            row.dataset.date = entry.date; // Ajout de l'attribut data-date pour le tri


            row.innerHTML = `
      <td>${entry.date}</td>
      <td><strong>${entry.action}</strong></td>
      <td>${entry.nom}</td>
      <td>${entry.utilisateur || "—"}</td>
      <td>${entry.dlc ? `DLC : ${entry.dlc}` : "—"}</td>
    `;

            row.classList.add(`history-${entry.action.toLowerCase()}`); // utile pour styliser par type d'action
            tbody.appendChild(row);
        });
    }

    // Ajouter à l'historique
    function addToHistory(action, nom, date, dlc, utilisateur = "inconnu") {
        const history = JSON.parse(localStorage.getItem("history")) || [];

        history.push({ action, nom, date, dlc, utilisateur });

        if (history.length > 50) history.shift();

        localStorage.setItem("history", JSON.stringify(history));
        updateHistoryDisplay();
    }


    // ✅ Fonction pour afficher l'historique au démarrage


    // ✅ Charger l'historique automatiquement au démarrage
    document.addEventListener("DOMContentLoaded", updateHistoryDisplay);

    // ✅ Gestion du bouton pour afficher/masquer l'historique
    document.getElementById("history-btn").addEventListener("click", () => {
        document.getElementById("history-modal").style.display = "block";
    });
    // ✅Cacher 
    document.querySelector(".close-history").addEventListener("click", () => {
        document.getElementById("history-modal").style.display = "none";
    });
    document.querySelector(".close1").addEventListener("click", () => {
        document.getElementById("edit-modal").style.display = "none";
    });

    // Effacer les entrées
    document.getElementById("add-product-btn", "update-product-btn").addEventListener("click",
        function clearInputs() {
            document.getElementById("product-name").value = "";
            document.getElementById("quantity").value = "";
            document.getElementById("category").value = "";
            document.getElementById("expiry-date").value = "";
        }
    );

    //Filtrage


    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById("search-bar");
        const grid = document.getElementById("product-card");

        if (!searchInput || !grid) return;

        const message = document.createElement("div");
        message.id = "no-results";
        message.textContent = "Aucun produit correspondant.";
        message.style.display = "none";
        message.style.color = "#888";
        message.style.fontStyle = "italic";
        message.style.marginTop = "10px";
        grid.parentElement.appendChild(message);

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            const cards = grid.querySelectorAll(".product-card");
            let matches = 0;

            cards.forEach(card => {
                const content = card.textContent.toLowerCase();
                const match = content.includes(query);
                card.style.display = match ? "block" : "none";
                if (match) matches++;
            });

            message.style.display = matches === 0 ? "block" : "none";
        });
    });


    // Mettre à jour le tableau avec vérification de la date de péremption
});