<?php
$conn = new mysqli("localhost", "root", "", "entrepot_alimentaire");
header("Content-Type: application/json");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Erreur connexion BDD"]);
    exit;
}

$motifs = [];
$valeur_totale = 0;

$result = $conn->query("
    SELECT raison, SUM(valeur) AS total_valeur
    FROM mouvements_stock
    WHERE type = 'sortie'
    GROUP BY raison
");

while ($row = $result->fetch_assoc()) {
    $raison = $row["raison"];
    $valeur = floatval($row["total_valeur"]);
    $motifs[$raison] = ["valeur" => $valeur];
    $valeur_totale += $valeur;
}

foreach ($motifs as $raison => &$info) {
    $info["percent"] = $valeur_totale > 0
        ? round(($info["valeur"] / $valeur_totale) * 100, 2)
        : 0;
}
unset($info);

echo json_encode([
    "success" => true,
    "total" => $valeur_totale,
    "data" => $motifs
]);
$conn->close();
?>
