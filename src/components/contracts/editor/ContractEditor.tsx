'use client';

/**
 * ContractEditor
 *
 * Rich-text editor for in-platform contract negotiation.
 *
 * Workflow:
 *   1.  No documentHtml stored yet → show the generated template with an
 *       "Open for Editing" button that saves the template as the baseline.
 *   2.  documentHtml exists, no PENDING revision → editing enabled.
 *       The toolbar shows a live "Show Changes" toggle that diffs the current
 *       editor state against the saved baseline in real time (debounced 400ms).
 *   3.  PENDING revision exists, proposed by me → locked view; review pane
 *       shows my proposed diff while waiting for the other party.
 *   4.  PENDING revision exists, proposed by the other party → amber banner
 *       prompts me to switch to the "Review Changes" pane.
 *   5.  On Accept: proposed HTML becomes the new documentHtml baseline.
 *       On Decline: revision is marked DECLINED; editor is unlocked for me
 *       to counter-propose.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  List, ListOrdered, Undo2, Redo2,
  MessageSquare, Eye, Edit3, Send, Clock, AlertTriangle, CheckCircle2, XCircle,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { htmlDiff, countChanges } from '@/lib/htmlDiff';
import { RevisionDiffViewer, type Revision } from './RevisionDiffViewer';
import { CommentSidebar, type DocComment } from './CommentSidebar';

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  contractId: string;
  /** Current accepted document HTML, or null if not yet initialized */
  initialHtml: string | null;
  currentUserRole: 'buyer' | 'seller';
  currentUserName?: string;
  readOnly?: boolean;
  onSaved?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export function ContractEditor({
  contractId,
  initialHtml,
  currentUserRole,
  currentUserName,
  readOnly = false,
  onSaved,
}: Props) {

  // ── state ──────────────────────────────────────────────────────────────────
  const [revisions,       setRevisions]       = useState<Revision[]>([]);
  const [comments,        setComments]        = useState<DocComment[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [submitting,      setSubmitting]      = useState(false);

  // view: 'edit' | 'diff' | 'review'
  const [view,            setView]            = useState<'edit' | 'diff' | 'review'>('edit');
  const [showComments,    setShowComments]    = useState(false);
  const [showChanges,     setShowChanges]     = useState(false);  // live diff overlay
  const [liveChangeCount, setLiveChangeCount] = useState(0);
  const [liveDiffHtml,    setLiveDiffHtml]    = useState('');
  const [submitMsg,       setSubmitMsg]       = useState('');
  const [showSubmitForm,  setShowSubmitForm]  = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  const diffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── derived ────────────────────────────────────────────────────────────────
  const pendingRevision      = revisions.find(r => r.status === 'PENDING') ?? null;
  const isMyTurnToRespond    = !!pendingRevision && pendingRevision.authorRole !== currentUserRole;
  const isWaitingForResponse = !!pendingRevision && pendingRevision.authorRole === currentUserRole;
  const canEdit              = !pendingRevision && !readOnly;

  const unresolved = useMemo(() => comments.filter(c => !c.resolved).length, [comments]);

  // ── TipTap editor ─────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Start editing the contract…' }),
    ],
    content: initialHtml || '<p></p>',
    editable: canEdit,
    editorProps: {
      attributes: {
        class: [
          'prose prose-sm max-w-none min-h-[600px] px-10 py-8 focus:outline-none',
          'font-serif leading-relaxed text-gray-800',
        ].join(' '),
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!showChanges || !initialHtml) return;
      if (diffTimerRef.current) clearTimeout(diffTimerRef.current);
      diffTimerRef.current = setTimeout(() => {
        const html = ed.getHTML();
        setLiveChangeCount(countChanges(initialHtml, html));
        setLiveDiffHtml(htmlDiff(initialHtml, html));
      }, 400);
    },
  });

  // sync editability when pending revision changes
  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [editor, canEdit]);

  // update live diff when toggled on
  useEffect(() => {
    if (!showChanges || !editor || !initialHtml) return;
    const html = editor.getHTML();
    setLiveChangeCount(countChanges(initialHtml, html));
    setLiveDiffHtml(htmlDiff(initialHtml, html));
  }, [showChanges, initialHtml]);

  // ── data fetching ──────────────────────────────────────────────────────────
  const fetchRevisions = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/revisions`);
      if (res.ok) {
        const data: Revision[] = await res.json();
        setRevisions(data);
        const pending = data.find(r => r.status === 'PENDING');
        if (pending && pending.authorRole !== currentUserRole) {
          // Auto-select for review
          setSelectedRevision(pending);
          setView('review');
        }
      }
    } catch { /* silent */ }
  }, [contractId, currentUserRole]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* silent */ }
  }, [contractId]);

  useEffect(() => {
    Promise.all([fetchRevisions(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchRevisions, fetchComments]);

  // ── actions ────────────────────────────────────────────────────────────────

  /** Initialize the document from the generated template */
  async function initializeDocument() {
    if (!initialHtml) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHtml: initialHtml }),
      });
      if (res.ok) {
        toast.success('Document initialized. You can now edit it.');
        onSaved?.();
      }
    } finally { setSaving(false); }
  }

  /** Save the current editor content as the live document (auto-save) */
  async function saveDocument() {
    if (!editor || !canEdit) return;
    setSaving(true);
    try {
      await fetch(`/api/contracts/${contractId}/document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHtml: editor.getHTML() }),
      });
    } finally { setSaving(false); }
  }

  /** Submit current edits as a formal revision for the other party to review */
  async function submitRevision() {
    if (!editor) return;
    const proposed = editor.getHTML();
    if (proposed === initialHtml) { toast.error('No changes to propose.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedHtml: proposed,
          authorRole:   currentUserRole,
          authorName:   currentUserName,
          message:      submitMsg,
        }),
      });
      if (res.ok) {
        toast.success('Changes sent for review.');
        setShowSubmitForm(false);
        setSubmitMsg('');
        setShowChanges(false);
        await fetchRevisions();
        onSaved?.();
      } else {
        toast.error('Failed to submit revision.');
      }
    } finally { setSubmitting(false); }
  }

  /** Accept the other party's proposed revision */
  async function acceptRevision(revId: string) {
    const res = await fetch(`/api/contracts/${contractId}/revisions/${revId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', respondedBy: currentUserRole }),
    });
    if (res.ok) {
      toast.success('Revision accepted. Document updated.');
      setView('edit');
      setSelectedRevision(null);
      await fetchRevisions();
      window.location.reload();  // reload to get updated documentHtml
    } else {
      toast.error('Failed to accept revision.');
    }
  }

  /** Decline the other party's revision (editor unlocked for counter-proposal) */
  async function declineRevision(revId: string) {
    const res = await fetch(`/api/contracts/${contractId}/revisions/${revId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline', respondedBy: currentUserRole }),
    });
    if (res.ok) {
      toast.success('Revision declined. You can now propose your own changes.');
      setView('edit');
      setSelectedRevision(null);
      await fetchRevisions();
    } else {
      toast.error('Failed to decline revision.');
    }
  }

  async function addComment(text: string, anchorText?: string) {
    const res = await fetch(`/api/contracts/${contractId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorRole: currentUserRole,
        authorName: currentUserName,
        anchorText,
        text,
        revisionId: selectedRevision?.id ?? null,
      }),
    });
    if (res.ok) await fetchComments();
  }

  async function resolveComment(id: string) {
    const res = await fetch(`/api/contracts/${contractId}/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true, resolvedBy: currentUserRole }),
    });
    if (res.ok) await fetchComments();
  }

  // ── render helpers ─────────────────────────────────────────────────────────

  const ToolbarBtn = ({
    onClick, active = false, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors',
        active && 'bg-gray-200 text-foreground'
      )}
    >
      {children}
    </button>
  );

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-16 border rounded-xl bg-white">
      <div className="animate-spin h-7 w-7 rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div className={cn('flex border rounded-xl overflow-hidden bg-white shadow-sm min-h-[700px]', showComments && 'divide-x')}>
      {/* ── left / main panel ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── status banners ── */}
        {isMyTurnToRespond && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              <strong>{pendingRevision!.authorName ?? pendingRevision!.authorRole}</strong> has proposed
              document changes. Review them before editing further.
            </span>
            <button
              onClick={() => { setSelectedRevision(pendingRevision); setView('review'); }}
              className="text-xs font-semibold underline hover:no-underline shrink-0"
            >
              Review changes →
            </button>
          </div>
        )}
        {isWaitingForResponse && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-700 text-sm shrink-0">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="flex-1">Your proposed changes are awaiting the other party's review.</span>
            <button
              onClick={() => { setSelectedRevision(pendingRevision); setView('review'); }}
              className="text-xs font-semibold underline hover:no-underline shrink-0"
            >
              View your diff →
            </button>
          </div>
        )}

        {/* ── view toggle tabs ── */}
        <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50 shrink-0">
          {[
            { id: 'edit',   label: canEdit ? 'Edit Document' : 'View Document', Icon: Edit3 },
            ...(pendingRevision || revisions.length > 0
              ? [{ id: 'review' as const, label: 'Review Changes', Icon: GitCompare }]
              : []),
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setView(id as 'edit' | 'review'); if (id === 'review') setSelectedRevision(pendingRevision ?? revisions[0] ?? null); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                view === id
                  ? 'bg-white shadow-sm border text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {id === 'review' && isMyTurnToRespond && (
                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">!</span>
              )}
            </button>
          ))}

          {/* revision history picker */}
          {revisions.length > 0 && (
            <div className="ml-auto">
              <select
                className="text-xs border rounded px-2 py-1 bg-white text-muted-foreground"
                value={selectedRevision?.id ?? ''}
                onChange={e => {
                  const rev = revisions.find(r => r.id === e.target.value) ?? null;
                  setSelectedRevision(rev);
                  if (rev) setView('review');
                }}
              >
                <option value="" disabled>Revision history ({revisions.length})</option>
                {revisions.map(r => (
                  <option key={r.id} value={r.id}>
                    v{r.version} · {r.authorRole} · {r.status} · {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* comment toggle */}
          <button
            onClick={() => setShowComments(s => !s)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors',
              showComments
                ? 'bg-primary text-white border-primary'
                : 'text-muted-foreground hover:text-foreground border-gray-200',
              !revisions.length && 'ml-auto'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {unresolved > 0 && (
              <span className="h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {unresolved > 9 ? '9+' : unresolved}
              </span>
            )}
          </button>
        </div>

        {/* ════════════ EDIT VIEW ════════════ */}
        {view === 'edit' && (
          <>
            {/* formatting toolbar */}
            {canEdit && editor && (
              <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-gray-50 flex-wrap shrink-0">
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}         title="Bold">        <Bold className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}       title="Italic">      <Italic className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}    title="Underline">   <UnderlineIcon className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}       title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarBtn>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}  title="Bullet list"> <List className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></ToolbarBtn>

                <div className="h-5 w-px bg-gray-300 mx-1" />

                {/* live diff toggle */}
                <button
                  onClick={() => setShowChanges(s => !s)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                    showChanges
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'text-muted-foreground border-gray-200 hover:text-foreground'
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Show Changes
                  {showChanges && liveChangeCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {liveChangeCount}
                    </span>
                  )}
                </button>

                <div className="ml-auto flex items-center gap-2">
                  {saving && <span className="text-[11px] text-muted-foreground animate-pulse">Saving…</span>}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={saveDocument} disabled={saving}>
                    Save Draft
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={() => setShowSubmitForm(s => !s)}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Propose Revision
                  </Button>
                </div>
              </div>
            )}

            {/* not-editable notice */}
            {!canEdit && !readOnly && (
              <div className="px-4 py-2 bg-gray-50 border-b text-xs text-muted-foreground flex items-center gap-2 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                Locked while a revision is pending. Respond to the pending revision to unlock editing.
              </div>
            )}

            {/* submit form */}
            {showSubmitForm && canEdit && (
              <div className="px-4 py-3 border-b bg-blue-50 space-y-2 shrink-0">
                <p className="text-xs font-semibold text-blue-900">
                  Propose your changes to the other party
                </p>
                <textarea
                  rows={2}
                  placeholder="Optional: add a cover note explaining your changes…"
                  value={submitMsg}
                  onChange={e => setSubmitMsg(e.target.value)}
                  className="w-full text-sm border rounded-md px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitRevision} disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send for Review'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSubmitForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* document pane — either live diff overlay or editor */}
            <div className="flex flex-1 overflow-hidden">
              {showChanges && liveDiffHtml ? (
                /* live diff overlay */
                <div
                  className="flex-1 overflow-auto px-10 py-8 prose prose-sm max-w-none font-serif leading-relaxed text-gray-800 bg-yellow-50/30"
                  dangerouslySetInnerHTML={{ __html: liveDiffHtml }}
                />
              ) : (
                <div className="flex-1 overflow-auto">
                  <EditorContent editor={editor} />
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ REVIEW VIEW ════════════ */}
        {view === 'review' && selectedRevision && (
          <RevisionDiffViewer
            revision={selectedRevision}
            currentUserRole={currentUserRole}
            isMyTurnToRespond={isMyTurnToRespond && selectedRevision.id === pendingRevision?.id}
            onAccept={() => acceptRevision(selectedRevision.id)}
            onDecline={() => declineRevision(selectedRevision.id)}
            onBack={() => setView('edit')}
          />
        )}

        {view === 'review' && !selectedRevision && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a revision from the history picker above.
          </div>
        )}
      </div>

      {/* ── comment sidebar ── */}
      {showComments && (
        <div className="w-72 shrink-0">
          <CommentSidebar
            comments={comments}
            currentUserRole={currentUserRole}
            onAddComment={addComment}
            onResolve={resolveComment}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}
    </div>
  );
}
