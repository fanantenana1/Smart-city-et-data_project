import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, AlertCircle, Package } from 'lucide-react';
import ExportButtons from './ExportButtons';
import '../styles/ReportsPage.css';

const ReportsPageMalagasy = () => {
  const [reportData, setReportData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('month'); // 'day', 'week', 'month', 'year'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [apiData, setApiData] = useState({
    bins: [],
    collectors: [],
    predictions: []
  });
  const [loading, setLoading] = useState(true);

  // Traductions Malagasy
  const translations = {
    'titre': 'RAPPORT D\'ANALYSE - SYSTÈME DE GESTION DES DÉCHETS',
    'periode': 'Endriky ny Periode',
    'statistiques': 'Statistika Momba ny Fiangon\'ny Tahiry',
    'alertes': 'Fampilaram-Pisalampi',
    'predictions': 'Vinavinam-Pikarohana',
    'total_collectes': 'Isan\'ny Fiangon\'ny Farany',
    'volume_total': 'Volan\'ny Fiterin\'ny Kateza',
    'volume_moyen': 'Vola Afovoany',
    'poubelles_critiques': 'Tahiry Kritika',
    'collectes_par_jour': 'Fiangon\'ny Isan\'ariva',
    'remplissage_moyen': 'Feno Afovoany',
    'jours': 'Andro',
    'mois': 'Volana',
    'annee': 'Taona',
  };

  // Charger les données
  useEffect(() => {
    fetchReportData();
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Récupérer les données depuis l'API
      const response = await fetch('http://localhost:8000/api/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sw_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
        processReportData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Données de démonstration
      generateDemoData();
    }
    setLoading(false);
  };

  const generateDemoData = () => {
    // Générer des données de démonstration
    const demoData = {
      statistiques: {
        total_collectes: 342,
        volume_total: 65430,
        volume_moyen: 191,
        volume_max: 280,
        volume_min: 85,
      },
      chronologie: generateTimelineData(),
      poubelles_top: [
        { id: 'PBL-ANT-001', location: 'Avenue de l\'Indépendance', collectes: 28, volume_total: 5240 },
        { id: 'PBL-ANT-004', location: 'Gare Routière', collectes: 35, volume_total: 9100 },
        { id: 'PBL-ANT-005', location: 'Marché Zoma', collectes: 32, volume_total: 7850 },
      ],
      alertes: [
        { bin_id: 'PBL-ANT-001', location: 'Avenue de l\'Indépendance', fill_level: 95, severity: 'CRITIQUE' },
        { bin_id: 'PBL-ANT-008', location: 'Aéroport International', fill_level: 88, severity: 'URGENT' },
        { bin_id: 'PBL-ANT-012', location: 'Rue de France', fill_level: 75, severity: 'IMPORTANT' },
      ],
      predictions: generatePredictionsData(),
    };
    
    setReportData(demoData);
  };

  const generateTimelineData = () => {
    const dates = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toLocaleDateString('mg-MG'),
        collectes: Math.floor(Math.random() * 15) + 5,
        volume: Math.floor(Math.random() * 3000) + 1000,
        poubelles_pleines: Math.floor(Math.random() * 5) + 1,
      });
    }
    return dates;
  };

  const generatePredictionsData = () => {
    const predictions = [];
    const today = new Date();

    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toLocaleDateString('mg-MG'),
        collectes_predites: Math.floor(Math.random() * 12) + 3,
        confiance: Math.floor(Math.random() * 15) + 80,
      });
    }
    return predictions;
  };

  const processReportData = (data) => {
    setReportData({
      statistiques: data.statistiques,
      chronologie: data.historique || generateTimelineData(),
      poubelles_top: data.poubelles_top,
      alertes: data.alertes,
      predictions: data.predictions || generatePredictionsData(),
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITIQUE': '#ef4444',
      'URGENT': '#f97316',
      'IMPORTANT': '#eab308',
      'NORMAL': '#22c55e',
    };
    return colors[severity] || '#666';
  };

  const getMonthName = (monthStr) => {
    const months = [
      'Janoary', 'Febroary', 'Martsa', 'Aprily', 'Mey', 'Jona',
      'Jolay', 'Aogositra', 'Septambra', 'Oktobra', 'Novambra', 'Desambra'
    ];
    const monthIndex = parseInt(monthStr.split('-')[1]) - 1;
    return months[monthIndex] || monthStr;
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="spinner">⏳</div>
        <p>Mitomboana ny données...</p>
      </div>
    );
  }

  return (
    <div className="reports-page-malagasy">
      {/* En-tête */}
      <div className="reports-header">
        <h1> RAPPORT D\'ANALYSE</h1>
        <p className="subtitle">Fitentin\'ny Tahiry Samihafa - Fokontany Madagascar</p>
      </div>

      {/* Sélecteur de période */}
      <div className="period-selector">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${timeFilter === 'day' ? 'active' : ''}`}
            onClick={() => setTimeFilter('day')}
          >
             {translations.jours}
          </button>
          <button
            className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
             Herinandro
          </button>
          <button
            className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
             {translations.mois}
          </button>
          <button
            className={`filter-btn ${timeFilter === 'year' ? 'active' : ''}`}
            onClick={() => setTimeFilter('year')}
          >
             {translations.annee}
          </button>
        </div>

        {timeFilter === 'month' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="date-input"
          />
        )}
        {timeFilter === 'year' && (
          <input
            type="number"
            min="2020"
            max={new Date().getFullYear()}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="date-input"
          />
        )}
      </div>

      {/* Composant d'export */}
      <ExportButtons reportPeriod={timeFilter} />

      {/* Statistiques principales */}
      {reportData?.statistiques && (
        <div className="stats-grid">
          <div className="stat-card stat-collectes">
            <Package size={24} />
            <div>
              <h3>{translations.total_collectes}</h3>
              <p className="stat-value">{reportData.statistiques.total_collectes}</p>
              <span className="stat-unit">Isan\'ariva</span>
            </div>
          </div>

          <div className="stat-card stat-volume">
            <TrendingUp size={24} />
            <div>
              <h3>{translations.volume_total}</h3>
              <p className="stat-value">{(reportData.statistiques.volume_total / 1000).toFixed(1)}K</p>
              <span className="stat-unit">Litro</span>
            </div>
          </div>

          <div className="stat-card stat-average">
            <Calendar size={24} />
            <div>
              <h3>{translations.volume_moyen}</h3>
              <p className="stat-value">{reportData.statistiques.volume_moyen}</p>
              <span className="stat-unit">L / Fiangon\'y</span>
            </div>
          </div>

          <div className="stat-card stat-critical">
            <AlertCircle size={24} />
            <div>
              <h3>{translations.poubelles_critiques}</h3>
              <p className="stat-value">{reportData.alertes?.length || 0}</p>
              <span className="stat-unit">Tahiry</span>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="charts-section">
        {/* Chronologie */}
        {reportData?.chronologie && reportData.chronologie.length > 0 && (
          <div className="chart-container">
            <h2> Fiangon\'ny Isan\'ariva</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.chronologie}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="collectes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Fiangon\'y"
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  yAxisId="right"
                  name="Volana (L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Poubelles Top */}
        {reportData?.poubelles_top && reportData.poubelles_top.length > 0 && (
          <div className="chart-container">
            <h2> Tahiry Fara-Pikarohana</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.poubelles_top}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="location" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Bar dataKey="collectes" fill="#8b5cf6" name="Fiangon\'y" radius={[8, 8, 0, 0]} />
                <Bar dataKey="volume_total" fill="#ec4899" name="Volan\'y (L)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Prédictions */}
        {reportData?.predictions && reportData.predictions.length > 0 && (
          <div className="chart-container">
            <h2> Vinavinam-Pikarohana</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Bar dataKey="collectes_predites" fill="#f59e0b" name="Fiangon\'y Vinavina" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Alertes */}
      {reportData?.alertes && reportData.alertes.length > 0 && (
        <div className="alerts-section">
          <h2>🚨 Fampilaram-Pisalampi Aorian\'ny Fikambanana</h2>
          <div className="alerts-list">
            {reportData.alertes.map((alert, index) => (
              <div
                key={index}
                className="alert-item"
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              >
                <div className="alert-header">
                  <h3>{alert.location}</h3>
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(alert.severity) }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="alert-details">
                  <p><strong>Feno:</strong> {alert.fill_level.toFixed(1)}%</p>
                  <p><strong>ID:</strong> {alert.bin_id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé */}
      <div className="summary-section">
        <h2> Feuilli Voalaza</h2>
        <div className="summary-content">
          <p>
            Sa paritaka {reportData?.statistiques?.total_collectes || 0} fiangon\'y tahiry amin\'ny piroida
            {timeFilter === 'month' ? ` {getMonthName(selectedMonth)}` : ''}
            {timeFilter === 'year' ? ` ${selectedYear}` : ''}, niaingain\'ny kateza
            {reportData?.statistiques?.volume_total ? ` ${reportData.statistiques.volume_total.toLocaleString('mg-MG')} litro` : ''}.
          </p>
          <p>
            Ny isan\'ny tahiry tsy misy ny fitobodoana anatin\'ny piroida dia
            {reportData?.alertes?.length || 0} amin\'ny totalin\'ny mihitsy.
            Ito dia mila fiangon\'ny maika sy fanambarana.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPageMalagasy;
