<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$to      = trim($input['to'] ?? '');
$subject = trim($input['subject'] ?? '');
$htmlBody = $input['html'] ?? '';

if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

if (!$subject || !$htmlBody) {
    echo json_encode(['success' => false, 'error' => 'Missing subject or email body']);
    exit;
}

$boundary = md5(uniqid(rand(), true));

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Gully-Vision Scout <noreply@gully-vision.com>\r\n";
$headers .= "Reply-To: noreply@gully-vision.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$sent = mail($to, $subject, $htmlBody, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Mail server failed to send. Please try again.']);
}
