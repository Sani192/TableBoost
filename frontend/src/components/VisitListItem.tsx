import { StoredVisit } from '@/lib/visits-store';

interface VisitListItemProps {
  visit: StoredVisit;
}

export default function VisitListItem({ visit }: VisitListItemProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="font-extrabold text-slate-950">{visit.name || visit.phoneNumber}</p>
      <p className="text-sm font-medium text-slate-500">{visit.phoneNumber}</p>
    </div>
  );
}
