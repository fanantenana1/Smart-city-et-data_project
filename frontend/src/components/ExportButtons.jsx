import React, { useState } from 'react';
import { Download, FileJson, FileText, Database, Sheet } from 'lucide-react';
import '../styles/ExportButtons.css';

const ExportButtons = ({ reportPeriod = 'month' }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [exportStatus, setExportStatus] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const token = localStorage.getItem('sw_token');

  const exportFormats = [
    {
      id: 'json',
      name: 'JSON',
      icon: <FileJson size={20} />,
      description: 'Format JSON complet',
      endpoint: '/api/export/json',
      mime: 'application/json'
    },
    {
      id: 'csv-poubelles',
      name: 'CSV - Poubelles',
      icon: <FileText size={20} />,
      description: 'Données poubelles',
      endpoint: '/api/export/csv/poubelles',
      mime: 'text/csv'
    },
    {
      id: 'csv-historiques',
      name: 'CSV - Historiques',
      icon: <FileText size={20} />,
      description: 'Historique collectes',
      endpoint: '/api/export/csv/historiques',
      mime: 'text/csv'
    },
    {
      id: 'csv-predictions',
      name: 'CSV - Prédictions',
      icon: <FileText size={20} />,
      description: 'Données prédictives',
      endpoint: '/api/export/csv/predictions',
      mime: 'text/csv'
    },
    {
      id: 'sqlite',
      name: 'SQLite Database',
      icon: <Database size={20} />,
      description: 'Base données SQLite',
      endpoint: '/api/export/sqlite',
      mime: 'application/x-sqlite3'
    },
    {
      id: 'sql',
      name: 'SQL Dump',
      icon: <Database size={20} />,
      description: 'Export SQL (MySQL/PostgreSQL)',
      endpoint: '/api/export/sql-dump',
      mime: 'text/plain'
    },
    {
      id: 'excel',
      name: 'Excel',
      icon: <Sheet size={20} />,
      description: 'Classeur multi-sheets',
      endpoint: '/api/export/excel',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
      id: 'all',
      name: 'Tous les formats',
      icon: <Download size={20} />,
      description: 'Exporter tous formats',
      endpoint: '/api/export/all',
      mime: 'application/json'
    }
  ];

  const handleExport = async (format) => {
    setLoading(true);
    setExportStatus({ type: 'loading', message: `Exportation en ${format.name}...` });

    try {
      const response = await fetch(
        `http://localhost:8000${format.endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Obtenir le nom du fichier
      const disposition = response.headers.get('content-disposition');
      let filename = `rapport_${format.id}_${new Date().toISOString().split('T')[0]}.${getExtension(format.id)}`;
      
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]*)"?/);
        if (match) filename = match[1];
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus({
        type: 'success',
        message: `${format.name} exporté: ${filename}`
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setExportStatus({
        type: 'error',
        message: `Erreur: ${error.message}`
      });
    } finally {
      setLoading(false);
      setTimeout(() => setExportStatus(null), 5000);
    }
  };

  const handleExportAll = async () => {
    setLoading(true);
    setExportStatus({ type: 'loading', message: 'Exportation multiples formats...' });

    try {
      // Récupérer les infos
      const infoResponse = await fetch('http://localhost:8000/api/export/info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!infoResponse.ok) {
        throw new Error('Impossible de récupérer les infos');
      }

      const info = await infoResponse.json();

      // Exporter les formats principaux
      const formatsToExport = exportFormats.filter(f => f.id !== 'all' && f.id.split('-').length === 1);
      
      for (const format of formatsToExport) {
        try {
          await handleExport(format);
        } catch (e) {
          console.warn(`Erreur export ${format.name}:`, e);
        }
      }

      setExportStatus({
        type: 'success',
        message: `Tous les formats exportés! (${info.statistiques.total_poubelles} poubelles, ${info.statistiques.total_historiques} collectes)`
      });
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: `Erreur exports multiples: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getExtension = (formatId) => {
    const extensions = {
      'json': 'json',
      'csv-poubelles': 'csv',
      'csv-historiques': 'csv',
      'csv-predictions': 'csv',
      'sqlite': 'db',
      'sql': 'sql',
      'excel': 'xlsx'
    };
    return extensions[formatId] || formatId;
  };

  return (
    <div className="export-buttons-container">
      <div className="export-header">
        <h3>EXPORT DES DONNÉES</h3>
        <p>Télécharger rapport en plusieurs formats</p>
      </div>

      <div className="export-controls">
        <button
          className="export-main-btn"
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
        >
          <Download size={18} />
          {loading ? 'En cours...' : 'Exporter'}
          <span className="dropdown-arrow">{showMenu ? '▲' : '▼'}</span>
        </button>
      </div>

      {showMenu && (
        <div className="export-menu">
          <div className="export-menu-header">
            <h4>Formats disponibles</h4>
            <button
              className="export-all-btn"
              onClick={handleExportAll}
              disabled={loading}
            >
              <Download size={16} />
              Tous formats
            </button>
          </div>

          <div className="export-formats-grid">
            {exportFormats.slice(0, -1).map((format) => (
              <button
                key={format.id}
                className="export-format-btn"
                onClick={() => handleExport(format)}
                disabled={loading}
                title={format.description}
              >
                <div className="format-icon">{format.icon}</div>
                <div className="format-info">
                  <div className="format-name">{format.name}</div>
                  <div className="format-desc">{format.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="export-menu-footer">
            <div className="export-info">
              <span>Données: Poubelles + Historique + Prédictions</span>
              <span>Période actuelle: {reportPeriod}</span>
            </div>
          </div>
        </div>
      )}

      {exportStatus && (
        <div className={`export-status export-status-${exportStatus.type}`}>
          {exportStatus.message}
        </div>
      )}

      {/* Mini info cards */}
      <div className="export-info-cards">
        <div className="info-card">
          <span className="icon"></span>
          <span className="label">Poubelles</span>
        </div>
        <div className="info-card">
          <span className="icon"></span>
          <span className="label">Historiques</span>
        </div>
        <div className="info-card">
          <span className="icon"></span>
          <span className="label">Prédictions</span>
        </div>
        <div className="info-card">
          <span className="icon"></span>
          <span className="label">Utilisateurs</span>
        </div>
      </div>
    </div>
  );
};

export default ExportButtons;
