<?php
// history.php

header('Content-Type: application/json');
$directory = 'message';
$data = json_decode(file_get_contents('php://input'), true);
$requestedDate = $data['date']; // 클라이언트로부터 받은 가장 오래된 메시지의 날짜

$startDate = new DateTime($requestedDate); // 받은 날짜로부터 시작
$startDate->modify('-1 day'); // 이전 날짜로 시작하기 위해 하루를 뺍니다.

$historyMessages = [];
$foundOlderMessages = false; // 이전 메시지 존재 여부

// 최대 7일 전까지의 메시지를 조회합니다.
for ($i = 0; $i < 7; $i++) {
    $filename = $directory . '/chat-' . $startDate->format('Y-m-d') . '.json';
    if (file_exists($filename)) {
        $dayMessages = json_decode(file_get_contents($filename), true);
        $historyMessages = array_merge($historyMessages, $dayMessages);
        $foundOlderMessages = true; // 파일이 존재하면, 이전 메시지가 존재함을 표시합니다.
    }
    // 다음 이전 날짜로 이동
    $startDate->modify('-1 day');
}

// 이전 메시지가 더 있는지 여부를 확인합니다.
$hasMoreOlderMessages = false;
if ($foundOlderMessages && $startDate->format('Y-m-d') > '2000-01-01') { // 예를 들어, 서비스 시작 날짜 이후인지 확인
    $previousDay = $startDate->modify('-1 day'); // 한 번 더 이전 날짜
    $previousFilename = $directory . '/chat-' . $previousDay->format('Y-m-d') . '.json';
    if (file_exists($previousFilename)) {
        $hasMoreOlderMessages = true;
    }
}

echo json_encode([
    'messages' => array_reverse($historyMessages), // 최신 메시지가 먼저 오도록 배열을 뒤집습니다.
    'hasOlderMessages' => $hasMoreOlderMessages // 이전 메시지가 더 있는지 여부
]);
?>
