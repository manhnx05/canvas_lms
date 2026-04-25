import { NextResponse } from 'next/server';
import { userService } from '@/src/services/userService';
import { requireAuth } from '@/src/middleware/auth';
import { createUserSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';
import { withRateLimit, rateLimitConfigs } from '@/src/middleware/rateLimiting';
import { sanitizeRequestBody, sanitizeText } from '@/src/middleware/sanitization';

export const GET = withRateLimit(
  withErrorHandler(async (req: Request) => {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    
    // Process query parameters
    for (const [k, v] of searchParams.entries()) {
      // Sanitize query parameters - use simple text sanitization for query params
      query[k] = sanitizeText(v);
    }
    
    const users = await userService.getUsers(query);
    return NextResponse.json(users);
  }),
  rateLimitConfigs.api
);

export const POST = withRateLimit(
  withErrorHandler(async (req: Request) => {
    await requireAuth(req, ['teacher']);
    
    // Sanitize and validate request body
    const sanitizedBody = await sanitizeRequestBody(req as any);
    if (!sanitizedBody) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const validatedData = validateRequestBody(createUserSchema, sanitizedBody);
    const user = await userService.createUser(validatedData);
    return NextResponse.json(user, { status: 201 });
  }),
  rateLimitConfigs.api
);
