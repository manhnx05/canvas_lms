import requests
import json
import time

"""
Hướng dẫn sử dụng canvas_sync.py cho PlickersPython:

1. Copy file này vào thư mục dự án PlickersPython của bạn.
2. Tại file xử lý quét thẻ chính (vd: scanner.py hoặc app.py), import hàm bên dưới:
   `from canvas_sync import sync_to_canvas`
3. Khi quét được một thẻ (ví dụ ID thẻ = 5, đáp án = "B", câu hỏi ID = "q_123", và session = "s_456"):
   `sync_to_canvas(session_id="s_456", question_id="q_123", card_id=5, answer="B")`

Lưu ý: Bạn cần biết `session_id` và `question_id` (có thể lấy qua API lấy danh sách phiên từ CanvasLMS). 
"""

CANVAS_URL = "http://localhost:3000/api/plickers/sessions"

def sync_to_canvas(session_id, question_id, card_id, answer):
    """
    Gửi kết quả của một thẻ Plickers lên CanvasLMS.
    """
    url = f"{CANVAS_URL}/{session_id}/responses"
    payload = {
        "questionId": str(question_id),
        "cardNumber": int(card_id),
        "answer": str(answer).upper()
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=3)
        if response.status_code == 201:
            print(f"[Canvas Sync] ✅ Đồng bộ thẻ #{card_id} -> Chọn '{answer}'")
            return True
        else:
            print(f"[Canvas Sync] ❌ Lỗi từ Server: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[Canvas Sync] ⚠️ Không thể kết nối đến CanvasLMS: {e}")
        return False

# --- Khối thử nghiệm độc lập ---
if __name__ == "__main__":
    print("Testing Canvas API Sync...")
    # Cần thay bằng id thật trong database để test
    test_session = "11111111-1111-1111-1111-111111111111"
    test_question = "22222222-2222-2222-2222-222222222222"
    
    # Gửi thử đáp án thẻ số 5 chọn C
    sync_to_canvas(test_session, test_question, 5, "C")
