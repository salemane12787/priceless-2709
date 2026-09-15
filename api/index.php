<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
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

function out(array $payload, int $code = 200): void {
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && ($action === 'ping' || $action === '')) {
  out(['ok' => true, 'server' => 'php-sqlite', 'time' => gmdate('c')]);
}

if ($method === 'GET' && $action === 'list') {
  $rows = $pdo->query('SELECT id, body, created_at FROM records ORDER BY id DESC LIMIT 200')->fetchAll(PDO::FETCH_ASSOC);
  out(['ok' => true, 'records' => $rows]);
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  $body = is_array($data) ? json_encode($data) : $raw;
  if ($body === '' || $body === 'null') {
    out(['ok' => false, 'error' => 'empty'], 400);
  }
  $stmt = $pdo->prepare('INSERT INTO records (body, created_at) VALUES (?, ?)');
  $stmt->execute([$body, gmdate('c')]);
  out(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

out(['ok' => false, 'error' => 'unknown'], 404);
