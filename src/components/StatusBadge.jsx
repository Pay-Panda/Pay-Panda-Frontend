export default function StatusBadge({ status }) {
  return <span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-${String(status).toLowerCase()}`}><i />{status}</span>;
}
