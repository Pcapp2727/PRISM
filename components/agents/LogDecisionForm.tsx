'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogDecisionForm({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [open, setOpen]                   = useState(false);
  const [summary, setSummary]             = useState('');
  const [domain, setDomain]               = useState('');
  const [category, setCategory]           = useState('');
  const [predDescription, setPredDesc]    = useState('');
  const [probability, setProbability]     = useState(70);          // shown 0-100, sent 0-1
  const [ev, setEv]                       = useState('');
  const [resolutionDate, setResDate]      = useState(defaultResolutionDate());
  const [notes, setNotes]                 = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [err, setErr]                     = useState<string | null>(null);

  async function submit() {
    if (!summary.trim() || !domain.trim() || !category.trim() || !predDescription.trim()) {
      setErr('Summary, domain, category, and predicted outcome are required.');
      return;
    }
    setSubmitting(true);
    setErr(null);

    try {
      const res = await fetch('/api/agent-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          domain,
          category,
          decision_summary:       summary,
          predicted_description:  predDescription,
          predicted_probability:  probability / 100,
          expected_value_usd:     ev ? Number(ev) : undefined,
          resolution_date:        new Date(resolutionDate).toISOString(),
          notes:                  notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Reset + close + refresh
      setSummary('');
      setDomain('');
      setCategory('');
      setPredDesc('');
      setProbability(70);
      setEv('');
      setResDate(defaultResolutionDate());
      setNotes('');
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 text-[10px] tracking-[0.2em] uppercase font-mono rounded border border-[#5B9DF5]/35 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 transition-colors"
      >
        + Log New Decision
      </button>
    );
  }

  return (
    <div className="border border-[#5B9DF5]/20 rounded-lg p-5 bg-[#5B9DF5]/[0.02]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5B9DF5] font-mono">
            New Decision
          </div>
          <div className="text-xs text-white/45 mt-1">
            Log what you&apos;re deciding now. Resolve it later when the outcome is known.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-white/30 hover:text-white/60 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <Field label="Decision Summary" required>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={2}
          placeholder="What specific decision is being made?"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Domain" required>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="pricing, sales, ops..."
            className={inputClass}
          />
        </Field>
        <Field label="Category" required>
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="quote_over_10k"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Predicted Outcome" required>
        <textarea
          value={predDescription}
          onChange={e => setPredDesc(e.target.value)}
          rows={2}
          placeholder='What do you expect to happen? (e.g., "Customer accepts quote within 30 days")'
          className={inputClass}
        />
      </Field>

      <Field label={`Probability: ${probability}%`}>
        <input
          type="range"
          min={1}
          max={99}
          value={probability}
          onChange={e => setProbability(Number(e.target.value))}
          className="w-full accent-[#5B9DF5]"
        />
        <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1">
          <span>1%</span>
          <span>50/50</span>
          <span>99%</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected Value ($, optional)">
          <input
            value={ev}
            onChange={e => setEv(e.target.value.replace(/[^0-9.-]/g, ''))}
            placeholder="45000"
            inputMode="decimal"
            className={inputClass}
          />
        </Field>
        <Field label="Resolve By" required>
          <input
            type="date"
            value={resolutionDate}
            onChange={e => setResDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Reasoning, context, what would change your mind..."
          className={inputClass}
        />
      </Field>

      {err && (
        <div className="text-xs text-rose-400 mb-3">{err}</div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase font-mono rounded border border-white/[0.06] text-white/45 hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase font-mono rounded border border-[#5B9DF5]/35 text-[#5B9DF5] hover:bg-[#5B9DF5]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Logging...' : 'Log Decision'}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-white/[0.02] border border-white/[0.06] rounded px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:border-[#5B9DF5]/35 focus:outline-none';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40 font-mono mb-1">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </div>
      {children}
    </div>
  );
}

function defaultResolutionDate(): string {
  // 30 days from today, formatted YYYY-MM-DD
  const d = new Date(Date.now() + 30 * 86_400_000);
  return d.toISOString().slice(0, 10);
}
