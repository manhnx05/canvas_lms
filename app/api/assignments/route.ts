import { NextResponse } from 'next/server';
import { getAssignments, createAssignment } from '@/src/server/controllers/assignment.controller';
import { createMockRes, createMockReq } from '../_utils/mockExpressAdapter';

// Since our service uses Express req/res, we use our own service directly instead.
import prisma from '@/src/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const where: any = {};
    if (courseId) where.courseId = courseId;
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: { select: { id: true, name: true } },
        submissions: userId ? { where: { studentId: userId } } : false,
      },
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        maxScore: body.maxScore ? Number(body.maxScore) : 100,
        courseId: body.courseId,
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
