<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

$host = "localhost";
$user = "root"; 
$password = ""; 
$dbname = "entrepotalimentaire"; 

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["success" => false, "message" => "❌ Échec de connexion à la base de données"]));
}

// ✅ Gestion des requêtes préliminaires (`OPTIONS`)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// ✅ Vérifier que la méthode est bien POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? intval($data['id']) : null;
    $nom = $data['nom'] ?? null;
    $email = $data['email'] ?? null;
    $role = $data['role'] ?? null;
    $mot_de_passe = $data['mot_de_passe'] ?? null; // Remplace `password` par `mot_de_passe`

    if (!$id || !$nom || !$email || !$role) {
        echo json_encode(["success" => false, "message" => "❌ Données invalides"]);
        exit();
    }

    // ✅ Construire la requête SQL dynamiquement
    $query = "UPDATE utilisateurs SET nom=?, email=?, role=?";
    $params = [$nom, $email, $role];
    $types = "sss";

    // ✅ Si le mot de passe est envoyé, on le met aussi à jour
    if (!empty($mot_de_passe)) {
        $query .= ", mot_de_passe=?";
        $params[] = password_hash($mot_de_passe, PASSWORD_DEFAULT); // Sécurisation du mot de passe
        $types .= "s";
    }

    $query .= " WHERE id=?";
    $params[] = $id;
    $types .= "i";

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "✅ Utilisateur mis à jour avec succès"]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Erreur lors de la mise à jour"]);
    }

    $stmt->close();
}

mysqli_close($conn);
?>