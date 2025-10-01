<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = mysqli_connect("localhost", "root", "", "entrepot_alimentaire");
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Connexion échouée"]);
    exit;
}

// 🔎 Récupérer seuils par catégorie
$seuils = [];
$res = $conn->query("SELECT categorie, seuil FROM seuils_stock");
while ($row = $res->fetch_assoc()) {
    $seuils[$row['categorie']] = intval($row['seuil']);
}

// 📅 Préparation des dates
$today = date('Y-m-d');
$sevenDays = date('Y-m-d', strtotime('+7 days'));

//  Sélection des produits
$data = [];
$res = $conn->query("SELECT nom, quantite, categorie, date_peremption FROM produits");

while ($row = $res->fetch_assoc()) {
    $qte = intval(preg_replace('/[^0-9]/', '', $row['quantite']));
    $cat = $row['categorie'];
    $seuil = $seuils[$cat] ?? 50;
    $exp = $row['date_peremption'];

    // 🧠 Analyse métier
    $isPerime = $exp && $exp < $today;
    $isBientotPerime = $exp && $exp <= $sevenDays;
    $isStockFaible = $qte <= $seuil;

    if ($isPerime || $isBientotPerime || $isStockFaible) {
        // 🏷️ Déterminer l’état
        $etat = "";
        if ($isPerime) {
            $etat = "Périmé";
        } elseif ($isBientotPerime) {
            $etat = "Bientôt périmé";
        } else {
            $etat = "Stock faible";
        }

        // 📋 Ajouter au tableau
        $data[] = [
            "nom" => $row['nom'],
            "quantite" => $row['quantite'],
            "categorie" => $cat,
            "seuil" => $seuil,
            "date_peremption" => $exp ?: "—",
            "etat" => $etat
        ];
    }
}

echo json_encode($data);
$conn->close();
?>
