# Requirements Document

## Introduction

This document specifies the requirements for enhancing the existing exam generation system with Retrieval-Augmented Generation (RAG) capabilities. The system will process textbook documents, create embeddings, store them in a vector database, and use retrieved context to generate more accurate and curriculum-aligned exam questions using Google Gemini AI.

## Glossary

- **RAG_System**: The Retrieval-Augmented Generation system that combines document retrieval with AI generation
- **Document_Processor**: Python-based component that processes PDF textbooks into chunks
- **Embedding_Generator**: Component that creates vector embeddings from text chunks
- **Vector_Database**: Database that stores and retrieves document embeddings
- **Query_Interface**: Next.js API that queries the vector database
- **Exam_Generator**: Existing Next.js component that generates exam questions
- **Gemini_AI**: Google's generative AI model (gemini-1.5-flash)
- **Chunk**: A segment of text extracted from a document (typically 500-1000 tokens)
- **Embedding**: A numerical vector representation of text content
- **Top-K_Retrieval**: Process of retrieving the K most relevant chunks for a query
- **Context_Window**: The combined text from retrieved chunks sent to Gemini AI

## Requirements

### Requirement 1: Document Upload and Storage

**User Story:** As a teacher, I want to upload textbook PDF files directly into the source code, so that the system can use them as reference material for exam generation.

#### Acceptance Criteria

1. THE Document_Processor SHALL accept PDF files as input
2. THE Document_Processor SHALL store uploaded PDF files in a designated source code directory
3. WHEN a PDF file exceeds 50MB, THE Document_Processor SHALL return an error message
4. THE Document_Processor SHALL support Vietnamese language content in PDF files
5. THE Document_Processor SHALL maintain a registry of uploaded documents with metadata (filename, upload date, subject, grade level)

### Requirement 2: Document Processing and Chunking

**User Story:** As a teacher, I want the system to automatically process uploaded textbooks, so that content can be efficiently retrieved for exam generation.

#### Acceptance Criteria

1. THE Document_Processor SHALL extract text content from PDF files
2. THE Document_Processor SHALL split extracted text into chunks of 500-1000 tokens
3. WHEN chunking text, THE Document_Processor SHALL preserve sentence boundaries
4. THE Document_Processor SHALL preserve mathematical formulas and LaTeX notation during chunking
5. THE Document_Processor SHALL add metadata to each chunk (source document, page number, subject, grade level)
6. WHEN text extraction fails, THE Document_Processor SHALL log the error and notify the user

### Requirement 3: Embedding Generation

**User Story:** As a system administrator, I want document chunks to be converted into embeddings, so that semantic search can be performed efficiently.

#### Acceptance Criteria

1. THE Embedding_Generator SHALL create vector embeddings for each text chunk
2. THE Embedding_Generator SHALL use a consistent embedding model for all chunks
3. THE Embedding_Generator SHALL support Vietnamese language embeddings
4. WHEN embedding generation fails for a chunk, THE Embedding_Generator SHALL retry up to 3 times
5. THE Embedding_Generator SHALL store embeddings with their associated chunk metadata

### Requirement 4: Vector Database Integration

**User Story:** As a system administrator, I want embeddings stored in a vector database, so that relevant content can be quickly retrieved during exam generation.

#### Acceptance Criteria

1. THE Vector_Database SHALL store embeddings with their associated metadata
2. THE Vector_Database SHALL support similarity search operations
3. THE Vector_Database SHALL return results within 500ms for queries
4. THE Vector_Database SHALL support filtering by metadata (subject, grade level)
5. WHEN the database connection fails, THE RAG_System SHALL return a descriptive error message

### Requirement 5: Query Interface from Next.js

**User Story:** As a developer, I want a Next.js API route to query the vector database, so that the frontend can retrieve relevant document chunks.

#### Acceptance Criteria

1. THE Query_Interface SHALL accept query text and metadata filters as input
2. THE Query_Interface SHALL authenticate requests using JWT tokens
3. WHEN a query is received, THE Query_Interface SHALL generate an embedding for the query text
4. THE Query_Interface SHALL search the Vector_Database using the query embedding
5. THE Query_Interface SHALL return results in JSON format with chunk text and metadata
6. WHEN authentication fails, THE Query_Interface SHALL return HTTP 401 status

### Requirement 6: Top-K Retrieval Mechanism

**User Story:** As a teacher, I want the system to retrieve the most relevant textbook content, so that generated exam questions are aligned with the curriculum.

