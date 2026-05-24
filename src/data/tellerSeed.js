export const entities = [
  { key: "world", label: "Simplee World", type: "Parent / Command" },
  { key: "pay", label: "SimpleePay", type: "Company / Payroll Ops" },
  { key: "skincare", label: "SimpleeSkincare", type: "Product Business" },
  { key: "observatory", label: "The Observatory", type: "Trading Intelligence" },
  { key: "onthego", label: "SimpleeOnTheGo", type: "ATM / Routes" },
  { key: "property", label: "SimpleeProperty", type: "Property / Assets" },
  { key: "laundromat", label: "Luxe Laundromat", type: "Operations" },
  { key: "safehaven", label: "SimpleeSafeHaven", type: "Foundation / Charity" },
];

export const assignedEntityKeys = ["world", "pay", "skincare", "observatory", "onthego", "safehaven"];

export const roles = [
  {
    key: "owner",
    label: "Owner",
    scope: "Owner command + final authority",
    dashboardRoom: "command",
    entityKeys: ["world", "pay", "skincare", "observatory", "onthego", "safehaven"],
    note: "High authority actions require step-up.",
  },
  {
    key: "admin",
    label: "Payroll Admin",
    scope: "Assigned companies only",
    dashboardRoom: "payroll",
    entityKeys: ["pay", "skincare", "onthego"],
    note: "Can prepare payroll runs, not self-approve.",
  },
  {
    key: "manager",
    label: "Manager",
    scope: "Assigned team only",
    dashboardRoom: "people",
    entityKeys: ["skincare", "onthego"],
    note: "Can approve limited team items.",
  },
  {
    key: "program",
    label: "Program Officer",
    scope: "Foundation programs only",
    dashboardRoom: "money",
    entityKeys: ["safehaven"],
    note: "Can review aid workflows without touching payroll lanes.",
  },
];

export const assignedRoleKeys = ["owner", "admin", "manager", "program"];

export const snapshots = {
  world: {
    headline: "Parent ecosystem snapshot",
    balance: "$58,850",
    payrollDue: "$8,420",
    reserve: "82%",
    debt: "$14,900",
    nextAction: "Review two entity funding requests.",
    nextDebtAction: "Review upcoming card and equipment balances.",
  },
  pay: {
    headline: "Payroll operations snapshot",
    balance: "$6,280",
    payrollDue: "$3,140",
    reserve: "76%",
    debt: "$1,200",
    nextAction: "Review admin clearance and export settings.",
    nextDebtAction: "No urgent debt action.",
  },
  skincare: {
    headline: "Product business snapshot",
    balance: "$4,900",
    payrollDue: "$1,870",
    reserve: "68%",
    debt: "$2,400",
    nextAction: "Approve one creator invoice.",
    nextDebtAction: "Review vendor balance before the next supply order.",
  },
  observatory: {
    headline: "Trading intelligence snapshot",
    balance: "$12,300",
    payrollDue: "$0",
    reserve: "91%",
    debt: "$0",
    nextAction: "Archive latest proof packet.",
    nextDebtAction: "No debt attached.",
  },
  onthego: {
    headline: "Route operations snapshot",
    balance: "$7,120",
    payrollDue: "$2,450",
    reserve: "73%",
    debt: "$7,800",
    nextAction: "Review route worker cash-handling acknowledgment.",
    nextDebtAction: "Track ATM/equipment loan readiness.",
  },
  property: {
    headline: "Property operations snapshot",
    balance: "$2,700",
    payrollDue: "$650",
    reserve: "61%",
    debt: "$3,500",
    nextAction: "Upload maintenance vendor proof.",
    nextDebtAction: "Keep property debt separate from payroll lanes.",
  },
  laundromat: {
    headline: "Laundromat operations snapshot",
    balance: "$1,950",
    payrollDue: "$420",
    reserve: "58%",
    debt: "$0",
    nextAction: "Finish attendant onboarding template.",
    nextDebtAction: "No active debt yet.",
  },
  safehaven: {
    headline: "Foundation support snapshot",
    balance: "$5,600",
    payrollDue: "$0",
    reserve: "Restricted",
    debt: "$0",
    nextAction: "Review one assistance request.",
    nextDebtAction: "Keep aid funds separate from business obligations.",
  },
};

