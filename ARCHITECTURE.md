# Canvas LMS - Clean Architecture

## 📁 Cấu trúc thư mục

```
canvas_lms/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── ai/                   # AI services endpoints
│   │   ├── assignments/          # Assignment CRUD
│   │   ├── auth/                 # Authentication
│   │   ├── conversations/        # Messaging system
│   │   ├── courses/              # Course management
│   │   ├── exams/                # Exam system
│   │   ├── health/               # Health check
│   │   ├── notifications/        # Notifications
│   │   ├── rewards/              # Reward system
│   │   ├── teacher/              # Teacher-specific APIs
│   │   ├── upload/               # File upload
│   │   └── users/                # User management
│   ├── [[...slug]]/              # Catch-all route for SPA
│   └── layout.tsx                # Root layout
│
├── src/                          # Frontend Source Code
│   ├── components/               # Reusable UI Components
│   │   ├── quiz/                 # Quiz-related components
│   │   ├── shared/               # Shared components
│   │   ├── stats/                # Statistics components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LatexRenderer.tsx
│   │   ├── Layout.tsx
│   │   └── Loading.tsx
│   │
│   ├── context/                  # React Context
│   │   └── AuthContext.tsx       # Authentication context
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── assignments/          # Assignment features
│   │   ├── course/               # Course features
│   │   └── inbox/                # Inbox/messaging features
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAssignments.ts
│   │   ├── useAuth.ts
│   │   ├── useCourseDetail.ts
│   │   ├── useDashboardData.ts
│   │   └── useSocket.ts
│   │
│   ├── lib/                      # Core Libraries & Utilities
│   │   ├── apiClient.ts          # HTTP client with interceptors
│   │   ├── env.ts                # Environment validation
│   │   ├── exam.ai.service.ts    # AI exam generation
│   │   ├── gemini.ts             # Google Gemini AI integration
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── validations.ts        # Zod validation schemas
│   │
│   ├── middleware/               # Backend Middleware
│   │   ├── auth.ts               # JWT authentication
│   │   ├── rateLimit.ts          # Rate limiting
│   │   └── security.ts           # Security headers
│   │
│   ├── sections/                 # Page Sections
│   │   ├── AiChatSection.tsx
│   │   ├── ComparisonSection.tsx
│   │   └── HeroSection.tsx
│   │
│   ├── services/                 # Business Logic Layer
│   │   ├── aiService.ts          # AI operations
│   │   ├── assignmentService.ts  # Assignment business logic
│   │   ├── conversationService.ts # Messaging logic
│   │   ├── courseService.ts      # Course business logic
│   │   ├── examService.ts        # Exam business logic
│   │   ├── notificationService.ts # Notification logic
│   │   ├── rewardService.ts      # Reward logic
│   │   ├── teacherService.ts     # Teacher-specific logic
│   │   └── userService.ts        # User management logic
│   │
│   ├── types/                    # TypeScript Type Definitions
│   │   └── index.ts              # Shared types
│   │
│   ├── utils/                    # Utility Functions
│   │   ├── errorHandler.ts       # Centralized error handling
│   │   └── format.ts             # Formatting utilities
│   │
│   ├── views/                    # Page Components
│   │   ├── AssignmentDetail.tsx
│   │   ├── Assignments.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── Courses.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EvaluationHub.tsx
│   │   ├── ExamGenerator.tsx
│   │   ├── ExamList.tsx
│   │   ├── ExamTaking.tsx
│   │   ├── ExamViewer.tsx
│   │   ├── Inbox.tsx
│   │   ├── Login.tsx
│   │   ├── Notifications.tsx
│   │   ├── Profile.tsx
│   │   ├── Rewards.tsx
│   │   └── Students.tsx
│   │
│   ├── App.tsx                   # Main App component
│   └── index.css                 # Global styles
│
├── prisma/                       # Database
│   ├── migrations/               # Database migrations
│   ├── schema.prisma             # Prisma schema
│   └── seed.ts                   # Database seeding
│
├── public/                       # Static Assets
│   └── uploads/                  # User uploads
│
└── Configuration Files
    ├── .env                      # Environment variables (local)
    ├── .env.example              # Environment template
    ├── .gitignore                # Git ignore rules
    ├── next.config.js            # Next.js configuration
    ├── package.json              # Dependencies
    ├── postcss.config.mjs        # PostCSS configuration
    ├── tsconfig.json             # TypeScript configuration
    └── README.md                 # Project documentation
```

