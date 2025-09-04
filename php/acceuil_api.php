<?php
header("Content-Type: application/json");
$mysqli = new mysqli("localhost", "root", "", "entrepot_alimentaire");

$data = [
    "totalProduits" => 0,
    "volumeStock" => 0,
    "critique" => 0,
    "peremption" => 0,
    "notifications" => [],
    "sparkline" => ["labels" => [], "values" => []]
];

// 🔢 Total produits
$res = $mysqli->query("SELECT COUNT(*) AS total FROM produits");
$data["totalProduits"] = $res->fetch_assoc()["total"];

// ⚖️ Volume total
$res = $mysqli->query("SELECT quantite FROM produits");
$total = 0;
while ($row = $res->fetch_assoc()) {
    $parts = explode(" ", $row["quantite"]);
    $qte = floatval($parts[0]);
    $total += $qte;
}
$data["volumeStock"] = $total;

// ⚠️ Stock critique
$res = $mysqli->query("SELECT COUNT(*) AS critique FROM produits WHERE seuil IS NOT NULL AND CAST(SUBSTRING_INDEX(quantite, ' ', 1) AS DECIMAL) <= seuil");
$data["critique"] = $res->fetch_assoc()["critique"];

// ⏰ Périmés ou bientôt
$res = $mysqli->query("SELECT COUNT(*) AS peremption FROM produits WHERE date_peremption <= DATE_ADD(NOW(), INTERVAL 7 DAY)");
$data["peremption"] = $res->fetch_assoc()["peremption"];

// 🔔 Notifications
$data["notifications"][] = "📦 " . $data["critique"] . " produits en stock critique";
$data["notifications"][] = "⏰ " . $data["peremption"] . " produits périmés ou bientôt périmés";

// 📈 Sparkline (sorties sur 7 jours)
$res = $mysqli->query("
  SELECT DATE(date_mouvement) AS jour, SUM(quantite) AS total
  FROM mouvements_stock
  WHERE type = 'sortie' AND date_mouvement >= DATE_SUB(NOW(), INTERVAL 7 DAY)
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