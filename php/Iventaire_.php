<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

error_reporting(E_ALL);
ini_set('display_errors', 1);

// 🔒 Connexion à MySQL
$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Connexion échouée"]);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");

// 🔄 Préflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 🔐 Vérification de la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée"]);
    exit;
}

// 📥 Lecture des données JSON
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['produit_id'], $input['quantite_theorique'], $input['quantite_observee'], $input['ecart'], $input['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Données incomplètes"]);
    exit;
}

// 🔍 Vérification existence du produit
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

// 🔄 Récupération des données
$quantiteTheorique = floatval($input['quantite_theorique']);
$quantiteObservee = floatval($input['quantite_observee']);
$ecart = floatval($input['ecart']);
$justification = mysqli_real_escape_string($conn, $input['justification'] ?? "");
$utilisateurId = intval($input['utilisateur_id']);

// 🗃️ Enregistrement
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
$stmt->close();
$conn->close();
?>