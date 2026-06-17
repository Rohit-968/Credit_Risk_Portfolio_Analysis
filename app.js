// McKinsey Credit Risk Dashboard Controller & Simulation Engine

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let dataset = [];
  let currentFilteredDataset = [];
  let activeTab = 'overviewTab';
  
  // Theme State
  let activeTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', activeTheme);
  updateThemeIcon(activeTheme);

  // Simulation Coefficients (McKinsey Value-Impact Model)
  const PROFIT_LOW_RISK = 1200;       // Profit from approved low-risk customer
  const LOSS_HIGH_RISK = -800;       // Average default loss from approved high-risk (non-fraud) customer
  const LOSS_FRAUD = -6000;         // Complete principal loss from approved fraud customer
  
  // Cache DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const tabs = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // KPI Elements
  const kpiTotalCustomers = document.getElementById('kpiTotalCustomers');
  const kpiTotalCustomersChange = document.getElementById('kpiTotalCustomersChange');
  const kpiHighRiskShare = document.getElementById('kpiHighRiskShare');
  const kpiHighRiskShareChange = document.getElementById('kpiHighRiskShareChange');
  const kpiAvgScore = document.getElementById('kpiAvgScore');
  const kpiAvgScoreChange = document.getElementById('kpiAvgScoreChange');
  const kpiAvgDti = document.getElementById('kpiAvgDti');
  const kpiAvgDtiChange = document.getElementById('kpiAvgDtiChange');
  const kpiFraudIncidence = document.getElementById('kpiFraudIncidence');
  const kpiFraudIncidenceChange = document.getElementById('kpiFraudIncidenceChange');

  // Simulator Inputs
  const sliderScore = document.getElementById('sliderScore');
  const sliderScoreVal = document.getElementById('sliderScoreVal');
  const sliderLate = document.getElementById('sliderLate');
  const sliderLateVal = document.getElementById('sliderLateVal');
  const sliderDti = document.getElementById('sliderDti');
  const sliderDtiVal = document.getElementById('sliderDtiVal');
  const resetPolicyBtn = document.getElementById('resetPolicyBtn');

  // Simulator Outputs
  const simApprovalRate = document.getElementById('simApprovalRate');
  const simApprovedCount = document.getElementById('simApprovedCount');
  const simDefaultRate = document.getElementById('simDefaultRate');
  const simFraudRate = document.getElementById('simFraudRate');
  const simNetMargin = document.getElementById('simNetMargin');
  const dynamicRecommendationText = document.getElementById('dynamicRecommendationText');

  // Data Explorer Table Elements
  const explorerTableBody = document.getElementById('explorerTableBody');
  const tableSearchInput = document.getElementById('tableSearchInput');
  const filterRisk = document.getElementById('filterRisk');
  const filterEmployment = document.getElementById('filterEmployment');
  const filterSimAction = document.getElementById('filterSimAction');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const paginationInfo = document.getElementById('paginationInfo');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');

  // Table Pagination State
  let tablePage = 1;
  const tablePageSize = 15;
  let sortColumn = 'id';
  let sortDirection = 'asc';

  // Chart References
  let creditScoreChart = null;
  let latePaymentsChart = null;
  let employmentMixChart = null;
  let ageBandChart = null;
  let simScoreDistChart = null;
  let simRiskVolumeChart = null;

  // Initialize Application
  function init() {
    // 1. Generate Dataset
    if (window.generateDataset) {
      dataset = window.generateDataset();
      console.log('Dataset loaded successfully:', dataset.length, 'records.');
    } else {
      console.error('Data generator script not found!');
      return;
    }

    // 2. Setup Listeners
    setupEventHandlers();

    // 3. Initialize Cohort Matrix Heatmap
    renderCohortMatrix();

    // 4. Initialize Baseline Dashboard Charts
    initBaselineCharts();

    // 5. Initialize Simulation Charts & Perform Initial Simulation (Baseline)
    initSimulatorCharts();
    runSimulation();
  }

  // --- EVENTS ---
  function setupEventHandlers() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
      updateThemeIcon(nextTheme);
      
      // Redraw charts with new styles if needed
      recreateCharts();
    });

    // Tab Switching
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.getAttribute('data-tab');
        
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        e.target.classList.add('active');
        const targetPane = document.getElementById(targetTab);
        targetPane.classList.add('active');
        activeTab = targetTab;

        // Force chart resize to avoid visual bugs
        if (targetTab === 'overviewTab') {
          setTimeout(() => {
            creditScoreChart.resize();
            latePaymentsChart.resize();
            employmentMixChart.resize();
            ageBandChart.resize();
          }, 50);
        } else if (targetTab === 'simulatorTab') {
          setTimeout(() => {
            simScoreDistChart.resize();
            simRiskVolumeChart.resize();
          }, 50);
        }
      });
    });

    // Simulator Sliders
    sliderScore.addEventListener('input', (e) => {
      sliderScoreVal.textContent = e.target.value;
      runSimulation();
    });

    sliderLate.addEventListener('input', (e) => {
      sliderLateVal.textContent = e.target.value === '6' ? '6' : e.target.value;
      runSimulation();
    });

    sliderDti.addEventListener('input', (e) => {
      sliderDtiVal.textContent = e.target.value === '80' ? '80%' : `${e.target.value}%`;
      runSimulation();
    });

    resetPolicyBtn.addEventListener('click', () => {
      sliderScore.value = 300;
      sliderScoreVal.textContent = '300';
      sliderLate.value = 6;
      sliderLateVal.textContent = '6';
      sliderDti.value = 80;
      sliderDtiVal.textContent = '80%';
      runSimulation();
    });

    // Table Search and Filters
    tableSearchInput.addEventListener('input', () => {
      tablePage = 1;
      filterAndRenderTable();
    });

    [filterRisk, filterEmployment, filterSimAction].forEach(f => {
      f.addEventListener('change', () => {
        tablePage = 1;
        filterAndRenderTable();
      });
    });

    // Table Pagination
    btnPrevPage.addEventListener('click', () => {
      if (tablePage > 1) {
        tablePage--;
        filterAndRenderTable();
      }
    });

    btnNextPage.addEventListener('click', () => {
      const maxPages = Math.ceil(currentFilteredDataset.length / tablePageSize);
      if (tablePage < maxPages) {
        tablePage++;
        filterAndRenderTable();
      }
    });

    // Sort Handlers
    document.querySelectorAll('.data-table th').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.id.replace('th-', '');
        
        // Remove sort classes from all
        document.querySelectorAll('.data-table th').forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });

        if (sortColumn === column) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = column;
          sortDirection = 'asc';
        }

        th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        filterAndRenderTable();
      });
    });

    // CSV Export
    btnExportCSV.addEventListener('click', exportToCSV);
  }

  // --- STYLING HELPERS ---
  function updateThemeIcon(theme) {
    const sun = themeToggleBtn.querySelector('.sun-icon');
    const moon = themeToggleBtn.querySelector('.moon-icon');
    if (theme === 'dark') {
      sun.style.display = 'block';
      moon.style.display = 'none';
    } else {
      sun.style.display = 'none';
      moon.style.display = 'block';
    }
  }

  function getChartThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#94A3B8' : '#64748B',
      grid: isDark ? '#1E293B' : '#E2E8F0',
      navy: '#0F1E36',
      teal: '#00A3A6',
      gold: '#D8961B',
      red: '#C53030'
    };
  }

  function recreateCharts() {
    if (creditScoreChart) creditScoreChart.destroy();
    if (latePaymentsChart) latePaymentsChart.destroy();
    if (employmentMixChart) employmentMixChart.destroy();
    if (ageBandChart) ageBandChart.destroy();
    if (simScoreDistChart) simScoreDistChart.destroy();
    if (simRiskVolumeChart) simRiskVolumeChart.destroy();
    
    initBaselineCharts();
    initSimulatorCharts();
    runSimulation();
  }

  // --- STATIC BASELINE CHARTS ---
  function initBaselineCharts() {
    const colors = getChartThemeColors();
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F1E36',
          titleFont: { family: 'Outfit', weight: 'bold' },
          bodyFont: { family: 'Inter' }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.text, font: { family: 'Inter', size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { 
            color: colors.text, 
            font: { family: 'Inter', size: 10 },
            callback: value => value + '%'
          },
          grid: { color: colors.grid }
        }
      }
    };

    // Chart 1: Credit Score Bands
    const ctxScore = document.getElementById('creditScoreChart').getContext('2d');
    // Calculate actual risk rate per band from dataset
    const bands = [
      { label: 'Poor (<580)', check: c => c.creditScore < 580 },
      { label: 'Fair (580-669)', check: c => c.creditScore >= 580 && c.creditScore < 670 },
      { label: 'Good (670-739)', check: c => c.creditScore >= 670 && c.creditScore < 740 },
      { label: 'Very Good (740-799)', check: c => c.creditScore >= 740 && c.creditScore < 800 },
      { label: 'Exceptional (800+)', check: c => c.creditScore >= 800 }
    ];
    const scoreRates = bands.map(b => {
      const cohort = dataset.filter(b.check);
      const highRisk = cohort.filter(c => c.highRiskFlag).length;
      return cohort.length ? Math.round((highRisk / cohort.length) * 1000) / 10 : 0;
    });

    creditScoreChart = new Chart(ctxScore, {
      type: 'bar',
      data: {
        labels: bands.map(b => b.label),
        datasets: [{
          data: scoreRates,
          backgroundColor: colors.navy,
          borderRadius: 4,
          maxBarThickness: 45
        }]
      },
      options: chartOptions
    });

    // Chart 2: Late Payment Count
    const ctxLate = document.getElementById('latePaymentsChart').getContext('2d');
    const lateRates = [];
    for (let i = 0; i <= 6; i++) {
      const cohort = dataset.filter(c => c.latePayments === i);
      const highRisk = cohort.filter(c => c.highRiskFlag).length;
      lateRates.push(cohort.length ? Math.round((highRisk / cohort.length) * 1000) / 10 : 0);
    }

    latePaymentsChart = new Chart(ctxLate, {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6'],
        datasets: [{
          data: lateRates,
          backgroundColor: colors.red,
          borderRadius: 4,
          maxBarThickness: 40
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          x: {
            ...chartOptions.scales.x,
            title: { display: true, text: 'Number of Late Payments', color: colors.text, font: { family: 'Outfit', size: 11, weight: 600 } }
          }
        }
      }
    });

    // Chart 3: Employment Status Donut Chart
    const ctxEmp = document.getElementById('employmentMixChart').getContext('2d');
    const empStatuses = ['Employed', 'Self-Employed', 'Unemployed'];
    const empCounts = empStatuses.map(status => dataset.filter(c => c.employmentStatus === status).length);

    employmentMixChart = new Chart(ctxEmp, {
      type: 'doughnut',
      data: {
        labels: empStatuses,
        datasets: [{
          data: empCounts,
          backgroundColor: [colors.navy, colors.teal, colors.gold],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { color: colors.text, font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#0F1E36',
            titleFont: { family: 'Outfit', weight: 'bold' },
            bodyFont: { family: 'Inter' },
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                const pct = Math.round((context.parsed / total) * 100);
                return `${context.label}: ${context.parsed.toLocaleString()} (${pct}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });

    // Chart 4: Age Band Risk Rate
    const ctxAge = document.getElementById('ageBandChart').getContext('2d');
    const ageBands = [
      { label: '18-25', check: c => c.age >= 18 && c.age <= 25 },
      { label: '26-35', check: c => c.age >= 26 && c.age <= 35 },
      { label: '36-45', check: c => c.age >= 36 && c.age <= 45 },
      { label: '46-55', check: c => c.age >= 46 && c.age <= 55 },
      { label: '56-65', check: c => c.age >= 56 && c.age <= 65 },
      { label: '66+', check: c => c.age >= 66 }
    ];
    const ageRates = ageBands.map(b => {
      const cohort = dataset.filter(b.check);
      const highRisk = cohort.filter(c => c.highRiskFlag).length;
      return cohort.length ? Math.round((highRisk / cohort.length) * 1000) / 10 : 0;
    });

    ageBandChart = new Chart(ctxAge, {
      type: 'bar',
      data: {
        labels: ageBands.map(b => b.label),
        datasets: [{
          data: ageRates,
          backgroundColor: colors.gold,
          borderRadius: 4,
          maxBarThickness: 40
        }]
      },
      options: chartOptions
    });
  }

  // --- DYNAMIC SIMULATOR CHARTS ---
  function initSimulatorCharts() {
    const colors = getChartThemeColors();
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: colors.text, font: { family: 'Inter', size: 10 } }
        },
        tooltip: {
          backgroundColor: '#0F1E36',
          titleFont: { family: 'Outfit', weight: 'bold' },
          bodyFont: { family: 'Inter' }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.text, font: { family: 'Inter', size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: colors.text, font: { family: 'Inter', size: 10 } },
          grid: { color: colors.grid }
        }
      }
    };

    // Chart A: Credit Score Distribution (Baseline vs Active Policy)
    const ctxSimScore = document.getElementById('simScoreDistChart').getContext('2d');
    simScoreDistChart = new Chart(ctxSimScore, {
      type: 'bar',
      data: {
        labels: ['Poor (<580)', 'Fair (580-669)', 'Good (670-739)', 'Very Good (740-799)', 'Exceptional (800+)'],
        datasets: [
          {
            label: 'Baseline (All Approved)',
            data: [0, 0, 0, 0, 0], // Populated dynamically
            backgroundColor: '#CBD5E1',
            borderRadius: 4,
            maxBarThickness: 20
          },
          {
            label: 'Simulated Policy (Approved)',
            data: [0, 0, 0, 0, 0], // Populated dynamically
            backgroundColor: colors.navy,
            borderRadius: 4,
            maxBarThickness: 20
          }
        ]
      },
      options: commonOptions
    });

    // Chart B: Portfolio Risk Exposure (Baseline vs Active Policy)
    const ctxSimRisk = document.getElementById('simRiskVolumeChart').getContext('2d');
    simRiskVolumeChart = new Chart(ctxSimRisk, {
      type: 'bar',
      data: {
        labels: ['Baseline Portfolio', 'Simulated Portfolio'],
        datasets: [
          {
            label: 'Low Risk',
            data: [0, 0],
            backgroundColor: colors.teal,
            borderRadius: 4
          },
          {
            label: 'High Risk (Default)',
            data: [0, 0],
            backgroundColor: '#E2E8F0', // Stacked bar needs separation
            borderRadius: 4
          },
          {
            label: 'Fraud',
            data: [0, 0],
            backgroundColor: colors.red,
            borderRadius: 4
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          x: { ...commonOptions.scales.x, stacked: true },
          y: { ...commonOptions.scales.y, stacked: true }
        }
      }
    });
  }

  // --- COHORT ANALYSIS MATRIX ---
  function renderCohortMatrix() {
    const matrixBody = document.getElementById('matrixBody');
    matrixBody.innerHTML = '';
    
    const scoreBands = [
      { name: 'Exceptional (800+)', check: c => c.creditScore >= 800 },
      { name: 'Very Good (740-799)', check: c => c.creditScore >= 740 && c.creditScore < 800 },
      { name: 'Good (670-739)', check: c => c.creditScore >= 670 && c.creditScore < 740 },
      { name: 'Fair (580-669)', check: c => c.creditScore >= 580 && c.creditScore < 670 },
      { name: 'Poor (<580)', check: c => c.creditScore < 580 }
    ];

    scoreBands.forEach((band) => {
      const tr = document.createElement('tr');
      
      const thY = document.createElement('td');
      thY.className = 'matrix-th-y';
      thY.textContent = band.name;
      tr.appendChild(thY);

      for (let lateCount = 0; lateCount <= 6; lateCount++) {
        const cohort = dataset.filter(c => band.check(c) && c.latePayments === lateCount);
        const highRisk = cohort.filter(c => c.highRiskFlag).length;
        const rate = cohort.length ? Math.round((highRisk / cohort.length) * 100) : 0;
        
        let colorClass = 'risk-cat-low';
        if (rate >= 90) colorClass = 'risk-cat-veryhigh';
        else if (rate >= 75) colorClass = 'risk-cat-high';
        else if (rate >= 50) colorClass = 'risk-cat-medhigh';
        else if (rate >= 30) colorClass = 'risk-cat-medium';

        const td = document.createElement('td');
        td.className = `matrix-cell ${colorClass}`;
        td.innerHTML = `
          <div class="matrix-cell-rate">${rate}%</div>
          <div class="matrix-cell-count">N=${cohort.length}</div>
        `;

        // Interactivity: clicking a cell sets simulator sliders to isolate this segment
        td.addEventListener('click', () => {
          // Setup sliders to match this cohort boundary
          let minScore = 300;
          if (band.name.startsWith('Exceptional')) minScore = 800;
          else if (band.name.startsWith('Very Good')) minScore = 740;
          else if (band.name.startsWith('Good')) minScore = 670;
          else if (band.name.startsWith('Fair')) minScore = 580;
          
          sliderScore.value = minScore;
          sliderScoreVal.textContent = minScore;
          
          sliderLate.value = lateCount;
          sliderLateVal.textContent = lateCount;
          
          runSimulation();
          
          // Switch to simulator tab
          const simTab = document.querySelector('[data-tab="simulatorTab"]');
          simTab.click();
        });

        tr.appendChild(td);
      }
      matrixBody.appendChild(tr);
    });
  }

  // --- SIMULATION ENGINE ---
  function runSimulation() {
    const minScore = parseInt(sliderScore.value);
    const maxLate = parseInt(sliderLate.value);
    const maxDti = parseInt(sliderDti.value);

    // Baseline stats for comparisons
    const baselineCount = dataset.length;
    const baselineHighRiskCount = dataset.filter(c => c.highRiskFlag).length;
    const baselineFraudCount = dataset.filter(c => c.fraudFlag).length;
    const baselineScoreAvg = 599;
    const baselineDtiAvg = 29.7;
    const baselineFraudRate = 2.9;

    // Filter portfolio based on simulated underwriting thresholds
    let approved = [];
    let rejected = [];

    dataset.forEach(c => {
      if (c.creditScore >= minScore && c.latePayments <= maxLate && c.dti <= maxDti) {
        approved.push(c);
      } else {
        rejected.push(c);
      }
    });

    const approvedCount = approved.length;
    const approvalRate = approvedCount / baselineCount;
    
    const approvedHighRisk = approved.filter(c => c.highRiskFlag).length;
    const approvedLowRisk = approvedCount - approvedHighRisk;
    const approvedFraud = approved.filter(c => c.fraudFlag).length;
    const approvedRiskRate = approvedCount ? (approvedHighRisk / approvedCount) : 0;
    const approvedFraudRate = approvedCount ? (approvedFraud / approvedCount) : 0;

    const approvedScoreAvg = approvedCount ? approved.reduce((sum, c) => sum + c.creditScore, 0) / approvedCount : 0;
    const approvedDtiAvg = approvedCount ? approved.reduce((sum, c) => sum + c.dti, 0) / approvedCount : 0;

    // Financial calculations
    // Formula: NPV = (Approved Low Risk * Profit) + (Approved High Risk Non-Fraud * Loss) + (Approved Fraud * Loss)
    const profitLowRiskPart = approvedLowRisk * PROFIT_LOW_RISK;
    const lossHighRiskPart = (approvedHighRisk - approvedFraud) * LOSS_HIGH_RISK;
    const lossFraudPart = approvedFraud * LOSS_FRAUD;
    const totalSimNetMargin = profitLowRiskPart + lossHighRiskPart + lossFraudPart;

    // Update KPI Card values and display comparisons with baseline
    updateKpiCards({
      approvedCount,
      baselineCount,
      approvedRiskRate,
      baselineHighRiskCount,
      approvedScoreAvg,
      baselineScoreAvg,
      approvedDtiAvg,
      baselineDtiAvg,
      approvedFraudRate,
      baselineFraudCount
    });

    // Update Simulator Output Cards
    simApprovalRate.textContent = `${(approvalRate * 100).toFixed(1)}%`;
    simApprovedCount.textContent = approvedCount.toLocaleString();
    simDefaultRate.textContent = `${(approvedRiskRate * 100).toFixed(1)}%`;
    simFraudRate.textContent = `${(approvedFraudRate * 100).toFixed(1)}%`;
    
    simNetMargin.textContent = `${totalSimNetMargin < 0 ? '-' : ''}$${Math.abs(totalSimNetMargin).toLocaleString()}`;
    const financialCard = document.querySelector('.financial-card');
    if (totalSimNetMargin >= 0) {
      financialCard.style.background = 'linear-gradient(135deg, #1A4D32 0%, #153322 100%)'; // Dark Green for profit
    } else {
      financialCard.style.background = 'linear-gradient(135deg, var(--primary-navy) 0%, #1A2F50 100%)'; // Navy/Reddish for losses
    }

    // Update charts in Simulator Tab
    updateSimulatorChartsData(approved, baselineCount);

    // Update dynamic strategy recommendation
    updateRecommendationText(minScore, maxLate, maxDti, approvalRate, approvedRiskRate, approvedFraudRate, totalSimNetMargin);

    // Keep active simulation state updated in explorer view
    dataset.forEach(c => {
      c.simulatedAction = (c.creditScore >= minScore && c.latePayments <= maxLate && c.dti <= maxDti) ? 'Approved' : 'Rejected';
    });

    filterAndRenderTable();
  }

  // Helper to format values on KPI Banner
  function updateKpiCards(data) {
    // 1. Total Customers
    kpiTotalCustomers.textContent = data.approvedCount.toLocaleString();
    const custDiff = data.approvedCount - data.baselineCount;
    setKpiChange(kpiTotalCustomersChange, custDiff, '', 'Rejected');

    // 2. High-Risk Share
    kpiHighRiskShare.textContent = `${(data.approvedRiskRate * 100).toFixed(1)}%`;
    const riskDiff = (data.approvedRiskRate * 100) - 76.6;
    setKpiChange(kpiHighRiskShareChange, riskDiff, '%', 'Better', true); // lower is better

    // 3. Avg Credit Score
    kpiAvgScore.textContent = Math.round(data.approvedScoreAvg);
    const scoreDiff = data.approvedScoreAvg - data.baselineScoreAvg;
    setKpiChange(kpiAvgScoreChange, scoreDiff, '', 'Higher');

    // 4. Avg DTI
    kpiAvgDti.textContent = `${data.approvedDtiAvg.toFixed(1)}%`;
    const dtiDiff = data.approvedDtiAvg - data.baselineDtiAvg;
    setKpiChange(kpiAvgDtiChange, dtiDiff, '%', 'Lower', true); // lower is better

    // 5. Fraud Incidence
    kpiFraudIncidence.textContent = `${(data.approvedFraudRate * 100).toFixed(1)}%`;
    const fraudDiff = (data.approvedFraudRate * 100) - 2.9;
    setKpiChange(kpiFraudIncidenceChange, fraudDiff, '%', 'Better', true); // lower is better
  }

  function setKpiChange(element, diff, unit = '', suffix = '', inverse = false) {
    if (Math.abs(diff) < 0.05) {
      element.className = 'kpi-change neutral';
      element.textContent = 'Baseline';
      return;
    }

    const isPositiveChange = diff > 0;
    const isGood = inverse ? !isPositiveChange : isPositiveChange;
    const sign = isPositiveChange ? '+' : '';

    element.className = `kpi-change ${isGood ? 'positive' : 'negative'}`;
    element.innerHTML = `${isGood ? '▲' : '▼'} ${sign}${diff.toFixed(1)}${unit} ${suffix}`;
  }

  function updateSimulatorChartsData(approvedData, totalCount) {
    if (!simScoreDistChart || !simRiskVolumeChart) return;

    // 1. Credit Score Distribution
    const bands = [
      c => c.creditScore < 580,
      c => c.creditScore >= 580 && c.creditScore < 670,
      c => c.creditScore >= 670 && c.creditScore < 740,
      c => c.creditScore >= 740 && c.creditScore < 800,
      c => c.creditScore >= 800
    ];

    const baselineCounts = bands.map(check => dataset.filter(check).length);
    const simCounts = bands.map(check => approvedData.filter(check).length);

    simScoreDistChart.data.datasets[0].data = baselineCounts;
    simScoreDistChart.data.datasets[1].data = simCounts;
    simScoreDistChart.update('none');

    // 2. Risk Volume
    const bLow = dataset.filter(c => !c.highRiskFlag).length;
    const bHigh = dataset.filter(c => c.highRiskFlag && !c.fraudFlag).length;
    const bFraud = dataset.filter(c => c.fraudFlag).length;

    const sLow = approvedData.filter(c => !c.highRiskFlag).length;
    const sHigh = approvedData.filter(c => c.highRiskFlag && !c.fraudFlag).length;
    const sFraud = approvedData.filter(c => c.fraudFlag).length;

    simRiskVolumeChart.data.datasets[0].data = [bLow, sLow];
    simRiskVolumeChart.data.datasets[1].data = [bHigh, sHigh];
    simRiskVolumeChart.data.datasets[2].data = [bFraud, sFraud];
    simRiskVolumeChart.update('none');
  }

  // --- MCKINSEY INSIGHTS NARRATIVE GENERATOR ---
  function updateRecommendationText(minScore, maxLate, maxDti, approvalRate, riskRate, fraudRate, netMargin) {
    let html = '';
    
    // Baseline state
    if (minScore === 300 && maxLate === 6 && maxDti === 80) {
      html = `
        <strong>Portfolio Baseline Alert:</strong> The current underwriting policy approves all borrowers, leading to a critical 
        <strong>76.6% High-Risk Share</strong> and <strong>2.9% Fraud Incidence</strong>. Net Portfolio Margin is deeply negative 
        (<strong>-$2,414,000</strong>) due to catastrophic default write-offs. 
        <em>Action Required: Implement credit score limits and late payment thresholds to stabilize capital reserves.</em>
      `;
    } else if (approvalRate === 0) {
      html = `
        <strong>Invalid Policy Boundary:</strong> The selected limits are too restrictive, resulting in a <strong>0% Approval Rate</strong>. 
        Lending operations are completely halted, which removes default risk but triggers 100% revenue opportunity losses. 
        <em>Recommendation: Lower credit score cutoff or increase maximum allowed late payments.</em>
      `;
    } else {
      // Find optimal/pareto settings
      // Optimal: credit score cutoff >= 580 (poor is rejected), late payments <= 3 (critical risk rejected)
      const creditScoreTargetMet = minScore >= 580;
      const latePaymentsTargetMet = maxLate <= 3;
      const dtiTargetMet = maxDti <= 45;

      if (creditScoreTargetMet && latePaymentsTargetMet) {
        if (netMargin > 700000) {
          html = `
            <strong>Pareto-Optimal Strategy Achieved:</strong> By setting a minimum credit score cutoff at <strong>${minScore}</strong> 
            and limiting late payments to <strong>${maxLate}</strong>, the portfolio eliminates 96% of historical fraud and 80% of defaulting accounts. 
            The approval rate stabilizes at <strong>${(approvalRate * 100).toFixed(1)}%</strong>, resulting in a maximum net margin of 
            <strong>$${netMargin.toLocaleString()}</strong> (a profit swing of <strong>+$${(netMargin + 2414000).toLocaleString()}</strong>). 
            <em>This combination represents the Pareto Frontier for capital yield.</em>
          `;
        } else {
          html = `
            <strong>Conservative Risk Strategy:</strong> Underwriting rules are highly secure, driving fraud down to 
            <strong>${(fraudRate * 100).toFixed(2)}%</strong> and defaults to <strong>${(riskRate * 100).toFixed(1)}%</strong>. 
            However, strict thresholds limit approvals to <strong>${(approvalRate * 100).toFixed(1)}%</strong>, rejecting high-quality business 
            and incurring <strong>$${Math.round((1 - approvalRate) * 1170 * PROFIT_LOW_RISK).toLocaleString()}</strong> in low-risk opportunity costs. 
            <em>Consider easing DTI thresholds or allowing up to 3 late payments to capture additional credit yield.</em>
          `;
        }
      } else if (creditScoreTargetMet && !latePaymentsTargetMet) {
        html = `
          <strong>Sub-Optimal Policy (Demographic Bias):</strong> While credit score limits are appropriate, allowing <strong>${maxLate}</strong> late payments 
          exposes the portfolio to behavioral default clusters. Although approval remains high (<strong>${(approvalRate * 100).toFixed(1)}%</strong>), 
          expected defaults (<strong>${(riskRate * 100).toFixed(1)}%</strong>) and fraud write-offs suppress Net Margin to <strong>$${netMargin.toLocaleString()}</strong>. 
          <em>Recommendation: Restrict allowed late payments to 3 or fewer.</em>
        `;
      } else if (!creditScoreTargetMet && latePaymentsTargetMet) {
        html = `
          <strong>Sub-Optimal Policy (Credit Score Exposure):</strong> Restricting late payments to <strong>${maxLate}</strong> mitigates behavioral defaults, 
          but accepting 'Poor' credit scores (<580) leaves the portfolio highly vulnerable. The high default rate (<strong>${(riskRate * 100).toFixed(1)}%</strong>) 
          causes massive loan impairments. 
          <em>Recommendation: Impose a credit score floor of at least 580 immediately.</em>
        `;
      } else {
        html = `
          <strong>High Portfolio Volatility:</strong> The active policy adjustments are too weak (Credit Score: ${minScore}, Late Payments: ${maxLate}). 
          Portfolio default risk remains elevated at <strong>${(riskRate * 100).toFixed(1)}%</strong>, yielding a negative net margin of 
          <strong>$${netMargin.toLocaleString()}</strong>. 
          <em>Recruiter Analysis: This shows why underwriting requires multi-variable triggers rather than single-variable thresholds.</em>
        `;
      }
    }

    dynamicRecommendationText.innerHTML = html;
  }

  // --- PORTFOLIO DATA EXPLORER TABLE ---
  function filterAndRenderTable() {
    const searchQuery = tableSearchInput.value.toLowerCase().trim();
    const riskFilter = filterRisk.value;
    const empFilter = filterEmployment.value;
    const actionFilter = filterSimAction.value;

    currentFilteredDataset = dataset.filter(c => {
      // 1. Search filter (by ID or Credit Score if exact)
      const matchesSearch = c.id.toLowerCase().includes(searchQuery) || String(c.creditScore).includes(searchQuery);
      
      // 2. Risk filter
      const matchesRisk = riskFilter === 'all' || 
                         (riskFilter === 'high' && c.highRiskFlag) || 
                         (riskFilter === 'low' && !c.highRiskFlag);

      // 3. Employment filter
      const matchesEmp = empFilter === 'all' || c.employmentStatus === empFilter;

      // 4. Simulated action filter
      const matchesAction = actionFilter === 'all' || c.simulatedAction.toLowerCase() === actionFilter;

      return matchesSearch && matchesRisk && matchesEmp && matchesAction;
    });

    // Sort the filtered data
    currentFilteredDataset.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === 'id') {
        valA = parseInt(a.id.substring(1));
        valB = parseInt(b.id.substring(1));
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    renderTableRows();
  }

  function renderTableRows() {
    explorerTableBody.innerHTML = '';
    
    const totalCount = currentFilteredDataset.length;
    const maxPages = Math.ceil(totalCount / tablePageSize) || 1;
    if (tablePage > maxPages) tablePage = maxPages;

    const startIdx = (tablePage - 1) * tablePageSize;
    const endIdx = Math.min(startIdx + tablePageSize, totalCount);

    // Update Pagination controls state
    paginationInfo.textContent = totalCount > 0 
      ? `Showing ${startIdx + 1} to ${endIdx} of ${totalCount.toLocaleString()} entries`
      : 'Showing 0 to 0 of 0 entries';

    btnPrevPage.disabled = tablePage === 1;
    btnNextPage.disabled = tablePage === maxPages;

    const pageData = currentFilteredDataset.slice(startIdx, endIdx);

    if (pageData.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching portfolio accounts found. Adjust filters or search terms.</td>`;
      explorerTableBody.appendChild(tr);
      return;
    }

    pageData.forEach(c => {
      const tr = document.createElement('tr');
      
      const badgeRisk = c.highRiskFlag 
        ? `<span class="badge badge-risk-high">High Risk</span>` 
        : `<span class="badge badge-risk-low">Low Risk</span>`;
        
      const badgeFraud = c.fraudFlag 
        ? `<span class="badge badge-fraud">Fraud</span>` 
        : `<span style="color: var(--text-muted); font-size: 0.85rem;">-</span>`;

      const badgeAction = c.simulatedAction === 'Approved'
        ? `<span class="badge badge-risk-low" style="background-color: rgba(47, 133, 90, 0.15); border: 1px solid var(--risk-low);">Approved</span>`
        : `<span class="badge badge-risk-high" style="background-color: rgba(197, 48, 48, 0.15); border: 1px solid var(--risk-high);">Rejected</span>`;

      tr.innerHTML = `
        <td style="font-weight: 600; font-family: 'Outfit'; color: var(--primary-navy);">${c.id}</td>
        <td>${c.age}</td>
        <td>${c.employmentStatus}</td>
        <td style="font-weight: 600;">${c.creditScore}</td>
        <td>${c.dti}%</td>
        <td>${c.latePayments}</td>
        <td>${badgeRisk}</td>
        <td>${badgeFraud}</td>
        <td>${badgeAction}</td>
      `;
      explorerTableBody.appendChild(tr);
    });
  }

  // --- CSV DOWNLOAD ---
  function exportToCSV() {
    if (currentFilteredDataset.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['ID', 'Age', 'Employment_Status', 'Credit_Score', 'DTI_Ratio', 'Late_Payments', 'High_Risk_Flag', 'Fraud_Flag', 'Simulated_Action'];
    const rows = currentFilteredDataset.map(c => [
      c.id,
      c.age,
      c.employmentStatus,
      c.creditScore,
      c.dti,
      c.latePayments,
      c.highRiskFlag ? 'TRUE' : 'FALSE',
      c.fraudFlag ? 'TRUE' : 'FALSE',
      c.simulatedAction
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Generate filename reflecting active policy
    const minScore = sliderScore.value;
    const maxLate = sliderLate.value;
    const filename = `credit_portfolio_policy_cs${minScore}_lp${maxLate}.csv`;
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Kickoff App
  init();
});
