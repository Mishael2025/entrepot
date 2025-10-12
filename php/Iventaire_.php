<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

error_reporting(E_ALL);
ini_set('display_errors', 1);

// 🔒 Connexion à MySQL
$conn = mysqli_connect("localhost", "root", "", "entrepot_alimentaire");
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Connexion échouée"]);
    exit;
}
// 🔄 Préflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
mysqli_set_charset($conn, "utf8mb4");
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_historique') {
    $sql = "SELECT i.*, p.nom AS produit_nom, u.nom AS utilisateur_nom
            FROM inventaire_physique i
            JOIN produits p ON p.id = i.produit_id
            JOIN utilisateurs u ON u.id = i.utilisateur_id
            ORDER BY i.date_inventaire DESC";

    $result = mysqli_query($conn, $sql);
    $rows = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $rows[] = $row;
    }

    echo json_encode($rows);
    $conn->close();
    exit;
}


$input = json_decode(file_get_contents("php://input"), true);

// 🔐 Vérification de la méthode
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ✅ Traitement POST ici
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input || !isset($input['produit_id'], $input['quantite_theorique'], $input['quantite_observee'], $input['ecart'], $input['utilisateur_id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Données incomplètes"]);
        exit;
    }

    foreach (['produit_id', 'quantite_theorique', 'quantite_observee', 'ecart', 'utilisateur_id'] as $champ) {
        if (!isset($input[$champ])) {
            error_log("Champ manquant : $champ");
        }
    }

    $produitId = intval($input['produit_id']);
    $check = $conn->prepare("SELECT COUNT(*) FROM produits WHERE id = ?");
    $check->bind_param("i", $produitId);
    $check->execute();
    $check->bind_result($count);
    $check->fetch();
    $check->close();

    if ($count == 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Produit avec ID $produitId inexistant"]);
        exit;
    }

    $quantiteTheorique = floatval($input['quantite_theorique']);
    $quantiteObservee = floatval($input['quantite_observee']);
    $ecart = floatval($input['ecart']);
    $justification = mysqli_real_escape_string($conn, $input['justification'] ?? "");
    $utilisateurId = intval($input['utilisateur_id']);

    $sql = "INSERT INTO inventaire_physique (produit_id, quantite_theorique, quantite_reelle, ecart, justification, utilisateur_id, date_inventaire)
            VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("idddsi", $produitId, $quantiteTheorique, $quantiteObservee, $ecart, $justification, $utilisateurId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Constat enregistré"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée"]);
    exit;
}



$stmt->close();
$conn->close();
?>