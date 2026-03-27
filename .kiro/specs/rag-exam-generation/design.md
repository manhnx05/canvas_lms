# Design Document - RAG Exam Generation System

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ExamGenerator│  │ Document Mgmt│  │ Quiz System  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/ai/     │  │ /api/rag/    │  │ /api/exams/  │          │
│  │ generate-quiz│  │ query        │  │ ...          │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ aiService    │  │ ragService   │  │ examService  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Gemini AI    │  │ Vector DB    │  │ PostgreSQL   │          │
│  │ (Generation) │  │ (Embeddings) │  │ (Metadata)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          ▲                  ▲
          │                  │
┌─────────┴──────────────────┴─────────────────────────────────────┐
│                    Python Processing Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PDF Parser   │  │ Text Chunker │  │ Embedding    │          │
│  │              │  │              │  │ Generator    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
1. Document Upload & Processing:
   PDF File → Python Parser → Text Chunks → Embeddings → Vector DB
                                    ↓
                              PostgreSQL (Metadata)

2. Exam Generation with RAG:
   User Query → Generate Query Embedding → Vector DB Search
        ↓
   Top-K Chunks → Context Window → Gemini AI → Exam Questions
```

## 2. Component Design

### 2.1 Python Processing Layer

**Location:** `python/rag/`

#### 2.1.1 PDF Parser (`pdf_parser.py`)
```python
class PDFParser:
    def parse(pdf_path: str) -> Document
    def extract_text(pdf_path: str) -> str
    def extract_metadata(pdf_path: str) -> dict
    def validate_pdf(pdf_path: str) -> bool
```

#### 2.1.2 Text Chunker (`text_chunker.py`)
```python
class TextChunker:
    def chunk(text: str, chunk_size: int = 1000) -> List[Chunk]
    def preserve_sentences(text: str) -> List[str]
    def preserve_latex(text: str) -> str
    def add_metadata(chunk: Chunk, metadata: dict) -> Chunk
```

#### 2.1.3 Embedding Generator (`embedding_generator.py`)
```python
class EmbeddingGenerator:
    def generate(text: str) -> np.ndarray
    def batch_generate(texts: List[str]) -> List[np.ndarray]
    def validate_embedding(embedding: np.ndarray) -> bool
    def normalize(embedding: np.ndarray) -> np.ndarray
```

#### 2.1.4 Vector DB Client (`vector_db_client.py`)
```python
class VectorDBClient:
    def insert(embedding: np.ndarray, metadata: dict) -> str
    def search(query_embedding: np.ndarray, k: int, filters: dict) -> List[Result]
    def delete(doc_id: str) -> bool
    def update(doc_id: str, embedding: np.ndarray, metadata: dict) -> bool
```

### 2.2 Next.js Service Layer

**Location:** `src/services/`

#### 2.2.1 RAG Service (`ragService.ts`)
```typescript
class RAGService {
  async processDocument(file: File, metadata: DocumentMetadata): Promise<string>
  async queryContext(query: string, filters: QueryFilters): Promise<Chunk[]>
  async deleteDocument(docId: string): Promise<void>
  async listDocuments(filters?: DocumentFilters): Promise<Document[]>
}
```

#### 2.2.2 Enhanced AI Service (`aiService.ts`)
```typescript
class AIService {
  // Existing methods...
  
  // New RAG-enhanced methods
  async generateQuizWithRAG(config: ExamConfig, context: Chunk[]): Promise<Question[]>
  async buildContextWindow(chunks: Chunk[]): Promise<string>
  async generateQueryEmbedding(query: string): Promise<number[]>
}
```

### 2.3 API Routes

**Location:** `app/api/rag/`

#### 2.3.1 Document Processing (`/api/rag/process/route.ts`)
```typescript
POST /api/rag/process
Body: { file: File, subject: string, grade: string }
Response: { docId: string, chunksCount: number }
```

#### 2.3.2 Query Context (`/api/rag/query/route.ts`)
```typescript
POST /api/rag/query
Body: { query: string, subject: string, grade: string, k: number }
Response: { chunks: Chunk[], totalFound: number }
```

#### 2.3.3 Document Management (`/api/rag/documents/route.ts`)
```typescript
GET /api/rag/documents
Response: { documents: Document[] }

