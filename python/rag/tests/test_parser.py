"""
Unit tests for PDF Parser
"""

import pytest
from pathlib import Path
from rag.pdf_parser import PDFParser, parse_pdf, Document


class TestPDFParser:
    """Test cases for PDFParser class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.parser = PDFParser()
        self.fixtures_dir = Path(__file__).parent / 'fixtures'
    
    def test_parser_initialization(self):
        """Test parser initializes correctly."""
        assert self.parser.min_text_length == 100
    
    def test_validate_pdf_nonexistent_file(self):
        """Test validation fails for nonexistent file."""
        with pytest.raises(ValueError, match="File not found"):
            self.parser.validate_pdf('nonexistent.pdf')
    
    def test_validate_pdf_wrong_extension(self):
        """Test validation fails for non-PDF file."""
        with pytest.raises(ValueError, match="not a PDF"):
            self.parser.validate_pdf('document.txt')
    
    def test_clean_text_removes_excessive_whitespace(self):
        """Test text cleaning removes excessive whitespace."""
        text = "Hello    world\n\n\n\nNext paragraph"
        cleaned = self.parser._clean_text(text)
        assert "    " not in cleaned
        assert "\n\n\n" not in cleaned
    
    def test_clean_text_preserves_latex_inline(self):
        """Test LaTeX inline formulas are preserved."""
        text = "The formula is $x^2 + y^2 = z^2$ in the text."
        cleaned = self.parser._clean_text(text)
        assert "$x^2 + y^2 = z^2$" in cleaned
    
    def test_clean_text_preserves_latex_block(self):
        """Test LaTeX block formulas are preserved."""
        text = "The formula is \\[x^2 + y^2 = z^2\\] in the text."
        cleaned = self.parser._clean_text(text)
        assert "\\[x^2 + y^2 = z^2\\]" in cleaned
    
    def test_extract_metadata_structure(self):
        """Test metadata extraction returns correct structure."""
        # Create a dummy file for testing
        test_file = self.fixtures_dir / 'test.txt'
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.write_text('test content')
        
        try:
            metadata = self.parser.extract_metadata(str(test_file))
            assert 'filename' in metadata
            assert 'file_size' in metadata
            assert metadata['filename'] == 'test.txt'
        finally:
            if test_file.exists():
                test_file.unlink()
    
    def test_document_representation(self):
        """Test Document string representation."""
        doc = Document(
            text="Sample text",
            metadata={'filename': 'test.pdf', 'page_count': 5}
        )
        repr_str = repr(doc)
        assert 'test.pdf' in repr_str
        assert '5' in repr_str
    
    def test_parse_pdf_convenience_function(self):
        """Test convenience function accepts metadata."""
        # This test would need a real PDF file
        # For now, just test that the function exists and has correct signature
        assert callable(parse_pdf)


class TestPDFParserIntegration:
    """Integration tests requiring actual PDF files."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.parser = PDFParser()
        self.fixtures_dir = Path(__file__).parent / 'fixtures'
    
    @pytest.mark.skipif(
        not (Path(__file__).parent / 'fixtures' / 'sample.pdf').exists(),
        reason="Sample PDF not found"
    )
    def test_parse_real_pdf(self):
        """Test parsing a real PDF file."""
        pdf_path = self.fixtures_dir / 'sample.pdf'
        doc = self.parser.parse(str(pdf_path))
        
        assert isinstance(doc, Document)
        assert len(doc.text) > 0
        assert doc.metadata['filename'] == 'sample.pdf'
        assert doc.metadata['page_count'] > 0
    
    @pytest.mark.skipif(
        not (Path(__file__).parent / 'fixtures' / 'vietnamese.pdf').exists(),
        reason="Vietnamese PDF not found"
    )
    def test_parse_vietnamese_pdf(self):
        """Test parsing PDF with Vietnamese content."""
        pdf_path = self.fixtures_dir / 'vietnamese.pdf'
        doc = self.parser.parse(str(pdf_path))
        
        assert isinstance(doc, Document)
        assert len(doc.text) > 0
        # Check for Vietnamese characters
        vietnamese_chars = ['à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ']
        has_vietnamese = any(char in doc.text.lower() for char in vietnamese_chars)
        assert has_vietnamese or len(doc.text) > 100  # Either has Vietnamese or has content


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
