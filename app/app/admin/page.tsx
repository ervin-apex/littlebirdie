import {
  UserPlus,
  UsersThree,
  TrendUp,
  CurrencyDollar,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/Reveal";

type StatTile = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold"; className?: string; "aria-hidden"?: boolean }>;
};

type OperatorStatus = "Active" | "Invited" | "Inactive";

type Operator = {
  business: string;
  owner: string;
  plan: "Pro" | "Starter";
  status: OperatorStatus;
  lastSeen: string;
};

const stats: StatTile[] = [
  { label: "Active operators", value: "38", icon: UsersThree },
  { label: "Signups this week", value: "6", icon: TrendUp },
  { label: "MRR", value: "$1,862", icon: CurrencyDollar },
  { label: "Avg. opens / week", value: "4.2", icon: Eye },
];

const operators: Operator[] = [
  { business: "Crema Café", owner: "Scott T.", plan: "Pro", status: "Active", lastSeen: "2h ago" },
  { business: "The Daily Grind", owner: "Mia R.", plan: "Pro", status: "Active", lastSeen: "Today" },
  { business: "Riverside Bakery", owner: "Tom H.", plan: "Starter", status: "Invited", lastSeen: "Never" },
  { business: "Paws Vet Clinic", owner: "Dr. Lee", plan: "Pro", status: "Active", lastSeen: "Yesterday" },
  { business: "Studio 9 Dance", owner: "Ana K.", plan: "Starter", status: "Inactive", lastSeen: "12d ago" },
  { business: "Harbour Bistro", owner: "Sam W.", plan: "Pro", status: "Active", lastSeen: "5h ago" },
  { business: "Bean & Co", owner: "Priya N.", plan: "Starter", status: "Active", lastSeen: "1d ago" },
];

const statusBadge: Record<OperatorStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Invited: "bg-amber-50 text-amber-700",
  Inactive: "bg-black/5 text-ink/60",
};

export default function AdminPage() {
  return (
    <div>
      <Reveal>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">Admin</h1>
            <p className="mt-0.5 text-[13px] text-ink/60">
              Manage access and see how operators use Little Birdie.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 font-display text-[14px] font-semibold text-amber-950 transition hover:bg-amber-300"
          >
            <UserPlus size={18} weight="bold" aria-hidden />
            Provision access
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                {label}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-display text-[28px] font-semibold tnum text-ink">{value}</span>
              <Icon size={20} className="text-ink/60" aria-hidden />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          Operators
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                <th className="pb-3 pr-4 text-left font-semibold">Business</th>
                <th className="pb-3 pr-4 text-left font-semibold">Owner</th>
                <th className="pb-3 pr-4 text-left font-semibold">Plan</th>
                <th className="pb-3 pr-4 text-left font-semibold">Status</th>
                <th className="pb-3 text-left font-semibold">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {operators.map((op) => (
                <tr key={op.business}>
                  <td className="py-3 pr-4 font-medium text-ink">{op.business}</td>
                  <td className="py-3 pr-4 text-ink/65">{op.owner}</td>
                  <td className="py-3 pr-4 text-ink/65">{op.plan}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadge[op.status]}`}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td className="py-3 text-ink/65 tnum">{op.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
