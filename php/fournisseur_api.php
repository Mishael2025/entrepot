<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "entrepot_alimentaire");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "❌ Connexion échouée : " . $conn->connect_error]);
    exit;
}

// 🔁 Méthode GET : Afficher tous les fournisseurs ou un seul si ?id= fourni
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $res = $conn->query("SELECT * FROM fournisseur WHERE id = $id");
        echo json_encode($res->fetch_assoc());
    } else {
        $res = $conn->query("SELECT * FROM fournisseur ORDER BY nom ASC");
        $liste = [];
        while ($f = $res->fetch_assoc()) {
            $liste[] = $f;
        }
        echo json_encode($liste, JSON_UNESCAPED_UNICODE);
    }
    exit;
}

//  Méthode POST : Ajouter un nouveau fournisseur
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    //  Lecture et nettoyage des données
    $data = json_decode(file_get_contents("php://input"), true);

    //  Logs pour debug (facultatif)
    error_log("🔍 Reçu POST : " . json_encode($data));

    // ✅ Sécurisation des champs
    $nom = isset($data['nom']) ? trim($data['nom']) : '';
    $categorie = isset($data['categorie']) ? trim($data['categorie']) : '';
    $contact = isset($data['contact']) ? trim($data['contact']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $adresse = isset($data['adresse']) ? trim($data['adresse']) : '';

    //  Validation des champs obligatoires
    if ($nom === '' || $categorie === '') {
        echo json_encode(["success" => false, "error" => "❌ Nom et catégorie requis"]);
        exit;
    }

    //  Insertion dans la base
    $stmt = $conn->prepare("INSERT INTO fournisseur (nom, contact, email, adresse, categorie) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(["success" => false, "error" => "❌ Erreur préparation : " . $conn->error]);
        exit;
    }

    $stmt->bind_param("sssss", $nom, $contact, $email, $adresse, $categorie);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "✅ Fournisseur ajouté avec succès"]);
    } else {
        echo json_encode(["success" => false, "error" => "❌ Erreur SQL : " . $stmt->error]);
    }

    $stmt->close();
    exit;
}


//  Méthode PUT : Modifier un fournisseur
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    //  Extraction sécurisée
    $id = isset($data['id']) ? intval($data['id']) : 0;
    $nom = isset($data['nom']) ? trim($data['nom']) : '';
    $contact = isset($data['contact']) ? trim($data['contact']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $adresse = isset($data['adresse']) ? trim($data['adresse']) : '';
    $categorie = isset($data['categorie']) ? trim($data['categorie']) : '';

    //  Validation
    if ($id === 0 || $nom === '' || $categorie === '') {
        echo json_encode(["success" => false, "error" => "❌ Données incomplètes"]);
        exit;
    }

    //  Requête SQL
    $stmt = $conn->prepare("UPDATE fournisseur SET nom = ?, contact = ?, email = ?, adresse = ?, categorie = ? WHERE id = ?");
    $stmt->bind_param("sssssi", $nom, $contact, $email, $adresse, $categorie, $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "❌ Erreur SQL : " . $stmt->error]);
    }
    $stmt->close();
    exit;
}


//  Méthode DELETE : Supprimer un fournisseur
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("DELETE FROM fournisseur WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

// ⚠️ Si aucune méthode valide n'est utilisée
echo json_encode(["success" => false, "error" => "Méthode non prise en charge"]);
$conn->close();
?>