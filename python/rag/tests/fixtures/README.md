# Test Fixtures

This directory contains sample PDF files for testing the RAG system.

## Required Test Files

To run all tests, place the following files in this directory:

1. **sample.pdf** - A simple PDF file with English text (for basic parsing tests)
2. **vietnamese.pdf** - A PDF file with Vietnamese content (for language support tests)
3. **math.pdf** - A PDF file with mathematical formulas and LaTeX (for formula preservation tests)

## Creating Test Files

You can create simple test PDFs using:
- Microsoft Word → Save as PDF
- Google Docs → Download as PDF
- Online PDF generators

### Sample Content Suggestions

**sample.pdf:**
```
This is a sample document for testing.
It contains multiple sentences.
Each sentence should be preserved during chunking.
```

**vietnamese.pdf:**
```
Đây là tài liệu tiếng Việt để kiểm tra.
Hệ thống cần hỗ trợ các ký tự đặc biệt.
Ví dụ: à, á, ả, ã, ạ, ă, ằ, ắ, ẳ, ẵ, ặ.
```

**math.pdf:**
```
Công thức toán học:
Phương trình bậc hai: $ax^2 + bx + c = 0$
Định lý Pythagore: $a^2 + b^2 = c^2$
```

## Note

Test files are not included in the repository to keep it lightweight.
Tests will be skipped if fixture files are not present.
