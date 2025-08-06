<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$user = "root";
$password = "";
$dbname = "entrepotalimentaire";

$conn = mysqli_connect($host, $user, $password, $dbname);
if (!$conn) {
    die(json_encode(["success" => false, "message" => "❌ Connexion échouée"]));
}

// ✅ Récupérer les notifications non lues
$sql = "SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC";
$result = $conn->query($sql);

$notifications = [];
while ($row = $result->fetch_assoc()) {
    $notifications[] = $row;
}

echo json_encode(["success" => true, "notifications" => $notifications]);

$conn->close();
?>