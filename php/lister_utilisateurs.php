<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');
$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepotalimentaire";
$role = $_POST['role'] ?? "employé"; // Assure un rôle par défaut

if (!$role || trim($role) === "") {
    $role = "employé"; // Définit une valeur par défaut si le rôle est vide
}
$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["success" => false, "message" => "Erreur de connexion à la base de données"]));
}

$sql = "SELECT id, nom, email, role FROM utilisateurs";
$sql = "SELECT id, nom, email, COALESCE(role, 'Non défini') AS role FROM utilisateurs";
$result = mysqli_query($conn, $sql);

$utilisateurs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $utilisateurs[] = $row;
}

echo json_encode($utilisateurs);
mysqli_close($conn);
?>