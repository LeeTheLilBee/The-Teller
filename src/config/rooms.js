import {
  FileCheck2,
  HandCoins,
  LayoutDashboard,
  ShieldCheck,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";

export const rooms = [
  {
    key: "command",
    label: "Command",
    system: "PaySky",
    eyebrow: "Company overview",
    icon: LayoutDashboard,
    copy:
      "The Teller gives each approved company a clear command layer for payroll, onboarding, approvals, debt, documents, giving, foundation support, and proof.",
  },
  {
    key: "people",
    label: "People",
    system: "PayOnboard",
    eyebrow: "Workers + onboarding",
    icon: UserRoundPlus,
    copy:
      "Separate worker lanes keep employees, contractors, vendors, admins, route workers, creators, and foundation helpers from bleeding into each other.",
  },
  {
    key: "payroll",
    label: "Payroll",
    system: "PayRun",
    eyebrow: "Runs + approvals",
    icon: WalletCards,
    copy:
      "Build pay runs, check worker clearance, confirm funding, resolve exceptions, approve, seal, and archive the proof.",
  },
  {
    key: "money",
    label: "Money Flow",
    system: "PayFlow",
    eyebrow: "Cash + debt + giving",
    icon: HandCoins,
    copy:
      "Cash movement, reserves, debt, restricted funds, charitable giving, vendor pay, reimbursements, and aid payments stay in their proper lanes.",
  },
  {
    key: "records",
    label: "Records",
    system: "PayProof",
    eyebrow: "Proof + vault",
    icon: FileCheck2,
    copy:
      "Receipts, sealed packets, documents, foundation files, giving proof, exports, corrections, and audit trails live here.",
  },
  {
    key: "security",
    label: "Security",
    system: "PayGuard",
    eyebrow: "Doors + boundaries",
    icon: ShieldCheck,
    copy:
      "The Tower opens the front gate later. The Teller still checks company, role, record, field, and action boundaries internally.",
  },
];
