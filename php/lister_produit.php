<?php
header("Content-Type: application/json");
$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
mysqli_set_charset($conn, "utf8mb4");

$sql = "SELECT id, nom, quantite FROM produits ORDER BY nom ASC";
$result = mysqli_query($conn, $sql);

$rows = [];
while ($row = mysqli_fetch_assoc($result)) {
    $rows[] = $row;
}

echo json_encode(["success" => true, "data" => $rows]);
?>
