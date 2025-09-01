<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Connexion à la base
$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepot_alimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Connexion échouée : " . mysqli_connect_error()]);
    exit;
}

// Vérification méthode
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Méthode non autorisée"]);
    exit;
}

// Lecture des données JSON
$data = json_decode(file_get_contents("php://input"), true);

$nom = trim($data['nom'] ?? "");
$email = trim($data['email'] ?? "");
$mot_de_passe = trim($data['mot_de_passe'] ?? "");
$role = trim($data['role'] ?? "invite");
$permissions = trim($data['permissions'] ?? "");
$actif = isset($data['actif']) ? intval($data['actif']) : 0;

// Validation
if ($nom === "" || $email === "" || $mot_de_passe === "" || $role === "" || $permissions === "") {
    echo json_encode(["success" => false, "error" => "Tous les champs sont requis"]);
    exit;
}

// Vérification doublon email
$checkStmt = $conn->prepare("SELECT COUNT(*) FROM utilisateurs WHERE email = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkStmt->bind_result($count);
$checkStmt->fetch();
$checkStmt->close();

if ($count > 0) {
    echo json_encode(["success" => false, "message" => "❌ Email déjà utilisé"]);
    exit;
}

// Hachage du mot de passe
$mot_de_passe_hache = password_hash($mot_de_passe, PASSWORD_DEFAULT);

// Insertion
$stmt = $conn->prepare("INSERT INTO utilisateurs (nom, email, mot_de_passe, role, permissions, actif) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssi", $nom, $email, $mot_de_passe_hache, $role, $permissions, $actif);
$success = $stmt->execute();
$stmt->close();

// Réponse finale
echo json_encode([
    "success" => $success,
    "message" => $success ? "✅ Utilisateur ajouté avec succès" : "❌ Échec de l'ajout"
]);

mysqli_close($conn);
?>
