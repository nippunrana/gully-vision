<?php
header('Content-Type: application/json; charset=utf-8');

// Ensure request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Only POST is supported.']);
    exit;
}

$analysisType = isset($_POST['type']) ? $_POST['type'] : 'batting';
if (!in_array($analysisType, ['batting', 'bowling', 'fielding'])) {
    $analysisType = 'batting';
}
$playerName = isset($_POST['player']) ? trim($_POST['player']) : 'Grassroots Prospect';
if (empty($playerName)) {
    $playerName = 'Grassroots Prospect';
}

function saveToLeaderboard($output) {
    $resultData = json_decode($output, true);
    if ($resultData && !isset($resultData['error'])) {
        $name = isset($resultData['scouted_player']['name']) ? $resultData['scouted_player']['name'] : 'Grassroots Prospect';
        $role = isset($resultData['scouted_player']['role']) ? $resultData['scouted_player']['role'] : 'Batter';
        $techName = isset($resultData['shot_or_delivery_name']['technical']) ? $resultData['shot_or_delivery_name']['technical'] : 'Unknown';
        
        $overallScore = 80;
        if ($role === 'Bowler') {
            $scores = isset($resultData['dashboard_metrics']['bowling_scores']) ? $resultData['dashboard_metrics']['bowling_scores'] : [];
            $runUp = isset($scores['run_up_and_stride']) && $scores['run_up_and_stride'] !== null ? $scores['run_up_and_stride'] : 80;
            $armSpeed = isset($scores['release_arm_speed']) && $scores['release_arm_speed'] !== null ? $scores['release_arm_speed'] : 80;
            $follow = isset($scores['follow_through']) && $scores['follow_through'] !== null ? $scores['follow_through'] : 80;
            $overallScore = round(($runUp + $armSpeed + $follow) / 3);
        } else if ($role === 'Fielder') {
            $scores = isset($resultData['dashboard_metrics']['fielding_scores']) ? $resultData['dashboard_metrics']['fielding_scores'] : [];
            $throwing = isset($scores['throwing_accuracy']) && $scores['throwing_accuracy'] !== null ? $scores['throwing_accuracy'] : 80;
            $coverage = isset($scores['ground_coverage']) && $scores['ground_coverage'] !== null ? $scores['ground_coverage'] : 80;
            $catching = isset($scores['catching_technique']) && $scores['catching_technique'] !== null ? $scores['catching_technique'] : 80;
            $overallScore = round(($throwing + $coverage + $catching) / 3);
        } else {
            $scores = isset($resultData['dashboard_metrics']['batting_scores']) ? $resultData['dashboard_metrics']['batting_scores'] : [];
            $stance = isset($scores['stance_and_balance']) && $scores['stance_and_balance'] !== null ? $scores['stance_and_balance'] : 80;
            $backlift = isset($scores['backlift_and_swing']) && $scores['backlift_and_swing'] !== null ? $scores['backlift_and_swing'] : 80;
            $execution = isset($scores['footwork_and_execution']) && $scores['footwork_and_execution'] !== null ? $scores['footwork_and_execution'] : 80;
            $overallScore = round(($stance + $backlift + $execution) / 3);
        }
        
        $verdict = isset($resultData['evaluation_and_feedback']['scouting_summary']) ? $resultData['evaluation_and_feedback']['scouting_summary'] : '';
        
        try {
            $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=gullyvision";
            $user = "gullyvision_user";
            $password = "GullyVision2026Pass";
            $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            
            $stmt = $pdo->prepare("INSERT INTO leaderboard (player_name, role, overall_score, technique_name, verdict) VALUES (:player_name, :role, :overall_score, :technique_name, :verdict)");
            $stmt->execute([
                ':player_name' => $name,
                ':role' => $role,
                ':overall_score' => $overallScore,
                ':technique_name' => $techName,
                ':verdict' => $verdict
            ]);
        } catch (PDOException $dbEx) {
            // Silently ignore or log connection/write failure to not disrupt flow
        }
    }
}

$response = null;

