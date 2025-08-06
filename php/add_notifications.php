<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Connexion échouée"]);
    exit();
}

// 🔧 Fonctions utilitaires
function extraireQuantite($valeur) {
    preg_match('/(\d+)/', $valeur, $matches);
    return isset($matches[1]) ? intval($matches[1]) : 0;
}

function extraireUnite($valeur) {
    return trim(preg_replace('/\d+/', '', $valeur));
}

function nettoyerCategorie($categorie) {
    $cat = mb_strtolower($categorie);
    $cat = str_replace(['é','è','ê','à','ç'], ['e','e','e','a','c'], $cat);
    return trim($cat);
}

function createNotification($conn, $product_id, $message, $type, $severity = null, $category = null, $context = null, &$log) {
    $check = $conn->prepare("SELECT id FROM notifications WHERE product_id = ? AND message = ? AND is_read = 0");
    $check->bind_param("is", $product_id, $message);
    $check->execute();
    $check->store_result();

    if ($check->num_rows === 0) {
        $insert = $conn->prepare("
            INSERT INTO notifications (user_id, product_id, message, type, severity, category, context, created_at, is_read)
            VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW(), 0)
        ");
        $insert->bind_param("issssss", $product_id, $message, $type, $severity, $category, $context);
        $insert->execute();
        $log[] = $message;
        $insert->close();
    }
    $check->close();
}


// 🔎 Analyse des produits
$products = $conn->query("SELECT id, nom, quantite, categorie, date_peremption FROM produits");
$log = [];

while ($p = $products->fetch_assoc()) {
    $id     = $p['id'];
    $nom    = $p['nom'];
    $qte    = extraireQuantite($p['quantite']);
    $unit   = extraireUnite($p['quantite']);
    $cat    = $p['categorie'];
    $exp    = $p['date_peremption'];

    // 🔍 Normalisation du nom de catégorie
    $cat_nettoye = nettoyerCategorie($cat);

    // 🔍 Lecture du seuil depuis seuils_stock
    $seuil = 50; // Valeur par défaut
    $threshold = $conn->prepare("SELECT seuil FROM seuils_stock WHERE LOWER(categorie) = ?");
    $threshold->bind_param("s", $cat_nettoye);
    $threshold->execute();
    $result = $threshold->get_result();
    if ($result->num_rows > 0) {
        $seuil = intval($result->fetch_assoc()['seuil']);
    }
    $threshold->close();

    // 📅 Péremption proche
    if ($exp && date('Y-m-d', strtotime($exp)) <= date('Y-m-d', strtotime('+1 day'))) {
        $message = "⚠️ Le produit « $nom » expire demain !";
        createNotification($conn, $id, $message, "warning", $log);
    }

    // 📉 Stock faible
    if ($qte <= $seuil) {
        $message = "📦 Stock faible pour « $nom » ({$qte} {$unit}) dans la catégorie « $cat »";
        createNotification($conn, $id, $message, "alerte", $log);
    }
}

echo json_encode([
    "success" => true,
    "message" => "✅ Analyse terminée",
    "notifications_created" => $log
]);

$conn->close();
?>