## 🏗️ Clean Architecture Principles

### 1. Separation of Concerns

#### **Presentation Layer** (`src/views`, `src/components`, `src/features`)
- Chỉ chứa UI logic
- Không chứa business logic
- Sử dụng hooks và context để quản lý state

#### **Business Logic Layer** (`src/services`)
- Chứa toàn bộ business rules
- Độc lập với UI và database
- Có thể test riêng biệt

#### **Data Access Layer** (`prisma`, `src/lib/prisma.ts`)
- Quản lý database operations
- Sử dụng Prisma ORM
- Type-safe database queries

#### **API Layer** (`app/api`)
- RESTful API endpoints
- Authentication & authorization
- Request validation với Zod
- Error handling

### 2. Dependency Flow

```
Views → Hooks → Services → Prisma → Database
  ↓       ↓        ↓
Components  Context  Middleware
```

- **Views** phụ thuộc vào **Hooks** và **Components**
- **Hooks** phụ thuộc vào **Services** và **Context**
- **Services** phụ thuộc vào **Prisma**
- **API Routes** sử dụng **Middleware** và **Services**

### 3. Key Design Patterns

#### **Repository Pattern** (Services)
```typescript
// src/services/courseService.ts
export const courseService = {
  getCourses: async (query) => { /* ... */ },
  getCourseById: async (id) => { /* ... */ },
  createCourse: async (data) => { /* ... */ },
  updateCourse: async (id, data) => { /* ... */ },
  deleteCourse: async (id) => { /* ... */ }
};
```

#### **Middleware Pattern** (Authentication, Rate Limiting)
```typescript
// src/middleware/auth.ts
export async function requireAuth(req, requiredRoles?) {
  // Verify JWT token
  // Check user permissions
  // Return user info or throw error
}
```

#### **Error Handling Pattern**
```typescript
// src/utils/errorHandler.ts
export function withErrorHandler(handler) {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}
```

#### **Validation Pattern** (Zod)
```typescript
// src/lib/validations.ts
export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  // ...
});
```

### 4. Type Safety

- **100% TypeScript** với strict mode enabled
- **Prisma** tự động generate types từ schema
- **Zod** validation schemas đảm bảo runtime type safety
- Shared types trong `src/types/index.ts`

### 5. Security Layers

1. **Authentication**: JWT tokens với middleware
2. **Authorization**: Role-based access control (RBAC)
3. **Validation**: Zod schemas cho tất cả inputs
4. **Rate Limiting**: Prevent abuse
5. **Security Headers**: CORS, CSP, etc.
6. **Environment Validation**: Type-safe env variables

## 🔄 Data Flow Example

### Creating a Course

```
1. User clicks "Create Course" button
   ↓
2. View (Courses.tsx) calls handleCreateCourse
   ↓
3. API call via apiClient.post('/courses', data)
   ↓
4. API Route (app/api/courses/route.ts)
   - Validates request with requireAuth middleware
   - Validates data with Zod schema
   ↓
5. Service Layer (courseService.createCourse)
   - Business logic validation
   - Calls Prisma
   ↓
6. Database (PostgreSQL via Prisma)
   - Inserts record
   - Returns created course
   ↓
7. Response flows back through layers
   ↓
8. View updates UI with new course
```

## 📦 Module Independence

Mỗi module có thể được:
- **Tested** độc lập
- **Modified** mà không ảnh hưởng modules khác
- **Reused** trong các contexts khác
- **Replaced** với implementation khác

## 🎯 Benefits

1. **Maintainability**: Code dễ đọc, dễ hiểu, dễ sửa
2. **Testability**: Mỗi layer có thể test riêng
3. **Scalability**: Dễ thêm features mới
4. **Type Safety**: Catch errors at compile time
5. **Security**: Multiple layers of protection
6. **Performance**: Optimized data flow

## 🚀 Future Improvements

- [ ] Add unit tests cho services
- [ ] Add integration tests cho API routes
- [ ] Add E2E tests với Playwright
- [ ] Implement caching layer (Redis)
- [ ] Add monitoring và logging (Sentry, LogRocket)
- [ ] Implement WebSocket cho real-time features
- [ ] Add API documentation (Swagger/OpenAPI)
