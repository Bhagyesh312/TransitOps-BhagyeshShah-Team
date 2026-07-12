// ================================================================
// TransitOps — Dashboard Module (Premium Edition)
// ================================================================

let fleetChart = null;
let tripChart = null;

async function loadDashboard() {
    const content = document.getElementById('pageContent');
    const user = window.currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const canCreateTrip = ['fleet_manager', 'driver'].includes(user?.role);

    content.innerHTML = `
        <div class="dashboard-shell">
            <section class="dashboard-main">
                <!-- KPI Cards Skeleton -->
                <div class="metrics-grid" id="kpiCards">
                    ${getKpiSkeleton()}
                </div>

                <!-- Charts Row -->
                <div class="chart-row" id="chartsRow">
                    <div class="card reveal fade-left" id="fleetChartCard">
                        <div class="card-header">
                            <div>
                                <div class="card-title"><i class="fas fa-chart-area"></i> Fleet Utilization</div>
                                <div class="card-subtitle">Real-time status distribution</div>
                            </div>
                            <div class="metric-pulse">
                                <span class="metric-pulse-dot"></span> Live
                            </div>
                        </div>
                        <div class="chart-container" id="fleetChartEl"></div>
                    </div>
                    <div class="card reveal fade-right" id="tripChartCard">
                        <div class="card-header">
                            <div>
                                <div class="card-title"><i class="fas fa-chart-bar"></i> Trip Status Overview</div>
                                <div class="card-subtitle">Current trip breakdown</div>
                            </div>
                        </div>
                        <div class="chart-container" id="tripChartEl"></div>
                    </div>
                </div>

                <!-- Recent Trips Table -->
                <div class="card reveal fade-up dashboard-table-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title"><i class="fas fa-route"></i> Recent Trips</div>
                            <div class="card-subtitle">Latest fleet activity</div>
                        </div>
                        ${canCreateTrip ? `
                            <button class="btn btn-primary btn-sm" onclick="loadPage('trips')">
                                <i class="fas fa-plus"></i> New Trip
                            </button>` : ''}
                    </div>
                    <div class="table-container">
                        <table class="table" id="recentTripsTable">
                            <thead>
                                <tr>
                                    <th>Trip ID</th>
                                    <th>Route</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="recentTripsBody">
                                <tr><td colspan="6">
                                    <div class="empty-state">
                                        <div class="spinner spinner-sm" style="margin:0 auto 8px;"></div>
                                        <div style="font-size:0.8rem;color:var(--c-text-3);">Loading trips…</div>
                                    </div>
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <aside class="dashboard-rail">
                <div class="card reveal fade-up dashboard-summary-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title"><i class="fas fa-wave-square"></i> Fleet Snapshot</div>
                            <div class="card-subtitle">Live operational pulse</div>
                        </div>
                    </div>
                    <div class="rail-metrics">
                        <div class="rail-metric"><span>Active vehicles</span><strong id="railActiveVehicles">-</strong></div>
                        <div class="rail-metric"><span>Available vehicles</span><strong id="railAvailableVehicles">-</strong></div>
                        <div class="rail-metric"><span>Trips on road</span><strong id="railActiveTrips">-</strong></div>
                        <div class="rail-metric"><span>Drivers on duty</span><strong id="railDriversOnDuty">-</strong></div>
                    </div>
                </div>

                <div class="card reveal fade-up dashboard-summary-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title"><i class="fas fa-bolt"></i> Quick Actions</div>
                            <div class="card-subtitle">Common next steps</div>
                        </div>
                    </div>
                    <div class="rail-actions">
                        ${canCreateTrip ? '<button class="rail-action" onclick="loadPage(\'trips\')">Create trip</button>' : ''}
                        <button class="rail-action" onclick="loadPage(\'vehicles\')">Review vehicles</button>
                        <button class="rail-action" onclick="loadPage(\'drivers\')">Check drivers</button>
                        <button class="rail-action" onclick="loadPage(\'reports\')">Open reports</button>
                    </div>
                </div>

                <div class="card reveal fade-up dashboard-summary-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title"><i class="fas fa-user-tag"></i> Signed in as</div>
                            <div class="card-subtitle">Role-aware access</div>
                        </div>
                    </div>
                    <div class="role-identity">
                        <strong id="railUserName">User</strong>
                        <span id="railUserRole">Role</span>
                    </div>
                </div>
            </aside>
        </div>
    `;

    // Trigger reveal animations
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 50);

    try {
        const [kpis, tripsData] = await Promise.all([
            api.getDashboardKPIs(),
            api.getTrips()
        ]);

        updateKPICards(kpis);
        updateRecentTrips(tripsData.trips.slice(0, 10));
        renderCharts(kpis, tripsData.trips);
        updateRailSummary(kpis, user);

    } catch (error) {
        showToast('Error loading dashboard: ' + error.message, 3000);
    }
}

