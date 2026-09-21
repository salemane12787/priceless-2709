<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['voiceNote'])) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'no file']);
  exit;
}

$dir = __DIR__ . '/uploads';
if (!is_dir($dir)) {
  mkdir($dir, 0775, true);
}

$safe = 'audio_' . date('Ymd-His') . '_' . bin2hex(random_bytes(3)) . '.webm';
$target = $dir . '/' . $safe;

if (!move_uploaded_file($_FILES['voiceNote']['tmp_name'], $target)) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'save failed']);
  exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) mkdir($dataDir, 0775, true);

$pdo = new PDO('sqlite:' . $dataDir . '/app.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
)');

$stmt = $pdo->prepare('INSERT INTO records (body, created_at) VALUES (?, ?)');
$path = 'uploads/' . $safe;
$body = json_encode(['type' => 'voice_note', 'path' => $path]);
$stmt->execute([$body, gmdate('c')]);

echo json_encode(['status' => 'success', 'path' => $path, 'id' => $pdo->lastInsertId()]);
