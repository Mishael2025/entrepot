<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepotalimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["success" => false, "message" => "Erreur de connexion à la base de données"]));
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée"]);
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "message" => "ID utilisateur requis"]);
    exit;
}

$sql = "SELECT id, nom, email, role FROM utilisateurs WHERE id=?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if ($row = mysqli_fetch_assoc($result)) {
    echo json_encode($row);
} else {
    echo json_encode(["success" => false, "message" => "Utilisateur non trouvé"]);
}

mysqli_stmt_close($stmt);
mysqli_close($conn);
?>