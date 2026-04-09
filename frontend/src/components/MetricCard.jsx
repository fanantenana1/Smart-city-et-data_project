export default function MetricCard({ title, items }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <div className="list">
        {(!items || items.length === 0) && <div className="badge">Aucune donnée</div>}
        {items.map((m, idx) => (
          <div className="list-item" key={idx}>
            <div>
              <div className="stat-label">Lien</div>
              <div className="badge">{m.lien}</div>
            </div>
            <div>
              <div className="stat-label">Distance (m)</div>
              <div className="stat-value">{m.distance}</div>
            </div>
            <div>
              <div className="stat-label">Horodatage</div>
              <div className="badge">{new Date(m.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
