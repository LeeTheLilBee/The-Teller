
import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Languages,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import EmployeeDocumentVaultPanel from "./EmployeeDocumentVaultPanel";
import {
  AccessReceiptTrail,
  EscalationButton,
  SecurityChip,
  SourceConfidenceBadge,
  TraceIdTag,
} from "./SecureMoneyComponents";
import {
  CONFIDENCE_LEVEL,
  MONEY_STATUS,
  VISIBILITY_LEVEL,
  getCopy,
  makeAccessReceipt,
} from "./securityIntelligence";

const managerCopy = {
  en: {
    title: "Manager Payroll Tools",
    subtitle: "Managers get employee access plus schedule-to-payroll tools based on role permission.",
    managerId: "Manager ID",
    employeeId: "Employee ID",
    managerMeld: "Manager = employee portal + manager tools",
    managerMeldBody: "This person can still view their own pay, tax paperwork, handbook, and Tower-routed account changes. Manager tools are added on top.",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    scheduleToPay: "Schedule-to-pay board",
    teamCoverage: "Team coverage",
    timeEdits: "Time edits",
    availability: "Availability",
    hoursReady: "Hours ready",
    reviewTimeEdits: "Review time edits",
    assignCoverage: "Assign coverage",
    approveHours: "Approve hours",
    reviewAvailability: "Review availability",
    wrongHours: "Wrong hours",
    missingCoverage: "Missing coverage",
    payrollImpact: "Payroll impact",
    managerOnly: "Manager tool",
    teamLevelOnly: "Team-level only",
    towerSensitive: "Tower-routed if it changes pay, tax, bank, or identity info.",
    employeePortalBelow: "Employee-side portal below",
    employeePortalBody: "The secure employee document vault is included because managers are employees too.",
    escalationCreated: "Manager escalation created",
    receipts: "Manager receipts",
  },
  es: {
    title: "Herramientas de nómina para gerentes",
    subtitle: "Los gerentes tienen acceso de empleado más herramientas de horario-a-nómina según permisos del rol.",
    managerId: "ID de gerente",
    employeeId: "ID de empleada",
    managerMeld: "Gerente = portal de empleada + herramientas de gerente",
    managerMeldBody: "Esta persona todavía puede ver su propio pago, papeleo de impuestos, manual y cambios de cuenta por The Tower. Las herramientas de gerente se agregan encima.",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    scheduleToPay: "Panel de horario a pago",
    teamCoverage: "Cobertura del equipo",
    timeEdits: "Ediciones de tiempo",
    availability: "Disponibilidad",
    hoursReady: "Horas listas",
    reviewTimeEdits: "Revisar ediciones de tiempo",
    assignCoverage: "Asignar cobertura",
    approveHours: "Aprobar horas",
    reviewAvailability: "Revisar disponibilidad",
    wrongHours: "Horas incorrectas",
    missingCoverage: "Falta cobertura",
    payrollImpact: "Impacto en nómina",
    managerOnly: "Herramienta de gerente",
    teamLevelOnly: "Solo nivel de equipo",
    towerSensitive: "Pasa por The Tower si cambia pago, impuestos, banco o información de identidad.",
    employeePortalBelow: "Portal de empleada abajo",
    employeePortalBody: "La bóveda segura de documentos de empleada está incluida porque los gerentes también son empleados.",
    escalationCreated: "Escalación de gerente creada",
    receipts: "Recibos de gerente",
  },
};

const managerProfile = {
  name: "Jordan R.",
  role: "Shift Manager",
  managerId: "M-318704",
  employeeId: "E-524891",
  team: "Fulfillment Team",
  nextPayDate: "Jun 21",
  estimatedPay: "$612.40",
  nextShift: "Tue · 8:00 AM - 4:00 PM",
};

