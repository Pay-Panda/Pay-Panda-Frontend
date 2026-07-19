export default function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header mb-7 flex items-end justify-between gap-5 max-md:flex-col max-md:items-start"><div><p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}
