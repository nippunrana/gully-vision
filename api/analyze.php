<?php
header('Content-Type: application/json; charset=utf-8');

// Ensure request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Only POST is supported.']);
    exit;
}

$analysisType = isset($_POST['type']) ? $_POST['type'] : 'batting';
if (!in_array($analysisType, ['batting', 'bowling'])) {
    $analysisType = 'batting';
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
        $command = "node " . __DIR__ . "/analyze.js --video={$escapedPath} --type={$escapedType} 2>&1";
        
        $output = shell_exec($command);
        
        // Cleanup temp file
        if (file_exists($tempFilePath)) {
            unlink($tempFilePath);
        }
        
        if ($output === null) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute analysis script on remote video.']);
            exit;
        }
        
        echo $output;
        exit;
    }

    // Escape argument for CLI execution
    $escapedUrl = escapeshellarg($youtubeUrl);
    $escapedType = escapeshellarg($analysisType);
    
    // Execute Node CLI script for YouTube URL
    $command = "node " . __DIR__ . "/analyze.js --youtube={$escapedUrl} --type={$escapedType} 2>&1";
    
    $output = shell_exec($command);
    
    // Parse output
    if ($output === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to execute analysis script.']);
        exit;
    }
    
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
    $command = "node " . __DIR__ . "/analyze.js --video={$escapedPath} --type={$escapedType} 2>&1";
    
    $output = shell_exec($command);
    
    // Cleanup temporary file immediately after execution
    if (file_exists($tempFilePath)) {
        unlink($tempFilePath);
    }
    
    if ($output === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to execute analysis script.']);
        exit;
    }
    
    echo $output;
    exit;
}

// If neither YouTube nor File is supplied
http_response_code(400);
echo json_encode(['error' => 'Bad Request: Please upload a video file or supply a youtube_url.']);
exit;
