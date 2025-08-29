<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "entrepot_alimentaire");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connexion BDD échouée"]);
    exit;
}

// 🔍 Regroupement des produits par position (cellule)
$sql = "
    SELECT position, COUNT(*) AS nb_produits
    FROM produits
    WHERE statut = 'actif'
    GROUP BY position
";

$result = $conn->query($sql);
$data = [];

$seuil = 10; // 💡 Par exemple : +10 produits = saturé

while ($row = $result->fetch_assoc()) {
    $position = $row['position'];
    $nb = intval($row['nb_produits']);
    $etat = ($nb > $seuil) ? "saturé" : "libre";

    $data[] = [
        "position_stock" => $position,
        "nb_produits" => $nb,
        "etat" => $etat
    ];
}

echo json_encode(["success" => true, "data" => $data], JSON_PRETTY_PRINT);
$conn->close();
?>