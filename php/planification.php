<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set('display_errors', 1);

$conn = mysqli_connect("localhost", "root", "", "entrepot_alimentaire");
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

//  Enregistrement
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);

    // Validation minimale
    $required = ['produit_id', 'type', 'quantite', 'date_prevue'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Champ manquant : $field"]);
            exit;
        }
    }

    $type = $input['type'];
    $produit_id = $input['produit_id'];
    $quantite = $input['quantite'];
    $date_prevue = $input['date_prevue'];
    $commentaire = $input['commentaire'] ?? null;
    $notifie = $input['notifie'] ?? 0;

    if ($type === 'entrée') {
        if (empty($input['fournisseur_id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "fournisseur_id requis pour une entrée"]);
            exit;
        }

        $utilisateur_id = $input['utilisateur_id']; // ou récupéré depuis session

        $stmt = $conn->prepare("INSERT INTO planifications (produit_id, type, quantite, date_prevue, utilisateur_id, commentaire, fournisseur_id, notifie) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->bind_param("isssissi", $produit_id, $type, $quantite, $date_prevue, $utilisateur_id, $commentaire, $fournisseur_id, $notifie);

    } else {
        // Sortie : pas de fournisseur
        $stmt = $conn->prepare("INSERT INTO planifications (produit_id, type, quantite, date_prevue, utilisateur_id, commentaire, notifie) VALUES (?, ?, ?, ?, ?, ?, ?)");

        $stmt->bind_param("isssisi", $produit_id, $type, $quantite, $date_prevue, $utilisateur_id, $commentaire, $notifie);

    }

    $stmt->execute();
    echo json_encode(["success" => true, "message" => "Planification enregistrée"]);


    $stmt->close();
    $conn->close();
    exit;
}

//  Récupération des planifications à venir
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["upcoming"])) {
    $sql = "SELECT p.*, pr.nom AS produit_nom, f.nom AS fournisseur_nom
            FROM planifications p
            JOIN produits pr ON pr.id = p.produit_id
            LEFT JOIN fournisseur f ON f.id = p.fournisseur_id
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