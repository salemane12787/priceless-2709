<?php
// السماح لأي موقع (بما في ذلك سيرفر Vite المحلي) بإرسال البيانات إلى هذا السيرفر
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// التعامل مع طلبات الفحص المسبق (Preflight requests) التي يرسلها المتصفح
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['voiceNote'])) {
    $uploadDirectory = 'uploads/';
    
    // التأكد من وجود مجلد التخزين أو إنشائه إن لم يكن موجوداً
    if (!is_dir($uploadDirectory)) {
        mkdir($uploadDirectory, 0777, true);
    }

    $fileName = 'audio_' . time() . '_' . uniqid() . '.webm';
    $targetFile = $uploadDirectory . $fileName;

    if (move_uploaded_file($_FILES['voiceNote']['tmp_name'], $targetFile)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "path" => $targetFile]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "فشل حفظ الملف على السيرفر."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "طلب غير صالح."]);
}
?>
