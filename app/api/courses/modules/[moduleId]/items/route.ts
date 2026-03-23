import { NextResponse } from 'next/server';
import { courseService } from '@/src/services/courseService';

// POST /api/courses/modules/[moduleId]/items
export async function POST(req: Request, { params }: { params: { moduleId: string } }) {
  try {
    // Note: File uploads are not supported in Next.js serverless edge this way.
    // For text/link items, this works directly. For file uploads, handle with FormData.
    const contentType = req.headers.get('content-type') || '';
    let data: any;
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      data = {
        type: formData.get('type'),
        title: formData.get('title'),
        content: formData.get('content'),
        url: formData.get('url'),
        order: formData.get('order') ? Number(formData.get('order')) : undefined,
      };
    } else {
      data = await req.json();
    }
    const item = await courseService.createModuleItem(params.moduleId, data);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
