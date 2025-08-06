CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    -- Haché avec bcrypt !
    role ENUM('admin', 'manager', 'employé'),
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('lu', 'non_lu') DEFAULT 'non_lu'
);

CREATE TABLE produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    quantite VARCHAR(50) NOT NULL,
    
    categorie VARCHAR(50) NOT NULL,
    date_peremption DATE,
    position ENUM('Cellule A1', 'Cellule A2', 'Rayon 3', 'Réserve') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prix_unitaire INT NULL.lot VARCHAR(50) NOT NULL,
    code_barre VARCHAR(50) UNIQUE,
    statut ENUM('actif', 'inactif') DEFAULT 'actif';

);

CREATE TABLE fournisseur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    contact VARCHAR(100),
    email VARCHAR(255),
    adresse TEXT,
    categorie VARCHAR(100),
    -- ✅ Ajout du champ catégorie
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    -- Liée à un utilisateur spécifique
    product_id INT DEFAULT NULL,
    -- Liée à un produit (si applicable)
    message TEXT NOT NULL,
    -- Contenu de la notification
    type ENUM('info', 'warning', 'error') DEFAULT 'info',
    -- Type de notification
    is_read BOOLEAN DEFAULT FALSE,
    -- Notification lue ou non
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Date de création
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE mouvements_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produit_id INT NOT NULL,
    type ENUM('entrée', 'sortie') NOT NULL,
    quantite INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    -- ✅ Ajout de l'unité (kg, L, pcs, etc.)
    raison VARCHAR(255),
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

ALTER TABLE
    mouvements_stock
ADD
    COLUMN produit_nom VARCHAR(255)
AFTER
    produit_id;

ALTER TABLE
    mouvements_stock
ADD
    COLUMN opérateur VARCHAR(100)
AFTER
    raison;

ALTER TABLE
    mouvements_stock
ADD
    COLUMN valeur DECIMAL(10, 2)
AFTER
    opérateur;

ALTER TABLE
    mouvements_stock
MODIFY
    COLUMN quantite DECIMAL(10, 2) NOT NULL;

ALTER TABLE
    mouvements_stock DROP FOREIGN KEY mouvements_stock_ibfk_1;

ALTER TABLE
    mouvements_stock
ADD
    CONSTRAINT mouvements_stock_ibfk_1 FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE ON UPDATE CASCADE;