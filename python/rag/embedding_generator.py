"""
Embedding Generator Module
Generates vector embeddings using Google text-embedding-004 model.
"""

import os
import time
from typing import List, Optional
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class EmbeddingGenerator:
    """
    Generate embeddings using Google's text-embedding-004 model.
    Supports Vietnamese language and batch processing.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "models/text-embedding-004",
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Initialize embedding generator.
        
        Args:
            api_key: Google API key (defaults to GOOGLE_API_KEY env var)
            model_name: Name of the embedding model
            max_retries: Maximum number of retries on failure
            retry_delay: Delay between retries in seconds
        """
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError(
                "Google API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY "
                "environment variable or pass api_key parameter."
            )
        
        self.model_name = model_name
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.embedding_dimension = 768  # text-embedding-004 dimension
        
        # Configure Google AI
        genai.configure(api_key=self.api_key)
    
    def validate_embedding(self, embedding: np.ndarray) -> bool:
        """
        Validate that an embedding is valid.
        
        Args:
            embedding: Embedding vector to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Check if embedding is numpy array
        if not isinstance(embedding, np.ndarray):
            return False
        
        # Check dimension
        if embedding.shape[0] != self.embedding_dimension:
            return False
        
        # Check for NaN or Inf values
        if not np.isfinite(embedding).all():
            return False
        
        # Check for zero magnitude
        magnitude = np.linalg.norm(embedding)
        if magnitude == 0:
            return False
        
        return True
    
    def normalize(self, embedding: np.ndarray) -> np.ndarray:
        """
        Normalize embedding to unit length.
        
        Args:
            embedding: Embedding vector
            
        Returns:
            Normalized embedding
        """
        magnitude = np.linalg.norm(embedding)
        if magnitude == 0:
            raise ValueError("Cannot normalize zero-magnitude embedding")
        
        return embedding / magnitude
    
    def generate(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector as numpy array
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        for attempt in range(self.max_retries):
            try:
                # Generate embedding using Google AI
                result = genai.embed_content(
                    model=self.model_name,
                    content=text,
                    task_type="retrieval_document"
                )
                
                # Convert to numpy array
                embedding = np.array(result['embedding'], dtype=np.float32)
                
                # Validate embedding
                if not self.validate_embedding(embedding):
                    raise ValueError("Generated embedding is invalid")
                
                # Normalize to unit length
                embedding = self.normalize(embedding)
                
                return embedding
                
            except Exception as e:
                if attempt < self.max_retries - 1:
                    print(f"Attempt {attempt + 1} failed: {str(e)}. Retrying...")
                    time.sleep(self.retry_delay * (attempt + 1))  # Exponential backoff
                else:
                    raise RuntimeError(f"Failed to generate embedding after {self.max_retries} attempts: {str(e)}")
    
    def batch_generate(
        self,
        texts: List[str],
        batch_size: int = 100,
        show_progress: bool = True
    ) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts in batches.
        
        Args:
            texts: List of input texts
            batch_size: Number of texts to process in each batch
            show_progress: Whether to show progress messages
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        embeddings = []
        total_batches = (len(texts) + batch_size - 1) // batch_size
        
        for batch_idx in range(0, len(texts), batch_size):
            batch_texts = texts[batch_idx:batch_idx + batch_size]
            batch_num = batch_idx // batch_size + 1
            
            if show_progress:
                print(f"Processing batch {batch_num}/{total_batches} ({len(batch_texts)} texts)...")
            
            batch_embeddings = []
            for text in batch_texts:
                try:
                    embedding = self.generate(text)
                    batch_embeddings.append(embedding)
                except Exception as e:
                    print(f"Warning: Failed to generate embedding for text: {str(e)}")
                    # Add zero embedding as placeholder
                    batch_embeddings.append(np.zeros(self.embedding_dimension, dtype=np.float32))
            
            embeddings.extend(batch_embeddings)
            
            # Small delay between batches to avoid rate limiting
            if batch_idx + batch_size < len(texts):
                time.sleep(0.5)
        
        if show_progress:
            print(f"Generated {len(embeddings)} embeddings successfully.")
        
        return embeddings
    
    def generate_query_embedding(self, query: str) -> np.ndarray:
        """
        Generate embedding for a query (search) text.
        Uses different task type for optimal retrieval.
        
        Args:
            query: Query text
            
        Returns:
            Query embedding vector
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")
        
        for attempt in range(self.max_retries):
            try:
                # Generate embedding with query task type
                result = genai.embed_content(
                    model=self.model_name,
                    content=query,
                    task_type="retrieval_query"
                )
                
                # Convert to numpy array
                embedding = np.array(result['embedding'], dtype=np.float32)
                
                # Validate and normalize
                if not self.validate_embedding(embedding):
                    raise ValueError("Generated query embedding is invalid")
                
                embedding = self.normalize(embedding)
                
                return embedding
                
            except Exception as e:
                if attempt < self.max_retries - 1:
                    print(f"Attempt {attempt + 1} failed: {str(e)}. Retrying...")
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    raise RuntimeError(f"Failed to generate query embedding: {str(e)}")


# Convenience functions
def generate_embedding(text: str, api_key: Optional[str] = None) -> np.ndarray:
    """
    Convenience function to generate a single embedding.
    
    Args:
        text: Input text
        api_key: Optional Google API key
        
    Returns:
        Embedding vector
        
    Example:
        embedding = generate_embedding("Toán học lớp 5")
    """
    generator = EmbeddingGenerator(api_key=api_key)
    return generator.generate(text)


def generate_embeddings(texts: List[str], api_key: Optional[str] = None) -> List[np.ndarray]:
    """
    Convenience function to generate multiple embeddings.
    
    Args:
        texts: List of input texts
        api_key: Optional Google API key
        
    Returns:
        List of embedding vectors
        
    Example:
        embeddings = generate_embeddings(["Text 1", "Text 2", "Text 3"])
    """
    generator = EmbeddingGenerator(api_key=api_key)
    return generator.batch_generate(texts)
