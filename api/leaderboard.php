<?php
header('Content-Type: application/json; charset=utf-8');

$dsn = "pgsql:host=127.0.0.1;port=5432;dbname=gullyvision";
$user = "gullyvision_user";
$password = "GullyVision2026Pass";

try {
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Fetch top 20 players ordered by overall rating descending
    $stmt = $pdo->query("SELECT player_name, role, overall_score, technique_name, verdict, scouted_at FROM leaderboard ORDER BY overall_score DESC, scouted_at DESC LIMIT 20");
    $data = $stmt->fetchAll();
    
    echo json_encode($data);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}