// ================================================================
// KPI SKELETON
// ================================================================
function getKpiSkeleton() {
    const configs = [
        { label:'Active Vehicles',   icon:'fas fa-truck',       color:'primary' },
        { label:'Available Vehicles',icon:'fas fa-check-circle',color:'success' },
        { label:'In Maintenance',    icon:'fas fa-tools',       color:'warning' },
        { label:'Active Trips',      icon:'fas fa-route',       color:'primary' },
        { label:'Pending Trips',     icon:'fas fa-clock',       color:'warning' },
        { label:'Drivers On Duty',   icon:'fas fa-user-check',  color:'success' },
        { label:'Fleet Utilization', icon:'fas fa-chart-line',  color:'info' },
    ];

    return configs.map((c, i) => `
        <div class="metric-card reveal fade-up" style="animation-delay:${i * 0.07}s">
            <div class="metric-header">
                <div class="metric-icon ${c.color}">
                    <i class="${c.icon}"></i>
                </div>
                <span class="metric-trend neutral">—</span>
            </div>
            <div class="metric-value">-</div>
            <div class="metric-label">${c.label}</div>
            ${c.color === 'success' ? '<div class="metric-pulse"><span class="metric-pulse-dot"></span>Updated</div>' : ''}
        </div>
    `).join('');
}

// ================================================================
// UPDATE KPI CARDS WITH COUNT-UP
// ================================================================
function updateKPICards(kpis) {
    const cards = document.querySelectorAll('.metric-card');
    if (!cards.length) return;

    const data = [
        { val: kpis.active_vehicles,       suffix: '', trend:'neutral' },
        { val: kpis.available_vehicles,    suffix: '', trend:'up' },
        { val: kpis.vehicles_in_maintenance,suffix:'', trend:kpis.vehicles_in_maintenance > 2 ? 'down' : 'neutral' },
        { val: kpis.active_trips,          suffix: '', trend:'up' },
        { val: kpis.pending_trips,         suffix: '', trend:'neutral' },
        { val: kpis.drivers_on_duty,       suffix: '', trend:'up' },
        { val: kpis.fleet_utilization,     suffix: '%', trend: kpis.fleet_utilization > 50 ? 'up' : 'down' },
    ];

    data.forEach((d, i) => {
        if (!cards[i]) return;
        const valEl = cards[i].querySelector('.metric-value');
        const trendEl = cards[i].querySelector('.metric-trend');

        if (valEl) {
            // Animate count-up
            const target = d.val + d.suffix;
            if (typeof countUp === 'function') {
                countUp(valEl, d.val, 1000 + i * 120, d.suffix);
            } else {
                valEl.textContent = target;
            }
        }
        if (trendEl) {
            trendEl.className = `metric-trend ${d.trend}`;
            trendEl.textContent = d.trend === 'up' ? '↑ Good' : d.trend === 'down' ? '↓ Check' : '— OK';
        }

        // Stagger reveal
        cards[i].style.animationDelay = `${i * 0.07}s`;
        cards[i].classList.add('visible');
    });
}

