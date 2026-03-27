# RAG Processing System

Python-based document processing system for Canvas LMS RAG (Retrieval-Augmented Generation) features.

## Features

- PDF document parsing with Vietnamese language support
- Intelligent text chunking with sentence preservation
- LaTeX formula preservation for mathematical content
- Vector embeddings generation using Google text-embedding-004
- Pinecone vector database integration
- Batch processing support

## Setup

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

Or using virtual environment (recommended):

```bash
cd python
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `GOOGLE_API_KEY`: Get from https://aistudio.google.com/
- `PINECONE_API_KEY`: Get from https://www.pinecone.io/
- `PINECONE_ENVIRONMENT`: Your Pinecone environment (e.g., us-west1-gcp)
- `PINECONE_INDEX_NAME`: Name of your Pinecone index

### 3. Create Pinecone Index

```python
import pinecone

pinecone.init(api_key="your_api_key", environment="us-west1-gcp")

# Create index with 768 dimensions (for text-embedding-004)
pinecone.create_index(
    name="canvas-lms-rag",
    dimension=768,
    metric="cosine"
)
```

## Usage

### Process a Document

```bash
python -m rag.process_document --file path/to/textbook.pdf --subject "Toán" --grade "5"
```

### Run Tests

```bash
pytest rag/tests/
```

## Project Structure

```
python/
├── rag/
│   ├── __init__.py
│   ├── pdf_parser.py          # PDF parsing
│   ├── text_chunker.py        # Text chunking
│   ├── embedding_generator.py # Embedding generation
│   ├── vector_db_client.py    # Pinecone client
│   ├── process_document.py    # Main pipeline
│   └── tests/
│       ├── test_parser.py
│       ├── test_chunker.py
│       ├── test_embeddings.py
│       └── fixtures/
│           └── sample.pdf
├── api/                        # FastAPI service (Phase 4)
├── requirements.txt
├── .env.example
└── README.md
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest rag/tests/test_parser.py

# Run with coverage
pytest --cov=rag
```

### Code Style

This project follows PEP 8 style guidelines. Format code with:

```bash
pip install black
black rag/
```

## Troubleshooting

### PDF Parsing Issues

If you encounter issues with PDF parsing:
- Ensure the PDF is not password-protected
- Check if the PDF contains extractable text (not scanned images)
- Try using a different PDF library if PyPDF2 fails

### Vietnamese Text Issues

If Vietnamese characters are not displaying correctly:
- Ensure your terminal supports UTF-8 encoding
- Check that the PDF contains proper Unicode text

### Pinecone Connection Issues

If you can't connect to Pinecone:
- Verify your API key is correct
- Check your environment name matches your Pinecone dashboard
- Ensure your index exists and has the correct dimensions (768)

## Next Steps

After Phase 1 completion:
- Phase 2: Vector database integration
- Phase 3: Database schema updates
- Phase 4: FastAPI microservice
- Phase 5: Next.js integration

## Support

For issues or questions, please refer to the main project documentation.
