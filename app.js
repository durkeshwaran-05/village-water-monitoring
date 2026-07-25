/* ============================================================
   SIH 2026: Village Water Point Uptime Monitoring System
   Application Logic Engine (app.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  let waterPointsData = [];
  let filteredData = [];

  // DOM Elements
  const grid = document.getElementById('waterpoints-grid');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const habitationFilter = document.getElementById('habitation-filter');
  const displayedCount = document.getElementById('displayed-count');
  const totalCount = document.getElementById('total-count');

  // Stats DOM Elements
  const statTotal = document.getElementById('stat-total-points');
  const statActive = document.getElementById('stat-active-points');
  const statStopped = document.getElementById('stat-stopped-points');
  const statFaulty = document.getElementById('stat-faulty-points');

  // Modal DOM Elements
  const modal = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Fetch JSON Dataset (Task 1 & Task 5 Loading State)
  fetchData();

  async function fetchData() {
    renderLoadingState();
    try {
      const response = await fetch('water_points_data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      waterPointsData = await response.json();

      if (!Array.isArray(waterPointsData) || waterPointsData.length === 0) {
        renderEmptyState('No data records found in the dataset file.');
        return;
      }

      // Initialize UI Components
      populateHabitationFilter();
      calculateOverallSummaryStats();
      applyFilters();

    } catch (err) {
      console.error('Error loading dataset:', err);
      renderErrorState('Failed to load water point usage data. Please verify water_points_data.json file location.');
    }
  }

  // Helper: Classify Record Health & Status
  function getRecordStatus(record) {
    // Edge Case 1: Missing value
    if (record.usage_count === null || record.usage_count === undefined || !record.habitation || record.habitation.trim() === '') {
      return { status: 'faulty', label: 'Faulty (Missing Data)', type: 'missing' };
    }

    // Edge Case 2: Out of plausible range (> 1000 L or impossible spike)
    if (record.usage_count > 1000) {
      return { status: 'faulty', label: 'Faulty (Range Spike)', type: 'spike' };
    }

    // Edge Case 3: Stuck sensor reading (flow_ok is false but usage_count > 0)
    if (record.flow_ok === false && record.usage_count > 0) {
      return { status: 'faulty', label: 'Faulty (Stuck Sensor)', type: 'stuck' };
    }

    // Normal Stopped Case
    if (record.flow_ok === false) {
      return { status: 'stopped', label: 'Stopped (Down)', type: 'stopped' };
    }

    // Normal Working Case
    return { status: 'working', label: 'Working (Normal)', type: 'working' };
  }

  // Calculate Overall Summary Statistics
  function calculateOverallSummaryStats() {
    let active = 0;
    let stopped = 0;
    let faulty = 0;

    waterPointsData.forEach(item => {
      const info = getRecordStatus(item);
      if (info.status === 'working') active++;
      else if (info.status === 'stopped') stopped++;
      else if (info.status === 'faulty') faulty++;
    });

    statTotal.textContent = waterPointsData.length;
    statActive.textContent = active;
    statStopped.textContent = stopped;
    statFaulty.textContent = faulty;
    totalCount.textContent = waterPointsData.length;
  }

  // Populate Habitation Filter Dropdown
  function populateHabitationFilter() {
    const habitations = new Set();
    waterPointsData.forEach(item => {
      if (item.habitation && item.habitation.trim() !== '') {
        habitations.add(item.habitation.trim());
      }
    });

    habitationFilter.innerHTML = '<option value="all">All Habitations</option>';
    Array.from(habitations).sort().forEach(hab => {
      const opt = document.createElement('option');
      opt.value = hab;
      opt.textContent = hab;
      habitationFilter.appendChild(opt);
    });
  }

  // Task 2: Real-time Search and Filtering
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;
    const selectedHabitation = habitationFilter.value;

    filteredData = waterPointsData.filter(item => {
      const statusInfo = getRecordStatus(item);
      
      // Match Search Input
      const matchSearch = 
        (item.waterpoint_id && item.waterpoint_id.toLowerCase().includes(searchTerm)) ||
        (item.habitation && item.habitation.toLowerCase().includes(searchTerm)) ||
        (item.district && item.district.toLowerCase().includes(searchTerm)) ||
        (item.state && item.state.toLowerCase().includes(searchTerm)) ||
        (item.reading_id && item.reading_id.toLowerCase().includes(searchTerm));

      // Match Status Filter
      const matchStatus = (selectedStatus === 'all') || (statusInfo.status === selectedStatus);

      // Match Habitation Filter
      const matchHabitation = (selectedHabitation === 'all') || (item.habitation === selectedHabitation);

      return matchSearch && matchStatus && matchHabitation;
    });

    displayedCount.textContent = filteredData.length;
    renderGrid(filteredData);
  }

  // Event Listeners for Instant Search & Filtering
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  habitationFilter.addEventListener('change', applyFilters);

  // Render Water Points Grid
  function renderGrid(data) {
    grid.innerHTML = '';

    if (data.length === 0) {
      renderEmptyState('No water points match your current search or filter criteria.');
      return;
    }

    data.forEach(item => {
      const statusInfo = getRecordStatus(item);
      const card = document.createElement('div');
      card.className = 'wp-card';

      let chipClass = 'working';
      if (statusInfo.status === 'stopped') chipClass = 'stopped';
      else if (statusInfo.status === 'faulty') chipClass = 'faulty';

      // Format usage count display
      let usageDisplay = `${item.usage_count} L`;
      if (item.usage_count === null || item.usage_count === undefined) {
        usageDisplay = '<span class="invalid">N/A (Missing)</span>';
      } else if (item.usage_count > 1000) {
        usageDisplay = `<span class="invalid">${item.usage_count} L (Spike)</span>`;
      }

      const locationText = item.habitation 
        ? `${escapeHtml(item.habitation)}${item.district ? `, ${escapeHtml(item.district)}` : ''}` 
        : 'Unspecified Habitation';

      card.innerHTML = `
        <div class="wp-card-header">
          <div>
            <div class="wp-id">${escapeHtml(item.waterpoint_id || 'UNKNOWN-ID')}</div>
            <div class="wp-habitation"><i class="fas fa-map-marker-alt"></i> ${locationText}</div>
          </div>
          <span class="status-chip ${chipClass}">
            <span class="status-dot"></span> ${statusInfo.label}
          </span>
        </div>

        <div class="wp-card-body">
          <div class="metric-item">
            <label>Usage / Flow</label>
            <span>${usageDisplay}</span>
          </div>
          <div class="metric-item">
            <label>Reading ID</label>
            <span>${escapeHtml(item.reading_id || 'N/A')}</span>
          </div>
        </div>

        <div class="wp-card-footer">
          <span><i class="far fa-clock"></i> ${formatTimestamp(item.recorded_at)}</span>
          <span class="btn-detail">View Details <i class="fas fa-arrow-right"></i></span>
        </div>
      `;

      card.addEventListener('click', () => openDetailModal(item));
      grid.appendChild(card);
    });
  }

  // Task 3: Build the Detail and Summary View (Modal with Prominent Derived Figures at Top)
  function openDetailModal(item) {
    const statusInfo = getRecordStatus(item);
    const derivedBanner = document.getElementById('derived-banner');
    const derivedTitle = document.getElementById('derived-title');
    const derivedVal = document.getElementById('derived-metric-val');
    const derivedSub = document.getElementById('derived-metric-sub');
    const alertBanner = document.getElementById('alert-banner');
    const alertTitle = document.getElementById('alert-title');
    const alertDesc = document.getElementById('alert-desc');

    // Reset Alert Banner State
    alertBanner.classList.add('hidden');
    alertBanner.className = 'alert-banner hidden';

    // Calculate Derived Metrics Prominently at Top
    if (statusInfo.status === 'stopped') {
      // Calculate Downtime Days
      const daysDown = calculateDaysAgo(item.recorded_at);
      derivedTitle.textContent = 'PROMINENT DERIVED METRIC — DOWNTIME DURATION';
      derivedVal.textContent = `${daysDown} Day${daysDown === 1 ? '' : 's'} Out of Service`;
      derivedVal.style.color = 'var(--status-danger)';
      derivedSub.textContent = `Water point stopped working on ${formatTimestamp(item.recorded_at)}. Repair priority high!`;
      
      alertBanner.classList.remove('hidden');
      alertBanner.className = 'alert-banner danger';
      alertTitle.textContent = 'Water Point Breakdown Confirmed';
      alertDesc.textContent = `This tap has been unresponsive for ${daysDown} days. Dispatch maintenance team immediately.`;

    } else if (statusInfo.status === 'faulty') {
      derivedTitle.textContent = 'PROMINENT DERIVED METRIC — SENSOR FAULT ALARM';
      derivedVal.textContent = 'TELEMETRY ANOMALY DETECTED';
      derivedVal.style.color = 'var(--status-warning)';
      
      if (statusInfo.type === 'missing') {
        derivedSub.textContent = 'Data corruption: missing usage count or habitation record.';
        alertBanner.classList.remove('hidden');
        alertBanner.className = 'alert-banner warning';
        alertTitle.textContent = 'Missing Field Anomaly';
        alertDesc.textContent = 'Required sensor fields are null or empty. Check IoT transmitter board.';
      } else if (statusInfo.type === 'spike') {
        derivedSub.textContent = `Plausibility Failure: Usage count (${item.usage_count} L) exceeds max 1000 L threshold.`;
        alertBanner.classList.remove('hidden');
        alertBanner.className = 'alert-banner warning';
        alertTitle.textContent = 'Out-of-Range Spike Rejected';
        alertDesc.textContent = 'The sensor reported an impossible surge reading. Likely hardware spike or noisy line.';
      } else if (statusInfo.type === 'stuck') {
        derivedSub.textContent = `Sensor Error: Flow status is FALSE but usage count is non-zero (${item.usage_count} L).`;
        alertBanner.classList.remove('hidden');
        alertBanner.className = 'alert-banner warning';
        alertTitle.textContent = 'Stuck Sensor Hardware Fault';
        alertDesc.textContent = 'Telemetry reports zero flow while pulse counter remains frozen at non-zero state.';
      }

    } else { // Working Normal
      derivedTitle.textContent = 'PROMINENT DERIVED METRIC — WATER DELIVERY VOLUME';
      derivedVal.textContent = `${item.usage_count} Litres Drawn`;
      derivedVal.style.color = 'var(--status-success)';
      derivedSub.textContent = `Normal operating status. System health score: 100% (Active flow verified).`;
    }

    // Populate Detailed Spec Fields
    document.getElementById('detail-reading-id').textContent = item.reading_id || 'N/A';
    document.getElementById('detail-wp-id').textContent = item.waterpoint_id || 'N/A';
    document.getElementById('detail-habitation').textContent = item.habitation 
      ? `${item.habitation}${item.district ? `, ${item.district}` : ''} (Tamil Nadu)` 
      : 'Missing Habitation Data';
    document.getElementById('detail-flow-status').textContent = item.flow_ok ? 'Flow Active (OK)' : 'No Flow (Stopped)';
    document.getElementById('detail-usage-count').textContent = item.usage_count !== null ? `${item.usage_count} Litres` : 'Missing (Null)';
    document.getElementById('detail-recorded-at').textContent = formatTimestamp(item.recorded_at);

    // Open Modal
    modal.classList.add('active');
  }

  // Close Modal Handler
  modalCloseBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Contact Us Navigation & Form Handlers
  const contactNavBtn = document.getElementById('contact-us-nav-btn');
  const contactModal = document.getElementById('contact-modal');
  const contactModalCloseBtn = document.getElementById('contact-modal-close-btn');
  const modalContactForm = document.getElementById('modal-contact-form');
  const modalContactSuccessMsg = document.getElementById('modal-contact-success-msg');

  if (contactNavBtn && contactModal) {
    contactNavBtn.addEventListener('click', () => {
      if (modalContactForm) {
        modalContactForm.reset();
        modalContactForm.classList.remove('hidden');
      }
      if (modalContactSuccessMsg) {
        modalContactSuccessMsg.classList.add('hidden');
      }
      contactModal.classList.add('active');
    });
  }

  if (contactModalCloseBtn && contactModal) {
    contactModalCloseBtn.addEventListener('click', () => {
      contactModal.classList.remove('active');
    });
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) contactModal.classList.remove('active');
    });
  }

  if (modalContactForm) {
    modalContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      modalContactForm.classList.add('hidden');
      if (modalContactSuccessMsg) {
        modalContactSuccessMsg.classList.remove('hidden');
      }
      setTimeout(() => {
        if (contactModal) contactModal.classList.remove('active');
        modalContactForm.reset();
        modalContactForm.classList.remove('hidden');
        if (modalContactSuccessMsg) {
          modalContactSuccessMsg.classList.add('hidden');
        }
      }, 4000);
    });
  }

  // Task 5 Loading / Empty / Error State Helpers
  function renderLoadingState() {
    grid.innerHTML = `
      <div class="state-container">
        <div class="state-icon"><i class="fas fa-spinner fa-spin" style="color:var(--accent-blue);"></i></div>
        <div class="state-title">Loading Water Point Telemetry...</div>
        <div class="state-desc">Fetching datasets from local village database</div>
      </div>
    `;
  }

  function renderEmptyState(message) {
    grid.innerHTML = `
      <div class="state-container">
        <div class="state-icon"><i class="fas fa-inbox"></i></div>
        <div class="state-title">No Records Displayed</div>
        <div class="state-desc">${escapeHtml(message)}</div>
      </div>
    `;
  }

  function renderErrorState(message) {
    grid.innerHTML = `
      <div class="state-container">
        <div class="state-icon" style="color:var(--status-danger);"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="state-title" style="color:var(--status-danger);">Dataset Error</div>
        <div class="state-desc">${escapeHtml(message)}</div>
      </div>
    `;
  }

  // Utilities
  function calculateDaysAgo(dateString) {
    if (!dateString) return 0;
    const recordedDate = new Date(dateString);
    const currentDate = new Date('2026-07-25T11:00:00Z');
    const diffTime = Math.abs(currentDate - recordedDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function formatTimestamp(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
