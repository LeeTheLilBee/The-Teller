
import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  Languages,
  LockKeyhole,
  Send,
  ShieldCheck,
  Siren,
} from "lucide-react";
import {
  buildFinalActionPreview,
  buildSecurityChips,
  chooseTodayMoneyFocus,
  confidenceLabel,
  getCopy,
  isSignatureRequired,
  isTowerRequired,
  makeAccessReceipt,
} from "./securityIntelligence";

const toneStyles = {
  good: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#86efac",
    borderColor: "rgba(134, 239, 172, 0.28)",
  },
  warning: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#fbbf24",
    borderColor: "rgba(251, 191, 36, 0.30)",
  },
  private: {
    background: "rgba(96, 165, 250, 0.13)",
    color: "#93c5fd",
    borderColor: "rgba(147, 197, 253, 0.28)",
  },
  team: {
    background: "rgba(45, 212, 191, 0.13)",
    color: "#5eead4",
    borderColor: "rgba(94, 234, 212, 0.28)",
  },
  owner: {
    background: "rgba(244, 114, 182, 0.13)",
    color: "#f9a8d4",
    borderColor: "rgba(249, 168, 212, 0.28)",
  },
  neutral: {
    background: "rgba(148, 163, 184, 0.12)",
    color: "#cbd5e1",
    borderColor: "rgba(203, 213, 225, 0.22)",
  },
};

function chipStyle(tone = "neutral") {
  return toneStyles[tone] || toneStyles.neutral;
}

export function SecurityChip({ label, tone = "neutral" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]" style={chipStyle(tone)}>
      <ShieldCheck size={12} />
      {label}
    </span>
  );
}

export function SecurityChipRow({ item, language = "en" }) {
  const chips = buildSecurityChips(item, language);
  if (!chips.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <SecurityChip key={`${chip.label}-${chip.tone}`} label={chip.label} tone={chip.tone} />
      ))}
    </div>
  );
}

export function SourceConfidenceBadge({ source, confidence, language = "en" }) {
  const copy = getCopy(language);

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
      <span className="rounded-full border px-3 py-1.5" style={chipStyle("neutral")}>
        {copy.source}: {source || "manual"}
      </span>
      <span className="rounded-full border px-3 py-1.5" style={chipStyle(confidence === "confirmed" ? "good" : "warning")}>
        {copy.confidence}: {confidenceLabel(confidence, language)}
      </span>
    </div>
  );
}

export function TraceIdTag({ id, label = "ID" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
      {label} · {id}
    </span>
  );
}

export function EscalationButton({ language = "en", onEscalate }) {
  const copy = getCopy(language);

  return (
    <button
      type="button"
      onClick={onEscalate}
      className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/12 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-amber-200"
      title={copy.escalationNote}
    >
      <Siren size={15} />
      {copy.escalate}
    </button>
  );
}

