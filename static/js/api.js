// API Configuration and Helper Functions
const API_BASE_URL = window.location.origin + '/api';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders()
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Vehicle endpoints
    async getVehicles(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/vehicles${query ? '?' + query : ''}`);
    }

    async getVehicle(id) {
        return this.request(`/vehicles/${id}`);
    }

    async createVehicle(data) {
        return this.request('/vehicles', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateVehicle(id, data) {
        return this.request(`/vehicles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteVehicle(id) {
        return this.request(`/vehicles/${id}`, {
            method: 'DELETE'
        });
    }

    async getAvailableVehicles() {
        return this.request('/vehicles/available');
    }

    // Driver endpoints
    async getDrivers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/drivers${query ? '?' + query : ''}`);
    }

    async getDriver(id) {
        return this.request(`/drivers/${id}`);
    }

    async createDriver(data) {
        return this.request('/drivers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateDriver(id, data) {
        return this.request(`/drivers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteDriver(id) {
        return this.request(`/drivers/${id}`, {
            method: 'DELETE'
        });
    }

    async getAvailableDrivers() {
        return this.request('/drivers/available');
    }

    // Trip endpoints
    async getTrips(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/trips${query ? '?' + query : ''}`);
    }

    async getTrip(id) {
        return this.request(`/trips/${id}`);
    }

    async createTrip(data) {
        return this.request('/trips', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async dispatchTrip(id) {
        return this.request(`/trips/${id}/dispatch`, {
            method: 'POST'
        });
    }

    async completeTrip(id, data) {
        return this.request(`/trips/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async cancelTrip(id) {
        return this.request(`/trips/${id}/cancel`, {
            method: 'POST'
        });
    }

    // Maintenance endpoints
    async getMaintenanceLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/maintenance${query ? '?' + query : ''}`);
    }

    async createMaintenance(data) {
        return this.request('/maintenance', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async completeMaintenance(id) {
        return this.request(`/maintenance/${id}/complete`, {
            method: 'POST'
        });
    }

    // Expense endpoints
    async getFuelLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/fuel-logs${query ? '?' + query : ''}`);
    }

    async createFuelLog(data) {
        return this.request('/fuel-logs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getExpenses(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/expenses${query ? '?' + query : ''}`);
    }

    async createExpense(data) {
        return this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Dashboard & Analytics endpoints
    async getDashboardKPIs() {
        return this.request('/dashboard/kpis');
    }

    async getFuelEfficiency(vehicleId = null) {
        const query = vehicleId ? `?vehicle_id=${vehicleId}` : '';
        return this.request(`/analytics/fuel-efficiency${query}`);
    }

    async getOperationalCost(vehicleId = null, days = 30) {
        const params = new URLSearchParams();
        if (vehicleId) params.append('vehicle_id', vehicleId);
        params.append('days', days);
        return this.request(`/analytics/operational-cost?${params.toString()}`);
    }

    async getVehicleAnalytics(id) {
        return this.request(`/analytics/vehicle/${id}`);
    }
}

// Create global API instance
const api = new API();
let loadingShownAt = 0;
let loadingHideTimer = null;

// Utility functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    const stage = document.getElementById('loadingStage');
    if (!overlay || !stage) return;

    const user = window.currentUser || JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role || 'generic';

    if (loadingHideTimer) {
        clearTimeout(loadingHideTimer);
        loadingHideTimer = null;
    }

    loadingShownAt = Date.now();
    stage.className = `loading-stage loading-stage--${role}`;
    stage.innerHTML = getLoadingMarkup(role);
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    const elapsed = Date.now() - loadingShownAt;
    const minimumVisibleMs = 1800;
    const remaining = Math.max(0, minimumVisibleMs - elapsed);

    if (loadingHideTimer) clearTimeout(loadingHideTimer);
    loadingHideTimer = setTimeout(() => {
        overlay.style.display = 'none';
        loadingHideTimer = null;
    }, remaining);
}

function getLoadingMarkup(role) {
    if (role === 'safety_officer') {
        return `
            <div class="loader loader-safety" aria-label="Loading"></div>
            <span class="loading-text">Inspecting safety data…</span>
        `;
    }

    if (role === 'fleet_manager' || role === 'driver') {
        return `
            <div class="loader loader-truck" aria-label="Loading">
                <div class="truckWrapper">
                    <div class="truckBody">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 198 93" class="trucksvg">
                            <path stroke-width="3" stroke="currentColor" fill="var(--loader-body)" d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"></path>
                            <path stroke-width="3" stroke="currentColor" fill="var(--loader-cabin)" d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"></path>
                            <path stroke-width="2" stroke="currentColor" fill="currentColor" d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"></path>
                            <rect stroke-width="2" stroke="currentColor" fill="var(--loader-highlight)" rx="1" height="7" width="5" y="63" x="187"></rect>
                            <rect stroke-width="2" stroke="currentColor" fill="currentColor" rx="1" height="11" width="4" y="81" x="193"></rect>
                            <rect stroke-width="3" stroke="currentColor" fill="var(--loader-surface)" rx="2.5" height="90" width="121" y="1.5" x="6.5"></rect>
                            <rect stroke-width="2" stroke="currentColor" fill="var(--loader-surface)" rx="2" height="4" width="6" y="84" x="1"></rect>
                        </svg>
                    </div>
                    <div class="truckTires">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" class="tiresvg">
                            <circle stroke-width="3" stroke="currentColor" fill="currentColor" r="13.5" cy="15" cx="15"></circle>
                            <circle fill="var(--loader-surface)" r="7" cy="15" cx="15"></circle>
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" class="tiresvg">
                            <circle stroke-width="3" stroke="currentColor" fill="currentColor" r="13.5" cy="15" cx="15"></circle>
                            <circle fill="var(--loader-surface)" r="7" cy="15" cx="15"></circle>
                        </svg>
                    </div>
                    <div class="road"></div>
                    <svg xml:space="preserve" viewBox="0 0 453.459 453.459" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Capa_1" version="1.1" fill="currentColor" class="lampPost">
                        <path d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0zM232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"></path>
                    </svg>
                </div>
            </div>
            <span class="loading-text">Rolling into fleet data…</span>
        `;
    }

    if (role === 'financial_analyst') {
        return `
            <div class="loader wallet-loader" aria-label="Loading">
                <div class="wallet-back"></div>
                <div class="bill bill-1"></div>
                <div class="bill bill-2"></div>
                <div class="bill bill-3"></div>
                <div class="wallet-front">
                    <div class="text">Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>
                </div>
            </div>
            <span class="loading-text">Balancing finance data…</span>
        `;
    }

    return `
        <div class="spinner"></div>
        <span class="loading-text">Loading…</span>
    `;
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getStatusBadge(status) {
    const statusClass = status.toLowerCase().replace('_', '-');
    const statusText = status.replace('_', ' ').toUpperCase();
    return `<span class="status-badge ${statusClass}">${statusText}</span>`;
}
