"""
RAG (Retrieval-Augmented Generation) Processing System
Canvas LMS - AI-Powered Exam Generation

This package provides document processing capabilities for the RAG system:
- PDF parsing with Vietnamese language support
- Text chunking with sentence preservation
- Embedding generation using Google text-embedding-004
- Vector database integration with Pinecone
"""

__version__ = "1.0.0"
__author__ = "Canvas LMS Team"

from .pdf_parser import PDFParser
from .text_chunker import TextChunker
from .embedding_generator import EmbeddingGenerator
from .vector_db_client import VectorDBClient

__all__ = [
    "PDFParser",
    "TextChunker",
    "EmbeddingGenerator",
    "VectorDBClient",
]