DELETE /api/rag/documents/[id]/route.ts
Response: { success: boolean }
```

### 2.4 Database Schema Extensions

**Location:** `prisma/schema.prisma`

```prisma
model Document {
  id          String   @id @default(uuid())
  filename    String
  subject     String
  grade       String
  fileSize    Int
  chunkCount  Int
  uploadedBy  String
  status      String   // 'processing' | 'ready' | 'failed'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  chunks      DocumentChunk[]
  
  @@index([subject, grade])
  @@index([uploadedBy])
  @@index([status])
}

model DocumentChunk {
  id          String   @id @default(uuid())
  documentId  String
  content     String   @db.Text
  pageNumber  Int?
  chunkIndex  Int
  vectorId    String   // Reference to vector DB
  createdAt   DateTime @default(now())
  
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@index([vectorId])
}
```

## 3. Technology Stack Decisions

### 3.1 Vector Database Selection

**Recommended: Pinecone**

**Rationale:**
- ✅ Managed service (no infrastructure management)
- ✅ Free tier: 1M vectors, 100K queries/month
- ✅ Fast similarity search (<100ms)
- ✅ Metadata filtering support
- ✅ Good Python and Node.js SDKs
- ✅ Easy integration with Vercel

**Alternatives Considered:**
- Weaviate: Self-hosted, more complex setup
- Qdrant: Good but requires hosting
- pgvector: PostgreSQL extension, simpler but slower

### 3.2 Embedding Model Selection

**Recommended: text-embedding-004 (Google)**

**Rationale:**
- ✅ Same provider as Gemini (consistent API)
- ✅ 768 dimensions (good balance)
- ✅ Supports Vietnamese language
- ✅ Free tier available
- ✅ Good performance on semantic search

**Alternatives Considered:**
- OpenAI embeddings: Requires separate API key
- Sentence Transformers: Self-hosted, more complex

### 3.3 Python Integration Approach

**Recommended: Python Microservice with FastAPI**

**Rationale:**
- ✅ Clean separation of concerns
- ✅ Can be deployed separately or with Next.js
- ✅ Easy to test and maintain
- ✅ FastAPI provides automatic API docs
- ✅ Can be called from Next.js API routes

**Architecture:**
```
Next.js API → HTTP Request → FastAPI (Python) → Response
```

## 4. Implementation Plan

### 🔄 Git Workflow for Each Phase

**IMPORTANT:** Mỗi phase phải được commit và push riêng biệt:

```bash
# Sau khi hoàn thành mỗi commit:
git add .
git commit -m "feat: [commit message in English]"
git push origin main