#### Acceptance Criteria

1. THE RAG_System SHALL retrieve the top K most similar chunks for a given query
2. THE RAG_System SHALL allow K to be configurable (default K=5, maximum K=20)
3. THE RAG_System SHALL rank retrieved chunks by similarity score
4. THE RAG_System SHALL filter chunks by subject and grade level before retrieval
5. WHEN no relevant chunks are found (similarity < 0.5), THE RAG_System SHALL generate questions without RAG context

### Requirement 7: Context Injection into Gemini Prompts

**User Story:** As a teacher, I want retrieved textbook content to be included in AI prompts, so that generated exam questions are based on actual curriculum material.

#### Acceptance Criteria

1. THE Exam_Generator SHALL combine retrieved chunks into a Context_Window
2. THE Exam_Generator SHALL inject the Context_Window into the Gemini_AI prompt
3. THE Exam_Generator SHALL format the prompt to instruct Gemini_AI to use the provided context
4. WHEN the Context_Window exceeds 30,000 tokens, THE Exam_Generator SHALL truncate to the most relevant chunks
5. THE Exam_Generator SHALL preserve mathematical formulas and LaTeX notation in the context

### Requirement 8: Maintain Current Exam Generation Features

**User Story:** As a teacher, I want all existing exam generation features to continue working, so that I can still create exams even without uploaded textbooks.

#### Acceptance Criteria

1. THE Exam_Generator SHALL support generating exams without RAG context (fallback mode)
2. THE Exam_Generator SHALL maintain support for Vietnamese education standards (Công văn 7991)
3. THE Exam_Generator SHALL maintain support for difficulty levels (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)
4. THE Exam_Generator SHALL maintain support for all subjects (Math, Physics, Chemistry, Biology, Literature, History, Geography)
5. THE Exam_Generator SHALL maintain support for grades 1-5
6. THE Exam_Generator SHALL preserve the existing UI and user workflow

### Requirement 9: Python Integration

**User Story:** As a developer, I want Python scripts integrated with the Next.js application, so that document processing can be performed efficiently.

#### Acceptance Criteria

1. THE RAG_System SHALL provide Python scripts for document processing in a dedicated directory
2. THE RAG_System SHALL provide a command-line interface for running document processing
3. THE Query_Interface SHALL communicate with Python components via API calls or subprocess execution
4. THE RAG_System SHALL handle Python dependency management with requirements.txt
5. WHEN Python execution fails, THE RAG_System SHALL log detailed error messages

### Requirement 10: Professional Implementation with Phased Commits

**User Story:** As a developer, I want the implementation to be organized in logical phases, so that changes can be reviewed and deployed incrementally.

#### Acceptance Criteria

1. THE RAG_System implementation SHALL be divided into separate git commits for each phase
2. THE RAG_System SHALL include commit messages that clearly describe each phase
3. THE RAG_System SHALL ensure each commit results in a working system (no broken states)
4. THE RAG_System SHALL include documentation for each phase in commit messages or README updates
5. THE RAG_System SHALL follow the project's existing code style and conventions

### Requirement 11: Document Processing Parser and Pretty Printer

**User Story:** As a developer, I want reliable PDF parsing with validation, so that document processing is robust and errors can be debugged easily.

#### Acceptance Criteria

1. WHEN a valid PDF file is provided, THE Document_Processor SHALL parse it into structured text chunks
2. WHEN an invalid PDF file is provided, THE Document_Processor SHALL return a descriptive error message
3. THE Document_Processor SHALL provide a pretty printer that formats parsed chunks for human review
4. FOR ALL valid parsed documents, processing then pretty printing then processing SHALL produce equivalent structured output (round-trip property)
5. THE Document_Processor SHALL validate that extracted text contains at least 100 characters before proceeding

### Requirement 12: Embedding Generation Validation

**User Story:** As a developer, I want embedding generation to be validated, so that the system can detect and handle malformed embeddings.

#### Acceptance Criteria

1. THE Embedding_Generator SHALL validate that generated embeddings have the expected dimensionality
2. WHEN an embedding has zero magnitude, THE Embedding_Generator SHALL reject it and retry
3. THE Embedding_Generator SHALL validate that embeddings contain only finite numerical values
4. THE Embedding_Generator SHALL normalize embeddings to unit length before storage
5. FOR ALL text chunks, generating embeddings twice SHALL produce embeddings with cosine similarity > 0.99 (idempotence property)