export function SecureDownloadWarning({ documentLabel, language = "en", onCancel, onContinue }) {
  const copy = getCopy(language);

  return (
    <section className="rounded-[1.5rem] border border-amber-300/30 bg-amber-300/10 p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-300/15 p-3 text-amber-200">
          <LockKeyhole size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">{copy.secureDownload}</p>
          <h3 className="mt-2 text-xl font-black">{documentLabel}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-300">{copy.secureDownloadBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onContinue} className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">
              {copy.continue}
            </button>
            <button type="button" onClick={onCancel} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">
              {copy.cancel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalActionPreview({ action, language = "en", onCancel, onConfirm }) {
  const copy = getCopy(language);
  const preview = buildFinalActionPreview(action, language);

  return (
    <section className="rounded-[1.5rem] border border-sky-300/25 bg-sky-300/10 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">{copy.finalReview}</p>
      <h3 className="mt-2 text-xl font-black">{preview.title}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-300">{preview.body}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {preview.willMoveMoney ? <SecurityChip label="Money action" tone="warning" /> : null}
        {preview.willSaveProof ? <SecurityChip label="Proof saved" tone="good" /> : null}
        {preview.willCreateReceipt ? <SecurityChip label={copy.createReceipt} tone="private" /> : null}
        {preview.willSendToTower ? <SecurityChip label={copy.sendToTower} tone="warning" /> : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onConfirm} className="rounded-full bg-sky-300 px-4 py-2 text-xs font-black text-slate-950">
          {copy.continue}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">
          {copy.cancel}
        </button>
      </div>
    </section>
  );
}

export function DocumentCard({ document, actorId, language = "en", onReceipt }) {
  const copy = getCopy(language);
  const [showWarning, setShowWarning] = useState(false);
  const tower = isTowerRequired(document.status);
  const signature = isSignatureRequired(document.status);

  function createReceipt(action) {
    const receipt = makeAccessReceipt({
      actorId,
      action,
      target: document.label,
      category: "document",
      towerRequired: tower || signature,
    });
    if (onReceipt) onReceipt(receipt);
  }

  if (showWarning) {
    return (
      <SecureDownloadWarning
        documentLabel={document.label}
        language={language}
        onCancel={() => setShowWarning(false)}
        onContinue={() => {
          createReceipt("secure_download");
          setShowWarning(false);
        }}
      />
    );
  }

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TraceIdTag id={`DOC-${String(document.key || document.label).toUpperCase()}`} label="Doc ID" />
          <h3 className="mt-3 text-xl font-black">{document.label}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            {copy.documentVersion}: {document.version}
          </p>
        </div>
        <FileText className="text-slate-300" size={22} />
      </div>

      <SecurityChipRow item={document} language={language} />
      <SourceConfidenceBadge source={document.source} confidence={document.confidence} language={language} />

      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-300 sm:grid-cols-2">
        <p>{copy.lastUpdated}: {document.lastUpdated}</p>
        <p>{copy.nextReview}: {document.nextReview}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowWarning(true)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">
          <Eye size={14} />
          {copy.secureDownload}
        </button>

        {tower ? (
          <button type="button" onClick={() => createReceipt("tower_change_request")} className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">
            <Send size={14} />
            {copy.sendToTower}
          </button>
        ) : null}

        {signature ? (
          <button type="button" onClick={() => createReceipt("tower_signature")} className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">
            <ShieldCheck size={14} />
            {copy.sendToTower}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function EmployeeDocumentVault({ documents = [], actorId, language = "en", onReceipt }) {
  const copy = getCopy(language);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">{copy.securePaperwork || "Secure paperwork"}</p>
          <h2 className="mt-2 text-2xl font-black">W-2, W-4, I-9, pay stubs, handbook</h2>
        </div>
        <TraceIdTag id={actorId} label="Actor ID" />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => (
          <DocumentCard key={document.key || document.label} document={document} actorId={actorId} language={language} onReceipt={onReceipt} />
        ))}
      </div>
    </section>
  );
}

export function TodayMoneyFocus({ queue = [], language = "en" }) {
  const copy = getCopy(language);
  const focus = useMemo(() => chooseTodayMoneyFocus(queue), [queue]);

  if (!focus) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">{copy.todayMoneyFocus}</p>
          <h2 className="mt-2 text-3xl font-black">{focus.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">{focus.business} · {focus.lane} · {focus.amount}</p>
        </div>
        <SecurityChip label={confidenceLabel(focus.confidence, language)} tone={focus.confidence === "confirmed" ? "good" : "warning"} />
      </div>
      <SourceConfidenceBadge source={focus.source} confidence={focus.confidence} language={language} />
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">
          <CheckCircle2 size={14} />
          {copy.continue}
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">
          <HelpCircle size={14} />
          {copy.whySeeingThis}
        </button>
      </div>
    </section>
  );
}

export function CalmMoneyModePanel({ queue = [], language = "en" }) {
  const copy = getCopy(language);
  const focus = useMemo(() => chooseTodayMoneyFocus(queue), [queue]);

  if (!focus) return null;

  return (
    <section className="rounded-[2rem] border border-violet-200/20 bg-violet-300/10 p-6">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
        <Languages size={15} />
        {copy.calmMoneyMode}
      </div>
      <h2 className="mt-3 text-3xl font-black">{focus.title}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-300">{copy.calmMoneyModeBody}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <SecurityChip label={focus.amount} tone="neutral" />
        <SecurityChip label={focus.due} tone="warning" />
        <SecurityChip label={confidenceLabel(focus.confidence, language)} tone="private" />
      </div>
    </section>
  );
}

export function AccessReceiptTrail({ receipts = [], language = "en" }) {
  const copy = getCopy(language);

  if (!receipts.length) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">{copy.accessReceipt}</p>
      <div className="mt-4 grid gap-3">
        {receipts.map((receipt) => (
          <article key={receipt.receiptId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TraceIdTag id={receipt.receiptId} label="Receipt" />
              <SecurityChip label={receipt.status} tone={receipt.towerRequired ? "warning" : "good"} />
            </div>
            <p className="mt-3 text-sm font-black">{receipt.action} · {receipt.target}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{receipt.createdAt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
