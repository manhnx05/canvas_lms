import { Search, Plus, Inbox as InboxIcon } from 'lucide-react';

export interface Conversation {
  id: string;
  subject?: string;
  courseId?: string;
  courseName?: string;
  unreadCount: number;
  participants: any[];
  lastMessage?: any | null;
}

interface Props {
  conversations: Conversation[];
  activeConvId?: string;
  onSelect: (conv: Conversation) => void;
  onCompose: () => void;
}

export function ConversationList({ conversations, activeConvId, onSelect, onCompose }: Props) {
  return (
    <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <InboxIcon className="w-5 h-5 text-sky-500" />
            <h2 className="font-extrabold text-slate-800 text-lg">Hộp Thư</h2>
          </div>
          <button
            onClick={onCompose}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-sm shadow-sky-200 transition-colors"
          >
            <Plus className="w-4 h-4" /> Soạn thư
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm trong Hộp thư..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-sky-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Hộp thư trống</p>
          </div>
        ) : conversations.map(conv => {
          const isActive = activeConvId === conv.id;
          const other = conv.participants[0];
          if (!other) return null;
          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`p-4 cursor-pointer border-b border-slate-100 transition-colors ${isActive ? 'bg-sky-50 border-l-4 border-l-sky-500' : 'hover:bg-slate-100'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                  {other.avatar
                    ? <img src={other.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : other.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm font-bold truncate ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-600'}`}>{other.name}</p>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">{conv.lastMessage?.timestamp || ''}</span>
                  </div>
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500 font-normal'}`}>
                    {conv.subject || 'Không có tiêu đề'}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400 truncate">{conv.lastMessage?.content || 'Chưa có nội dung'}</p>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {conv.courseName && (
                        <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-medium">{conv.courseName}</span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