# Verify deployment (nếu có auto-deploy)
# Test trên production/staging
# Chỉ tiếp tục phase tiếp theo khi phase hiện tại stable
```

### Phase 1: Python Processing Foundation (3 commits)

**Commit 1: Setup Python environment and dependencies**
```bash
# Commit message: "feat: setup Python RAG processing environment"
```
- Create `python/rag/` directory structure
- Add `requirements.txt` with dependencies:
  ```
  PyPDF2==3.0.1
  langchain==0.1.0
  google-generativeai==0.3.2
  pinecone-client==3.0.0
  python-dotenv==1.0.0
  fastapi==0.109.0
  uvicorn==0.27.0
  numpy==1.26.3
  ```
- Create `python/rag/README.md` for Python setup
- Add `python/.env.example` for Python config
- Update root `.gitignore` to exclude Python cache
- **Git push after completion**

**Commit 2: Implement PDF parser and text chunker**
```bash
# Commit message: "feat: implement PDF parser and text chunker with Vietnamese support"
```
- Create `python/rag/pdf_parser.py` with PyPDF2
- Create `python/rag/text_chunker.py` with sentence preservation
- Add LaTeX preservation logic (for math formulas)
- Add Vietnamese text handling
- Create `python/rag/tests/test_parser.py` unit tests
- Add sample test PDF in `python/rag/tests/fixtures/`
- **Git push after completion**

**Commit 3: Implement embedding generator**
```bash
# Commit message: "feat: implement embedding generator with Google text-embedding-004"
```
- Create `python/rag/embedding_generator.py` with Google embeddings
- Add validation and normalization
- Create batch processing support (process 100 chunks at a time)
- Add retry logic for API failures
- Create `python/rag/tests/test_embeddings.py` unit tests
- **Git push after completion**

### Phase 2: Vector Database Integration (2 commits)

**Commit 4: Setup Pinecone and vector DB client**
```bash
# Commit message: "feat: integrate Pinecone vector database"
```
- Create Pinecone account and index (dimension: 768)
- Implement `python/rag/vector_db_client.py`
- Add connection testing script
- Update `python/.env.example` with Pinecone config
- Update root `.env.example` with Pinecone variables
- Add Pinecone setup documentation
- **Git push after completion**

**Commit 5: Create document processing pipeline**
```bash
# Commit message: "feat: implement end-to-end document processing pipeline"
```
- Create `python/rag/process_document.py` orchestrator
- Implement pipeline: PDF → Chunks → Embeddings → Vector DB
- Add CLI interface: `python -m rag.process_document --file path/to/file.pdf`
- Create `python/scripts/process_sample.py` for testing
- Add progress logging and error handling
- **Git push after completion**

### Phase 3: Database Schema and Models (1 commit)

**Commit 6: Add Document and DocumentChunk models to Prisma**
```bash
# Commit message: "feat: add Document and DocumentChunk models for RAG system"
```
- Update `prisma/schema.prisma` with new models
- Create migration: `npx prisma migrate dev --name add_rag_models`
- Update `prisma/seed.ts` with sample documents (optional)
- Generate Prisma client: `npx prisma generate`
- Test database operations with new models
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Document.subject → Course.title (Toán, Tiếng Việt, Tự nhiên xã hội)
- Document.grade → "1", "2", "3", "4", "5" (khối lớp)
- Document.uploadedBy → User.id (teacher role)
- Liên kết với Exam model thông qua subject và grade

### Phase 4: FastAPI Microservice (2 commits)

**Commit 7: Create FastAPI application structure**
```bash
# Commit message: "feat: create FastAPI microservice for RAG processing"
```
- Create `python/api/` directory structure
- Implement `python/api/main.py` with FastAPI app
- Add CORS configuration for Next.js origin
- Add health check endpoint: `GET /health`
- Create `python/api/requirements.txt`
- Add Docker support with `Dockerfile` (optional)
- Add startup script: `python/api/start.sh`
- **Git push after completion**

**Commit 8: Implement RAG API endpoints**
```bash
# Commit message: "feat: implement RAG API endpoints for document processing and querying"
```
- POST `/api/v1/process` - Process document
  - Input: file (multipart), subject, grade, uploadedBy
  - Output: { docId, chunksCount, status }
- POST `/api/v1/query` - Query embeddings
  - Input: { query, subject, grade, k }
  - Output: { chunks: [{ content, metadata, score }] }
- GET `/api/v1/documents` - List documents
  - Query params: subject, grade, uploadedBy
  - Output: { documents: [...] }
- DELETE `/api/v1/documents/{id}` - Delete document
  - Output: { success: boolean }
- Add authentication middleware (API key validation)
- Add request validation with Pydantic models
- **Git push after completion**

### Phase 5: Next.js Integration (3 commits)

**Commit 9: Create RAG service layer**
```bash
# Commit message: "feat: create RAG service layer for Next.js integration"
```
- Implement `src/services/ragService.ts`:
  ```typescript
  class RAGService {
    async processDocument(file: File, metadata: DocumentMetadata): Promise<string>
    async queryContext(query: string, filters: QueryFilters): Promise<Chunk[]>
    async deleteDocument(docId: string): Promise<void>
    async listDocuments(filters?: DocumentFilters): Promise<Document[]>
  }
  ```
- Add HTTP client for Python API (axios with retry logic)
- Add error handling and timeout management
- Create TypeScript types in `src/types/rag.ts`
- Add unit tests for service layer
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Sử dụng `src/lib/apiClient.ts` pattern hiện có
- Tích hợp với `src/context/AuthContext.tsx` để lấy user info
- Follow error handling pattern từ `src/utils/errorHandler.ts`

**Commit 10: Create RAG API routes**
```bash
# Commit message: "feat: implement RAG API routes with authentication"
```
- Implement `app/api/rag/process/route.ts`:
  - POST handler với file upload
  - Validate user role (teacher only)
  - Call Python API
  - Store metadata in PostgreSQL
- Implement `app/api/rag/query/route.ts`:
  - POST handler với query parameters
  - Authenticate user
  - Call Python API for vector search
  - Return formatted results
- Implement `app/api/rag/documents/route.ts`:
  - GET handler (list documents)
  - DELETE handler (remove document)
- Add Zod validation schemas in `src/lib/validations.ts`
- Add rate limiting using existing middleware
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Follow API route pattern từ `app/api/courses/route.ts`
- Sử dụng `requireAuth` middleware từ `src/middleware/auth.ts`
- Apply `withErrorHandler` từ `src/utils/errorHandler.ts`
- Validate với Zod schemas như `app/api/ai/generate-quiz/route.ts`

**Commit 11: Enhance AI service with RAG**
```bash
# Commit message: "feat: enhance AI service with RAG-powered exam generation"
```
- Update `src/services/aiService.ts`:
  - Add `generateQuizWithRAG(config, context)` method
  - Implement `buildContextWindow(chunks)` helper
  - Add fallback to non-RAG generation if no context
  - Preserve existing `generateQuiz()` method
- Update `src/lib/gemini.ts` if needed for context handling
- Add prompt engineering for RAG context:
  ```
  Dựa trên tài liệu tham khảo sau:
  [Context from chunks]
  
  Hãy tạo câu hỏi trắc nghiệm...
  ```
- Test with sample documents
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Giữ nguyên interface của `aiService.generateQuiz()`
- Thêm optional parameter `useRAG: boolean`
- Tương thích với `app/api/ai/generate-quiz/route.ts`

### Phase 6: Frontend Updates (3 commits)

**Commit 12: Create document management UI**
```bash
# Commit message: "feat: add document management interface for teachers"
```
- Create `src/views/DocumentManagement.tsx`:
  - Document upload form (drag & drop)
  - Document list table with filters
  - Status indicators (processing/ready/failed)
  - Delete confirmation modal
  - Subject and grade filters
- Add route in `src/App.tsx`: `/documents`
- Add menu item in `src/components/Layout.tsx` (teacher only)
- Use existing UI components pattern from `src/views/Courses.tsx`
- Add loading states and error handling
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Follow UI pattern từ `src/views/Courses.tsx`
- Sử dụng Lucide icons như các view khác
- Apply Tailwind classes theo design system hiện tại
- Tích hợp với `src/components/Layout.tsx` sidebar

**Commit 13: Update ExamGenerator with RAG toggle**
```bash
# Commit message: "feat: integrate RAG context into exam generator"
```
- Update `src/views/ExamGenerator.tsx`:
  - Add "Sử dụng tài liệu tham khảo" toggle in Step 1
  - Show available documents dropdown (filtered by subject/grade)
  - Add "Nguồn tài liệu" section showing selected documents
  - Update `generateAIExam()` to call RAG-enhanced API
  - Show RAG status during generation
- Update API call to include `useRAG` and `documentIds` parameters
- Maintain backward compatibility (can generate without RAG)
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Giữ nguyên 3-step workflow hiện tại
- Thêm RAG options vào Step 1 (Thiết lập)
- Không thay đổi Step 2 (Tài liệu - giữ cho upload tạm thời)
- Step 3 (Xem & Lưu) giữ nguyên
- Tương thích với `app/api/ai/generate-quiz/route.ts`

**Commit 14: Add RAG status indicators and source citations**
```bash
# Commit message: "feat: add source citations and RAG indicators to generated questions"
```
- Update question display in `src/views/ExamGenerator.tsx` Step 3:
  - Add "📚 Nguồn" badge when question uses RAG
  - Show source document name and page number
  - Add tooltip with source chunk preview
- Update `src/components/LatexRenderer.tsx` if needed for citations
- Add visual distinction for RAG-generated vs non-RAG questions
- Update `src/views/ExamViewer.tsx` to show sources (if applicable)
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Enhance existing question card UI
- Follow badge/tag pattern từ các component khác
- Maintain LaTeX rendering functionality
- Tương thích với `src/views/ExamViewer.tsx`

### Phase 7: Testing and Documentation (2 commits)

**Commit 15: Add comprehensive testing**
```bash
# Commit message: "test: add integration tests for RAG pipeline"
```
- Create `tests/rag/` directory
- Integration tests for document processing:
  - Upload PDF → Process → Verify chunks in DB
  - Query context → Verify relevant results
  - Delete document → Verify cleanup
- Integration tests for exam generation:
  - Generate with RAG → Verify questions use context
  - Generate without RAG → Verify fallback works
  - Compare RAG vs non-RAG quality
- Add error scenario tests:
  - Invalid PDF file
  - Vector DB connection failure
  - Python API timeout
- Create test fixtures and sample PDFs
- **Git push after completion**

**Commit 16: Update documentation and deployment guide**
```bash
# Commit message: "docs: add RAG system documentation and deployment guide"
```
- Update `README.md`:
  - Add RAG features section
  - Add architecture diagram
  - Update tech stack
  - Add setup instructions
- Create `docs/RAG_SETUP.md`:
  - Python environment setup
  - Pinecone account creation
  - Environment variables configuration
  - Local development guide
- Create `docs/RAG_DEPLOYMENT.md`:
  - Production deployment options
  - Vercel + Railway setup
  - Environment variables for production
  - Monitoring and troubleshooting
- Create `docs/RAG_USER_GUIDE.md` (Vietnamese):
  - Hướng dẫn upload tài liệu
  - Hướng dẫn tạo đề thi với RAG
  - Tips để có kết quả tốt nhất
- Update `.env.example` with all RAG variables
- **Git push after completion**

**Mapping với hệ thống hiện tại:**
- Follow documentation structure hiện có
- Update existing README sections
- Maintain Vietnamese language for user guides
- Add to existing deployment documentation

## 5. Deployment Strategy

### 5.1 Development Environment

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Python FastAPI
cd python/api
uvicorn main:app --reload --port 8000
```

