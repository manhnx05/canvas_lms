"""
Test script to verify PDF parsing
Usage: python scripts/test_pdf.py path/to/file.pdf
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from rag.pdf_parser import parse_pdf
from rag.text_chunker import chunk_text


def test_pdf(pdf_path: str):
    """Test PDF parsing and chunking."""
    print(f"\n{'='*60}")
    print(f"Testing PDF: {pdf_path}")
    print(f"{'='*60}\n")
    
    try:
        # Parse PDF
        print("📄 Parsing PDF...")
        doc = parse_pdf(pdf_path, subject='Test', grade='5')
        
        print(f"✅ Successfully parsed!")
        print(f"   - Filename: {doc.metadata['filename']}")
        print(f"   - Pages: {doc.metadata['page_count']}")
        print(f"   - File size: {doc.metadata['file_size'] / 1024:.2f} KB")
        print(f"   - Text length: {len(doc.text)} characters")
        
        # Show first 500 characters
        print(f"\n📝 First 500 characters:")
        print(f"{'-'*60}")
        print(doc.text[:500])
        print(f"{'-'*60}")
        
        # Test chunking
        print(f"\n✂️  Testing chunking...")
        chunks = chunk_text(doc.text, chunk_size=1000)
        print(f"✅ Created {len(chunks)} chunks")
        
        if chunks:
            print(f"\n📦 First chunk preview:")
            print(f"{'-'*60}")
            print(f"Index: {chunks[0].chunk_index}")
            print(f"Page: {chunks[0].metadata.get('page_number', 'N/A')}")
            print(f"Length: {len(chunks[0].content)} chars")
            print(f"\nContent preview:")
            print(chunks[0].content[:300])
            print(f"{'-'*60}")
        
        print(f"\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_pdf.py path/to/file.pdf")
        print("\nExample:")
        print("  python scripts/test_pdf.py documents/toan/lop5/toan-5-tap-1.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"❌ File not found: {pdf_path}")
        sys.exit(1)
    
    success = test_pdf(pdf_path)
    sys.exit(0 if success else 1)
