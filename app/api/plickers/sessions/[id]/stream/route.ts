import { NextRequest } from 'next/server';
import prisma from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Hàm gửi SSE (thực tế Next.js TextEncoder)
      function send(data: any) {
        if (!isClosed) {
          const payload = `data: ${JSON.stringify({ data })}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        }
      }

      // Vòng lặp bắn event 1.5s/lần
      while (!isClosed) {
        try {
          const session = await prisma.plickersSession.findUnique({
            where: { id },
            include: { responses: { select: { questionId: true, cardNumber: true, answer: true } } }
          });
          
          if (!session) {
            isClosed = true;
            break;
          }

          send({
            status: session.status,
            currentQ: session.currentQ,
            showAnswer: session.showAnswer,  // Điều khiển từ Teacher Dashboard
            showGraph: session.showGraph,    // Điều khiển từ Teacher Dashboard
            totalResponses: session.responses.length,
            responses: session.responses,
          });

          // Ngủ 1.5s
          await new Promise(r => setTimeout(r, 1500));
        } catch (error) {
          console.error('[Plickers SSE] Lỗi Stream:', error);
          isClosed = true;
          break;
        }
      }
      
      try { 
        controller.close(); 
      } catch (error) {
        console.error('Error closing controller:', error);
      }
    },
    cancel() {
      isClosed = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
