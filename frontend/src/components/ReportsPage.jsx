import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, BarChart3, Calendar, Download, CheckCircle, 
  PieChart, LineChart as LineChartIcon, FileSpreadsheet, 
  Filter, RefreshCw, ArrowUpRight, ArrowDownRight, FileText,
  ChevronDown, FileDown, File
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const ReportsPage = ({ bins, collections, statistics, alerts = [], users = [] }) => {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('weekly');
  const [exportFormatSelection, setExportFormatSelection] = useState('excel');
  const [selectedCategories, setSelectedCategories] = useState(['poubelles', 'collectes', 'statistiques']);
  const [filterStatus, setFilterStatus] = useState('all');
  const [compareMetric, setCompareMetric] = useState('fill_level');
  const [chartData, setChartData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [volumeByDay, setVolumeByDay] = useState([]);
  const [collectionTrend, setCollectionTrend] = useState([]);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [highlightedBin, setHighlightedBin] = useState(null);
  const exportMenuRef = useRef(null);

  // Fermer le menu d'export quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les bibliothèques nécessaires
  useEffect(() => {
    const loadScripts = async () => {
      // Charger jsPDF
      if (!window.jspdf) {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(jspdfScript);
        await new Promise((resolve) => { jspdfScript.onload = resolve; });
      }
      
      // Charger autoTable pour PDF
      if (!window.jspdf || !window.jspdf.jsPDF.API.autoTable) {
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        document.head.appendChild(autoTableScript);
        await new Promise((resolve) => { autoTableScript.onload = resolve; });
      }
      setPdfLoaded(true);

      // Charger XLSX (SheetJS) pour Excel
      if (!window.XLSX) {
        const xlsxScript = document.createElement('script');
        xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(xlsxScript);
        await new Promise((resolve) => { xlsxScript.onload = resolve; });
      }
      setXlsxLoaded(true);
    };
    
    loadScripts();
  }, []);

  // Palette de couleurs
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    normal: '#10b981',
    attention: '#f59e0b',
    critical: '#ef4444',
    offline: '#6b7280',
    chart1: '#3b82f6',
    chart2: '#10b981',
    chart3: '#f59e0b',
    chart4: '#8b5cf6',
    chart5: '#06b6d4',
    bg: {
      primary: '#eff6ff',
      success: '#f0fdf4',
      warning: '#fffbeb',
      danger: '#fef2f2',
      gray: '#f9fafb'
    }
  };

  const totalVolume = collections.reduce((sum, col) => sum + col.volume_collected, 0);
  const avgPerCollection = collections.length > 0 ? (totalVolume / collections.length).toFixed(0) : 0;

  const reportTypeLabels = {
    daily: 'Journalier',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    neighborhood: 'Par quartier',
    service: 'Par service'
  };

  const binMap = useMemo(() => bins.reduce((map, bin) => ({ ...map, [bin.bin_id]: bin }), {}), [bins]);

  const filteredCollections = useMemo(() => {
    const now = new Date();
    const cutoffDays = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;

    return collections
      .filter((col) => {
        if (!col || !col.timestamp) return false;
        const diffDays = (now - new Date(col.timestamp)) / (1000 * 60 * 60 * 24);
        return diffDays <= cutoffDays;
      })
      .filter((col) => {
        if (filterStatus === 'all') return true;
        const bin = binMap[col.bin_id];
        return (bin?.status || 'unknown') === filterStatus;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [collections, dateRange, filterStatus, binMap]);

  const groupedCollections = useMemo(() => {
    if (reportType === 'neighborhood') {
      return filteredCollections.reduce((groups, col) => {
        const location = binMap[col.bin_id]?.location || 'Inconnu';
        groups[location] = (groups[location] || 0) + 1;
        return groups;
      }, {});
    }

    if (reportType === 'service') {
      return filteredCollections.reduce((groups, col) => {
        const service = col.operator || 'Inconnu';
        groups[service] = (groups[service] || 0) + 1;
        return groups;
      }, {});
    }

    return {};
  }, [filteredCollections, reportType, binMap]);

  const binComparisonRows = useMemo(() => {
    return bins
      .map((bin) => ({
        bin_id: bin.bin_id,
        location: bin.location,
        status: bin.status || 'inconnu',
        fill_level: bin.fill_level || 0,
        battery: bin.battery || 0,
      }))
      .sort((a, b) => b[compareMetric] - a[compareMetric])
      .slice(0, 8);
  }, [bins, compareMetric]);

  const exportCategories = [
    { id: 'poubelles', label: 'Poubelles' },
    { id: 'personnel', label: 'Personnel' },
    { id: 'collectes', label: 'Collectes' },
    { id: 'alertes', label: 'Alertes' },
    { id: 'statistiques', label: 'Statistiques' }
  ];

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const getSelectedCategoriesLabel = () => {
    if (selectedCategories.length === 0) return 'Aucune catégorie sélectionnée';
    return exportCategories
      .filter((category) => selectedCategories.includes(category.id))
      .map((category) => category.label)
      .join(', ');
  };

  const effectiveReportTitle = reportTypeLabels[reportType] || reportTypeLabels.weekly;

  // Préparer les données pour les graphiques
  useEffect(() => {
    const dataByDate = {};
    collections.forEach(col => {
      const date = new Date(col.timestamp).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      if (!dataByDate[date]) {
        dataByDate[date] = { date, volume: 0, count: 0 };
      }
      dataByDate[date].volume += col.volume_collected;
      dataByDate[date].count += 1;
    });
    
    const sortedData = Object.values(dataByDate).slice(-14);
    setChartData(sortedData);
    setVolumeByDay(sortedData);

    const trendData = sortedData.slice(-7).map(d => ({
      date: d.date,
      collectes: d.count,
      volumeMoyen: d.count > 0 ? Math.round(d.volume / d.count) : 0
    }));
    setCollectionTrend(trendData);

    const statusChartData = [
      { name: 'Normal', value: statistics.bins_by_status?.normal || 0, color: COLORS.normal },
      { name: 'Attention', value: statistics.bins_by_status?.attention || 0, color: COLORS.attention },
      { name: 'Critique', value: statistics.bins_by_status?.critical || 0, color: COLORS.critical },
      { name: 'Hors Ligne', value: statistics.bins_by_status?.offline || 0, color: COLORS.offline }
    ].filter(item => item.value > 0);
    
    setStatusData(statusChartData);
  }, [collections, statistics]);

  // Export CSV
  const exportToCSV = () => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const selected = new Set(selectedCategories);
      let csvContent = '\uFEFF'; // BOM pour UTF-8
      
      csvContent += '╔══════════════════════════════════════════════════════════════════════════════╗\n';
      csvContent += '║              RAPPORT ANALYTIQUE COMPLET - GESTION INTELLIGENTE DES DÉCHETS   ║\n';
      csvContent += '╚══════════════════════════════════════════════════════════════════════════════╝\n';
      csvContent += '\n';
      csvContent += `Organisation:,SmartWaste - Commune de Fianarantsoa\n`;
      csvContent += `Date de génération:,${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
      csvContent += `Période d'analyse:,${dateRange === 'week' ? '7 derniers jours' : dateRange === 'month' ? '30 derniers jours' : 'Année en cours'}\n`;
      csvContent += `Type de rapport:,${effectiveReportTitle}\n`;
      csvContent += `Catégories:,${getSelectedCategoriesLabel()}\n`;
      csvContent += '\n\n';

      const totalBins = statistics.total_bins || 0;
      const activeBins = statistics.active_bins || 0;
      const totalCollections = statistics.total_collections || 0;
      const avgFillRate = statistics.avg_fill_rate || 0;
      const efficiency = statistics.efficiency || 0;

      if (selected.has('statistiques')) {
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += 'TABLEAU DE BORD EXÉCUTIF\n';
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += '\n';
        csvContent += 'Indicateur,Valeur,Unité\n';
        csvContent += `Poubelles totales,${totalBins},unités\n`;
        csvContent += `Poubelles opérationnelles,${activeBins},unités\n`;
        csvContent += `Total des collectes,${totalCollections},opérations\n`;
        csvContent += `Volume total collecté,${totalVolume.toLocaleString()},litres\n`;
        csvContent += `Volume moyen par collecte,${avgPerCollection},litres\n`;
        csvContent += `Taux de remplissage moyen,${avgFillRate.toFixed(1)},pourcentage\n`;
        csvContent += `Efficacité opérationnelle,${efficiency.toFixed(1)},pourcentage\n`;
        csvContent += '\n\n';
      }

      if (selected.has('collectes')) {
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += 'COLLECTES DÉTAILLÉES\n';
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += '\n';
        csvContent += 'Poubelle,Opérateur,Volume,Taux,Date,Heure,Statut\n';
        filteredCollections.slice(0, 100).forEach(col => {
          const date = new Date(col.timestamp);
          const status = col.percentage >= 90 ? 'Critique' : col.percentage >= 70 ? 'Attention' : 'Normal';
          csvContent += `${col.bin_id},${col.operator},${col.volume_collected}L,${col.percentage}%,${date.toLocaleDateString('fr-FR')},${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })},${status}\n`;
        });
        csvContent += '\n\n';
      }

      if (selected.has('poubelles')) {
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += 'POUBELLES\n';
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += '\n';
        csvContent += 'ID Poubelle,Localisation,Niveau (%),Statut,Capacité (L),Batterie (%),Latitude,Longitude,Température,Humidité\n';
        bins.forEach((bin) => {
          csvContent += `${bin.bin_id},${bin.location},${bin.fill_level},${bin.status},${bin.capacity},${bin.battery},${bin.latitude || ''},${bin.longitude || ''},${bin.temperature || 'N/A'},${bin.humidity || 'N/A'}\n`;
        });
        csvContent += '\n\n';
      }

      if (selected.has('personnel')) {
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += 'PERSONNEL\n';
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += '\n';
        csvContent += 'Nom d\'utilisateur,Email,Rôle,Compte actif,Approuvé,Dernière activité\n';
        if (users.length > 0) {
          users.forEach((user) => {
            csvContent += `${user.username},${user.email},${user.role},${user.is_active ? 'Oui' : 'Non'},${user.is_approved ? 'Oui' : 'Non'},${user.last_login || 'N/A'}\n`;
          });
        } else {
          csvContent += 'Aucune donnée utilisateur disponible,,,,,\n';
        }
        csvContent += '\n\n';
      }

      if (selected.has('alertes')) {
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += 'ALERTES\n';
        csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        csvContent += '\n';
        csvContent += 'Titre,Description,Type,Statut,Date de création\n';
        if (alerts.length > 0) {
          alerts.forEach((alert) => {
            csvContent += `${alert.title || 'N/A'},${alert.description || 'N/A'},${alert.type || 'N/A'},${alert.status || 'N/A'},${alert.timestamp ? new Date(alert.timestamp).toLocaleString('fr-FR') : 'N/A'}\n`;
          });
        } else {
          csvContent += 'Aucune alerte disponible,,,,\n';
        }
        csvContent += '\n\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rapport-smartwaste-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
    } catch (error) {
      console.error('Erreur export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Export Excel (VRAI FICHIER EXCEL)
  const exportToExcel = () => {
    if (!xlsxLoaded || !window.XLSX) {
      alert('Bibliothèque Excel en cours de chargement...');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      const selected = new Set(selectedCategories);
      const filename = `rapport-smartwaste-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

      const appendSheet = (title, rows, colWidths = []) => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        if (colWidths.length) {
          ws['!cols'] = colWidths;
        }
        XLSX.utils.book_append_sheet(wb, ws, title);
      };

      if (selected.has('statistiques')) {
        const dashboardData = [
          ['RAPPORT ANALYTIQUE SMARTWASTE'],
          ['Commune de Fianarantsoa'],
          [''],
          [`Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`],
          [`Type de rapport: ${effectiveReportTitle}`],
          [''],
          ['INDICATEURS CLÉS DE PERFORMANCE'],
          [''],
          ['Indicateur', 'Valeur', 'Unité', 'Statut'],
          ['Poubelles totales', statistics.total_bins || 0, 'unités', '✓'],
          ['Poubelles opérationnelles', statistics.active_bins || 0, 'unités', '✓'],
          ['Taux d\'opérationnalité', `${((statistics.active_bins / (statistics.total_bins || 1)) * 100).toFixed(1)}%`, 'pourcentage', 
            (statistics.active_bins / (statistics.total_bins || 1)) >= 0.95 ? '✓ Excellent' : '⚠ À améliorer'],
          ['Total des collectes', statistics.total_collections || 0, 'opérations', '✓'],
          ['Volume total collecté', totalVolume.toLocaleString(), 'litres', '✓'],
          ['Volume moyen par collecte', avgPerCollection, 'litres', avgPerCollection >= 80 ? '✓ Optimal' : '⚠ Sous-optimal'],
          ['Taux de remplissage moyen', `${(statistics.avg_fill_rate || 0).toFixed(1)}%`, 'pourcentage', 
            (statistics.avg_fill_rate || 0) >= 70 && (statistics.avg_fill_rate || 0) <= 85 ? '✓ Optimal' : '⚠ Attention'],
          ['Efficacité opérationnelle', `${(statistics.efficiency || 0).toFixed(1)}%`, 'pourcentage', 
            (statistics.efficiency || 0) >= 95 ? '✓ Excellent' : '⚠ À améliorer'],
          [''],
          ['RÉPARTITION DES POUBELLES PAR STATUT'],
          [''],
          ['Statut', 'Nombre', 'Pourcentage'],
          ['Normal', statistics.bins_by_status?.normal || 0, `${(((statistics.bins_by_status?.normal || 0) / (statistics.total_bins || 1)) * 100).toFixed(1)}%`],
          ['Attention', statistics.bins_by_status?.attention || 0, `${(((statistics.bins_by_status?.attention || 0) / (statistics.total_bins || 1)) * 100).toFixed(1)}%`],
          ['Critique', statistics.bins_by_status?.critical || 0, `${(((statistics.bins_by_status?.critical || 0) / (statistics.total_bins || 1)) * 100).toFixed(1)}%`],
          ['Hors ligne', statistics.bins_by_status?.offline || 0, `${(((statistics.bins_by_status?.offline || 0) / (statistics.total_bins || 1)) * 100).toFixed(1)}%`]
        ];

        appendSheet('Tableau de Bord', dashboardData, [
          { wch: 30 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 }
        ]);
      }

      if (selected.has('collectes')) {
        const collectionSheet = [
          ['COLLECTES DÉTAILLÉES'],
          [''],
          ['Poubelle', 'Opérateur', 'Volume (L)', 'Taux (%)', 'Date', 'Heure', 'Statut', 'Quartier/Service']
        ];

        filteredCollections.slice(0, 200).forEach((col) => {
          const date = new Date(col.timestamp);
          const status = col.percentage >= 90 ? 'Critique' : col.percentage >= 70 ? 'Attention' : 'Normal';
          const groupLabel = reportType === 'neighborhood'
            ? binMap[col.bin_id]?.location || 'Inconnu'
            : reportType === 'service'
            ? col.operator || 'Inconnu'
            : '';

          collectionSheet.push([
            col.bin_id,
            col.operator,
            col.volume_collected,
            col.percentage,
            date.toLocaleDateString('fr-FR'),
            date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status,
            groupLabel
          ]);
        });

        appendSheet('Collectes', collectionSheet, [
          { wch: 15 },
          { wch: 18 },
          { wch: 12 },
          { wch: 10 },
          { wch: 15 },
          { wch: 10 },
          { wch: 12 },
          { wch: 20 }
        ]);
      }

      if (selected.has('poubelles')) {
        const binsData = [
          ['INFORMATIONS COMPLÈTES DES POUBELLES'],
          [''],
          ['ID Poubelle', 'Localisation', 'Niveau (%)', 'Statut', 'Capacité (L)', 'Batterie (%)', 'Latitude', 'Longitude', 'Température', 'Humidité']
        ];

        bins.forEach((bin) => {
          binsData.push([
            bin.bin_id,
            bin.location,
            bin.fill_level,
            bin.status,
            bin.capacity,
            bin.battery,
            bin.latitude,
            bin.longitude,
            bin.temperature || 'N/A',
            bin.humidity || 'N/A'
          ]);
        });

        appendSheet('Poubelles', binsData, [
          { wch: 15 },
          { wch: 25 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 }
        ]);
      }

      if (selected.has('personnel')) {
        const userData = [
          ['INFORMATIONS PERSONNEL'],
          [''],
          ['Nom d\'utilisateur', 'Email', 'Rôle', 'Compte actif', 'Approuvé', 'Dernière activité']
        ];

        if (users.length > 0) {
          users.forEach((user) => {
            userData.push([
              user.username,
              user.email,
              user.role,
              user.is_active ? 'Oui' : 'Non',
              user.is_approved ? 'Oui' : 'Non',
              user.last_login || 'N/A'
            ]);
          });
        } else {
          userData.push(['Aucune donnée utilisateur disponible', '', '', '', '', '']);
        }

        appendSheet('Personnel', userData, [
          { wch: 20 },
          { wch: 25 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 18 }
        ]);
      }

      if (selected.has('alertes')) {
        const alertsData = [
          ['ALERTES'],
          [''],
          ['Titre', 'Description', 'Type', 'Statut', 'Date de création']
        ];

        if (alerts.length > 0) {
          alerts.forEach((alert) => {
            alertsData.push([
              alert.title || 'N/A',
              alert.description || 'N/A',
              alert.type || 'N/A',
              alert.status || 'N/A',
              alert.timestamp ? new Date(alert.timestamp).toLocaleString('fr-FR') : 'N/A'
            ]);
          });
        } else {
          alertsData.push(['Aucune alerte disponible', '', '', '', '']);
        }

        appendSheet('Alertes', alertsData, [
          { wch: 25 },
          { wch: 35 },
          { wch: 15 },
          { wch: 15 },
          { wch: 22 }
        ]);
      }

      if (wb.SheetNames.length === 0) {
        appendSheet('Rapport', [['Aucune catégorie sélectionnée pour l\'export.']]);
      }

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const formatDecimal = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : parseFloat(num.toFixed(decimals));
  };

  const exportBinsTableau1CSV = () => {
    if (!xlsxLoaded || !window.XLSX) {
      alert('Bibliothèque Excel en cours de chargement...');
      return;
    }

    if (isExporting) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      
      const binsData = [
        ['Bin_ID', 'Quartier', 'Fill_Level (%)', 'Température (°C)', 'Humidité (%)', 'Batterie (%)', 'Latitude', 'Longitude', 'Statut', 'Date/Heure mesure', 'Qualité Données', 'Responsable assigné', 'Nombre de collectes', 'Dernière collecte']
      ];

      bins.forEach((bin) => {
        binsData.push([
          bin.bin_id || '',
          bin.location || '',
          formatDecimal(bin.fill_level),
          formatDecimal(bin.temperature),
          formatDecimal(bin.humidity),
          formatDecimal(bin.battery),
          bin.latitude ?? '', // Pas de formatage pour latitude
          bin.longitude ?? '', // Pas de formatage pour longitude
          bin.status || '',
          bin.last_update ? new Date(bin.last_update).toLocaleString('fr-FR') : '',
          'Valide',
          bin.assigned_to || 'Non assigné',
          bin.collection_count || 0,
          bin.last_collection ? new Date(bin.last_collection).toLocaleString('fr-FR') : ''
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(binsData);
      ws['!cols'] = [
        { wch: 12 }, // Bin_ID
        { wch: 20 }, // Quartier
        { wch: 15 }, // Fill_Level (%)
        { wch: 15 }, // Température (°C)
        { wch: 15 }, // Humidité (%)
        { wch: 15 }, // Batterie (%)
        { wch: 12 }, // Latitude
        { wch: 12 }, // Longitude
        { wch: 12 }, // Statut
        { wch: 18 }, // Date/Heure mesure
        { wch: 15 }, // Qualité Données
        { wch: 18 }, // Responsable assigné
        { wch: 18 }, // Nombre de collectes
        { wch: 18 }  // Dernière collecte
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Poubelles');
      XLSX.writeFile(wb, `Rapport_Poubelles_SmartWaste_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export Tableau 1.xlsx:', error);
      alert('Erreur lors de l\'export Tableau 1.xlsx');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const exportPersonnelTableau2CSV = () => {
    if (!xlsxLoaded || !window.XLSX) {
      alert('Bibliothèque Excel en cours de chargement...');
      return;
    }

    if (isExporting) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      
      const personnelData = [
        ['Nom complet', 'Prénom', 'Téléphone', 'Email', 'CIN', 'Adresse', 'Rôle', 'Numéro voiture', 'Quartier assigné', 'Poubelles suivies', 'Nombre de collectes', 'Dernière collecte']
      ];

      if (users.length > 0) {
        users.forEach((user) => {
          personnelData.push([
            user.full_name || user.username || '',
            user.first_name || '',
            user.phone || '',
            user.email || '',
            user.cin || '',
            user.address || '',
            user.role || '',
            user.vehicle_number || '',
            user.assigned_zone || '',
            user.assigned_bins ? user.assigned_bins.join(', ') : '',
            formatDecimal(user.collection_count),
            user.last_collection ? new Date(user.last_collection).toLocaleString('fr-FR') : ''
          ]);
        });
      } else {
        personnelData.push(['Aucune donnée disponible', '', '', '', '', '', '', '', '', '', '', '']);
      }

      const ws = XLSX.utils.aoa_to_sheet(personnelData);
      ws['!cols'] = [
        { wch: 20 }, // Nom complet
        { wch: 15 }, // Prénom
        { wch: 15 }, // Téléphone
        { wch: 25 }, // Email
        { wch: 15 }, // CIN
        { wch: 25 }, // Adresse
        { wch: 15 }, // Rôle
        { wch: 15 }, // Numéro voiture
        { wch: 20 }, // Quartier assigné
        { wch: 25 }, // Poubelles suivies
        { wch: 18 }, // Nombre de collectes
        { wch: 18 }  // Dernière collecte
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Personnel');
      XLSX.writeFile(wb, `Rapport_Personnel_SmartWaste_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export Tableau 2.xlsx:', error);
      alert('Erreur lors de l\'export Tableau 2.xlsx');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Export PDF (VERSION COMPACTE ET SOBRE - COULEURS VERT/BLANC)
  const exportToPDF = () => {
    if (!pdfLoaded) {
      alert('PDF en cours de chargement...');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Couleurs principales (Vert et Blanc)
      const GREEN = [16, 185, 129];      // Vert principal
      const GREEN_LIGHT = [240, 253, 244]; // Vert très clair
      const GREEN_DARK = [5, 150, 105];    // Vert foncé
      const WHITE = [255, 255, 255];
      const GRAY = [107, 114, 128];
      const GRAY_LIGHT = [249, 250, 251];
      
      // ====== EN-TÊTE SIMPLE ET COMPACT ======
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, 210, 25, 'F');
      
      // Titre simple
      doc.setTextColor(...WHITE);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Rapport SmartWaste', 15, 12);
      
      // Date et période
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${new Date().toLocaleDateString('fr-FR')} | ${dateRange === 'week' ? '7 jours' : '30 jours'}`, 15, 19);
      doc.text('Commune de Fianarantsoa', 195, 15, { align: 'right' });
      
      let yPos = 35;
      
      // ====== KPI COMPACTS ======
      const kpis = [
        { label: 'Poubelles', value: `${statistics.total_bins || 0}`, sublabel: `${statistics.active_bins || 0} actives` },
        { label: 'Collectes', value: `${statistics.total_collections || 0}`, sublabel: 'opérations' },
        { label: 'Volume Total', value: `${totalVolume.toLocaleString()}L`, sublabel: `moy. ${avgPerCollection}L` },
        { label: 'Efficacité', value: `${(statistics.efficiency || 0).toFixed(1)}%`, sublabel: 'opérationnelle' }
      ];
      
      const kpiWidth = 45;
      const kpiHeight = 22;
      const kpiSpacing = 3;
      
      kpis.forEach((kpi, index) => {
        const x = 15 + (index * (kpiWidth + kpiSpacing));
        
        // Fond blanc avec bordure verte
        doc.setFillColor(...WHITE);
        doc.roundedRect(x, yPos, kpiWidth, kpiHeight, 2, 2, 'F');
        doc.setDrawColor(...GREEN);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, yPos, kpiWidth, kpiHeight, 2, 2, 'S');
        
        // Label
        doc.setTextColor(...GRAY);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(kpi.label, x + kpiWidth/2, yPos + 5, { align: 'center' });
        
        // Valeur
        doc.setTextColor(...GREEN_DARK);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(kpi.value, x + kpiWidth/2, yPos + 12, { align: 'center' });
        
        // Sous-label
        doc.setTextColor(...GRAY);
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.text(kpi.sublabel, x + kpiWidth/2, yPos + 18, { align: 'center' });
      });
      
      yPos += 30;
      
      // ====== STATUTS DES POUBELLES - COMPACT ======
      doc.setFillColor(...GREEN_LIGHT);
      doc.roundedRect(15, yPos, 180, 20, 2, 2, 'F');
      
      doc.setTextColor(...GREEN_DARK);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('État des Poubelles', 20, yPos + 7);
      
      const statuses = [
        { label: 'Normal', value: statistics.bins_by_status?.normal || 0, color: GREEN },
        { label: 'Attention', value: statistics.bins_by_status?.attention || 0, color: [245, 158, 11] },
        { label: 'Critique', value: statistics.bins_by_status?.critical || 0, color: [239, 68, 68] },
        { label: 'Hors ligne', value: statistics.bins_by_status?.offline || 0, color: GRAY }
      ];
      
      let statusX = 80;
      statuses.forEach(status => {
        doc.setTextColor(...status.color);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${status.value}`, statusX, yPos + 7);
        
        doc.setTextColor(...GRAY);
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.text(status.label, statusX, yPos + 12);
        
        statusX += 25;
      });
      
      yPos += 28;
      
      // ====== INDICATEURS DE PERFORMANCE - COMPACT ======
      doc.setFillColor(...WHITE);
      doc.roundedRect(15, yPos, 180, 32, 2, 2, 'F');
      doc.setDrawColor(...GREEN);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, yPos, 180, 32, 2, 2, 'S');
      
      doc.setTextColor(...GREEN_DARK);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Indicateurs de Performance', 20, yPos + 7);
      
      const metrics = [
        { label: 'Opérationnalité', value: ((statistics.active_bins / (statistics.total_bins || 1)) * 100) },
        { label: 'Efficacité', value: statistics.efficiency || 0 },
        { label: 'Remplissage', value: statistics.avg_fill_rate || 0 }
      ];
      
      let metricY = yPos + 12;
      metrics.forEach(metric => {
        // Label
        doc.setTextColor(...GRAY);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(metric.label, 20, metricY);
        
        // Barre de progression fine
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(55, metricY - 3, 100, 4, 1, 1, 'F');
        
        // Remplissage vert
        const fillWidth = (metric.value / 100) * 100;
        doc.setFillColor(...GREEN);
        doc.roundedRect(55, metricY - 3, fillWidth, 4, 1, 1, 'F');
        
        // Valeur
        doc.setTextColor(...GREEN_DARK);
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.text(`${metric.value.toFixed(1)}%`, 160, metricY, { align: 'left' });
        
        metricY += 8;
      });
      
      yPos += 40;
      
      // ====== TABLEAU DES COLLECTES - COMPACT ======
      if (collections.length > 0) {
        doc.setTextColor(...GREEN_DARK);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Collectes Récentes', 15, yPos);
        
        yPos += 5;
        
        const collectionsData = collections.slice(0, 25).map(col => {
          const date = new Date(col.timestamp);
          return [
            col.bin_id,
            col.operator,
            `${col.volume_collected}L`,
            `${col.percentage}%`,
            date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          ];
        });
        
        doc.autoTable({
          startY: yPos,
          head: [['ID', 'Opérateur', 'Volume', 'Taux', 'Date', 'Heure']],
          body: collectionsData,
          theme: 'plain',
          headStyles: {
            fillColor: GREEN,
            textColor: WHITE,
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 2
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 20, fontStyle: 'bold', textColor: GREEN_DARK },
            1: { cellWidth: 45 },
            2: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 22, halign: 'center' },
            5: { cellWidth: 22, halign: 'center' }
          },
          alternateRowStyles: { fillColor: GREEN_LIGHT },
          margin: { left: 15, right: 15 },
          didParseCell: function(data) {
            // Colorer les cellules de taux
            if (data.column.index === 3 && data.cell.section === 'body') {
              const value = parseFloat(data.cell.text[0]);
              if (value >= 90) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              } else if (value >= 70) {
                data.cell.styles.textColor = [245, 158, 11];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });
        
        // Statistiques finales
        const finalY = doc.lastAutoTable.finalY + 8;
        
        if (finalY < 270) {
          doc.setFillColor(...GREEN_LIGHT);
          doc.roundedRect(15, finalY, 180, 12, 2, 2, 'F');
          
          doc.setTextColor(...GREEN_DARK);
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          doc.text('Résumé:', 20, finalY + 5);
          
          doc.setFont(undefined, 'normal');
          doc.text(`${collections.length} collectes`, 40, finalY + 5);
          doc.text(`${totalVolume.toLocaleString()} L collectés`, 90, finalY + 5);
          doc.text(`Moy. ${avgPerCollection} L/collecte`, 150, finalY + 5);
        }
      } else {
        doc.setTextColor(...GRAY);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('Aucune collecte enregistrée pour cette période', 105, yPos + 20, { align: 'center' });
      }
      
      // ====== PIED DE PAGE SIMPLE ======
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ligne verte fine
        doc.setDrawColor(...GREEN);
        doc.setLineWidth(0.5);
        doc.line(15, 285, 195, 285);
        
        // Informations
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.setFont(undefined, 'normal');
        doc.text('SmartWaste', 15, 290);
        doc.text(`Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
        doc.text(new Date().toLocaleDateString('fr-FR'), 195, 290, { align: 'right' });
      }
      
      doc.save(`rapport-smartwaste-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Export Données Poubelles et Personnel (Excel seulement)
  const exportBinsPersonnelData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/export/bins-personnel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sw_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'export');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DONNEES_POUBELLES_PERSONNEL_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // Notification de succès
      if (window.showNotification) {
        window.showNotification('✅ Données poubelles et personnel exportées avec succès!', 'success');
      } else {
        alert('✅ Données poubelles et personnel exportées avec succès!');
      }

    } catch (error) {
      console.error('Erreur export données poubelles/personnel:', error);
      
      let errorMessage = 'Erreur lors de l\'export des données poubelles et personnel';
      if (error.message.includes('Pipeline ETL non disponible')) {
        errorMessage = 'Service ETL non disponible sur ce serveur';
      } else if (error.message.includes('rôle insuffisant')) {
        errorMessage = 'Accès refusé: vous devez être administrateur ou collecteur';
      }
      
      if (window.showNotification) {
        window.showNotification(`❌ ${errorMessage}`, 'error');
      } else {
        alert(`❌ ${errorMessage}`);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Composant Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-2xl border-2 border-blue-100">
          <p className="font-bold text-gray-900 mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculer les variations
  const calculateTrend = (data, key) => {
    if (data.length < 2) return { value: 0, isPositive: true };
    const current = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    const change = ((current - previous) / (previous || 1)) * 100;
    return { value: Math.abs(change).toFixed(1), isPositive: change >= 0 };
  };

  const collectionsTrend = calculateTrend(chartData, 'count');
  const volumeTrend = calculateTrend(volumeByDay, 'volume');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6">
      {/* En-tête amélioré */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="animate-fadeIn">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2">
              Rapports et Analyses
            </h1>
            <p className="text-gray-600 text-lg">
              Vue d'ensemble complète de vos opérations de collecte
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sélecteur de période */}
            <div className="relative">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-5 py-3 pr-10 font-semibold text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="year">Année en cours</option>
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            {/* Bouton Actualiser */}
            <button className="bg-white border-2 border-gray-200 rounded-xl px-5 py-3 font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-lg transition-all flex items-center gap-2 group">
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Actualiser
            </button>

            {/* Bouton Export avec menu déroulant */}
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl px-6 py-3 font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 transform"
              >
                <FileDown size={20} />
                Exporter
                <ChevronDown size={18} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu déroulant */}
              {showExportMenu && !isExporting && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50 animate-slideDown">
                  <div className="px-4 py-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Type de rapport</p>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-blue-100 focus:ring-4"
                      >
                        <option value="daily">Journalier</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                        <option value="neighborhood">Par quartier</option>
                        <option value="service">Par service</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Format de fichier</p>
                      <select
                        value={exportFormatSelection}
                        onChange={(e) => setExportFormatSelection(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-blue-100 focus:ring-4"
                      >
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Catégories à inclure</p>
                      <div className="grid grid-cols-2 gap-2">
                        {exportCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm ${selectedCategories.includes(category.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">Sélection : {getSelectedCategoriesLabel()}</div>
                      <button
                        type="button"
                        onClick={() => {
                          if (exportFormatSelection === 'excel') {
                            exportToExcel();
                          } else if (exportFormatSelection === 'csv') {
                            exportToCSV();
                          } else {
                            exportToPDF();
                          }
                        }}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-colors"
                      >
                        Générer le rapport
                      </button>
                      <button
                        type="button"
                        onClick={exportBinsTableau1CSV}
                        disabled={isExporting}
                        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        📊 Rapport Poubelles (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={exportPersonnelTableau2CSV}
                        disabled={isExporting}
                        className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        👥 Rapport Personnel (.xlsx)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé du rapport</h2>
          <p className="text-sm text-gray-600 mb-3">Type de rapport : <span className="font-semibold text-gray-900">{effectiveReportTitle}</span></p>
          <p className="text-sm text-gray-600 mb-3">Période analysée : <span className="font-semibold text-gray-900">{dateRange === 'week' ? '7 derniers jours' : dateRange === 'month' ? '30 derniers jours' : 'Année en cours'}</span></p>
          <p className="text-sm text-gray-600 mb-3">Collectes affichées : <span className="font-semibold text-gray-900">{filteredCollections.length}</span></p>
          <p className="text-sm text-gray-600">Catégories incluses :</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {exportCategories.filter(cat => selectedCategories.includes(cat.id)).map(cat => (
              <span key={cat.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{cat.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filtres comparatifs</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Statut</p>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-blue-100 focus:ring-4"
              >
                <option value="all">Tous</option>
                <option value="normal">Normal</option>
                <option value="attention">Attention</option>
                <option value="critical">Critique</option>
                <option value="offline">Hors ligne</option>
              </select>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Comparaison</p>
              <select
                value={compareMetric}
                onChange={(e) => setCompareMetric(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-400 focus:ring-blue-100 focus:ring-4"
              >
                <option value="fill_level">Remplissage</option>
                <option value="battery">Batterie</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Groupes</h2>
          {reportType === 'neighborhood' || reportType === 'service' ? (
            <div className="space-y-3">
              {Object.entries(groupedCollections).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between rounded-2xl bg-gray-50 p-4">
                  <span className="text-sm font-semibold text-gray-800">{key}</span>
                  <span className="text-sm font-bold text-blue-700">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Les données sont affichées selon le type de rapport sélectionné.</p>
          )}
        </div>
      </div>

      {/* Cartes KPI améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI 1 - Poubelles Totales */}
        <div className="group bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 shadow-lg border-2 border-blue-100/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <BarChart3 className="text-white" size={24} />
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
              ACTIF
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-2">
            {statistics.total_bins || 0}
          </h3>
          <p className="text-gray-600 font-semibold mb-3">Poubelles Totales</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-blue-600 font-bold">
              ● {statistics.active_bins || 0} opérationnelles
            </span>
          </div>
        </div>

        {/* KPI 2 - Collectes Totales */}
        <div className="group bg-gradient-to-br from-white to-green-50/50 rounded-2xl p-6 shadow-lg border-2 border-green-100/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="text-white" size={24} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
              collectionsTrend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {collectionsTrend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {collectionsTrend.value}%
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-2">
            {statistics.total_collections || 0}
          </h3>
          <p className="text-gray-600 font-semibold mb-3">Collectes Totales</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-bold">
              +{collectionsTrend.value}% vs période précédente
            </span>
          </div>
        </div>

        {/* KPI 3 - Litres Collectés */}
        <div className="group bg-gradient-to-br from-white to-amber-50/50 rounded-2xl p-6 shadow-lg border-2 border-amber-100/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
              volumeTrend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {volumeTrend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {volumeTrend.value}%
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-2">
            {totalVolume.toLocaleString()}
          </h3>
          <p className="text-gray-600 font-semibold mb-3">Litres Collectés</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-600 font-bold">
              Moyenne: {avgPerCollection}L par collecte
            </span>
          </div>
        </div>

        {/* KPI 4 - Efficacité Opérationnelle */}
        <div className="group bg-gradient-to-br from-white to-purple-50/50 rounded-2xl p-6 shadow-lg border-2 border-purple-100/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <PieChart className="text-white" size={24} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              (statistics.efficiency || 0) >= 95 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {(statistics.efficiency || 0) >= 95 ? 'EXCELLENT' : 'BON'}
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-2">
            {(statistics.efficiency || 0).toFixed(1)}%
          </h3>
          <p className="text-gray-600 font-semibold mb-3">Efficacité Opérationnelle</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((statistics.efficiency || 0), 100)}%` }}
              ></div>
            </div>
            <span className="text-purple-600 font-bold">
              Objectif: 95%
            </span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique Volume par jour */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="text-white" size={22} />
              </div>
              Volume Collecté par Jour
            </h3>
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">
              14 derniers jours
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={volumeByDay}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke={COLORS.primary} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVolume)"
                name="Volume (L)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Nombre de collectes */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="text-white" size={22} />
              </div>
              Nombre de Collectes par Jour
            </h3>
            <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
              7 derniers jours
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={collectionTrend}>
              <defs>
                <linearGradient id="colorCollectes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="collectes" 
                stroke={COLORS.success} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCollectes)"
                name="Nombre de collectes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Répartition par statut */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <PieChart className="text-white" size={22} />
              </div>
              Répartition par Statut
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RechartsPie>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
          
          {/* Légende détaillée */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-md" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-bold text-gray-700">{item.name}</span>
                </div>
                <span className="text-lg font-black text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique Volume Moyen */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <LineChartIcon className="text-white" size={22} />
              </div>
              Volume Moyen par Collecte
            </h3>
            <span className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold">
              Tendance hebdomadaire
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={collectionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="volumeMoyen" 
                stroke={COLORS.warning} 
                strokeWidth={4}
                dot={{ fill: COLORS.warning, r: 6, strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 9, strokeWidth: 4, stroke: '#fff' }}
                name="Volume moyen (L)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau des collectes récentes amélioré */}
      <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
              <CheckCircle className="text-white" size={22} />
            </div>
            Collectes Récentes
          </h3>
          <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold">
            {collections.length} collectes au total
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Poubelle</th>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Opérateur</th>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Volume</th>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Taux</th>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Date</th>
                <th className="text-left py-5 px-5 font-bold text-gray-800">Heure</th>
              </tr>
            </thead>
            <tbody>
              {collections.slice(0, 15).map((col, idx) => {
                const date = new Date(col.timestamp);
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-all">
                    <td className="py-4 px-5 font-black text-blue-600">{col.bin_id}</td>
                    <td className="py-4 px-5 text-gray-700 font-semibold">{col.operator}</td>
                    <td className="py-4 px-5 font-black text-gray-900">{col.volume_collected}L</td>
                    <td className="py-4 px-5">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                        col.percentage >= 90 ? 'bg-red-100 text-red-700 ring-2 ring-red-200' :
                        col.percentage >= 70 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' :
                        'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                      }`}>
                        {col.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-600 font-semibold">
                      {date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-5 text-gray-500 font-medium">
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {collections.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <BarChart3 size={56} className="mx-auto mb-5 text-gray-300" />
            <p className="text-xl font-bold text-gray-600 mb-2">Aucune collecte disponible</p>
            <p className="text-sm">Les données de collecte apparaîtront ici</p>
          </div>
        )}
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;