// Handle YouTube URL Flow
if (isset($_POST['youtube_url']) && !empty(trim($_POST['youtube_url']))) {
    $youtubeUrl = trim($_POST['youtube_url']);
    
    // Simple sanitization and validation of YouTube URL format
    if (!filter_var($youtubeUrl, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid URL format provided.']);
        exit;
    }

    $isYoutube = (strpos($youtubeUrl, 'youtube.com') !== false || strpos($youtubeUrl, 'youtu.be') !== false || strpos($youtubeUrl, 'mixkit.co') !== false);
    
    if (!$isYoutube) {
        // Direct video URL (like the Mixkit samples). Download and treat as local video file.
        $uploadDir = __DIR__ . '/uploads/';
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create uploads directory for download.']);
                exit;
            }
        }
        
        $tempFileName = uniqid('download_', true) . '.mp4';
        $tempFilePath = $uploadDir . $tempFileName;
        
        // Download the remote file
        $videoData = @file_get_contents($youtubeUrl);
        if ($videoData === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to download the remote video sample.']);
            exit;
        }
        
        if (file_put_contents($tempFilePath, $videoData) === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save downloaded remote video.']);
            exit;
        }
        
        // Execute Node CLI script with local video path
        $escapedPath = escapeshellarg($tempFilePath);
        $escapedType = escapeshellarg($analysisType);
        $errorLog = __DIR__ . '/uploads/error.log';
        if (file_exists($errorLog)) {
            unlink($errorLog);
        }
        $command = "node " . __DIR__ . "/analyze.js --video={$escapedPath} --type={$escapedType} 2>" . escapeshellarg($errorLog);
        
        $output = shell_exec($command);
        
        // Cleanup temp file
        if (file_exists($tempFilePath)) {
            unlink($tempFilePath);
        }
        
        $decoded = json_decode($output, true);
        if ($decoded === null) {
            $stderr = file_exists($errorLog) ? file_get_contents($errorLog) : '';
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to execute analysis script on remote video.',
                'details' => $output ? $output : $stderr
            ]);
            exit;
        }
        
        echo $output;
        exit;
    }

    // Escape argument for CLI execution
    $escapedUrl = escapeshellarg($youtubeUrl);
    $escapedType = escapeshellarg($analysisType);
    $escapedPlayer = escapeshellarg($playerName);
    $errorLog = __DIR__ . '/uploads/error.log';
    if (file_exists($errorLog)) {
        unlink($errorLog);
    }
    
    // Execute Node CLI script for YouTube URL
    $command = "node " . __DIR__ . "/analyze.js --youtube={$escapedUrl} --type={$escapedType} --player={$escapedPlayer} 2>" . escapeshellarg($errorLog);
    
    $output = shell_exec($command);
    
    $decoded = json_decode($output, true);
    if ($decoded === null) {
        $stderr = file_exists($errorLog) ? file_get_contents($errorLog) : '';
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to execute analysis script for YouTube URL.',
            'details' => $output ? $output : $stderr
        ]);
        exit;
    }
    
    saveToLeaderboard($output);
    echo $output;
    exit;
}

// Handle File Upload Flow
if (isset($_FILES['video'])) {
    $file = $_FILES['video'];
    
    // Check for PHP upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = 'Upload error code: ' . $file['error'];
        if ($file['error'] === UPLOAD_ERR_INI_SIZE) {
            $errorMsg = 'The uploaded file exceeds the upload_max_filesize directive in php.ini.';
        }
        http_response_code(400);
        echo json_encode(['error' => $errorMsg]);
        exit;
    }
    
    // Validate file size (e.g. limit to 50MB)
    $maxSize = 50 * 1024 * 1024; // 50MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds maximum limit of 50MB.']);
        exit;
    }
    
    // Validate file extension/mime-type (allow mp4 and quicktime/mov)
    $allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
    $fileMime = mime_content_type($file['tmp_name']);
    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($fileMime, $allowedTypes) && !in_array($fileExt, ['mp4', 'mov', 'mkv'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Unsupported file format. Please upload an MP4 or MOV cricket video.']);
        exit;
    }
    
    // Create uploads directory if it does not exist
    $uploadDir = __DIR__ . '/uploads/';
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create uploads directory. check server folder permissions.']);
            exit;
        }
    }
    
    // Generate secure unique name for temporary video file
    $tempFileName = uniqid('scout_', true) . '.' . $fileExt;
    $tempFilePath = $uploadDir . $tempFileName;
    
    if (!move_uploaded_file($file['tmp_name'], $tempFilePath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file to temporary path.']);
        exit;
    }
    
    // Escape path and run CLI execution
    $escapedPath = escapeshellarg($tempFilePath);
    $escapedType = escapeshellarg($analysisType);
    $escapedPlayer = escapeshellarg($playerName);
    $errorLog = __DIR__ . '/uploads/error.log';
    if (file_exists($errorLog)) {
        unlink($errorLog);
    }
    $command = "node " . __DIR__ . "/analyze.js --video={$escapedPath} --type={$escapedType} --player={$escapedPlayer} 2>" . escapeshellarg($errorLog);
    
    $output = shell_exec($command);
    
    // Cleanup temporary file immediately after execution
    if (file_exists($tempFilePath)) {
        unlink($tempFilePath);
    }
    
    $decoded = json_decode($output, true);
    if ($decoded === null) {
        $stderr = file_exists($errorLog) ? file_get_contents($errorLog) : '';
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to execute analysis script for uploaded file.',
            'details' => $output ? $output : $stderr
        ]);
        exit;
    }
    
    saveToLeaderboard($output);
    echo $output;
    exit;
}

// If neither YouTube nor File is supplied
http_response_code(400);
echo json_encode(['error' => 'Bad Request: Please upload a video file or supply a youtube_url.']);
exit;
