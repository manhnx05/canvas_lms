-- Add composite indexes for better query performance

-- Enrollment: Query by course and plicker card
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_plickerCardId_idx" ON "Enrollment"("courseId", "plickerCardId");

-- Assignment: Query by course and status
CREATE INDEX IF NOT EXISTS "Assignment_courseId_status_idx" ON "Assignment"("courseId", "status");

-- Submission: Query by assignment and status
CREATE INDEX IF NOT EXISTS "Submission_assignmentId_status_idx" ON "Submission"("assignmentId", "status");

-- Message: Query by conversation and read status
CREATE INDEX IF NOT EXISTS "Message_conversationId_isRead_idx" ON "Message"("conversationId", "isRead");

-- Notification: Query by user and read status
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- ExamAttempt: Query by exam and status
CREATE INDEX IF NOT EXISTS "ExamAttempt_examId_status_idx" ON "ExamAttempt"("examId", "status");

-- PlickersResponse: Query by session and card number
CREATE INDEX IF NOT EXISTS "PlickersResponse_sessionId_cardNumber_idx" ON "PlickersResponse"("sessionId", "cardNumber");

-- PlickersSession: Query by course and status
CREATE INDEX IF NOT EXISTS "PlickersSession_courseId_status_idx" ON "PlickersSession"("courseId", "status");

-- User: Query by role and creation date for analytics
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- Course: Query by teacher and creation date
CREATE INDEX IF NOT EXISTS "Course_teacher_createdAt_idx" ON "Course"("teacher", "createdAt");