const managerMetrics = [
  {
    key: "coverage",
    label: "teamCoverage",
    value: "4 / 5",
    detail: "One open shift",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "schedule_record",
    confidence: CONFIDENCE_LEVEL.NEEDS_PROOF,
    icon: UsersRound,
  },
  {
    key: "time-edits",
    label: "timeEdits",
    value: "2",
    detail: "Affects payroll",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "time_clock",
    confidence: CONFIDENCE_LEVEL.NEEDS_PROOF,
    icon: Clock3,
  },
  {
    key: "availability",
    label: "availability",
    value: "1",
    detail: "Needs review",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "employee_request",
    confidence: CONFIDENCE_LEVEL.ESTIMATED,
    icon: CalendarDays,
  },
  {
    key: "hours",
    label: "hoursReady",
    value: "18.5",
    detail: "Ready to approve",
    status: MONEY_STATUS.READY,
    source: "schedule_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    icon: CheckCircle2,
  },
];

const managerActions = [
  {
    key: "review-time-edits",
    label: "reviewTimeEdits",
    detail: "Review clock edits before payroll locks.",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "time_clock",
    confidence: CONFIDENCE_LEVEL.NEEDS_PROOF,
    receiptAction: "manager_review_time_edits",
  },
  {
    key: "assign-coverage",
    label: "assignCoverage",
    detail: "Assign or confirm the uncovered shift.",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "schedule_record",
    confidence: CONFIDENCE_LEVEL.ESTIMATED,
    receiptAction: "manager_assign_coverage",
  },
  {
    key: "approve-hours",
    label: "approveHours",
    detail: "Approve team hours for payroll readiness.",
    status: MONEY_STATUS.READY,
    source: "schedule_record",
    confidence: CONFIDENCE_LEVEL.CONFIRMED,
    receiptAction: "manager_approve_hours",
  },
  {
    key: "review-availability",
    label: "reviewAvailability",
    detail: "Review availability update before schedule changes affect pay.",
    status: MONEY_STATUS.NEEDS_REVIEW,
    source: "employee_request",
    confidence: CONFIDENCE_LEVEL.NEEDS_PROOF,
    receiptAction: "manager_review_availability",
  },
];

function getManagerCopy(language) {
  return managerCopy[language] || managerCopy.en;
}

function ManagerLanguageToggle({ language, setLanguage }) {
  const copy = getManagerCopy(language);

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

function ManagerMetricCard({ item, language }) {
  const copy = getManagerCopy(language);
  const Icon = item.icon;

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-4">
      <TraceIdTag id={`MGR-METRIC-${String(item.key).toUpperCase()}`} label={copy.managerId} />
      <div className="mt-3 flex items-center gap-2">
        <Icon size={18} className="text-teal-200" />
        <h3 className="text-lg font-black">{copy[item.label]}</h3>
      </div>
      <p className="mt-2 text-3xl font-black">{item.value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-300">{item.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SecurityChip label={copy.managerOnly} tone="team" />
        <SecurityChip label={copy.teamLevelOnly} tone="private" />
      </div>
      <SourceConfidenceBadge source={item.source} confidence={item.confidence} language={language} />
    </article>
  );
}

function ManagerActionCard({ action, language, onReceipt }) {
  const copy = getManagerCopy(language);

  function handleAction() {
    const receipt = makeAccessReceipt({
      actorId: managerProfile.managerId,
      action: action.receiptAction,
      target: action.label,
      category: "manager_schedule_to_pay",
      towerRequired: false,
    });
    onReceipt(receipt);
  }

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-4">
      <TraceIdTag id={`MGR-ACTION-${String(action.key).toUpperCase()}`} label={copy.managerId} />
      <h3 className="mt-3 text-xl font-black">{copy[action.label]}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-300">{action.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SecurityChip label={copy.managerOnly} tone="team" />
        <SecurityChip label={copy.payrollImpact} tone={action.confidence === CONFIDENCE_LEVEL.CONFIRMED ? "good" : "warning"} />
      </div>
      <SourceConfidenceBadge source={action.source} confidence={action.confidence} language={language} />
      <button
        type="button"
        onClick={handleAction}
        className="mt-4 rounded-full bg-teal-300 px-4 py-2 text-xs font-black text-slate-950"
      >
        {copy[action.label]}
      </button>
    </article>
  );
}

