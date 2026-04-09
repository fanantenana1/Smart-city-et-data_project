import React, { useState, useEffect, useRef } from 'react';
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

const ReportsPage = ({ bins, collections, statistics }) => {
  const [dateRange, setDateRange] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [volumeByDay, setVolumeByDay] = useState([]);
  const [collectionTrend, setCollectionTrend] = useState([]);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
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
      let csvContent = '\uFEFF'; // BOM pour UTF-8
      
      csvContent += '╔══════════════════════════════════════════════════════════════════════════════╗\n';
      csvContent += '║              RAPPORT ANALYTIQUE COMPLET - GESTION INTELLIGENTE DES DÉCHETS   ║\n';
      csvContent += '╚══════════════════════════════════════════════════════════════════════════════╝\n';
      csvContent += '\n';
      csvContent += `Organisation:,SmartWaste - Commune de Fianarantsoa\n`;
      csvContent += `Date de génération:,${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
      csvContent += `Période d'analyse:,${dateRange === 'week' ? '7 derniers jours' : dateRange === 'month' ? '30 derniers jours' : 'Année en cours'}\n`;
      csvContent += '\n\n';
      
      csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      csvContent += 'TABLEAU DE BORD EXÉCUTIF\n';
      csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      csvContent += '\n';
      csvContent += 'Indicateur,Valeur,Unité\n';
      
      const totalBins = statistics.total_bins || 0;
      const activeBins = statistics.active_bins || 0;
      const totalCollections = statistics.total_collections || 0;
      const avgFillRate = statistics.avg_fill_rate || 0;
      const efficiency = statistics.efficiency || 0;
      
      csvContent += `Poubelles totales,${totalBins},unités\n`;
      csvContent += `Poubelles opérationnelles,${activeBins},unités\n`;
      csvContent += `Total des collectes,${totalCollections},opérations\n`;
      csvContent += `Volume total collecté,${totalVolume.toLocaleString()},litres\n`;
      csvContent += `Volume moyen par collecte,${avgPerCollection},litres\n`;
      csvContent += `Taux de remplissage moyen,${avgFillRate.toFixed(1)},pourcentage\n`;
      csvContent += `Efficacité opérationnelle,${efficiency.toFixed(1)},pourcentage\n`;
      csvContent += '\n\n';
      
      csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      csvContent += 'DÉTAIL DES COLLECTES\n';
      csvContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      csvContent += '\n';
      csvContent += 'Poubelle,Opérateur,Volume,Taux,Date,Heure\n';
      
      collections.slice(0, 50).forEach(col => {
        const date = new Date(col.timestamp);
        csvContent += `${col.bin_id},${col.operator},${col.volume_collected}L,${col.percentage}%,${date.toLocaleDateString('fr-FR')},${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
      });
      
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

      // ====== FEUILLE 1: TABLEAU DE BORD ======
      const dashboardData = [
        ['RAPPORT ANALYTIQUE SMARTWASTE'],
        ['Commune de Fianarantsoa'],
        [''],
        [`Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`],
        [`Période d'analyse: ${dateRange === 'week' ? '7 derniers jours' : dateRange === 'month' ? '30 derniers jours' : 'Année en cours'}`],
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

      const ws1 = XLSX.utils.aoa_to_sheet(dashboardData);
      
      // Style pour la feuille
      ws1['!cols'] = [
        { wch: 30 }, // Colonne A
        { wch: 20 }, // Colonne B
        { wch: 15 }, // Colonne C
        { wch: 15 }  // Colonne D
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'Tableau de Bord');

      // ====== FEUILLE 2: COLLECTES DÉTAILLÉES ======
      const collectionsData = [
        ['DÉTAIL DES COLLECTES'],
        [''],
        ['Poubelle', 'Opérateur', 'Volume (L)', 'Taux (%)', 'Date', 'Heure', 'Statut']
      ];

      collections.slice(0, 100).forEach(col => {
        const date = new Date(col.timestamp);
        const status = col.percentage >= 90 ? '🔴 Critique' : col.percentage >= 70 ? '🟠 Attention' : '🟢 Normal';
        collectionsData.push([
          col.bin_id,
          col.operator,
          col.volume_collected,
          col.percentage,
          date.toLocaleDateString('fr-FR'),
          date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(collectionsData);
      
      ws2['!cols'] = [
        { wch: 15 }, // Poubelle
        { wch: 20 }, // Opérateur
        { wch: 12 }, // Volume
        { wch: 10 }, // Taux
        { wch: 15 }, // Date
        { wch: 10 }, // Heure
        { wch: 15 }  // Statut
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'Collectes Détaillées');

      // ====== FEUILLE 3: VOLUME PAR JOUR ======
      const volumeData = [
        ['VOLUME COLLECTÉ PAR JOUR'],
        [''],
        ['Date', 'Volume (L)', 'Nombre de Collectes', 'Volume Moyen (L)']
      ];

      volumeByDay.forEach(item => {
        volumeData.push([
          item.date,
          item.volume,
          item.count,
          Math.round(item.volume / item.count)
        ]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(volumeData);
      ws3['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Volume par Jour');

      // ====== FEUILLE 4: ANALYSE DES POUBELLES ======
      const binsAnalysisData = [
        ['ANALYSE DES POUBELLES'],
        [''],
        ['ID Poubelle', 'Localisation', 'Niveau (%)', 'Statut', 'Capacité (L)', 'Batterie (%)']
      ];

      Object.values(bins).forEach(bin => {
        binsAnalysisData.push([
          bin.bin_id,
          bin.location,
          bin.fill_level,
          bin.status,
          bin.capacity,
          bin.battery
        ]);
      });

      const ws4 = XLSX.utils.aoa_to_sheet(binsAnalysisData);
      ws4['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Analyse Poubelles');

      // Générer et télécharger le fichier Excel
      XLSX.writeFile(wb, `rapport-smartwaste-${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
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
                {isExporting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <FileDown size={20} />
                    Exporter
                    <ChevronDown size={18} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Menu déroulant */}
              {showExportMenu && !isExporting && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50 animate-slideDown">
                  <div className="py-2">
                    <button
                      onClick={exportToCSV}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <FileSpreadsheet className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">CSV</p>
                        <p className="text-xs text-gray-500">Fichier texte délimité</p>
                      </div>
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <FileSpreadsheet className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Excel</p>
                        <p className="text-xs text-gray-500">Tableur Microsoft Excel</p>
                      </div>
                    </button>

                    <button
                      onClick={exportToPDF}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                        <FileText className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">PDF</p>
                        <p className="text-xs text-gray-500">Document portable</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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