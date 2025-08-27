<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = mysqli_connect("localhost", "root", "", "entrepotalimentaire");
if (!$conn) {
    echo json_encode(["success" => false, "error" => "❌ Connexion échouée"]);
    exit;
}

$action = $_GET['action'] ?? null;

switch ($action) {
    case "get":
        $result = $conn->query("SELECT categorie, produit_id, seuil FROM seuils_stock ORDER BY categorie ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode($data);
        break;

    case "add":
        $input = json_decode(file_get_contents("php://input"), true);
        $cat = trim($input['categorie'] ?? '');
        $seuil = intval($input['seuil'] ?? 5);

        if ($cat !== '') {
            $stmt = $conn->prepare("INSERT INTO seuils_stock (categorie, seuil) VALUES (?, ?) ON DUPLICATE KEY UPDATE seuil = ?");
            $stmt->bind_param("sii", $cat, $seuil, $seuil);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true, "message" => "✅ Catégorie ajoutée ou mise à jour"]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Catégorie invalide"]);
        }
        break;

    case "update":
        $input = json_decode(file_get_contents("php://input"), true);
        $cat = trim($input['categorie'] ?? '');
        $seuil = intval($input['seuil'] ?? 0);

        if ($cat !== '') {
            $stmt = $conn->prepare("UPDATE seuils_stock SET seuil = ? WHERE categorie = ?");
            $stmt->bind_param("is", $seuil, $cat);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true, "message" => "✏️ Seuil modifié"]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Catégorie invalide"]);
        }
        break;

    case "delete":
        $input = json_decode(file_get_contents("php://input"), true);
        $cat = trim($input['categorie'] ?? '');

        if ($cat !== '') {
            $stmt = $conn->prepare("DELETE FROM seuils_stock WHERE categorie = ?");
            $stmt->bind_param("s", $cat);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true, "message" => "🗑️ Catégorie supprimée"]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Catégorie invalide"]);
        }
        break;

    default:
        echo json_encode(["success" => false, "message" => "❌ Action non reconnue"]);
        break;
}

$conn->close();
?>