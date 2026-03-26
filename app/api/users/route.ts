import { NextResponse } from 'next/server';
import { userService } from '@/src/services/userService';
import { requireAuth } from '@/src/middleware/auth';
import { createUserSchema, validateRequestBody } from '@/src/lib/validations';
import { withErrorHandler } from '@/src/utils/errorHandler';

export const GET = withErrorHandler(async (req: Request) => {
  await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => { query[k] = v; });
  const users = await userService.getUsers(query);
  return NextResponse.json(users);
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireAuth(req, ['teacher']);
  const body = await req.json();
  const validatedData = validateRequestBody(createUserSchema, body);
  const user = await userService.createUser(validatedData);
  return NextResponse.json(user, { status: 201 });
});
