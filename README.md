# Canvas LMS - AI-Powered Learning Management System

An advanced, full-stack Learning Management System (LMS) inspired by Canvas, featuring modern UI and integrated tracking, enhanced with Artificial Intelligence to streamline the educational experience for both teachers and students.

## 🚀 Features

> **Status:** ✅ Production-ready with comprehensive TypeScript, authentication, validation, and security features.

### Core Modules
* **Courses & Modules:** Organize content, interactive lectures, and class resources effectively.
* **Announcements:** Broadcast important updates to all enrolled students.
* **Assignments & Grades:** Create assignments, manage file submissions, and track student academic progress.
* **People & Enrollments:** Manage student enrollments, teacher assignments, and classroom rosters.
* **Real-time Communication:** Live discussions and instant messaging system.
* **Secure Authentication:** Complete authentication flow with JWT, rate limiting, and role-based access control.
* **Interactive UI:** Smooth animations and drag-and-drop capabilities for course management.

### 🤖 AI-Powered Capabilities (Integrated with Google Gemini)
* **AI-Assisted Quiz Generation:** Teachers can automatically generate customizable multiple-choice quizzes based on specific subjects, topics and grade levels.
* **Smart Student Evaluation:** The system can automatically evaluate and grade student quiz submissions, providing detailed, constructive feedback on learning outcomes, mistakes, and areas for improvement.
* **AI Chat Assistant:** Students can interact with an AI tutor for learning support and question answering.

### 🔒 Security & Performance Features
* **Authentication & Authorization:** JWT-based auth with role-based access control (RBAC)
* **Rate Limiting:** Configurable rate limits to prevent abuse
* **Input Validation:** Comprehensive validation using Zod schemas
* **Security Headers:** CSP, HSTS, XSS protection, and more
* **Error Handling:** Centralized error handling with proper HTTP status codes
* **Environment Validation:** Startup validation of all required environment variables
* **Database Optimization:** Proper indexing and query optimization

## 🛠️ Tech Stack

### Frontend
* **React 19** - Latest React with concurrent features
* **Next.js 16** - Full-stack React framework with App Router
* **TypeScript** - Strict type checking enabled
* **Tailwind CSS** - Utility-first CSS framework
* **Lucide React** - Beautiful icons
* **Framer Motion** - Smooth animations
* **DnD-Kit** - Drag and drop functionality

### Backend
* **Next.js API Routes** - Serverless API endpoints
* **Prisma ORM** - Type-safe database access
* **PostgreSQL** - Robust relational database
* **JWT Authentication** - Secure token-based auth
* **Zod Validation** - Runtime type validation
* **Rate Limiting** - Request throttling

### AI & External Services
* **Google Generative AI** - AI-powered features
* **Resend** - Email notifications and OTP

### Security & DevOps
* **Environment Validation** - Startup config validation
* **Security Headers** - Comprehensive security middleware
* **Error Boundaries** - Graceful error handling
* **Input Sanitization** - XSS and injection prevention

## ⚙️ Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/) database
* [Google Gemini API Key](https://aistudio.google.com/)
* [Resend API Key](https://resend.com/)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/manhnx05/canvas_lms.git
cd canvas_lms
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/canvas_lms"

# Authentication (generate a secure 32+ character string)
JWT_SECRET="your_super_secret_jwt_key_at_least_32_characters_long"

# AI Services
GEMINI_API_KEY="your_gemini_api_key"

# Email Services  
RESEND_API_KEY="your_resend_api_key"

# App Configuration
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Default Login Credentials

After seeding, you can login with:

**Teacher Account:**
- Email: `ngocdiep@gmail.com`
- Password: `123456`

**Student Account:**
- Email: `hocsinh@gmail.com`  
- Password: `123456`

## 📁 Project Structure

```
canvas_lms/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── ai/            # AI-powered endpoints
│   │   ├── courses/       # Course management
│   │   ├── assignments/   # Assignment handling
│   │   └── ...
│   ├── layout.tsx         # Root layout
│   └── [[...slug]]/       # Catch-all route
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Loading.tsx
│   │   └── ...
│   ├── features/          # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   ├── validations.ts # Zod schemas
│   │   ├── env.ts         # Environment validation
│   │   └── ...
│   ├── middleware/        # API middleware
│   │   ├── auth.ts        # Authentication
│   │   ├── rateLimit.ts   # Rate limiting
│   │   └── security.ts    # Security headers
│   ├── services/          # Business logic
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Helper functions
│   └── views/             # Page components
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Database seeding
└── ...
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Commands

```bash
npx prisma studio              # Open Prisma Studio
npx prisma migrate dev         # Create and apply migration
npx prisma migrate reset       # Reset database
npx prisma db seed            # Seed database
npx prisma generate           # Generate Prisma client
```

## 🚀 Deployment

### Environment Variables for Production

Ensure all required environment variables are set:

- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Secure random string (32+ characters)
- `GEMINI_API_KEY` - Google AI API key
- `RESEND_API_KEY` - Email service API key
- `FRONTEND_URL` - Your production domain
- `NODE_ENV=production`

### Build and Deploy

```bash
npm run build
npm run start
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Role-Based Access Control** (Student/Teacher permissions)
- **Rate Limiting** on all API endpoints
- **Input Validation** with Zod schemas
- **SQL Injection Prevention** with Prisma ORM
- **XSS Protection** with input sanitization
- **Security Headers** (CSP, HSTS, etc.)
- **Environment Validation** on startup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/manhnx05/canvas_lms/issues) page
2. Review the environment setup in `.env.example`
3. Ensure all prerequisites are installed
4. Check the console for detailed error messages

## 🎯 Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] File upload and management system
- [ ] Advanced analytics and reporting
- [ ] Mobile app development
- [ ] Integration with external LMS platforms
- [ ] Advanced AI features (automated grading, content generation)
