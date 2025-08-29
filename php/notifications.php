<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$user = "root"; 
$password = ""; 
$dbname = "entrepot_alimentaire"; 

$conn = mysqli_connect($host, $user, $password, $dbname);
if (!$conn) {
    die(json_encode(["success" => false, "message" => "❌ Connexion échouée"]));
}

$data = json_decode(file_get_contents("php://input"), true);
$notification_id = $data['notification_id'] ?? null;

if (!$notification_id) {
    echo json_encode(["success" => false, "message" => "❌ ID de notification manquant"]);
    exit();
}

// ✅ Mettre la notification à "lue"
$stmt = $conn->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
$stmt->bind_param("i", $notification_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "✅ Notification mise à jour"]);
} else {
    echo json_encode(["success" => false, "message" => "❌ Erreur de mise à jour"]);
}

$stmt->close();
mysqli_close($conn);
?>