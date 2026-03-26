import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // AI Services
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  
  // Email Services (optional - app will work without email)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required').optional(),
  
  // App Configuration
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional configurations
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DATABASE_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1).max(10000)).default(100),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(1).max(3600)).default(900), // 15 minutes
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
    
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('📖 See .env.example for reference.');
    
    process.exit(1);
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

// Validate environment on module load in production
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  validateEnv();
}