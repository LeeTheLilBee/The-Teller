
import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  FileText,
  Languages,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import {
  AccessReceiptTrail,
  DocumentCard,
  EscalationButton,
  SecurityChip,
  TraceIdTag,
} from "./SecureMoneyComponents";
import {
  CONFIDENCE_LEVEL,
  MONEY_STATUS,
  VISIBILITY_LEVEL,
  defaultEmployeeDocuments,
  getCopy,
  makeAccessReceipt,
} from "./securityIntelligence";

const employeePortalCopy = {
  en: {
    title: "Employee Payroll + Documents",
    subtitle: "Pay, account info, tax documents, handbook signatures, and protected payroll changes live here.",
    profile: "Profile",
    randomId: "Random ID",
    randomIdNote: "Completely random. Not SSN, not payroll account, not bank info.",
    nextPay: "Next pay date",
    estimatedPay: "Estimated pay",
    nextShift: "Next shift",
    accountInfo: "Account info",
    accountNote: "Changes to phone, address, tax, or direct deposit go through The Tower.",
    requestChange: "Request Change Through Tower",
    secureDocs: "Secure documents",
    secureDocsNote: "Viewing, downloading, signing, or changing sensitive documents creates an access receipt.",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    escalation: "Escalation",
    phone: "Phone",
    address: "Address",
    directDeposit: "Direct Deposit",
    towerRequired: "Tower review required",
    handbookFocus: "Handbook signature still needs attention",
    handbookBody: "The handbook can be viewed here, but the signature receipt goes to The Tower.",
    signHandbook: "Sign Handbook Through The Tower",
  },
  es: {
    title: "Nómina + Documentos de Empleada",
    subtitle: "Pago, información de cuenta, documentos de impuestos, firmas del manual y cambios protegidos de nómina viven aquí.",
    profile: "Perfil",
    randomId: "ID aleatorio",
    randomIdNote: "Completamente aleatorio. No es SSN, ni cuenta de nómina, ni información bancaria.",
    nextPay: "Próxima fecha de pago",
    estimatedPay: "Pago estimado",
    nextShift: "Próximo turno",
    accountInfo: "Información de cuenta",
    accountNote: "Cambios de teléfono, dirección, impuestos o depósito directo pasan por The Tower.",
    requestChange: "Solicitar cambio por The Tower",
    secureDocs: "Documentos seguros",
    secureDocsNote: "Ver, descargar, firmar o cambiar documentos sensibles crea un recibo de acceso.",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    escalation: "Escalación",
    phone: "Teléfono",
    address: "Dirección",
    directDeposit: "Depósito Directo",
    towerRequired: "Revisión de The Tower requerida",
    handbookFocus: "La firma del manual todavía necesita atención",
    handbookBody: "El manual se puede ver aquí, pero el recibo de firma va a The Tower.",
    signHandbook: "Firmar manual por The Tower",
  },
};

function getPortalCopy(language) {
  return employeePortalCopy[language] || employeePortalCopy.en;
}

const defaultEmployee = {
  name: "Maya J.",
  role: "Fulfillment Associate",
  randomId: "E-749362",
  nextPayDate: "Jun 21",
  estimatedPay: "$462.50",
  nextShift: "Tue · 9:00 AM - 2:00 PM",
  accountInfo: [
    {
      key: "phone",
      label: "Phone",
      value: "(404) 555-0188",
      status: MONEY_STATUS.TOWER_REQUIRED,
      icon: Phone,
    },
    {
      key: "address",
      label: "Address",
      value: "Griffin, GA",
      status: MONEY_STATUS.TOWER_REQUIRED,
      icon: UserCog,
    },
    {
      key: "direct_deposit",
      label: "Direct Deposit",
      value: "•••• 4821",
      status: MONEY_STATUS.TOWER_REQUIRED,
      icon: Banknote,
    },
  ],
};

function localTranslate(value, language) {
  if (language !== "es") return value;
  const map = {
    Phone: "Teléfono",
    Address: "Dirección",
    "Direct Deposit": "Depósito Directo",
    "W-2": "W-2",
    "W-4": "W-4",
    "I-9": "I-9",
    "Pay stubs": "Talones de pago",
    "Direct deposit form": "Formulario de depósito directo",
    "Employee handbook": "Manual del empleado",
  };
  return map[value] || value;
}

