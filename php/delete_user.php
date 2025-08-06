<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ✅ Autorise les requêtes venant d'autres origines (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

// ✅ Gestion des requêtes préliminaires (`OPTIONS`)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// ✅ Connexion à la base de données
$host = "localhost";
$user = "root"; 
$password = ""; 
$dbname = "entrepotalimentaire"; 

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["success" => false, "message" => "❌ Échec de connexion à la base de données"]));
}

// ✅ Gestion de la suppression via `DELETE`
if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "❌ ID utilisateur requis"]);
        exit();
    }

    // Vérification si l'utilisateur existe
    $stmt_check = $conn->prepare("SELECT id FROM utilisateurs WHERE id = ?");
    $stmt_check->bind_param("i", $id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "❌ Utilisateur introuvable"]);
        exit();
    }

    $stmt_check->close();

    // Suppression de l'utilisateur
    $stmt = $conn->prepare("DELETE FROM utilisateurs WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "✅ Utilisateur supprimé avec succès"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "❌ Erreur interne lors de la suppression"]);
    }

    $stmt->close();
}

// ✅ Ferme la connexion
mysqli_close($conn);
?>