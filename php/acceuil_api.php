<?php
header("Content-Type: application/json");
$mysqli = new mysqli("localhost", "root", "", "entrepot_alimentaire");

$data = [
    "totalProduits" => 0,
    "produits" => [],
    "volumes" => ["kg" => 0, "l" => 0, "pcs" => 0, "box" => 0],
    "fournisseurs" => [],
    "notifications" => [],
    "sparkline" => ["labels" => [], "values" => []],
    "totalFournisseurs" => 0
];

// 🔢 Total produits
$res = $mysqli->query("SELECT COUNT(*) AS total FROM produits");
$data["totalProduits"] = intval($res->fetch_assoc()["total"]);

// 📥 Seuils par catégorie
$seuils = [];
$res = $mysqli->query("SELECT categorie, seuil FROM seuils_stock");
while ($row = $res->fetch_assoc()) {
    $seuils[$row['categorie']] = intval($row['seuil']);
}

// 📦 Produits + sorties cumulées
$res = $mysqli->query("SELECT p.id, p.nom, p.quantite, p.categorie, p.date_peremption FROM produits p");
while ($row = $res->fetch_assoc()) {
    $id = intval($row["id"]);
    $nom = $row["nom"];
    $cat = $row["categorie"];
    $qteParts = explode(" ", $row["quantite"]);
    $qte = floatval($qteParts[0]);
    $unite = strtolower(trim($qteParts[1] ?? ""));
    $seuil = $seuils[$cat] ?? 50;
    $datePeremption = $row["date_peremption"];

    // 📤 Sorties cumulées
    $resSortie = $mysqli->query("
        SELECT SUM(CAST(SUBSTRING_INDEX(quantite, ' ', 1) AS DECIMAL)) AS total
        FROM mouvements_stock
        WHERE produit_id = $id
    ");
    $sortie = floatval($resSortie->fetch_assoc()["total"] ?? 0);

    // 📥 Entrée = stock actuel + sorties
    $entree = $qte + $sortie;

    // ⚠️ État critique
    $critique = $qte <= $seuil;

    // ⏰ Péremption proche
    $bientotPerime = false;
    if ($datePeremption) {
        $now = new DateTime();
        $peremption = new DateTime($datePeremption);
        $interval = $now->diff($peremption);
        $bientotPerime = $peremption >= $now && $interval->days <= 7;
    }

    // 📊 Volumes globaux
    if (isset($data["volumes"][$unite])) {
        $data["volumes"][$unite] += $qte;
    }

    // 🧠 Stock par produit
    $data["produits"][$nom] = [
        "quantite" => $qte,
        "unite" => $unite,
        "entree" => $entree,
        "sortie" => $sortie,
        "seuil" => $seuil,
        "categorie" => $cat,
        "date_peremption" => $datePeremption,
        "critique" => $critique,
        "bientot_perime" => $bientotPerime
    ];
}

// 🔔 Notifications dynamiques
$nbCritiques = count(array_filter($data["produits"], fn($p) => $p["critique"]));
$nbPerimes = count(array_filter($data["produits"], fn($p) => $p["bientot_perime"]));

$data["notifications"][] = "📦 $nbCritiques produits en stock critique";
$data["notifications"][] = "⏰ $nbPerimes produits périmés ou bientôt périmés";

// 🧑‍🌾 Fournisseurs
$res = $mysqli->query("SELECT categorie, nom, contact FROM fournisseur");
while ($row = $res->fetch_assoc()) {
    $data["fournisseurs"][] = $row;
}
$data["totalFournisseurs"] = count($data["fournisseurs"]);

// 📈 Sparkline (sorties sur 7 jours)
$res = $mysqli->query("
    SELECT DATE(date_mouvement) AS jour,
           SUM(CAST(SUBSTRING_INDEX(quantite, ' ', 1) AS DECIMAL)) AS total
    FROM mouvements_stock
    WHERE date_mouvement >= DATE_SUB(NOW(), INTERVAL 7 DAY)
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