import { MessageCircle } from 'lucide-react';
import { AiChatSection } from '../sections/AiChatSection';

export function AiChat() {
  const currentUser = JSON.parse(localStorage.getItem('canvas_user') || '{}');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-sky-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            Hỏi AI
          </h1>
          <p className="text-sky-600 mt-2 font-medium">
            Trò chuyện với trợ lý AI để được giải đáp thắc mắc học tập
          </p>
        </div>
      </div>

      {/* AI Chat Component */}
      <AiChatSection studentName={currentUser.name} />
    </div>
  );
}
