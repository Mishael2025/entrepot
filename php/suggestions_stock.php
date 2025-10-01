<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("localhost", "root", "", "entrepot_alimentaire");
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Connexion échouée"]);
    exit;
}

// 🔍 Chargement des seuils
$seuils = [];
$res = $conn->query("SELECT produit_id, categorie, seuil FROM seuils_stock");
while ($row = $res->fetch_assoc()) {
    $key = nettoyerCategorie($row['categorie']);
    $seuils[$key] = intval($row['seuil']);
}

// 🔗 Chargement des fournisseurs par catégorie
$fournisseurs = [];
$fRes = $conn->query("SELECT nom, categorie FROM fournisseur");
while ($f = $fRes->fetch_assoc()) {
    $catKey = nettoyerCategorie($f['categorie']);
    if (!isset($fournisseurs[$catKey])) {
        $fournisseurs[$catKey] = [];
    }
    $fournisseurs[$catKey][] = $f['nom'];
}

// 📦 Analyse des produits
$produits = $conn->query("SELECT nom, quantite, categorie, date_peremption FROM produits");
$liste = [];
$notifications = [];

$today = date('Y-m-d');
$sevenDays = date('Y-m-d', strtotime('+7 days'));

while ($p = $produits->fetch_assoc()) {
    $qteInfo = ExtraireQuantite($p['quantite']);
    $qteValeur = $qteInfo['valeur'];
    $qteAffichage = $qteInfo['affichage'];

    $cat = nettoyerCategorie($p['categorie']);
    $seuil = $seuils[$cat] ?? 50;
    $exp = $p['date_peremption'];

    $raisons = [];
    $suggestion = "";

    // 🟥 Périmé
    if ($exp && $exp < $today) {
        $raisons[] = "❌ Périmé";
        $suggestion = "Remplacement";
        $notifications[] = "❌ {$p['nom']} périmé depuis le " . date('d/m/Y', strtotime($exp));
    }

    // 🟨 Péremption ≤ 7j
    elseif ($exp && $exp <= $sevenDays) {
        $raisons[] = "⏰ Péremption ≤ 7j";
        $suggestion = "Remplacement";
        $notifications[] = "⏰ {$p['nom']} périme le " . date('d/m/Y', strtotime($exp));
    }

    // 📉 Stock faible
    if ($qteValeur <= $seuil) {
        $raisons[] = "📉 Stock faible";
        if ($suggestion === "") {
            $suggestion = $seuil * 2;
        }
        $notifications[] = "📉 {$p['nom']} en stock critique ({$qteAffichage})";
    }

    if (!empty($raisons)) {
        $item = [
            "nom" => $p['nom'],
            "raison" => implode(" + ", $raisons),
            "suggestion" => $suggestion,
            "quantite" => $qteAffichage,
            "date_peremption" => $exp ?: "—",
            "fournisseurs" => $fournisseurs[$cat] ?? ["Aucun fournisseur associé"]
        ];
        $liste[] = $item;
    }
}

// ✅ Réponse unique et bien formée
echo json_encode([
    "produits" => $liste,
    "notifications" => $notifications
]);

$conn->close();


// 🔧 Fonctions utilitaires
function nettoyerCategorie($categorie)
{
    $cat = mb_strtolower($categorie);
    $cat = str_replace(['é', 'è', 'ê', 'à', 'ç'], ['e', 'e', 'e', 'a', 'c'], $cat);
    return trim($cat);
}

function ExtraireQuantite($quantiteBrute)
{
    preg_match('/([\d\.,]+)\s*(\D+)/', $quantiteBrute, $matches);
    $valeur = isset($matches[1]) ? floatval(str_replace(',', '.', $matches[1])) : null;
    $unite = isset($matches[2]) ? trim($matches[2]) : null;

    return [
        'valeur' => $valeur,
        'unite' => $unite,
        'affichage' => $valeur . ' ' . $unite
    ];
}
?>
