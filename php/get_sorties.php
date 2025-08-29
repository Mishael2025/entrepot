<?php
header("Content-Type: application/json");

$conn = new mysqli("", "root", "", "entrepot_alimentaire");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connexion échouée"]);
    exit;
}

$result = $conn->query("
    SELECT produit_nom, quantite, unit, raison, utilisateur, valeur, date_mouvement
    FROM mouvements_stock
    WHERE type = 'sortie'
    ORDER BY date_mouvement DESC
    LIMIT 50
");

$sorties = [];
while ($row = $result->fetch_assoc()) {
    $sorties[] = $row;
}

echo json_encode(["success" => true, "data" => $sorties]);
$conn->close();
?>
