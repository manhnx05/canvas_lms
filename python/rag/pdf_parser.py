"""
PDF Parser Module
Extracts text content from PDF files with Vietnamese language support.
"""

import re
from typing import Dict, Optional
from pathlib import Path
import PyPDF2


class Document:
    """Represents a parsed document with metadata."""
    
    def __init__(self, text: str, metadata: Dict[str, any]):
        self.text = text
        self.metadata = metadata
        self.page_count = metadata.get('page_count', 0)
        self.filename = metadata.get('filename', '')
    
    def __repr__(self):
        return f"Document(filename='{self.filename}', pages={self.page_count}, chars={len(self.text)})"


class PDFParser:
    """
    PDF parser with Vietnamese language support and LaTeX preservation.
    """
    
    def __init__(self):
        self.min_text_length = 100  # Minimum characters to consider valid
    
    def validate_pdf(self, pdf_path: str) -> bool:
        """
        Validate if the file is a valid PDF.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            True if valid PDF, False otherwise
        """
        try:
            path = Path(pdf_path)
            
            # Check if file exists
            if not path.exists():
                raise FileNotFoundError(f"File not found: {pdf_path}")
            
            # Check file extension
            if path.suffix.lower() != '.pdf':
                raise ValueError(f"File is not a PDF: {pdf_path}")
            
            # Check file size (max 50MB)
            file_size_mb = path.stat().st_size / (1024 * 1024)
            if file_size_mb > 50:
                raise ValueError(f"File too large: {file_size_mb:.2f}MB (max 50MB)")
            
            # Try to open with PyPDF2
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                _ = len(reader.pages)  # Try to get page count
            
            return True
            
        except Exception as e:
            raise ValueError(f"Invalid PDF file: {str(e)}")
    
    def extract_metadata(self, pdf_path: str) -> Dict[str, any]:
        """
        Extract metadata from PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing metadata
        """
        path = Path(pdf_path)
        metadata = {
            'filename': path.name,
            'file_size': path.stat().st_size,
        }
        
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                metadata['page_count'] = len(reader.pages)
                
                # Extract PDF metadata if available
                if reader.metadata:
                    pdf_meta = reader.metadata
                    metadata['title'] = pdf_meta.get('/Title', '')
                    metadata['author'] = pdf_meta.get('/Author', '')
                    metadata['subject'] = pdf_meta.get('/Subject', '')
                    metadata['creator'] = pdf_meta.get('/Creator', '')
        
        except Exception as e:
            print(f"Warning: Could not extract metadata: {str(e)}")
        
        return metadata
    
    def extract_text(self, pdf_path: str) -> str:
        """
        Extract text content from PDF file.
        Handles Vietnamese characters and preserves LaTeX formulas.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text_parts = []
                
                for page_num, page in enumerate(reader.pages, 1):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            # Add page marker for reference
                            text_parts.append(f"\n--- Page {page_num} ---\n")
                            text_parts.append(page_text)
                    except Exception as e:
                        print(f"Warning: Could not extract text from page {page_num}: {str(e)}")
                        continue
                
                full_text = ''.join(text_parts)
                
                # Clean up text while preserving LaTeX
                full_text = self._clean_text(full_text)
                
                # Validate minimum length
                if len(full_text) < self.min_text_length:
                    raise ValueError(
                        f"Extracted text too short ({len(full_text)} chars). "
                        f"PDF may be scanned images or empty."
                    )
                
                return full_text
                
        except Exception as e:
            raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text while preserving important content.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Preserve LaTeX formulas (between $ or \[ \])
        latex_patterns = [
            (r'\$([^\$]+)\$', r'LATEX_INLINE_\1_LATEX'),  # $formula$
            (r'\\\[([^\]]+)\\\]', r'LATEX_BLOCK_\1_LATEX'),  # \[formula\]
        ]
        
        # Temporarily replace LaTeX to protect it
        for pattern, replacement in latex_patterns:
            text = re.sub(pattern, replacement, text)
        
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Max 2 newlines
        text = re.sub(r' +', ' ', text)  # Multiple spaces to single
        
        # Restore LaTeX formulas
        text = text.replace('LATEX_INLINE_', '$')
        text = text.replace('_LATEX', '$')
        text = text.replace('LATEX_BLOCK_', '\\[')
        
        return text.strip()
    
    def parse(self, pdf_path: str, additional_metadata: Optional[Dict] = None) -> Document:
        """
        Parse PDF file and return Document object.
        
        Args:
            pdf_path: Path to the PDF file
            additional_metadata: Optional additional metadata to include
            
        Returns:
            Document object with text and metadata
        """
        # Validate PDF
        self.validate_pdf(pdf_path)
        
        # Extract metadata
        metadata = self.extract_metadata(pdf_path)
        
        # Add additional metadata if provided
        if additional_metadata:
            metadata.update(additional_metadata)
        
        # Extract text
        text = self.extract_text(pdf_path)
        
        # Create and return Document
        return Document(text=text, metadata=metadata)


# Convenience function
def parse_pdf(pdf_path: str, **metadata) -> Document:
    """
    Convenience function to parse a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        **metadata: Additional metadata as keyword arguments
        
    Returns:
        Document object
        
    Example:
        doc = parse_pdf('textbook.pdf', subject='Toán', grade='5')
    """
    parser = PDFParser()
    return parser.parse(pdf_path, additional_metadata=metadata)
