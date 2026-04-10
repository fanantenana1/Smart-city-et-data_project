import React, { useEffect, useRef, useState } from "react";
import Header from "./Header";
// import MetricCard from "./MetricCard";
import { fetchLatest, fetchHistory, fetchBins } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [latest, setLatest] = useState([]);
  const [history, setHistory] = useState([]);
  const [bins, setBins] = useState([]);
  const [binsLoading, setBinsLoading] = useState(true);
  const [binsError, setBinsError] = useState(null);
  const [polling, setPolling] = useState(true);
  const pollRef = useRef(null);
  const [statusText, setStatusText] = useState("Synchronisation");

  const loadData = async () => {
    try {
      setStatusText("Chargement…");
      const [lRes, hRes] = await Promise.all([fetchLatest(), fetchHistory(20)]);
      setLatest(lRes.data || []);
      setHistory(hRes.data || []);
      setStatusText("OK");
    } catch (e) {
      console.error("Erreur récupération:", e);
      setStatusText("Erreur de connexion");
    }
  };

  const loadBins = async () => {
    setBinsLoading(true);
    setBinsError(null);
    try {
      const res = await fetchBins();
      const data = res && res.data ? res.data : [];
      // Les données sont déjà triées par fill_level décroissant depuis le serveur
      setBins(data);
    } catch (e) {
      console.error("Erreur récupération des poubelles:", e);
      setBinsError(e?.response?.data || e.message || "Erreur");
    } finally {
      setBinsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadBins();
  }, []);

  useEffect(() => {
    if (polling) {
      pollRef.current = setInterval(() => { loadData(); loadBins(); }, 10000);
      return () => clearInterval(pollRef.current);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [polling]);

  const getStatusColor = (fillLevel) => {
    if (fillLevel >= 95) return "#e74c3c"; // Rouge critique
    if (fillLevel >= 80) return "#f39c12"; // Orange attention
    if (fillLevel >= 50) return "#f1c40f"; // Jaune
    return "#27ae60"; // Vert
  };

  const getStatusLabel = (fillLevel) => {
    if (fillLevel >= 95) return "CRITIQUE";
    if (fillLevel >= 80) return "PLEINE";
    if (fillLevel >= 50) return "MOYENNE";
    return "OK";
  };

  return (
    <div className="container">
      <Header onRefresh={() => { loadData(); loadBins(); }} polling={polling} setPolling={setPolling} />
      {/* Temporarily removed MetricCard components due to data format mismatch */}
      {/* <div className="grid place-items-center">
        <MetricCard title="Dernières mesures par lien" items={latest} />
        <MetricCard title="Historique récent" items={history} />
      </div> */}

      <div className="bins-section">
        <h2>Poubelles (Triées par niveau de remplissage)</h2>
        {binsLoading ? (
          <p>Chargement des poubelles…</p>
        ) : binsError ? (
          <p>Erreur: {String(binsError)}</p>
        ) : bins.length === 0 ? (
          <p>Aucune poubelle trouvée.</p>
        ) : (
          <div className="bins-grid">
            {bins.map((b, index) => (
              <div key={b.bin_id} className="bin-card" style={{ borderLeftColor: getStatusColor(b.fill_level) }}>
                <div className="bin-header">
                  <h3>{index + 1}. {b.bin_id}</h3>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(b.fill_level),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getStatusLabel(b.fill_level)}
                  </span>
                </div>
                <div className="bin-details">
                  <p><strong>📍 Localisation:</strong> {b.location}</p>
                  <p><strong>Adresse:</strong> {b.address}</p>
                  <div className="fill-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${b.fill_level}%`,
                          backgroundColor: getStatusColor(b.fill_level),
                          height: '100%',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <span className="fill-percentage" style={{ color: getStatusColor(b.fill_level), fontWeight: 'bold' }}>
                      {Math.round(b.fill_level)}%
                    </span>
                  </div>
                  <div className="bin-meta">
                    <span>Batterie: {b.battery?.toFixed(1) || 'N/A'}%</span>
                    <span>Temp: {b.temperature?.toFixed(1) || 'N/A'}°C</span>
                    <span>Signal: {b.signal_quality || 'N/A'}</span>
                  </div>
                  {b.last_collection && (
                    <p className="last-collection"><strong>Dernière collecte:</strong> {b.last_collection}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="footer">
        <span className="status-dot" />
        <span>{statusText} • Intervalle 10 s • {polling ? "Auto ON" : "Auto OFF"}</span>
      </div>
    </div>
  );
}
