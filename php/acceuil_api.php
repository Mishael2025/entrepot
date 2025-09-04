<?php
header("Content-Type: application/json");
$mysqli = new mysqli("localhost", "root", "", "entrepot_alimentaire");

$data = [
    "totalProduits" => 0,
    "volumeStock" => 0,
    "critique" => 0,
    "peremption" => 0,
    "notifications" => [],
    "volumes" => ["kg" => 0, "l" => 0, "pcs" => 0, "box" => 0],
    "sparkline" => ["labels" => [], "values" => []]
];

// 🔢 Total produits
$res = $mysqli->query("SELECT COUNT(*) AS total FROM produits");
$data["totalProduits"] = $res->fetch_assoc()["total"];

// ⚖️ Volume total + répartition par unité
$res = $mysqli->query("SELECT quantite FROM produits");
$total = 0;
while ($row = $res->fetch_assoc()) {
    $parts = explode(" ", $row["quantite"]);
    $qte = floatval($parts[0]);
    $unit = strtolower(trim($parts[1] ?? ""));
    $total += $qte;

    if (isset($data["volumes"][$unit])) {
        $data["volumes"][$unit] += $qte;
    }
}
$data["volumeStock"] = $total;

// ⚠️ Stock critique
$res = $mysqli->query("
 SELECT COUNT(*) AS critique
FROM produits p
JOIN seuils_stock s ON p.id = s.produit_id
WHERE CAST(SUBSTRING_INDEX(p.quantite, ' ', 1) AS DECIMAL) <= s.seuil

");
$data["critique"] = $res->fetch_assoc()["critique"];

// ⏰ Périmés ou bientôt périmés
$res = $mysqli->query("
    SELECT COUNT(*) AS peremption
    FROM produits
    WHERE date_peremption <= DATE_ADD(NOW(), INTERVAL 7 DAY)
");
$data["peremption"] = $res->fetch_assoc()["peremption"];

// 🔔 Notifications
$data["notifications"][] = "📦 " . $data["critique"] . " produits en stock critique";
$data["notifications"][] = "⏰ " . $data["peremption"] . " produits périmés ou bientôt périmés";

// 📈 Sparkline (sorties sur 7 jours)
$res = $mysqli->query("
    SELECT DATE(date_mouvement) AS jour,
           SUM(CAST(SUBSTRING_INDEX(quantite, ' ', 1) AS DECIMAL)) AS total
    FROM mouvements_stock
    WHERE type = 'sortie'
      AND date_mouvement >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY jour
    ORDER BY jour ASC
");
while ($row = $res->fetch_assoc()) {
    $data["sparkline"]["labels"][] = $row["jour"];
    $data["sparkline"]["values"][] = floatval($row["total"]);
}

echo json_encode($data);
$mysqli->close();
?>