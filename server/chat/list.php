<?php
// list.php
header('Content-Type: application/json');
$directory = 'message';
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

$todayFilename = $directory . '/chat-' . $today . '.json';
$yesterdayFilename = $directory . '/chat-' . $yesterday . '.json';

$messages = [];

if (file_exists($yesterdayFilename)) {
    $yesterdayMessages = json_decode(file_get_contents($yesterdayFilename), true);
    $messages = array_merge($messages, $yesterdayMessages);
}

if (file_exists($todayFilename)) {
    $todayMessages = json_decode(file_get_contents($todayFilename), true);
    $messages = array_merge($messages, $todayMessages);
}

// 새로운 메시지 배열을 정의합니다.
$updatedMessages = [];
foreach ($messages as $message) {
    // 메시지가 파일 메시지인 경우
    if (isset($message['file']) && !isset($message['img'])) {
        $message['isFile'] = true; // 파일 메시지임을 표시
        $message['fileText'] = basename($message['file']); // 파일 이름만 표시
    }

    // 메시지가 이미지 메시지인 경우
    if (isset($message['img']) && !isset($message['file'])) {
        $message['isImage'] = true; // 이미지 메시지임을 표시
    }

    // 텍스트 메시지 처리
    if (!isset($message['file']) && !isset($message['img'])) {
        $message['isText'] = true; // 텍스트 메시지임을 표시
    }

    // 업데이트된 메시지를 배열에 추가합니다.
    $updatedMessages[] = $message;
}

$hasOlderMessages = false;
$allFiles = array_diff(scandir($directory), ['..', '.']);
foreach ($allFiles as $file) {
    $fileDate = substr($file, 5, 10);
    if ($fileDate < $yesterday) {
        $hasOlderMessages = true;
        break;
    }
}

echo json_encode([
    'messages' => $updatedMessages,
    'hasOlderMessages' => $hasOlderMessages
]);
?>
