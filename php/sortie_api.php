<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "entrepot_alimentaire";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "❌ Connexion échouée"]);
    exit;
}
// 🔁 Helpers
function getJsonInput(): array
{
    $rawInput = file_get_contents("php://input");
    return (is_string($rawInput) && !empty($rawInput)) ? json_decode($rawInput, true) ?? [] : [];
}

function getParam(string $name, array $sources = ['GET', 'JSON'])
{
    foreach ($sources as $source) {
        if ($source === 'GET' && isset($_GET[$name]))
            return $_GET[$name];
        if ($source === 'JSON') {
            $input = getJsonInput();
            if (isset($input[$name]))
                return $input[$name];
        }
    }
    return null;
}

function getTrimmedParam(string $key): string
{
    $val = getParam($key, ['JSON']);
    return is_string($val) ? trim($val) : "";
}

function validateScalar($value, string $label): bool
{
    if (is_array($value) || is_object($value)) {
        echo json_encode(["success" => false, "error" => "❌ '$label' ne doit pas être un tableau ou un objet"]);
        return false;
    }
    return true;
}

function validateNumeric($value, string $label): bool
{
    if (!validateScalar($value, $label))
        return false;
    if (!is_numeric($value)) {
        echo json_encode(["success" => false, "error" => "❌ '$label' non numérique : " . json_encode($value)]);
        return false;
    }
    return true;
}
//  Requête POST : enregistrer une sortie
// 🔧 POST : Retrait de stock
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $requestId = uniqid("req_", true);

    if (!is_array($input)) {
        echo json_encode(["success" => false, "error" => "❌ Requête mal formée"]);
        error_log("[$requestId] Payload non valide");
        exit;
    }

    // Vérifie structure scalaire
    foreach ($input as $key => $val) {
        if (is_array($val)) {
            echo json_encode(["success" => false, "error" => "❌ '$key' ne doit pas être un tableau"]);
            error_log("[$requestId] Champ '$key' non scalaire");
            exit;
        }
    }

    $required = ['nom', 'quantite', 'unit', 'raison', 'type'];

    foreach ($required as $champ) {
        if (!isset($input[$champ]) || trim($input[$champ]) === '') {
            echo json_encode(["success" => false, "error" => "❌ Champ requis : $champ"]);
            exit;
        }

    }

    if (!validateNumeric($input["quantite"], "Quantité"))
        exit;

    $stmt = $conn->prepare("SELECT id, quantite, prix_unitaire FROM produits WHERE nom = ?");
    $stmt->bind_param("s", $input['nom']);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        echo json_encode(["success" => false, "error" => "❌ Produit introuvable"]);
        exit;
    }

    $quantite_parts = explode(" ", $product["quantite"]);
    $quantite_actuelle = isset($quantite_parts[0]) ? floatval($quantite_parts[0]) : 0;
    $unit_actuelle = strtolower(trim($quantite_parts[1] ?? ""));
    $unit_input = strtolower(trim($input["unit"]));

    if ($unit_input !== $unit_actuelle) {
        echo json_encode(["success" => false, "error" => "❌ Unité incompatible : saisie ($unit_input) ≠ stock ($unit_actuelle)"]);
        exit;
    }

    $quantite_retrait = floatval($input["quantite"]);
    if ($quantite_actuelle < $quantite_retrait) {
        echo json_encode(["success" => false, "error" => "❌ Stock insuffisant"]);
        exit;
    }

    $nouvelle_quantite = ($quantite_actuelle - $quantite_retrait) . " " . $unit_actuelle;
    $prix_unitaire = isset($product["prix_unitaire"]) ? floatval($product["prix_unitaire"]) : 0;
    $valeur = $prix_unitaire > 0
        ? $prix_unitaire * $quantite_retrait
        : 0;

    $utilisateur = isset($input["utilisateur"]) ? trim($input["utilisateur"]) : "inconnu";
    $date_mouvement = !empty($input["date"]) ? $input["date"] : date("Y-m-d");

    $stmt = $conn->prepare("
        INSERT INTO mouvements_stock 
        (produit_id, produit_nom, type, quantite, unit, raison, utilisateur, valeur, date_mouvement)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "issdsssss",
        $product['id'],
        $input['nom'],
        $input['type'],
        $quantite_retrait,
        $unit_actuelle,
        $input['raison'],
        $utilisateur,
        $valeur,
        $date_mouvement
    );
    $stmt->execute();

    $stmt = $conn->prepare("UPDATE produits SET quantite = ? WHERE id = ?");
    $stmt->bind_param("si", $nouvelle_quantite, $product['id']);
    $stmt->execute();

    // 🔔 Alerte seuil critique
    if ($quantite_actuelle - $quantite_retrait <= 50) {
        $stock_restant = $quantite_actuelle - $quantite_retrait;
        $message = "⚠️ Stock critique pour \"{$input['nom']}\" ({$stock_restant} {$unit_actuelle})";


        $notifData = json_encode([
            "user_id" => null,
            "product_id" => $product['id'],
            "message" => $message,
            "type" => "alerte"
        ]);
        file_get_contents("http://localhost/entrepot/add_notifications.php", false, stream_context_create([
            "http" => ["method" => "POST", "header" => "Content-Type: application/json", "content" => $notifData]
        ]));
    }

    echo json_encode([
        "success" => true,
        "message" => "✅ Produit retiré",
        "data" => [
            "nom" => $input["nom"],
            "quantite" => $nouvelle_quantite,
            "valeur" => $valeur,
            "date" => $date_mouvement,
            "utilisateur" => $utilisateur
        ]
    ]);
    exit;
}

