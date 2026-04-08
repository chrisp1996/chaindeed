'use client';

import { useState } from 'react';
import { MessageSquare, X, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DocComment {
  id: string;
  authorRole: string;
  authorName?: string;
  anchorText?: string;
  text: string;
  resolved: boolean;
  createdAt: string;
}

interface CommentSidebarProps {
  comments: DocComment[];
  currentUserRole: string;
  onAddComment: (text: string, anchorText?: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onClose: () => void;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function CommentSidebar({
  comments,
  currentUserRole,
  onAddComment,
  onResolve,
  onClose,
}: CommentSidebarProps) {
  const [draft, setDraft]           = useState('');
  const [posting, setPosting]       = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const open     = comments.filter(c => !c.resolved);
  const resolved = comments.filter(c => c.resolved);
  const list     = showResolved ? comments : open;

  async function post() {
    if (!draft.trim()) return;
    setPosting(true);
    try { await onAddComment(draft.trim()); setDraft(''); }
    finally { setPosting(false); }
  }

  const roleColor = (role: string) =>
    role === 'buyer' ? 'bg-blue-500' : role === 'seller' ? 'bg-purple-500' : 'bg-gray-500';

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Comments</span>
          {open.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {open.length} open
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* compose */}
      <div className="px-3 py-2.5 border-b space-y-2 shrink-0">
        <textarea
          rows={3}
          placeholder="Add a comment… (⌘↵ to post)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post(); }}
          className="w-full text-sm border rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">⌘↵ to post</span>
          <Button size="sm" className="h-7 text-xs" onClick={post} disabled={posting || !draft.trim()}>
            Post
          </Button>
        </div>
      </div>

      {/* resolved toggle */}
      {resolved.length > 0 && (
        <button
          onClick={() => setShowResolved(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground border-b shrink-0 transition-colors"
        >
          {showResolved
            ? <><ChevronUp className="h-3 w-3" /> Hide {resolved.length} resolved</>
            : <><ChevronDown className="h-3 w-3" /> Show {resolved.length} resolved</>}
        </button>
      )}

      {/* list */}
      <div className="flex-1 overflow-y-auto divide-y">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare className="h-7 w-7 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No comments yet</p>
          </div>
        ) : (
          list.map(c => (
            <div key={c.id} className={cn('px-3 py-3 space-y-1.5', c.resolved && 'opacity-50')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white', roleColor(c.authorRole))}>
                    {(c.authorName ?? c.authorRole).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold">{c.authorName ?? c.authorRole}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
              </div>

              {c.anchorText && (
                <p className="text-[11px] text-muted-foreground italic border-l-2 border-amber-400 pl-2 bg-amber-50 py-0.5 rounded-r">
                  &ldquo;{c.anchorText.length > 70 ? c.anchorText.slice(0, 70) + '…' : c.anchorText}&rdquo;
                </p>
              )}

              <p className="text-xs text-gray-800 leading-relaxed">{c.text}</p>

              {!c.resolved ? (
                <button
                  onClick={() => onResolve(c.id)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-green-600 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" /> Resolve
                </button>
              ) : (
                <p className="flex items-center gap-1 text-[11px] text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Resolved
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