### 5.2 Production Deployment

**Option 1: Vercel + Separate Python Service**
- Next.js on Vercel
- Python FastAPI on Railway/Render/Fly.io
- Pinecone managed service

**Option 2: All-in-One (Recommended for simplicity)**
- Next.js on Vercel with Python API routes
- Use Vercel's Python runtime support
- Pinecone managed service

### 5.3 Environment Variables

```env
# Existing variables...

# RAG System
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=canvas-lms-rag
GOOGLE_EMBEDDING_API_KEY=your_google_api_key
PYTHON_API_URL=http://localhost:8000  # or production URL
```

## 6. Performance Considerations

### 6.1 Optimization Strategies

1. **Batch Processing:** Process multiple chunks in parallel
2. **Caching:** Cache frequently queried embeddings
3. **Lazy Loading:** Load documents on-demand
4. **Pagination:** Paginate document lists
5. **Background Jobs:** Process large documents asynchronously

### 6.2 Expected Performance

- Document processing: 1-2 minutes per 100-page PDF
- Query latency: <500ms for top-5 retrieval
- Exam generation: 10-30 seconds (similar to current)

## 7. Security Considerations

1. **File Upload Validation:** Check file type, size, content
2. **Access Control:** Only teachers can upload documents
3. **Rate Limiting:** Limit document processing requests
4. **API Authentication:** Secure Python API with API keys
5. **Data Privacy:** Store documents securely, allow deletion

