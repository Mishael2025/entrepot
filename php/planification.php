<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set('display_errors', 1);

$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Connexion échouée"]);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");

// 🔄 Préflight CORS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// 📤 Enregistrement
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['produit_id'], $input['type'], $input['quantite'], $input['date_prevue'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Données incomplètes"]);
        exit;
    }

    $produitId = intval($input['produit_id']);
    $type = $input['type'];
    $quantite = floatval($input['quantite']);
    $datePrevue = $input['date_prevue'];
    $commentaire = mysqli_real_escape_string($conn, $input['commentaire'] ?? "");
    $fournisseurId = isset($input['fournisseur_id']) ? intval($input['fournisseur_id']) : null;

    if ($type === "entrée" && !$fournisseurId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Fournisseur requis pour une entrée"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO planifications (produit_id, type, quantite, date_prevue, commentaire, fournisseur_id, notifie)
                            VALUES (?, ?, ?, ?, ?, ?, 0)");
    $stmt->bind_param("isdssi", $produitId, $type, $quantite, $datePrevue, $commentaire, $fournisseurId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

// 📅 Récupération des planifications à venir
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["upcoming"])) {
    $sql = "SELECT p.*, pr.nom AS produit_nom, f.nom AS fournisseur_nom
            FROM planifications p
            JOIN produits pr ON pr.id = p.produit_id
            LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
            WHERE p.date_prevue >= NOW()
            ORDER BY p.date_prevue ASC";

    $result = mysqli_query($conn, $sql);
    $rows = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $rows[] = $row;
    }

    echo json_encode($rows);
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Requête invalide"]);
?>