function LanguagePillToggle({ language, setLanguage }) {
  const copy = getPortalCopy(language);

  return (
    <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-2 text-xs font-black ${language === "en" ? "bg-white text-slate-950" : "text-white"}`}
      >
        {copy.english}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={`rounded-full px-3 py-2 text-xs font-black ${language === "es" ? "bg-white text-slate-950" : "text-white"}`}
      >
        {copy.spanish}
      </button>
    </div>
  );
}

function AccountInfoCard({ item, language, onReceipt }) {
  const copy = getPortalCopy(language);
  const Icon = item.icon || UserCog;

  function requestChange() {
    const receipt = makeAccessReceipt({
      actorId: defaultEmployee.randomId,
      action: "tower_account_change_request",
      target: item.label,
      category: "account_change",
      towerRequired: true,
    });
    onReceipt(receipt);
  }

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-4">
      <TraceIdTag id={`ACCT-${String(item.key).toUpperCase()}`} label={copy.randomId} />
      <div className="mt-3 flex items-center gap-2">
        <Icon size={18} className="text-sky-200" />
        <h3 className="text-lg font-black">{localTranslate(item.label, language)}</h3>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-300">{item.value}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SecurityChip label={copy.towerRequired} tone="warning" />
        <SecurityChip label="employee-only" tone="private" />
      </div>
      <button
        type="button"
        onClick={requestChange}
        className="mt-4 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-slate-950"
      >
        {copy.requestChange}
      </button>
    </article>
  );
}

function HandbookFocusCard({ language, onReceipt }) {
  const copy = getPortalCopy(language);

  function signHandbook() {
    const receipt = makeAccessReceipt({
      actorId: defaultEmployee.randomId,
      action: "tower_handbook_signature",
      target: "Employee handbook v2026.1",
      category: "signature",
      towerRequired: true,
    });
    onReceipt(receipt);
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-300/25 bg-amber-300/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
            <AlertTriangle size={15} />
            {copy.handbookFocus}
          </div>
          <h2 className="mt-2 text-2xl font-black">{localTranslate("Employee handbook", language)} · v2026.1</h2>
          <p className="mt-2 text-sm font-semibold text-slate-300">{copy.handbookBody}</p>
        </div>
        <TraceIdTag id="DOC-HANDBOOK" label="Doc ID" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SecurityChip label={getCopy(language).signatureRequired} tone="warning" />
        <SecurityChip label={getCopy(language).towerRequired} tone="warning" />
        <SecurityChip label={getCopy(language).employeeOnly} tone="private" />
      </div>
      <button
        type="button"
        onClick={signHandbook}
        className="mt-5 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950"
      >
        {copy.signHandbook}
      </button>
    </section>
  );
}

function buildEmployeeDocuments() {
  return [
    ...defaultEmployeeDocuments,
    {
      key: "employment_docs",
      label: "Employment documents",
      version: "current",
      status: MONEY_STATUS.VIEW_ONLY,
      visibility: VISIBILITY_LEVEL.EMPLOYEE_ONLY,
      source: "employee_record",
      confidence: CONFIDENCE_LEVEL.CONFIRMED,
      lastUpdated: "2026-05-24",
      nextReview: "on_change",
    },
  ];
}

export default function EmployeeDocumentVaultPanel({ initialLanguage = "en", employee = defaultEmployee }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [receipts, setReceipts] = useState([]);
  const copy = getPortalCopy(language);
  const documents = useMemo(() => buildEmployeeDocuments(), []);

  function addReceipt(receipt) {
    setReceipts((current) => [receipt, ...current].slice(0, 8));
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-2xl">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-200">
              <ShieldCheck size={15} />
              {copy.profile}
            </div>
            <h1 className="mt-2 text-3xl font-black">{employee.name}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-300">{employee.role}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TraceIdTag id={employee.randomId} label={copy.randomId} />
              <SecurityChip label={copy.randomIdNote} tone="neutral" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EscalationButton language={language} onEscalate={() => addReceipt(makeAccessReceipt({
              actorId: employee.randomId,
              action: "employee_escalation",
              target: "employee_document_vault",
              category: "escalation",
              towerRequired: false,
            }))} />
            <LanguagePillToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
            <CalendarDays size={18} className="text-sky-200" />
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{copy.nextPay}</p>
            <p className="mt-1 text-xl font-black">{employee.nextPayDate}</p>
          </article>
          <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
            <ReceiptText size={18} className="text-sky-200" />
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{copy.estimatedPay}</p>
            <p className="mt-1 text-xl font-black">{employee.estimatedPay}</p>
          </article>
          <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
            <FileText size={18} className="text-sky-200" />
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{copy.nextShift}</p>
            <p className="mt-1 text-xl font-black">{employee.nextShift}</p>
          </article>
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">{copy.accountInfo}</p>
            <h2 className="mt-2 text-2xl font-black">{copy.towerRequired}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.accountNote}</p>
          </div>
          <TraceIdTag id={`ACCOUNT-${employee.randomId}`} label={copy.randomId} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {employee.accountInfo.map((item) => (
            <AccountInfoCard key={item.key} item={item} language={language} onReceipt={addReceipt} />
          ))}
        </div>
      </section>

      <div className="mt-5">
        <HandbookFocusCard language={language} onReceipt={addReceipt} />
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-200">
              <Languages size={15} />
              {copy.secureDocs}
            </div>
            <h2 className="mt-2 text-2xl font-black">W-2 · W-4 · I-9 · Pay stubs · Handbook</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.secureDocsNote}</p>
          </div>
          <TraceIdTag id={`DOCVAULT-${employee.randomId}`} label={copy.randomId} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard
              key={document.key}
              document={{ ...document, label: localTranslate(document.label, language) }}
              actorId={employee.randomId}
              language={language}
              onReceipt={addReceipt}
            />
          ))}
        </div>
      </section>

      <div className="mt-5">
        <AccessReceiptTrail receipts={receipts} language={language} />
      </div>
    </div>
  );
}
