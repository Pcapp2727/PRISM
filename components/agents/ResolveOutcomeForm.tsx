'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResolveOutcomeForm({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const [succeeded, setSucceeded] = useState<boolean | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (succeeded === null || description.trim().length === 0) {
      setErr('Pick an outcome and write a one-line description.');
      return;
    }
    setSubmitting(true);
    setErr(null);

    try {
      const res = await fetch(`/api/agent-decisions/${decisionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          succeeded,
          description: description.trim(),
          actual_value_usd: value ? Number(value) : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono mb-3">
        Resolve Outcome
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSucceeded(true)}
          className={`flex-1 py-2 text-sm rounded border transition-colors ${
            succeeded === true
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-white/[0.06] text-white/40 hover:border-white/20'
          }`}
        >
          Succeeded
        </button>
        <button
          type="button"
          onClick={() => setSucceeded(false)}
          className={`flex-1 py-2 text-sm rounded border transition-colors ${
            succeeded === false
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
              : 'border-white/[0.06] text-white/40 hover:border-white/20'
          }`}
        >
          Failed
        </button>
      </div>

      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="One-line outcome description"
        className="w-full bg-white/[0.02] border border-white/[0.06] rounded px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:border-[#5B9DF5]/35 focus:outline-none mb-2"
      />
      <input
        value={value}
        onChange={e => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
        placeholder="Actual $ value (optional)"
        className="w-full bg-white/[0.02] border border-white/[0.06] rounded px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:border-[#5B9DF5]/35 focus:outline-none mb-2"
        inputMode="decimal"
      />
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional — what surprised you, what to watch for)"
        rows={2}
        className="w-full bg-white/[0.02] border border-white/[0.06] rounded px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:border-[#5B9DF5]/35 focus:outline-none mb-3 resize-none"
      />

      {err && (
        <div className="text-xs text-rose-400 mb-3">{err}</div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full py-2.5 text-[10px] tracking-[0.2em] uppercase font-mono rounded border border-[#5B9DF5]/35 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Resolving...' : 'Log Outcome + Compute Brier'}
      </button>
    </div>
  );
}
