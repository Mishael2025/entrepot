<?php
// 🔧 Affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 🔒 En-têtes HTTP
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// 🔌 Connexion à la base
$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepotalimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Connexion échouée"]);
    exit();
}

$request = $_SERVER['REQUEST_METHOD'];

if ($request === 'POST') {
    // ✅ AJOUT ou MODIFICATION via FormData
    $id = $_POST['id'] ?? null;
    $nom = $_POST['nom'] ?? '';
    $quantite = $_POST['quantite'] ?? '';
    $unit = $_POST['unit'] ?? '';
    $categorie = $_POST['categorie'] ?? '';
    $date_peremption = $_POST['date_peremption'] ?? '';
    $position = $_POST['position'] ?? '';
    $prix_unitaire = $_POST['prix_unitaire'] ?? '';
    $photo = $_POST['photo_existante'] ?? '';

    //  Gestion de la photo
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $filename = pathinfo($_FILES['photo']['name'], PATHINFO_FILENAME);
        $uniqueName = $filename . "_" . time() . "." . $ext;
        $targetPath = "../Images/" . $uniqueName;
        
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array(strtolower($ext), $allowedExtensions)) {
            echo json_encode(["success" => false, "error" => "Extension de fichier non autorisée."]);
            exit;
        }

        if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetPath)) {
            $photo = $uniqueName;
        } else {
            echo json_encode(["success" => false, "error" => "Erreur lors de l'upload du fichier."]);
            exit;
        }
    } elseif (isset($_POST['photo_existante']) && $_POST['photo_existante'] !== "") {
        $photo = $_POST['photo_existante'];
    } else {
        $photo = "Food2.jpg";
    }

    $quantite_formattee = $quantite . " " . $unit;

    if ($id) {
        try {
            //  Regénération automatique du lot et du code-barres
            $initiales = strtoupper(substr($nom, 0, 2));
            $mois = date("m");
            $annee = date("y");
            $serie = strtoupper(substr(bin2hex(random_bytes(2)), 0, 2));

            $lot = $initiales . "-" . $mois . $annee . "-" . $serie;
            $code_barre = str_replace("-", "", $lot);

            // 🔍 Vérification unicité
            $verif = $conn->prepare("SELECT id FROM produits WHERE code_barre = ? AND id != ?");
            $verif->bind_param("si", $code_barre, $id);
            $verif->execute();
            $verif->store_result();

            if ($verif->num_rows > 0) {
                echo json_encode(["success" => false, "error" => "❌ Code-barres déjà existant"]);
                exit;
            }

            $verif->close();

            // 🔧 Requête UPDATE
            $stmt = $conn->prepare("UPDATE produits 
                SET nom = ?, quantite = ?, categorie = ?, date_peremption = ?, position = ?, prix_unitaire = ?, photo = ?, lot = ?, code_barre = ? 
                WHERE id = ?");
            $stmt->bind_param("sssssssssi", $nom, $quantite_formattee, $categorie, $date_peremption, $position, $prix_unitaire, $photo, $lot, $code_barre, $id);

            $success = $stmt->execute();
            $stmt->close();

            echo json_encode([
                "success" => $success,
                "photo" => $photo,
                "lot" => $lot,
                "code_barre" => $code_barre,
                "message" => $success ? "✅ Produit modifié" : "❌ Échec modification"
            ]);

        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => "❌ Exception : " . $e->getMessage()]);
        }
    } else {
        // ➕ AJOUT
        $initiales = strtoupper(substr($nom, 0, 2));
        $mois = date("m");
        $annee = date("y");
        $serie = strtoupper(substr(bin2hex(random_bytes(2)), 0, 2));

        $lot = $initiales . "-" . $mois . $annee . "-" . $serie;
        $code_barre = str_replace("-", "", $lot);

        if (!preg_match("/^[A-Z]{2}-\d{4}-[A-Z0-9]{2}$/", $lot) || !preg_match("/^[A-Z0-9]+$/", $code_barre)) {
            echo json_encode(["success" => false, "error" => "❌ Format lot ou code-barres invalide"]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO produits (nom, quantite, categorie, date_peremption, position, prix_unitaire, photo, lot, code_barre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssss", $nom, $quantite_formattee, $categorie, $date_peremption, $position, $prix_unitaire, $photo, $lot, $code_barre);

        $success = $stmt->execute();
        $newId = $stmt->insert_id;
        $stmt->close();

        echo json_encode([
            "success" => $success,
            "id" => $newId,
            "photo" => $photo,
            "message" => $success ? "✅ Produit ajouté" : "❌ Échec ajout",
            "lot" => $lot,
            "code_barre" => $code_barre
        ]);
    }
} elseif ($request === 'GET') {
    try {
        if (isset($_GET['id']) && is_numeric($_GET['id']) && intval($_GET['id']) > 0) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT * FROM produits WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $produit = $result->fetch_assoc();
            $stmt->close();

            if ($produit) {
                $q = explode(" ", $produit["quantite"]);
                $produit["quantite"] = $q[0];
                $produit["unit"] = $q[1] ?? "";
                echo json_encode(["success" => true, "data" => $produit]);
            } else {
                echo json_encode(["success" => false, "error" => "❌ Produit introuvable"]);
            }
        } else {
            $result = $conn->query("SELECT * FROM produits ORDER BY date_peremption ASC");
            $produits = [];
            while ($row = $result->fetch_assoc()) {
                $q = explode(" ", $row["quantite"]);
                $row["quantite"] = $q[0];
                $row["unit"] = $q[1] ?? "";
                $produits[] = $row;
            }
            echo json_encode(["success" => true, "data" => $produits]);
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => "❌ Erreur serveur : " . $e->getMessage()]);
    }
} elseif ($request === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id || !is_numeric($id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "❌ ID requis ou invalide"]);
        exit;
    }

    // 🔁 Supprimer les mouvements liés
    $stmt1 = $conn->prepare("DELETE FROM mouvements_stock WHERE produit_id = ?");
    $stmt1->bind_param("i", $id);
    $stmt1->execute();
    $stmt1->close();

    // 🗑️ Supprimer le produit
    $stmt2 = $conn->prepare("DELETE FROM produits WHERE id = ?");
    $stmt2->bind_param("i", $id);
    $success = $stmt2->execute();
    $stmt2->close();

    echo json_encode([
        "success" => $success,
        "message" => $success ? "✅ Produit supprimé" : "❌ Produit introuvable ou non supprimé"
    ]);
}

$conn->close();
?>