// ================================================================
// RECENT TRIPS TABLE
// ================================================================
function updateRecentTrips(trips) {
    const tbody = document.getElementById('recentTripsBody');
    if (!tbody) return;

    if (!trips || trips.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-route"></i></div>
                    <div class="empty-state-title">No trips found</div>
                    <div class="empty-state-text">Create your first trip to see activity here.</div>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = trips.map(trip => `
        <tr>
            <td><strong style="color:var(--c-primary);font-family:monospace;">#${String(trip.id).padStart(4,'0')}</strong></td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-weight:600;color:var(--c-text);">${trip.source}</span>
                    <i class="fas fa-arrow-right" style="color:var(--c-text-3);font-size:0.7rem;"></i>
                    <span style="font-weight:600;color:var(--c-text);">${trip.destination}</span>
                </div>
            </td>
            <td>
                <span style="font-family:monospace;font-size:0.8rem;background:var(--c-surface-2);padding:2px 8px;border-radius:6px;border:1px solid var(--c-border);">
                    ${trip.vehicle?.registration_number || '—'}
                </span>
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:26px;height:26px;border-radius:8px;background:var(--grad-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.65rem;font-weight:700;">
                        ${(trip.driver?.name || 'U')[0]}
                    </div>
                    <span>${trip.driver?.name || '—'}</span>
                </div>
            </td>
            <td>${getStatusBadge(trip.status)}</td>
            <td style="color:var(--c-text-3);font-size:0.8rem;">${formatDateTime(trip.created_at)}</td>
        </tr>
    `).join('');
}

function updateRailSummary(kpis, user) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('railActiveVehicles', kpis.active_vehicles ?? '-');
    setText('railAvailableVehicles', kpis.available_vehicles ?? '-');
    setText('railActiveTrips', kpis.active_trips ?? '-');
    setText('railDriversOnDuty', kpis.drivers_on_duty ?? '-');
    setText('railUserName', user?.name || 'User');
    setText('railUserRole', (user?.role || 'role').replace('_', ' ').toUpperCase());
}

// ================================================================
// APEXCHARTS
// ================================================================
function renderCharts(kpis, trips) {
    renderFleetDonut(kpis);
    renderTripBar(trips);
}

function getApexDefaults() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        textColor: isDark ? '#b4aedc' : '#4a4770',
        gridColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(99,102,241,0.08)',
        bg: isDark ? '#0f0e1a' : '#ffffff',
        fontFamily: 'Inter, sans-serif',
    };
}

function renderFleetDonut(kpis) {
    const el = document.getElementById('fleetChartEl');
    if (!el || typeof ApexCharts === 'undefined') return;
    if (fleetChart) { fleetChart.destroy(); fleetChart = null; }

    const avail = kpis.available_vehicles || 0;
    const onTrip = kpis.active_trips || 0;
    const maint = kpis.vehicles_in_maintenance || 0;
    const retired = Math.max(0, (kpis.active_vehicles || 0) - avail - onTrip - maint);
    const def = getApexDefaults();

    fleetChart = new ApexCharts(el, {
        chart: {
            type: 'donut', height: 220,
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 800 },
            toolbar: { show: false },
            fontFamily: def.fontFamily,
        },
        series: [avail, onTrip, maint, Math.max(retired, 0)],
        labels: ['Available', 'On Trip', 'Maintenance', 'Retired'],
        colors: ['#10b981', '#6366f1', '#f59e0b', '#9892c8'],
        legend: {
            position: 'bottom', fontSize: '12px',
            labels: { colors: def.textColor },
        },
        plotOptions: {
            pie: { donut: { size: '68%', labels: {
                show: true, total: { show: true, label: 'Total', color: def.textColor, fontWeight: 700 }
            }}}
        },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        tooltip: { theme: document.documentElement.getAttribute('data-theme') || 'light' },
        responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }]
    });
    fleetChart.render();
}

function renderTripBar(trips) {
    const el = document.getElementById('tripChartEl');
    if (!el || typeof ApexCharts === 'undefined') return;
    if (tripChart) { tripChart.destroy(); tripChart = null; }

    const counts = { draft: 0, dispatched: 0, completed: 0, cancelled: 0 };
    (trips || []).forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    const def = getApexDefaults();

    tripChart = new ApexCharts(el, {
        chart: {
            type: 'bar', height: 220,
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 700, dynamicAnimation: { enabled: true, speed: 350 } },
            toolbar: { show: false },
            fontFamily: def.fontFamily,
        },
        series: [{ name: 'Trips', data: [counts.draft, counts.dispatched, counts.completed, counts.cancelled] }],
        xaxis: {
            categories: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
            labels: { style: { colors: def.textColor, fontSize: '12px' } },
            axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: def.textColor }, formatter: v => Math.round(v) } },
        colors: ['#6366f1'],
        fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', gradientToColors: ['#8b5cf6'], stops: [0, 100] } },
        plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', distributed: false } },
        dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '11px', fontWeight: 700 } },
        grid: { borderColor: def.gridColor, strokeDashArray: 4 },
        tooltip: { theme: document.documentElement.getAttribute('data-theme') || 'light' },
    });
    tripChart.render();
}
