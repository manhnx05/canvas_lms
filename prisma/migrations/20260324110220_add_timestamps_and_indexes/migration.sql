/*
  Warnings:

  - You are about to drop the column `date` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CourseModule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ModuleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `stars` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_courseId_fkey";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "date",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CourseModule" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ModuleItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "date",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "stars" SET NOT NULL;

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "isCorrect" BOOLEAN,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_idx" ON "ExamAttempt"("examId");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_idx" ON "ExamAttempt"("userId");

-- CreateIndex
CREATE INDEX "ExamAttempt_status_idx" ON "ExamAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_examId_userId_key" ON "ExamAttempt"("examId", "userId");

-- CreateIndex
CREATE INDEX "ExamAnswer_attemptId_idx" ON "ExamAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Announcement_courseId_idx" ON "Announcement"("courseId");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Conversation_courseId_idx" ON "Conversation"("courseId");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");

-- CreateIndex
CREATE INDEX "CourseModule_order_idx" ON "CourseModule"("order");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Exam_courseId_idx" ON "Exam"("courseId");

-- CreateIndex
CREATE INDEX "Exam_createdBy_idx" ON "Exam"("createdBy");

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "Exam"("status");

-- CreateIndex
CREATE INDEX "Exam_subject_idx" ON "Exam"("subject");

-- CreateIndex
CREATE INDEX "Exam_grade_idx" ON "Exam"("grade");

-- CreateIndex
CREATE INDEX "ExamFile_examId_idx" ON "ExamFile"("examId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "ModuleItem_moduleId_idx" ON "ModuleItem"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleItem_order_idx" ON "ModuleItem"("order");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- CreateIndex
CREATE INDEX "Participant_conversationId_idx" ON "Participant"("conversationId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
