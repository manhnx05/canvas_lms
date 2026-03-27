"""
Text Chunker Module
Splits text into chunks while preserving sentence boundaries and LaTeX formulas.
"""

import re
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class Chunk:
    """Represents a text chunk with metadata."""
    content: str
    chunk_index: int
    metadata: Dict[str, any]
    
    def __repr__(self):
        return f"Chunk(index={self.chunk_index}, chars={len(self.content)})"


class TextChunker:
    """
    Text chunker with sentence preservation and LaTeX support.
    Optimized for Vietnamese educational content.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize text chunker.
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Vietnamese sentence endings
        self.sentence_endings = r'[.!?。！？]'
    
    def preserve_latex(self, text: str) -> tuple[str, Dict[int, str]]:
        """
        Extract and preserve LaTeX formulas from text.
        
        Args:
            text: Input text with LaTeX formulas
            
        Returns:
            Tuple of (text with placeholders, dict of placeholders to formulas)
        """
        latex_map = {}
        counter = 0
        
        # Pattern for LaTeX formulas
        patterns = [
            r'\$\$([^\$]+)\$\$',  # $$formula$$
            r'\$([^\$]+)\$',      # $formula$
            r'\\\[([^\]]+)\\\]',  # \[formula\]
            r'\\\(([^\)]+)\\\)',  # \(formula\)
        ]
        
        for pattern in patterns:
            def replace_latex(match):
                nonlocal counter
                placeholder = f"__LATEX_{counter}__"
                latex_map[counter] = match.group(0)
                counter += 1
                return placeholder
            
            text = re.sub(pattern, replace_latex, text)
        
        return text, latex_map
    
    def restore_latex(self, text: str, latex_map: Dict[int, str]) -> str:
        """
        Restore LaTeX formulas from placeholders.
        
        Args:
            text: Text with placeholders
            latex_map: Dictionary mapping placeholder IDs to formulas
            
        Returns:
            Text with restored LaTeX formulas
        """
        for idx, formula in latex_map.items():
            placeholder = f"__LATEX_{idx}__"
            text = text.replace(placeholder, formula)
        
        return text
    
    def preserve_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences while preserving structure.
        
        Args:
            text: Input text
            
        Returns:
            List of sentences
        """
        # Split by sentence endings followed by space or newline
        pattern = f'({self.sentence_endings}+)\\s+'
        sentences = re.split(pattern, text)
        
        # Recombine sentences with their endings
        result = []
        for i in range(0, len(sentences) - 1, 2):
            sentence = sentences[i]
            ending = sentences[i + 1] if i + 1 < len(sentences) else ''
            combined = (sentence + ending).strip()
            if combined:
                result.append(combined)
        
        # Add last sentence if exists
        if len(sentences) % 2 == 1 and sentences[-1].strip():
            result.append(sentences[-1].strip())
        
        return result
    
    def add_metadata(self, chunk: Chunk, metadata: Dict[str, any]) -> Chunk:
        """
        Add metadata to a chunk.
        
        Args:
            chunk: Chunk object
            metadata: Metadata dictionary
            
        Returns:
            Chunk with updated metadata
        """
        chunk.metadata.update(metadata)
        return chunk
    
    def chunk(
        self,
        text: str,
        chunk_size: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> List[Chunk]:
        """
        Split text into chunks with sentence preservation.
        
        Args:
            text: Input text to chunk
            chunk_size: Override default chunk size
            metadata: Optional metadata to add to all chunks
            
        Returns:
            List of Chunk objects
        """
        if chunk_size is None:
            chunk_size = self.chunk_size
        
        # Preserve LaTeX formulas
        text_no_latex, latex_map = self.preserve_latex(text)
        
        # Extract page markers
        page_pattern = r'\n--- Page (\d+) ---\n'
        page_markers = list(re.finditer(page_pattern, text_no_latex))
        
        # Split into sentences
        sentences = self.preserve_sentences(text_no_latex)
        
        # Group sentences into chunks
        chunks = []
        current_chunk = []
        current_size = 0
        chunk_index = 0
        current_page = 1
        
        for sentence in sentences:
            # Check if sentence contains page marker
            page_match = re.search(page_pattern, sentence)
            if page_match:
                current_page = int(page_match.group(1))
                continue
            
            sentence_size = len(sentence)
            
            # If adding this sentence exceeds chunk size and we have content
            if current_size + sentence_size > chunk_size and current_chunk:
                # Create chunk from current sentences
                chunk_text = ' '.join(current_chunk)
                chunk_text = self.restore_latex(chunk_text, latex_map)
                
                chunk_metadata = {
                    'page_number': current_page,
                    'char_count': len(chunk_text),
                }
                if metadata:
                    chunk_metadata.update(metadata)
                
                chunks.append(Chunk(
                    content=chunk_text,
                    chunk_index=chunk_index,
                    metadata=chunk_metadata
                ))
                
                chunk_index += 1
                
                # Start new chunk with overlap
                # Keep last few sentences for context
                overlap_text = ' '.join(current_chunk[-2:]) if len(current_chunk) >= 2 else ''
                overlap_size = len(overlap_text)
                
                if overlap_size > 0 and overlap_size < self.chunk_overlap:
                    current_chunk = current_chunk[-2:]
                    current_size = overlap_size
                else:
                    current_chunk = []
                    current_size = 0
            
            # Add sentence to current chunk
            current_chunk.append(sentence)
            current_size += sentence_size
        
        # Add remaining sentences as final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk_text = self.restore_latex(chunk_text, latex_map)
            
            chunk_metadata = {
                'page_number': current_page,
                'char_count': len(chunk_text),
            }
            if metadata:
                chunk_metadata.update(metadata)
            
            chunks.append(Chunk(
                content=chunk_text,
                chunk_index=chunk_index,
                metadata=chunk_metadata
            ))
        
        return chunks


# Convenience function
def chunk_text(text: str, chunk_size: int = 1000, **metadata) -> List[Chunk]:
    """
    Convenience function to chunk text.
    
    Args:
        text: Input text
        chunk_size: Size of each chunk
        **metadata: Additional metadata as keyword arguments
        
    Returns:
        List of Chunk objects
        
    Example:
        chunks = chunk_text(document.text, chunk_size=1000, subject='Toán', grade='5')
    """
    chunker = TextChunker(chunk_size=chunk_size)
    return chunker.chunk(text, metadata=metadata)
