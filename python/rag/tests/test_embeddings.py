"""
Unit tests for Embedding Generator
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch
from rag.embedding_generator import EmbeddingGenerator, generate_embedding


class TestEmbeddingGenerator:
    """Test cases for EmbeddingGenerator class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        # Use a mock API key for testing
        self.api_key = "test_api_key_for_unit_tests"
    
    def test_generator_initialization_with_api_key(self):
        """Test generator initializes with provided API key."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        assert generator.api_key == self.api_key
        assert generator.embedding_dimension == 768
        assert generator.max_retries == 3
    
    def test_generator_initialization_without_api_key(self):
        """Test generator raises error without API key."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="API key not found"):
                EmbeddingGenerator()
    
    def test_validate_embedding_correct_dimension(self):
        """Test validation passes for correct embedding."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.random.randn(768).astype(np.float32)
        assert generator.validate_embedding(embedding) is True
    
    def test_validate_embedding_wrong_dimension(self):
        """Test validation fails for wrong dimension."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.random.randn(512).astype(np.float32)
        assert generator.validate_embedding(embedding) is False
    
    def test_validate_embedding_with_nan(self):
        """Test validation fails for NaN values."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.random.randn(768).astype(np.float32)
        embedding[0] = np.nan
        assert generator.validate_embedding(embedding) is False
    
    def test_validate_embedding_with_inf(self):
        """Test validation fails for Inf values."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.random.randn(768).astype(np.float32)
        embedding[0] = np.inf
        assert generator.validate_embedding(embedding) is False
    
    def test_validate_embedding_zero_magnitude(self):
        """Test validation fails for zero magnitude."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.zeros(768, dtype=np.float32)
        assert generator.validate_embedding(embedding) is False
    
    def test_normalize_embedding(self):
        """Test embedding normalization to unit length."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.array([3.0, 4.0] + [0.0] * 766, dtype=np.float32)
        normalized = generator.normalize(embedding)
        
        # Check magnitude is 1
        magnitude = np.linalg.norm(normalized)
        assert np.isclose(magnitude, 1.0)
    
    def test_normalize_zero_embedding_raises_error(self):
        """Test normalizing zero embedding raises error."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        embedding = np.zeros(768, dtype=np.float32)
        
        with pytest.raises(ValueError, match="Cannot normalize zero-magnitude"):
            generator.normalize(embedding)
    
    def test_generate_empty_text_raises_error(self):
        """Test generating embedding for empty text raises error."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        
        with pytest.raises(ValueError, match="Text cannot be empty"):
            generator.generate("")
    
    def test_generate_query_embedding_empty_raises_error(self):
        """Test generating query embedding for empty text raises error."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        
        with pytest.raises(ValueError, match="Query cannot be empty"):
            generator.generate_query_embedding("")
    
    def test_batch_generate_empty_list(self):
        """Test batch generation with empty list returns empty list."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        result = generator.batch_generate([])
        assert result == []
    
    @patch('google.generativeai.embed_content')
    def test_generate_with_mock(self, mock_embed):
        """Test generate method with mocked API call."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        
        # Mock API response
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.return_value = {'embedding': mock_embedding.tolist()}
        
        result = generator.generate("Test text")
        
        assert isinstance(result, np.ndarray)
        assert result.shape == (768,)
        assert np.isclose(np.linalg.norm(result), 1.0)  # Should be normalized
        mock_embed.assert_called_once()
    
    @patch('google.generativeai.embed_content')
    def test_generate_query_embedding_with_mock(self, mock_embed):
        """Test query embedding generation with mocked API call."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        
        # Mock API response
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.return_value = {'embedding': mock_embedding.tolist()}
        
        result = generator.generate_query_embedding("Test query")
        
        assert isinstance(result, np.ndarray)
        assert result.shape == (768,)
        mock_embed.assert_called_once()
        
        # Check that task_type is retrieval_query
        call_args = mock_embed.call_args
        assert call_args[1]['task_type'] == 'retrieval_query'
    
    @patch('google.generativeai.embed_content')
    def test_batch_generate_with_mock(self, mock_embed):
        """Test batch generation with mocked API calls."""
        generator = EmbeddingGenerator(api_key=self.api_key)
        
        # Mock API response
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.return_value = {'embedding': mock_embedding.tolist()}
        
        texts = ["Text 1", "Text 2", "Text 3"]
        results = generator.batch_generate(texts, show_progress=False)
        
        assert len(results) == 3
        assert all(isinstance(emb, np.ndarray) for emb in results)
        assert all(emb.shape == (768,) for emb in results)
        assert mock_embed.call_count == 3
    
    @patch('google.generativeai.embed_content')
    def test_generate_with_retry_on_failure(self, mock_embed):
        """Test retry logic on API failure."""
        generator = EmbeddingGenerator(api_key=self.api_key, max_retries=3, retry_delay=0.1)
        
        # Mock API to fail twice then succeed
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.side_effect = [
            Exception("API Error 1"),
            Exception("API Error 2"),
            {'embedding': mock_embedding.tolist()}
        ]
        
        result = generator.generate("Test text")
        
        assert isinstance(result, np.ndarray)
        assert mock_embed.call_count == 3
    
    @patch('google.generativeai.embed_content')
    def test_generate_fails_after_max_retries(self, mock_embed):
        """Test generation fails after max retries."""
        generator = EmbeddingGenerator(api_key=self.api_key, max_retries=2, retry_delay=0.1)
        
        # Mock API to always fail
        mock_embed.side_effect = Exception("API Error")
        
        with pytest.raises(RuntimeError, match="Failed to generate embedding"):
            generator.generate("Test text")
        
        assert mock_embed.call_count == 2


class TestEmbeddingIdempotence:
    """Test idempotence property of embedding generation."""
    
    @patch('google.generativeai.embed_content')
    def test_generate_twice_produces_similar_embeddings(self, mock_embed):
        """Test generating embeddings twice produces similar results."""
        generator = EmbeddingGenerator(api_key="test_key")
        
        # Mock to return same embedding
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.return_value = {'embedding': mock_embedding.tolist()}
        
        text = "Test text for idempotence"
        emb1 = generator.generate(text)
        emb2 = generator.generate(text)
        
        # Calculate cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        
        # Should be very similar (> 0.99)
        assert similarity > 0.99


class TestConvenienceFunctions:
    """Test convenience functions."""
    
    @patch('google.generativeai.embed_content')
    def test_generate_embedding_function(self, mock_embed):
        """Test convenience function for single embedding."""
        mock_embedding = np.random.randn(768).astype(np.float32)
        mock_embed.return_value = {'embedding': mock_embedding.tolist()}
        
        result = generate_embedding("Test text", api_key="test_key")
        
        assert isinstance(result, np.ndarray)
        assert result.shape == (768,)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
