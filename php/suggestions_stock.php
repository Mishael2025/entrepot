<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("localhost", "root", "", "entrepot_alimentaire");
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Connexion échouée"]);
    exit;
}

// 🔧 Fonctions utilitaires
function extraireQuantite($valeur)
{
    preg_match('/(\d+)/', $valeur, $matches);
    return isset($matches[1]) ? intval($matches[1]) : 0;
}

function nettoyerCategorie($categorie)
{
    $cat = mb_strtolower($categorie);
    $cat = str_replace(['é', 'è', 'ê', 'à', 'ç'], ['e', 'e', 'e', 'a', 'c'], $cat);
    return trim($cat);
}

// 🔍 Chargement des seuils
$seuils = [];
$res = $conn->query("SELECT categorie, seuil FROM seuils_stock");
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
$today = date('Y-m-d');
$sevenDays = date('Y-m-d', strtotime('+7 days'));

while ($p = $produits->fetch_assoc()) {
    $qte = extraireQuantite($p['quantite']);
    $cat = nettoyerCategorie($p['categorie']);
    $seuil = $seuils[$cat] ?? 50;
    $exp = $p['date_peremption'];

    $raisons = [];
    $suggestion = "";

    // 🟥 Critère : produit périmé
    if ($exp && $exp < $today) {
        $raisons[] = "❌ Périmé";
        $suggestion = "Remplacement";
    }

    // 🟨 Critère : périmption ≤ 7 jours
    elseif ($exp && $exp <= $sevenDays) {
        $raisons[] = "⏰ Péremption ≤ 7j";
        $suggestion = "Remplacement";
    }

    // 📉 Critère : stock faible
    if ($qte <= $seuil) {
        $raisons[] = "📉 Stock faible";
        // Ne pas écraser suggestion précédente si déjà définie
        if ($suggestion === "") {
            $suggestion = $seuil * 2;
        }
    }

    if (!empty($raisons)) {
        $item = [
            "nom" => $p['nom'],
            "raison" => implode(" + ", $raisons),
            "suggestion" => $suggestion,
            "quantite" => $qte,
            "date_peremption" => $exp ?: "—"
        ];

        // 🔗 Ajout des fournisseurs associés
        if (isset($fournisseurs[$cat])) {
            $item["fournisseurs"] = $fournisseurs[$cat];
        } else {
            $item["fournisseurs"] = ["Aucun fournisseur associé"];
        }

        $liste[] = $item;
    }
}

echo json_encode($liste);
$conn->close();
?>