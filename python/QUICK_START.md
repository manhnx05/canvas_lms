# 🚀 Quick Start - Upload và Test PDF

## Bước 1: Upload File PDF

### Đặt file PDF vào thư mục:

```
python/documents/
├── toan/
│   ├── lop1/ ← Đặt sách Toán lớp 1 vào đây
│   ├── lop2/
│   ├── lop3/
│   ├── lop4/
│   └── lop5/ ← Đặt sách Toán lớp 5 vào đây
├── tieng-viet/
│   └── lop5/ ← Đặt sách Tiếng Việt lớp 5 vào đây
└── tu-nhien-xa-hoi/
    └── lop5/ ← Đặt sách Tự nhiên xã hội lớp 5 vào đây
```

### Ví dụ:
```
python/documents/toan/lop5/toan-5-tap-1.pdf
python/documents/tieng-viet/lop3/tieng-viet-3.pdf
```

## Bước 2: Cài Đặt Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

Hoặc dùng virtual environment (khuyến nghị):

```bash
cd python
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Bước 3: Test File PDF

### Test parsing PDF:

```bash
cd python
python scripts/test_pdf.py documents/toan/lop5/toan-5-tap-1.pdf
```

### Kết quả mong đợi:

```
============================================================
Testing PDF: documents/toan/lop5/toan-5-tap-1.pdf
============================================================

📄 Parsing PDF...
✅ Successfully parsed!
   - Filename: toan-5-tap-1.pdf
   - Pages: 120
   - File size: 15234.56 KB
   - Text length: 245678 characters

📝 First 500 characters:
------------------------------------------------------------
[Nội dung 500 ký tự đầu tiên của sách]
------------------------------------------------------------

✂️  Testing chunking...
✅ Created 246 chunks

📦 First chunk preview:
------------------------------------------------------------
Index: 0
Page: 1
Length: 987 chars

Content preview:
[Nội dung chunk đầu tiên]
------------------------------------------------------------

✅ All tests passed!
```

## Bước 4: Test Trong Python Interactive

```bash
cd python
python
```

```python
from rag.pdf_parser import parse_pdf
from rag.text_chunker import chunk_text

# Parse PDF
doc = parse_pdf(
    'documents/toan/lop5/toan-5-tap-1.pdf',
    subject='Toán học',
    grade='5'
)

print(f"Pages: {doc.page_count}")
print(f"Text length: {len(doc.text)}")

# Chunk text
chunks = chunk_text(doc.text, chunk_size=1000)
print(f"Total chunks: {len(chunks)}")

# View first chunk
print(chunks[0].content[:200])
```

## ⚠️ Troubleshooting

### Lỗi: "File not found"
- Kiểm tra đường dẫn file có đúng không
- Đảm bảo file PDF đã được upload vào thư mục

### Lỗi: "Extracted text too short"
- File PDF có thể là ảnh scan (không có text)
- Thử mở file bằng PDF reader để kiểm tra
- Cần convert PDF ảnh sang PDF text trước

### Lỗi: "Invalid PDF file"
- File có thể bị hỏng
- Thử mở file bằng Adobe Reader
- Download lại file PDF

### Lỗi: Vietnamese characters không hiển thị đúng
- Kiểm tra terminal hỗ trợ UTF-8
- Thử: `chcp 65001` (Windows CMD)
- Hoặc dùng PowerShell/Git Bash

## 📋 Checklist

- [ ] Upload file PDF vào thư mục `python/documents/`
- [ ] Cài đặt dependencies: `pip install -r requirements.txt`
- [ ] Test parsing: `python scripts/test_pdf.py path/to/file.pdf`
- [ ] Verify text được trích xuất đúng
- [ ] Verify tiếng Việt hiển thị đúng
- [ ] Verify công thức toán (nếu có) được preserve

## 🎯 Next Steps

Sau khi test thành công Phase 1:
1. ✅ Phase 1: Python Processing (Hoàn thành)
2. ⏳ Phase 2: Vector Database Integration (Pinecone)
3. ⏳ Phase 3: Database Schema Updates
4. ⏳ Phase 4: FastAPI Microservice
5. ⏳ Phase 5: Next.js Integration
6. ⏳ Phase 6: Frontend Updates
7. ⏳ Phase 7: Testing & Documentation

---

**Bắt đầu upload file PDF và test ngay!** 🚀
