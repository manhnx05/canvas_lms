import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // AI Services
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  
  // Email Services (optional - app will work without email)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  
  // App Configuration
  FRONTEND_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional configurations
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).optional().default(10),
  RATE_LIMIT_MAX: z.coerce.number().min(1).max(10000).optional().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().min(1).max(3600).optional().default(900), // 15 minutes
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
    });

    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    
    console.error('\n📝 Please check your environment variables.');
    console.error('📖 See .env.example for reference.');
    
    // Don't exit in production - let the app try to run
    // The specific API routes will fail with proper error messages
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    // Return a minimal valid env for production to prevent crash
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      JWT_SECRET: process.env.JWT_SECRET || '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      LOG_LEVEL: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      DATABASE_POOL_SIZE: 10,
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW: 900,
    } as Env;
  }
}

export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

// Helper functions for common environment checks
export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isProduction = () => getEnv().NODE_ENV === 'production';
export const isTest = () => getEnv().NODE_ENV === 'test';

// Validate environment on module load (but don't crash in production)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  validateEnv();
}