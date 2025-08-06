<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Connexion à la base de données
$host = "localhost";
$user = "root"; // Modifier si nécessaire
$password = ""; // Modifier si nécessaire
$dbname = "entrepotalimentaire"; // Modifier avec le nom correct

$conn = mysqli_connect($host, $user, $password, $dbname);

// Vérifier la connexion
if (!$conn) {
    die(json_encode(["success" => false, "error" => "Échec de connexion à la base de données : " . mysqli_connect_error()]));
}

// Vérifier que la requête est bien en POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Méthode non autorisée"]);
    exit;
}

// Récupération des données envoyées
$nom = $_POST['nom'] ?? null;
$email = $_POST['email'] ?? null;
$mot_de_passe = $_POST['mot_de_passe'] ?? null;
$role = $_POST['role'] ?? "employé"; // Assure un rôle par défaut
if (!$nom || !$mot_de_passe || !$email || !$role) {
    echo json_encode(["success" => false, "error" => "Tous les champs sont requis"]);
    exit;
}

// Vérifier si l'utilisateur existe déjà
$stmt = $conn->prepare("SELECT COUNT(*) FROM utilisateurs WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->bind_result($count);
$stmt->fetch();
if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Email déjà utilisé"]);
    exit;
}

// Ajouter l'utilisateur à la table `utilisateurs`
$sql = "INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)";
$stmt = mysqli_prepare($conn, $sql);

if ($stmt) {
    // Hasher le mot de passe AVANT de l'insérer
    $hashedPassword = password_hash($mot_de_passe, PASSWORD_DEFAULT);

    // Liaison des paramètres
    mysqli_stmt_bind_param($stmt, "ssss", $nom, $email, $hashedPassword, $role);

    // Exécuter la requête
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(["success" => true, "message" => "Utilisateur ajouté avec succès"]);
    } else {
        echo json_encode(["success" => false, "error" => mysqli_error($conn)]);
    }

    // Fermer la requête
    mysqli_stmt_close($stmt);
} else {
    echo json_encode(["success" => false, "error" => "Erreur de préparation de la requête SQL"]);
}

// Fermer la connexion
mysqli_close($conn);
?>