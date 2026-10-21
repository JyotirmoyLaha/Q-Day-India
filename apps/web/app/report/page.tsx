import { redirect } from 'next/navigation';
import { getSnapshots } from '@/lib/data';
import { reportMonths } from '@/lib/report';

/** /report → the latest monthly report. */
export default function ReportIndex() {
  const months = reportMonths(getSnapshots());
  if (!months.length)
    return <p className="text-muted">No scans yet. The first report appears after the first weekly scan.</p>;
  redirect(`/report/${months[months.length - 1]}`);
}
