# Canvas LMS

An advanced, full-stack Learning Management System (LMS) inspired by Canvas, enhanced with AI to streamline the educational experience for both teachers and students.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and fill in:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/canvas_lms"
   JWT_SECRET="your_super_secret_jwt_key_32_chars"
   GEMINI_API_KEY="your_gemini_api_key"
   RESEND_API_KEY="re_your_resend_api_key"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```

3. **Database Initialization**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   *Available at `http://localhost:3000`*

---

## 🏗️ Architecture

- **Frontend**: React 19, Next.js 16 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Security**: JWT Auth, RBAC, Zod Validation, Rate Limiting
- **AI**: Google Generative AI (Gemini)
- **Design Pattern**: Clean Architecture (Services Layer -> Data Access -> Controllers)

### Directory Structure

```text
canvas_lms/
├── app/api/               # Next.js API Routes (Controllers)
├── src/
│   ├── components/        # Reusable UI & Layout Components
│   ├── features/          # Feature-specific components (e.g. course tabs)
│   ├── lib/               # Utilities (Prisma, Zod, Gemini, API Client)
│   ├── services/          # Business Logic Layer (AI, Course, User)
│   ├── middleware/        # JWT Auth, Rate Limits, Security
│   └── views/             # Main Pages / Screen Views
├── prisma/                # Db Schema & Migrations
└── ...
```

---

## 🛠️ Essential Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Apply database migrations
npm run db:seed      # Seed test accounts
```

*For more details, refer to the source code directly.*
