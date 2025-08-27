CREATE DATABASE IF NOT EXISTS entrepotalimentaire;
USE entrepotalimentaire;

CREATE TABLE fournisseur (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  categorie VARCHAR(100),
  contact VARCHAR(100),
  email VARCHAR(255),
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE produits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  lot VARCHAR(100),
  categorie VARCHAR(100),
  code_barre VARCHAR(100) UNIQUE,
  photo VARCHAR(255),
  position ENUM('stock', 'rayon', 'sortie'),
  statut ENUM('actif', 'inactif') DEFAULT 'actif',
  quantite VARCHAR(50),
  prix_unitaire DECIMAL(10,2),
  date_peremption DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE inventaire_physique (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produit_id INT,
  utilisateur_id INT,
  date_inventaire DATETIME DEFAULT CURRENT_TIMESTAMP,
  quantite_theorique DECIMAL(10,2),
  quantite_reelle DECIMAL(10,2),
  ecart DECIMAL(10,2),
  justification TEXT,
  FOREIGN KEY (produit_id) REFERENCES produits(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;
CREATE TABLE utilisateurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employe', 'gestionnaire') DEFAULT 'employe',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE mouvements_stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produit_id INT,
  produit_nom VARCHAR(255),
  quantite INT,
  valeur DECIMAL(10,2) DEFAULT 0.00,
  raison VARCHAR(255),
  type ENUM('entrée', 'sortie', 'ajustement'),
  unit VARCHAR(50),
  utilisateur VARCHAR(255),
  date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produit_id) REFERENCES produits(id)
) ENGINE=InnoDB;
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  product_id INT,
  category VARCHAR(100),
  context LONGTEXT,
  message TEXT NOT NULL,
  severity ENUM('faible', 'moyenne', 'critique'),
  type ENUM('info', 'alerte', 'erreur') DEFAULT 'info',
  is_read TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (product_id) REFERENCES produits(id)
) ENGINE=InnoDB;
CREATE TABLE planifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produit_id INT,
  fournisseur_id INT,
  utilisateur_id INT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_prevue DATETIME,
  quantite DECIMAL(10,2),
  commentaire TEXT,
  notifie TINYINT DEFAULT 0,
  statut ENUM('attente', 'confirmée', 'annulée'),
  type ENUM('livraison', 'réception', 'autre'),
  FOREIGN KEY (produit_id) REFERENCES produits(id),
  FOREIGN KEY (fournisseur_id) REFERENCES fournisseur(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;
CREATE TABLE seuils_stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produit_id INT,
  categorie VARCHAR(100),
  seuil INT DEFAULT 5,
  FOREIGN KEY (produit_id) REFERENCES produits(id)
) ENGINE=InnoDB;
CREATE TABLE logs_acces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id INT,
  action VARCHAR(255),
  details TEXT,
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;

CREATE TABLE utilisateurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role SET('admin', 'gestionnaire', 'auditeur', 'invité'),
  permissions TEXT,
  actif TINYINT DEFAULT 1,
  date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