function ManagerMeldSummary({ language }) {
  const copy = getManagerCopy(language);

  return (
    <section className="rounded-[1.75rem] border border-teal-300/20 bg-teal-300/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-200">
            <ShieldCheck size={15} />
            {copy.managerMeld}
          </div>
          <h2 className="mt-2 text-3xl font-black">{managerProfile.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-300">{managerProfile.role} · {managerProfile.team}</p>
          <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-300">{copy.managerMeldBody}</p>
        </div>
        <div className="grid gap-2">
          <TraceIdTag id={managerProfile.managerId} label={copy.managerId} />
          <TraceIdTag id={managerProfile.employeeId} label={copy.employeeId} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
          <ReceiptText size={18} className="text-teal-200" />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Estimated pay</p>
          <p className="mt-1 text-xl font-black">{managerProfile.estimatedPay}</p>
        </article>
        <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
          <CalendarDays size={18} className="text-teal-200" />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Next pay date</p>
          <p className="mt-1 text-xl font-black">{managerProfile.nextPayDate}</p>
        </article>
        <article className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-4">
          <Clock3 size={18} className="text-teal-200" />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Next shift</p>
          <p className="mt-1 text-xl font-black">{managerProfile.nextShift}</p>
        </article>
      </div>
    </section>
  );
}

export default function ManagerMeldPanel({ initialLanguage = "en" }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [receipts, setReceipts] = useState([]);
  const copy = getManagerCopy(language);
  const sharedEmployeeProfile = useMemo(() => ({
    name: managerProfile.name,
    role: managerProfile.role,
    randomId: managerProfile.employeeId,
    nextPayDate: managerProfile.nextPayDate,
    estimatedPay: managerProfile.estimatedPay,
    nextShift: managerProfile.nextShift,
    accountInfo: [
      {
        key: "phone",
        label: "Phone",
        value: "(404) 555-0144",
        status: MONEY_STATUS.TOWER_REQUIRED,
      },
      {
        key: "address",
        label: "Address",
        value: "Griffin, GA",
        status: MONEY_STATUS.TOWER_REQUIRED,
      },
      {
        key: "direct_deposit",
        label: "Direct Deposit",
        value: "•••• 9210",
        status: MONEY_STATUS.TOWER_REQUIRED,
      },
    ],
  }), []);

  function addReceipt(receipt) {
    setReceipts((current) => [receipt, ...current].slice(0, 10));
  }

  function escalateManager() {
    const receipt = makeAccessReceipt({
      actorId: managerProfile.managerId,
      action: "manager_escalation",
      target: "manager_meld_panel",
      category: "manager_escalation",
      towerRequired: false,
    });
    addReceipt(receipt);
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-2xl">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-200">
              <UsersRound size={15} />
              {copy.title}
            </div>
            <h1 className="mt-2 text-4xl font-black">{copy.scheduleToPay}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EscalationButton language={language} onEscalate={escalateManager} />
            <ManagerLanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </section>

      <div className="mt-5">
        <ManagerMeldSummary language={language} />
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-teal-200">
              <CalendarDays size={15} />
              {copy.scheduleToPay}
            </div>
            <h2 className="mt-2 text-2xl font-black">{copy.payrollImpact}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.towerSensitive}</p>
          </div>
          <TraceIdTag id={managerProfile.managerId} label={copy.managerId} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {managerMetrics.map((item) => (
            <ManagerMetricCard key={item.key} item={item} language={language} />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-teal-200">
              <CheckCircle2 size={15} />
              {copy.managerOnly}
            </div>
            <h2 className="mt-2 text-2xl font-black">{copy.payrollImpact}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.teamLevelOnly}</p>
          </div>
          <TraceIdTag id={`MGR-ACTIONS-${managerProfile.managerId}`} label={copy.managerId} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {managerActions.map((action) => (
            <ManagerActionCard key={action.key} action={action} language={language} onReceipt={addReceipt} />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-teal-200">
              <UserRound size={15} />
              {copy.employeePortalBelow}
            </div>
            <h2 className="mt-2 text-2xl font-black">{copy.managerMeld}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">{copy.employeePortalBody}</p>
          </div>
          <TraceIdTag id={managerProfile.employeeId} label={copy.employeeId} />
        </div>

        <div className="mt-5">
          <EmployeeDocumentVaultPanel initialLanguage={language} employee={sharedEmployeeProfile} />
        </div>
      </section>

      <div className="mt-5">
        <AccessReceiptTrail receipts={receipts} language={language} />
      </div>
    </div>
  );
}
