<?php
// file.php
$uploadDir = 'upload/';
$messageDir = 'message';
$today = date('Y-m-d');
$now = date('Y-m-d H:i:s');
$randomKey = substr(md5(rand()), 0, 3); // 랜덤 키 생성

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method.']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No file uploaded.']);
    exit;
}

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode(['error' => 'Failed to create upload directory.']);
        exit;
    }
}

if (!is_dir($messageDir)) {
    if (!mkdir($messageDir, 0777, true)) {
        echo json_encode(['error' => 'Failed to create message directory.']);
        exit;
    }
}

// 파일 이름과 확장자 분리
$fileNameParts = explode('.', $_FILES['file']['name']);
$extension = array_pop($fileNameParts); // 확장자 추출
$fileNameWithoutExt = implode('.', $fileNameParts); // 확장자를 제외한 파일 이름
$filename = $today . '_' . $fileNameWithoutExt . '_' . $randomKey . '.' . $extension; // 새 파일 이름 생성
$filePath = $uploadDir . $filename;
$fileUrl = 'localhost:3000/chat/' . $filePath; // 파일 URL 생성

if (!move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
    echo json_encode(['error' => 'File upload failed.']);
    exit;
}

$messageFilename = $messageDir . '/chat-' . $today . '.json';
$newMessage = [
    'file' => $fileUrl,
    'text' => $filename,
    'date' => $now
];

if (file_exists($messageFilename)) {
    $messages = json_decode(file_get_contents($messageFilename), true);
} else {
    $messages = [];
}

array_unshift($messages, $newMessage); // 새 메시지를 배열 앞에 추가
file_put_contents($messageFilename, json_encode($messages, JSON_PRETTY_PRINT));
echo json_encode(['newMessage' => $newMessage]);
?>
