<?php
$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
mysqli_set_charset($conn, "utf8");

$sql = "SELECT id, nom FROM produits WHERE statut = 'actif' ORDER BY nom ASC";
$result = mysqli_query($conn, $sql);
$rows = [];

while ($row = mysqli_fetch_assoc($result)) {
    $rows[] = $row;
}

header("Content-Type: application/json");
echo json_encode(["success" => true, "data" => $rows]);
?>
