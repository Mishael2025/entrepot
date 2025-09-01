<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);



header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

// ✅ Connexion à la base de données
$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepot_alimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["success" => false, "message" => "❌ Échec de connexion à la base de données"]));
}

// ✅ Récupération des données en POST
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

if (strpos($contentType, "application/json") !== false) {
    $data = json_decode(file_get_contents("php://input"), true) ?? [];
} else {
    $data = $_POST;
}

// ✅ Vérification des données reçues
if (!isset($data["username"], $data["password"])) {
    echo json_encode(["success" => false, "message" => "❌ Données manquantes"]);
    exit();
}

$nom = $data["username"];
$password = $data["password"];

// ✅ Vérification dans la base de données
$stmt = $conn->prepare("SELECT id, nom, role, mot_de_passe FROM utilisateurs WHERE nom=?");

$stmt->bind_param("s", $nom);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    if (password_verify($password, $user["mot_de_passe"])) {
        echo json_encode([
            "success" => true,
            "id" => $user['id'],
            "username" => $user['nom'],
            "role" => $user['role']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Mot de passe incorrect"]);
    }

} else {
    echo json_encode(["success" => false, "message" => "❌ Utilisateur introuvable"]);
}


$stmt->close();
mysqli_close($conn);
?>