<?php
$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
mysqli_set_charset($conn, "utf8");

$date = $_GET['date']; // ex: 2025-08-22

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

$sqlProduit = "SELECT id, nom, quantite, categorie, position, prix_unitaire, photo FROM produits WHERE id = $id";
$resultProduit = mysqli_query($conn, $sqlProduit);
$produit = mysqli_fetch_assoc($resultProduit);

//  Vérification que le produit existe
if (!$produit) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "error" => "Produit introuvable pour l'ID $id",
        "id_reçu" => $id
        
    ]);
    error_log("ID reçu : " . $_GET['id']);
    exit;
}



// 📦 Mouvements du jour
$sqlMouvements = "
  SELECT type, quantite, unit, raison, utilisateur, valeur, date_mouvement
  FROM mouvements_stock
  WHERE produit_id = $id AND date_mouvement BETWEEN DATE_SUB('$date', INTERVAL 7 DAY) AND '$date 23:59:59'

  ORDER BY date_mouvement ASC
";
$resultMouvements = mysqli_query($conn, $sqlMouvements);
$mouvements = [];
$stats = [
    "entrees" => 0,
    "sorties" => 0,
    "heures_entrees" => [],
    "heures_sorties" => [],
    "users_entrees" => [],
    "users_sorties" => []
];

while ($row = mysqli_fetch_assoc($resultMouvements)) {
    $mouvements[] = $row;
    $heure = date('H:i', strtotime($row['date_mouvement']));

    if ($row['type'] === 'entrée') {
        $stats['entrees'] += $row['quantite'];
        $stats['heures_entrees'][] = $heure;
        $stats['users_entrees'][] = $row['utilisateur'];
    } else {
        $stats['sorties'] += $row['quantite'];
        $stats['heures_sorties'][] = $heure;
        $stats['users_sorties'][] = $row['utilisateur'];
    }
}

// 📊 Stock calculé
$stock_theorique = intval($produit['quantite']);
$stock_reel = $stock_theorique + $stats['entrees'] - $stats['sorties'];
$ecart = $stock_reel - $stock_theorique;

$stock = [
    "theorique" => $stock_theorique,
    "reel" => $stock_reel,
    "ecart" => $ecart
];

// 🏷️ Badge métier
if ($ecart === 0) {
    $badge = "✅ Stock conforme";
} elseif ($stock_reel <= 0) {
    $badge = "📦 Produit en rupture";
} else {
    $badge = "⚠️ Écart détecté";
}

// 📤 Réponse JSON
header("Content-Type: application/json");
echo json_encode([
    "success" => true,
    "date" => $date,
    "produit" => $produit,
    "stats" => $stats,
    "mouvements" => $mouvements,
    "stock" => $stock,
    "badge" => $badge
]);
?>