import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const SUGGESTIONS = [
  'What should I check next?',
  'That step did not work',
  'Explain it more simply',
  'Is it safe to run that command?',
];

export default function FollowUpChat({ session, busy, onSend, onAttach }) {
  const [text, setText] = useState('');
  const [label, setLabel] = useState('after');
  const fileRef = useRef(null);
  const messages = (session.messages || []).filter((item) => item.kind !== 'system');

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText('');
  };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card/60 p-4">
      <h2 className="font-heading text-sm font-semibold tracking-tight">Follow-up conversation</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Answer the question, report what happened, or attach the next screenshot. The whole session stays in context.
      </p>

      <div className="mt-3 max-h-[320px] min-h-[120px] flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
              item.role === 'user'
                ? 'ml-6 border border-evidence/30 bg-evidence/10'
                : 'mr-6 border border-border bg-background/60 text-foreground/90'
            }`}
          >
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {item.role === 'user' ? 'you' : 'assistant'} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {item.content}
          </div>
        ))}
        {busy === 'chat' && (
          <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> working through your answer…
          </p>
        )}
        {busy === 'attach' && (
          <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> assessing the new screenshot…
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={busy}
            onClick={() => onSend(suggestion)}
            className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event);
          }}
          rows={3}
          placeholder="What did you see, or what do you want to know next?"
          className="resize-none bg-background text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-[11px] text-muted-foreground focus:border-evidence focus:outline-none"
            >
              <option value="after">label: after</option>
              <option value="before">label: before</option>
              <option value="other">label: other</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" /> add screenshot
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onAttach(file, label);
              }}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-evidence px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {busy === 'chat' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} send
          </button>
        </div>
      </form>
    </section>
  );
}