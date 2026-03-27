# Thư Mục Tài Liệu Sách Giáo Khoa

Đây là thư mục để lưu trữ các file PDF sách giáo khoa cho hệ thống RAG.

## 📚 Cấu Trúc Thư Mục Đề Xuất

Tổ chức file theo môn học và khối lớp:

```
python/documents/
├── toan/
│   ├── lop1/
│   │   ├── toan-1-tap-1.pdf
│   │   └── toan-1-tap-2.pdf
│   ├── lop2/
│   ├── lop3/
│   ├── lop4/
│   └── lop5/
├── tieng-viet/
│   ├── lop1/
│   ├── lop2/
│   ├── lop3/
│   ├── lop4/
│   └── lop5/
└── tu-nhien-xa-hoi/
    ├── lop1/
    ├── lop2/
    ├── lop3/
    ├── lop4/
    └── lop5/
```

## 📖 Hướng Dẫn Upload File

### 1. Tải File PDF Vào Thư Mục

Bạn có thể upload file PDF theo 2 cách:

**Cách 1: Tổ chức theo môn học (Khuyến nghị)**
```
python/documents/toan/lop5/toan-5-tap-1.pdf
python/documents/tieng-viet/lop3/tieng-viet-3.pdf
```

**Cách 2: Đặt trực tiếp trong thư mục documents**
```
python/documents/toan-5-tap-1.pdf
python/documents/tieng-viet-3.pdf
```

### 2. Quy Tắc Đặt Tên File

Đặt tên file rõ ràng, dễ hiểu:
- ✅ `toan-5-tap-1.pdf`
- ✅ `tieng-viet-lop-3.pdf`
- ✅ `tu-nhien-xa-hoi-4.pdf`
- ❌ `sgk.pdf`
- ❌ `file1.pdf`

### 3. Yêu Cầu File PDF

- **Định dạng:** PDF (không phải ảnh scan)
- **Kích thước:** Tối đa 50MB mỗi file
- **Nội dung:** Phải có text có thể trích xuất (không phải PDF ảnh)
- **Ngôn ngữ:** Hỗ trợ tiếng Việt đầy đủ
- **Công thức toán:** Hỗ trợ LaTeX và ký hiệu toán học

### 4. Kiểm Tra File PDF

Sau khi upload, bạn có thể test file PDF:

```bash
cd python
python -c "from rag.pdf_parser import parse_pdf; doc = parse_pdf('documents/toan/lop5/toan-5-tap-1.pdf', subject='Toán', grade='5'); print(f'Pages: {doc.page_count}, Chars: {len(doc.text)}')"
```

## 📝 Metadata Đề Xuất

Khi xử lý file, nên thêm metadata:

```python
from rag.pdf_parser import parse_pdf

doc = parse_pdf(
    'documents/toan/lop5/toan-5-tap-1.pdf',
    subject='Toán học',      # Môn học
    grade='5',               # Khối lớp
    semester='1',            # Học kỳ (tùy chọn)
    publisher='NXB Giáo dục', # Nhà xuất bản (tùy chọn)
    year='2024'              # Năm xuất bản (tùy chọn)
)
```

## 🔍 Môn Học Hỗ Trợ

Hệ thống hỗ trợ các môn học sau:

1. **Toán học** (`toan`)
2. **Tiếng Việt** (`tieng-viet`)
3. **Tự nhiên và Xã hội** (`tu-nhien-xa-hoi`)
4. **Khoa học** (`khoa-hoc`)
5. **Lịch sử** (`lich-su`)
6. **Địa lý** (`dia-ly`)
7. **Đạo đức** (`dao-duc`)

## 🚀 Xử Lý File Sau Khi Upload

Sau khi upload file PDF, hệ thống sẽ:

1. **Parse PDF** → Trích xuất text
2. **Chunking** → Chia thành các đoạn nhỏ (chunks)
3. **Embedding** → Tạo vector embeddings
4. **Vector DB** → Lưu vào Pinecone
5. **PostgreSQL** → Lưu metadata

## ⚠️ Lưu Ý

- File PDF trong thư mục này **KHÔNG** được commit lên Git (đã thêm vào .gitignore)
- Chỉ lưu trữ local hoặc trên server
- Backup file PDF quan trọng ở nơi khác
- Kiểm tra bản quyền trước khi sử dụng

## 📞 Hỗ Trợ

Nếu gặp vấn đề với file PDF:
- Kiểm tra file có phải PDF text (không phải ảnh scan)
- Thử mở file bằng PDF reader để verify
- Kiểm tra encoding tiếng Việt
- Xem log lỗi chi tiết khi parse

## 🎯 Ví Dụ Cấu Trúc Hoàn Chỉnh

```
python/documents/
├── README.md (file này)
├── toan/
│   ├── lop1/
│   │   ├── toan-1-tap-1.pdf (15MB)
│   │   └── toan-1-tap-2.pdf (14MB)
│   ├── lop2/
│   │   ├── toan-2-tap-1.pdf
│   │   └── toan-2-tap-2.pdf
│   ├── lop3/
│   │   └── toan-3.pdf
│   ├── lop4/
│   │   └── toan-4.pdf
│   └── lop5/
│       ├── toan-5-tap-1.pdf ← Upload file vào đây
│       └── toan-5-tap-2.pdf
├── tieng-viet/
│   └── lop5/
│       └── tieng-viet-5.pdf
└── tu-nhien-xa-hoi/
    └── lop5/
        └── tnxh-5.pdf
```

---

**Bắt đầu upload file PDF của bạn vào thư mục này!** 📚
