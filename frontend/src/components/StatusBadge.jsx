export default function StatusBadge({ status }) {
  const label = String(status).replace(/_/g, " ");
  return <span className={`badge badge-${status}`}>{label}</span>;
}
