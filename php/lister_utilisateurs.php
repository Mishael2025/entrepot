<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepotalimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Erreur de connexion"]);
    exit;
}

$sql = "SELECT id, nom, email, COALESCE(role, 'Non défini') AS role, actif, permissions FROM utilisateurs";
$result = mysqli_query($conn, $sql);

$utilisateurs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $utilisateurs[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $utilisateurs
]);

mysqli_close($conn);
?>