## 8. Monitoring and Logging

1. **Document Processing:** Log success/failure rates
2. **Query Performance:** Track retrieval latency
3. **Generation Quality:** Monitor exam generation success
4. **Error Tracking:** Log all errors with context
5. **Usage Metrics:** Track RAG vs non-RAG usage

## 9. Future Enhancements

1. **Multi-modal Support:** Images, diagrams from PDFs
2. **Advanced Chunking:** Semantic chunking with AI
3. **Question Validation:** Verify questions against source
4. **Citation Generation:** Auto-cite source pages
5. **Collaborative Filtering:** Learn from teacher feedback

## 10. Success Metrics

1. **Adoption Rate:** % of exams generated with RAG
2. **Quality Improvement:** Teacher satisfaction scores
3. **Performance:** Query latency < 500ms
4. **Reliability:** 99% uptime for RAG service
5. **Coverage:** Number of documents processed

---

**Total Estimated Timeline:** 16 commits over 2-3 weeks

## 11. Mapping với Hệ Thống Hiện Tại

### 11.1 Database Integration

```
Existing Models → RAG Models
─────────────────────────────
User (teacher)  → Document.uploadedBy
Course.title    → Document.subject (Toán, Tiếng Việt, etc.)
Exam.grade      → Document.grade (1-5)
Exam.subject    → Document.subject
ExamFile        → Document (enhanced with RAG)
```

### 11.2 API Routes Integration

```
Existing Routes              New RAG Routes
────────────────────────────────────────────────
/api/ai/generate-quiz    →  Enhanced with RAG
/api/exams/*             →  Compatible with RAG
                         →  /api/rag/process (new)
                         →  /api/rag/query (new)
                         →  /api/rag/documents (new)
```

### 11.3 Service Layer Integration