export const worldRollup = [
  { key: "pay", label: "SimpleePay", kind: "Payroll Ops", cash: "$6.3k", pay: "$3.1k", debt: "$1.2k" },
  { key: "skincare", label: "SimpleeSkincare", kind: "Product", cash: "$4.9k", pay: "$1.9k", debt: "$2.4k" },
  { key: "observatory", label: "The Observatory", kind: "Trading Intel", cash: "$12.3k", pay: "$0", debt: "$0" },
  { key: "onthego", label: "SimpleeOnTheGo", kind: "ATM / Routes", cash: "$7.1k", pay: "$2.5k", debt: "$7.8k" },
  { key: "property", label: "SimpleeProperty", kind: "Assets", cash: "$2.7k", pay: "$650", debt: "$3.5k" },
  { key: "laundromat", label: "Luxe Laundromat", kind: "Operations", cash: "$2.0k", pay: "$420", debt: "$0" },
  { key: "safehaven", label: "SimpleeSafeHaven", kind: "Foundation", cash: "$5.6k", pay: "$0", debt: "$0" },
];

export const debtCatalog = [
  { id: "debt-001", entityKey: "onthego", entity: "SimpleeOnTheGo", type: "Equipment Loan", balance: "$7,800", due: "Jun 15", status: "Watch" },
  { id: "debt-002", entityKey: "property", entity: "SimpleeProperty", type: "Planning / Acquisition", balance: "$3,500", due: "Jun 22", status: "Planning" },
  { id: "debt-003", entityKey: "skincare", entity: "SimpleeSkincare", type: "Vendor / Supplies", balance: "$2,400", due: "Jun 09", status: "Review" },
  { id: "debt-004", entityKey: "pay", entity: "SimpleePay", type: "Operations", balance: "$1,200", due: "Jun 12", status: "Low" },
];

export const givingPrograms = [
  { id: "give-001", entityKey: "pay", entity: "SimpleePay", program: "Pay Relief Credits", budget: "$750", status: "Draft" },
  { id: "give-002", entityKey: "skincare", entity: "SimpleeSkincare", program: "Skin Relief Butter Drops", budget: "$500", status: "Planned" },
  { id: "give-003", entityKey: "observatory", entity: "The Observatory", program: "Education Access Seat", budget: "$1,000", status: "Protected" },
  { id: "give-004", entityKey: "onthego", entity: "SimpleeOnTheGo", program: "Route Community Cash Support", budget: "$650", status: "Watch" },
  { id: "give-005", entityKey: "property", entity: "SimpleeProperty", program: "Housing Stability Support", budget: "$900", status: "Planning" },
  { id: "give-006", entityKey: "laundromat", entity: "Luxe Laundromat", program: "Laundry Day Help", budget: "$300", status: "Template" },
  { id: "give-007", entityKey: "safehaven", entity: "SimpleeSafeHaven", program: "Foundation Aid Lane", budget: "$5,600", status: "Restricted" },
];

export const foundationDocs = [
  { id: "fd-001", title: "Formation + governance packet", category: "Governance", status: "Protected" },
  { id: "fd-002", title: "Restricted fund records", category: "Funds", status: "Restricted" },
  { id: "fd-003", title: "Aid review packets", category: "Assistance", status: "Redacted" },
  { id: "fd-004", title: "Donation + grant proof", category: "Proof", status: "Receipt-ready" },
];

export const calendarItems = [
  { label: "Payroll cutoff", date: "Jun 07", scope: "SimpleePay" },
  { label: "Creator invoice review", date: "Jun 09", scope: "SimpleeSkincare" },
  { label: "Debt minimum due", date: "Jun 12", scope: "SimpleePay" },
  { label: "Route worker clearance", date: "Jun 15", scope: "SimpleeOnTheGo" },
  { label: "Aid review packet", date: "Jun 18", scope: "SimpleeSafeHaven" },
];
