<?php
// message.php
$directory = 'message';
$today = date('Y-m-d');
$filename = $directory . '/chat-' . $today . '.json';
header('Content-Type: application/json');

if (!is_dir($directory)) {
    mkdir($directory, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $newMessage = json_decode($input, true);

    // 날짜와 시간을 메시지에 추가
    $newMessage['date'] = date('Y-m-d H:i:s');

    if (file_exists($filename)) {
        $messages = json_decode(file_get_contents($filename), true);
    } else {
        $messages = [];
    }

    array_unshift($messages, $newMessage); // 새 메시지를 배열 앞에 추가
    file_put_contents($filename, json_encode($messages, JSON_PRETTY_PRINT));
    echo json_encode(['newMessage' => $newMessage]);
} else {
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        $messages = [];
        file_put_contents($filename, json_encode($messages, JSON_PRETTY_PRINT));
        echo json_encode($messages);
    }
}
?>
