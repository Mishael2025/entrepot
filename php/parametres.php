<?php
header("Content-Type: application/json");

// 🔌 Connexion à la base
$conn = new mysqli("localhost", "root", "", "entrepot_alimentaire");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connexion échouée"]);
    exit;
}

// 🧱 Création de la table si elle n'existe pas
$conn->query("
    CREATE TABLE IF NOT EXISTS parametres (
        cle VARCHAR(50) PRIMARY KEY,
        valeur TEXT NOT NULL
    )
");

// 📥 Si requête POST → enregistrer les paramètres
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success" => false, "error" => "Données invalides"]);
        exit;
    }

    $success = true;
    foreach ($input as $cle => $valeur) {
        $stmt = $conn->prepare("REPLACE INTO parametres (cle, valeur) VALUES (?, ?)");
        $stmt->bind_param("ss", $cle, $valeur);
        if (!$stmt->execute()) {
            $success = false;
            break;
        }
    }

    echo json_encode(["success" => $success]);
    $conn->close();
    exit;
}

// 📤 Sinon → renvoyer les paramètres existants
$res = $conn->query("SELECT cle, valeur FROM parametres");
$data = [];

while ($row = $res->fetch_assoc()) {
    $data[$row["cle"]] = $row["valeur"];
}

echo json_encode(["success" => true, "parametres" => $data]);
$conn->close();
?>