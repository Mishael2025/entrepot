<?php
require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// 🔄 Connexion à la base
$conn = new mysqli("localhost", "root", "", "entrepot_alimentaire");
if ($conn->connect_error) {
    die("❌ Connexion échouée : " . $conn->connect_error);
}

// 🔍 Récupération des données
$result = $conn->query("
    SELECT p.id, p.nom, p.quantite, p.categorie, p.date_peremption, p.created_at, p.position, p.prix_unitaire,
           COALESCE(SUM(ms.quantite), 0) AS sorties
    FROM produits p
    LEFT JOIN mouvements_stock ms ON ms.produit_id = p.id AND ms.type = 'sortie'
    GROUP BY p.id
    ORDER BY p.nom ASC
");

// 📘 Création du document Excel
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle("Inventaire Stock");

// 📋 Métadonnées
$sheet->setCellValue("A1", "📦 Rapport d'Inventaire");
$sheet->setCellValue("A2", "Entrepôt : Central Stock");
$sheet->setCellValue("A3", "Date : " . date("d/m/Y"));
$sheet->setCellValue("A4", "Responsable : John Doe");

// 🧾 En-têtes du tableau
$headers = [
    "Nom",
    "Catégorie",
    "Unité",
    "Quantité Initiale",
    "Sorties",
    "Stock Restant",
    "Prix Unitaire",
    "Valeur Totale",
    "Date Entrée",
    "Date Péremption",
    "Position",
    "Observation"
];
$col = "A";
foreach ($headers as $header) {
    $sheet->setCellValue($col . "6", $header);
    $col++;
}

// 🔄 Insertion des lignes
$row = 7;
while ($data = $result->fetch_assoc()) {
    // ✅ Séparation fiable de la quantité et unité
    $quantiteRaw = trim($data["quantite"]);
    $quantiteParts = explode(" ", $quantiteRaw);
    $quantiteInitiale = isset($quantiteParts[0]) ? floatval($quantiteParts[0]) : 0;
    $unit = isset($quantiteParts[1]) ? strtoupper(trim($quantiteParts[1])) : "";

    $sorties = floatval($data["sorties"]);
    $stockRestant = max(0, $quantiteInitiale - $sorties);
    $valeurTotale = $stockRestant * floatval($data["prix_unitaire"]);
    $observation = ($stockRestant <= 50) ? "⚠️ Stock critique !" : "OK";

    // 📥 Remplir les colonnes
    $sheet->setCellValue("A$row", $data["nom"]);
    $sheet->setCellValue("B$row", $data["categorie"]);
    $sheet->setCellValue("C$row", $unit);
    $sheet->setCellValue("D$row", $quantiteInitiale);
    $sheet->setCellValue("E$row", $sorties);
    $sheet->setCellValue("F$row", $stockRestant . " " . $unit);
    $sheet->setCellValue("G$row", $data["prix_unitaire"]);
    $sheet->setCellValue("H$row", $valeurTotale);
    $sheet->setCellValue("I$row", $data["created_at"]);
    $sheet->setCellValue("J$row", $data["date_peremption"]);
    $sheet->setCellValue("K$row", $data["position"]);
    $sheet->setCellValue("L$row", $observation);

    $row++;
}


// 🎨 Mise en forme
$sheet->getStyle("A1")->getFont()->setBold(true)->setSize(14);
$sheet->getStyle("A2:A4")->getFont()->setBold(true);
$sheet->getStyle("A6:L6")->getFont()->setBold(true);
$sheet->getStyle("A6:L6")->getFill()
    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
    ->getStartColor()->setARGB("FFFFCC");

// 📤 Export du fichier Excel
$writer = new Xlsx($spreadsheet);
$filename = "Inventaire_Stock_" . date("d-m-Y") . ".xlsx";

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header("Content-Disposition: attachment; filename=\"$filename\"");
$writer->save("php://output");

$conn->close();
?>