```
Existing Services        RAG Enhancement
────────────────────────────────────────
aiService.ts         →  + generateQuizWithRAG()
examService.ts       →  Compatible (no changes)
                     →  ragService.ts (new)
```

### 11.4 Frontend Integration

```
Existing Views           RAG Enhancement
────────────────────────────────────────────────
ExamGenerator.tsx    →  + RAG toggle & document selection
ExamViewer.tsx       →  + Source citations display
Layout.tsx           →  + Document Management menu (teacher)
                     →  DocumentManagement.tsx (new)
```

### 11.5 Authentication & Authorization

```
Existing Auth Flow       RAG Integration
────────────────────────────────────────────────
JWT Authentication   →  Reused for RAG APIs
requireAuth()        →  Applied to RAG routes
Role: teacher        →  Required for document upload
Role: student        →  Can use RAG-generated exams
```

### 11.6 UI/UX Consistency

```
Design Pattern           Applied to RAG
────────────────────────────────────────────────
Tailwind CSS         →  All RAG components
Lucide Icons         →  Document management icons
Loading States       →  Document processing status
Error Handling       →  Consistent error messages
Vietnamese UI        →  All RAG interfaces
```

### 11.7 Data Flow Integration

```
Current Flow:
User → ExamGenerator → API → Gemini AI → Questions

Enhanced Flow with RAG:
User → ExamGenerator → [RAG Toggle ON]
  ↓
Select Documents → API → Query Vector DB
  ↓
Retrieve Context → Gemini AI (with context) → Questions
  ↓
Display with Source Citations
```

### 11.8 Environment Variables

```
Existing Variables       New RAG Variables
────────────────────────────────────────────────
DATABASE_URL         →  (reused)
JWT_SECRET           →  (reused)
GEMINI_API_KEY       →  (reused + embeddings)
                     →  PINECONE_API_KEY (new)
                     →  PINECONE_ENVIRONMENT (new)
                     →  PINECONE_INDEX_NAME (new)
                     →  PYTHON_API_URL (new)
                     →  RAG_API_KEY (new)
```

### 11.9 Deployment Integration

```
Current Deployment       RAG Deployment
────────────────────────────────────────────────
Vercel (Next.js)     →  (same)
PostgreSQL           →  (same + new tables)
                     →  Railway/Render (Python API)
                     →  Pinecone (Vector DB)
```

### 11.10 Backward Compatibility

✅ **Guaranteed Compatibility:**
- Existing exam generation works without RAG
- All current features remain functional
- No breaking changes to existing APIs
- Optional RAG enhancement (can be disabled)
- Gradual adoption by teachers

## 12. Git Workflow Summary

```bash
# Phase 1: Python Foundation
git commit -m "feat: setup Python RAG processing environment"
git push origin main

git commit -m "feat: implement PDF parser and text chunker with Vietnamese support"
git push origin main

git commit -m "feat: implement embedding generator with Google text-embedding-004"
git push origin main

# Phase 2: Vector Database
git commit -m "feat: integrate Pinecone vector database"
git push origin main

git commit -m "feat: implement end-to-end document processing pipeline"
git push origin main

# Phase 3: Database Schema
git commit -m "feat: add Document and DocumentChunk models for RAG system"
git push origin main

# Phase 4: FastAPI Service
git commit -m "feat: create FastAPI microservice for RAG processing"
git push origin main

git commit -m "feat: implement RAG API endpoints for document processing and querying"
git push origin main

# Phase 5: Next.js Integration
git commit -m "feat: create RAG service layer for Next.js integration"
git push origin main

git commit -m "feat: implement RAG API routes with authentication"
git push origin main

git commit -m "feat: enhance AI service with RAG-powered exam generation"
git push origin main

# Phase 6: Frontend
git commit -m "feat: add document management interface for teachers"
git push origin main

git commit -m "feat: integrate RAG context into exam generator"
git push origin main

git commit -m "feat: add source citations and RAG indicators to generated questions"
git push origin main

# Phase 7: Testing & Docs
git commit -m "test: add integration tests for RAG pipeline"
git push origin main

git commit -m "docs: add RAG system documentation and deployment guide"
git push origin main
```

**Next Steps:**
1. ✅ Review and approve design
2. ⏳ Setup development environment (Python + Pinecone)
3. ⏳ Begin Phase 1 implementation
4. ⏳ Test each phase before moving to next
5. ⏳ Deploy to production after Phase 7
