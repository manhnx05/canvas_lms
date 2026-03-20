# Canvas LMS - AI-Powered Learning Management System

An advanced, full-stack Learning Management System (LMS) inspired by Canvas, featuring modern UI and integrated tracking, enhanced with Artificial Intelligence to streamline the educational experience for both teachers and students.

## 🚀 Features

### Core Modules
* **Courses & Modules:** Organize content, interactive lectures, and class resources effectively.
* **Announcements:** Broadcast important updates to all enrolled students.
* **Assignments & Grades:** Create assignments, manage file submissions, and track student academic progress.
* **People & Enrollments:** Manage student enrollments, teacher assignments, and classroom rosters.
* **Real-time Communication:** Live discussions and instant messaging powered by Socket.IO.
* **Secure Authentication:** Complete authentication flow including Registration, Login, and OTP-based password recovery using Resend.
* **Interactive UI:** Smooth animations and drag-and-drop capabilities for course management.

### 🤖 AI-Powered Capabilities (Integrated with Google Gemini)
* **AI-Assisted Quiz Generation:** Teachers can automatically generate customizable multiple-choice quizzes based on specific subjects, topics and grade levels.
* **Smart Student Evaluation:** The system can automatically evaluate and grade student quiz submissions, providing detailed, constructive feedback on learning outcomes, mistakes, and areas for improvement.

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, React Router, Lucide React, Framer Motion, DnD-Kit.
* **Backend:** Node.js, Express.js.
* **Database & ORM:** Prisma ORM.
* **WebSockets:** Socket.IO for real-time events.
* **AI Integration:** Google Generative AI SDK (`@google/genai`).
* **Email Services:** Resend (for OTPs and notifications).

## ⚙️ Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* A supported SQL Database (PostgreSQL/MySQL) per Prisma configurations
* [Google Gemini API Key](https://aistudio.google.com/)
* [Resend API Key](https://resend.com/)

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manhnx05/canvas_lms.git
   cd canvas_lms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` (or `.env.local`) file in the root directory and add the essential keys:
   ```env
   DATABASE_URL="your_database_connection_string"
   GEMINI_API_KEY="your_gemini_api_key"
   RESEND_API_KEY="your_resend_api_key"
   JWT_SECRET="your_jwt_secret"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   
   # Optional: Seed the database with initial data
   npm run prisma:seed 
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application runs both the Vite development server and the Express backend concurrently. Access the interactive web interface at `http://localhost:5173` or `http://localhost:3000` depending on your Vite configurations.

## 📄 License

This project is fully open-sourced.
