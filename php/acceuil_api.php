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
    "volumesParProduit" => [],
    "sparkline" => ["labels" => [], "values" => []]
];

// 🔢 Total produits
$res = $mysqli->query("SELECT COUNT(*) AS total FROM produits");
$data["totalProduits"] = $res->fetch_assoc()["total"];

// 📦 Volumes par produit + par unité
$res = $mysqli->query("SELECT id, nom, quantite FROM produits");
$total = 0;
while ($row = $res->fetch_assoc()) {
    $nom = $row["nom"];
    $parts = explode(" ", $row["quantite"]);
    $qte = floatval($parts[0]);
    $unit = strtolower(trim($parts[1] ?? ""));

    $total += $qte;

    // Volume global par unité
    if (isset($data["volumes"][$unit])) {
        $data["volumes"][$unit] += $qte;
    }

    // Volume par produit
    $data["volumesParProduit"][$nom] = [
        "quantite" => $qte,
        "unite" => $unit
    ];
}
$data["volumeStock"] = $total;

// ⚠️ Produits en stock critique
$res = $mysqli->query("
    SELECT COUNT(*) AS critique
    FROM produits p
    JOIN seuils_stock s ON p.id = s.produit_id
    WHERE CAST(SUBSTRING_INDEX(p.quantite, ' ', 1) AS DECIMAL) <= s.seuil
");
$data["critique"] = $res->fetch_assoc()["critique"];

// ⏰ Produits périmés ou bientôt périmés
$res = $mysqli->query("
    SELECT COUNT(*) AS peremption
    FROM produits
    WHERE date_peremption <= DATE_ADD(NOW(), INTERVAL 7 DAY)
");
$data["peremption"] = $res->fetch_assoc()["peremption"];

// 🔔 Notifications
$data["notifications"][] = "📦 " . $data["critique"] . " produits en stock critique";
$data["notifications"][] = "⏰ " . $data["peremption"] . " produits périmés ou bientôt périmés";
$data["fournisseurs"] = [];

$res = $mysqli->query("SELECT  nom, contact, adresse FROM fournisseur");
while ($row = $res->fetch_assoc()) {
    $data["fournisseurs"][] = $row;
}

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