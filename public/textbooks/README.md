# Thư Mục Tài Liệu Sách Giáo Khoa (JSON)

Thư mục này chứa các file JSON trích xuất nội dung từ sách giáo khoa để AI sử dụng khi ra đề thi.

## 📚 Cấu Trúc File JSON

Mỗi file JSON đại diện cho một cuốn sách giáo khoa:

```json
{
  "book_metadata": {
    "title": "Tên sách",
    "series": "Bộ sách",
    "grade": 3,
    "subject": "Môn học",
    "total_themes": 6
  },
  "content": [
    {
      "id": "chu_de_1_bai_1",
      "theme": "Chủ đề",
      "lesson_title": "Tiêu đề bài học",
      "keywords": ["từ khóa 1", "từ khóa 2"],
      "content": "Nội dung chi tiết của bài học..."
    }
  ]
}
```

## 📖 Danh Sách File Hiện Có

- `tu-nhien-xa-hoi-3.json` - Tự nhiên và Xã hội lớp 3

## ➕ Thêm File Mới

Để thêm sách mới, tạo file JSON theo format trên với tên file:
- `[mon-hoc]-[lop].json`
- Ví dụ: `toan-5.json`, `tieng-viet-4.json`

## 🎯 Sử Dụng Trong Hệ Thống

File JSON này sẽ được:
1. Load vào hệ thống ra đề thi
2. Gửi cho Gemini AI làm context
3. AI sẽ dựa vào nội dung này để tạo câu hỏi sát với chương trình học

## 💡 Tips

- Nội dung nên ngắn gọn, súc tích
- Keywords giúp AI hiểu trọng tâm bài học
- Mỗi bài học nên có ID duy nhất