// 🔎 GET : Résumé ou timeline
function fetchSorties(mysqli $conn): array
{
    $result = $conn->query("
      SELECT m.type, m.quantite, m.date_mouvement, p.id AS produit_id, p.nom
        FROM mouvements_stock m
        JOIN produits p ON m.produit_id = p.id
        WHERE m.type = 'sortie'
        ORDER BY m.date_mouvement ASC
        GROUP BY m.produit_id
    ");
    $sorties = [];
    while ($row = $result->fetch_assoc()) {
        $stmt = $conn->prepare("SELECT nom FROM produits WHERE id = ?");
        $stmt->bind_param("i", $row['produit_id']);
        $stmt->execute();
        $nom = $stmt->get_result()->fetch_assoc()['nom'];
        $sorties[] = ["nom" => $nom, "quantite" => floatval($row['total_sorties'])];
    }
    return $sorties;
}

function fetchTimeline(mysqli $conn): array
{
    $result = $conn->query("
        SELECT m.type, m.quantite, m.date_mouvement, p.id AS produit_id, p.nom
        FROM mouvements_stock m
        JOIN produits p ON m.produit_id = p.id
        WHERE m.type = 'sortie'
        ORDER BY m.date_mouvement ASC
    ");

    $mouvements = [];
    while ($row = $result->fetch_assoc()) {
        $mouvements[] = [
            "type" => $row["type"],
            "quantite" => floatval($row["quantite"]),
            "date_mouvement" => $row["date_mouvement"],
            "produit_id" => intval($row["produit_id"]),
            "nom" => $row["nom"]
        ];
    }
    return $mouvements;
}

// 🔍 Requête GET : résumés ou historique
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 🧠 Journalisation
    error_log("🔎 Requête GET reçue : " . json_encode($_GET));

    // 🏷️ Récupération sécurisée du mode
    $mode = getParam('mode', ['GET']);
    if (!is_string($mode) || !in_array($mode, ["sorties", "timeline"])) {
        echo json_encode(["success" => false, "error" => "❌ Mode GET invalide ou absent"]);
        exit;
    }

    // 🔢 Validation des paramètres facultatifs (si présents)
    $quantite_retrait = getParam('quantite_retrait', ['GET']);
    $quantite_str = getTrimmedParam('quantite');

    if ($quantite_str !== "" && $quantite_retrait !== null) {
        if (!validateNumeric($quantite_str, "Quantité") || intval($quantite_retrait) <= 0) {
            echo json_encode(["success" => false, "error" => "❌ Quantité de retrait invalide"]);
            exit;
        }
    }

    // 🧮 Mode "sorties" : Total par produit
    if ($mode === "sorties") {
        $sorties = fetchSorties($conn);
        echo json_encode([
            "success" => true,
            "mode" => "sorties",
            "data" => $sorties
        ]);
        exit;
    }

    // 📊 Mode "timeline" : Historique complet
    if ($mode === "timeline") {
        $timeline = fetchTimeline($conn);
        echo json_encode([
            "success" => true,
            "mode" => "timeline",
            "data" => $timeline
        ]);
        exit;
    }

    //  Si on arrive ici, le mode est valide mais non géré
    echo json_encode([
        "success" => false,
        "error" => "❌ Mode reconnu mais non implémenté"
    ]);
    exit;
}
//  Si on arrive ici, la méthode n'est ni POST ni GET
echo json_encode([
    "success" => false,
    "error" => "❌ Méthode non autorisée"
]);
$conn->close();
?>