// Reports & Analytics Module
async function loadReports() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-chart-bar"></i> Reports & Analytics</h3>
                <button class="btn btn-primary" onclick="exportToCSV()">
                    <i class="fas fa-download"></i> Export CSV
                </button>
            </div>
            
            <div class="metrics-grid" style="margin-bottom: 2rem;">
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-icon success">
                            <i class="fas fa-gas-pump"></i>
                        </div>
                    </div>
                    <div class="metric-value" id="fuelEfficiency">-</div>
                    <div class="metric-label">Avg Fuel Efficiency (km/L)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-icon warning">
                            <i class="fas fa-rupee-sign"></i>
                        </div>
                    </div>
                    <div class="metric-value" id="operationalCost">-</div>
                    <div class="metric-label">Operational Cost (30 days)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-icon primary">
                            <i class="fas fa-route"></i>
                        </div>
                    </div>
                    <div class="metric-value" id="completedTrips">-</div>
                    <div class="metric-label">Completed Trips</div>
                </div>
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-icon success">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="metric-value" id="totalDistance">-</div>
                    <div class="metric-label">Total Distance (km)</div>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem; padding-left: 1rem;"><i class="fas fa-truck"></i> Vehicle Performance</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Status</th>
                            <th>Total Trips</th>
                            <th>Total Distance (km)</th>
                            <th>Fuel Efficiency (km/L)</th>
                            <th>Operational Cost</th>
                        </tr>
                    </thead>
                    <tbody id="vehiclePerformanceBody">
                        <tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem; padding-left: 1rem;"><i class="fas fa-id-card"></i> Driver Performance</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Driver</th>
                            <th>Status</th>
                            <th>Total Trips</th>
                            <th>Safety Score</th>
                            <th>License Expiry</th>
                        </tr>
                    </thead>
                    <tbody id="driverPerformanceBody">
                        <tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await refreshReports();
}

async function refreshReports() {
    try {
        // Load analytics data
        const [fuelEff, opCost, trips, vehicles, drivers] = await Promise.all([
            api.getFuelEfficiency(),
            api.getOperationalCost(),
            api.getTrips({ status: 'completed' }),
            api.getVehicles(),
            api.getDrivers()
        ]);
        
        // Update summary metrics
        document.getElementById('fuelEfficiency').textContent = fuelEff.fuel_efficiency || '0';
        document.getElementById('operationalCost').textContent = formatCurrency(opCost.operational_cost || 0);
        document.getElementById('completedTrips').textContent = trips.trips.length;
        
        const totalDist = trips.trips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
        document.getElementById('totalDistance').textContent = totalDist.toFixed(2);
        
        // Vehicle performance table
        const vehiclePerfBody = document.getElementById('vehiclePerformanceBody');
        if (vehicles.vehicles.length === 0) {
            vehiclePerfBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No data</td></tr>';
        } else {
            vehiclePerfBody.innerHTML = await Promise.all(vehicles.vehicles.map(async (vehicle) => {
                const vehicleTrips = trips.trips.filter(t => t.vehicle_id === vehicle.id);
                const totalTrips = vehicleTrips.length;
                const totalDistance = vehicleTrips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
                
                return `
                    <tr>
                        <td><strong>${vehicle.registration_number}</strong><br><small>${vehicle.vehicle_name}</small></td>
                        <td>${getStatusBadge(vehicle.status)}</td>
                        <td>${totalTrips}</td>
                        <td>${totalDistance.toFixed(2)}</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                `;
            })).then(rows => rows.join(''));
        }
        
        // Driver performance table
        const driverPerfBody = document.getElementById('driverPerformanceBody');
        if (drivers.drivers.length === 0) {
            driverPerfBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No data</td></tr>';
        } else {
            driverPerfBody.innerHTML = drivers.drivers.map(driver => {
                const driverTrips = trips.trips.filter(t => t.driver_id === driver.id);
                const licenseValid = new Date(driver.license_expiry_date) > new Date();
                const licenseClass = licenseValid ? 'success' : 'danger';
                
                return `
                    <tr>
                        <td><strong>${driver.name}</strong></td>
                        <td>${getStatusBadge(driver.status)}</td>
                        <td>${driverTrips.length}</td>
                        <td><i class="fas fa-star" style="color: var(--warning);"></i> ${driver.safety_score}</td>
                        <td><span class="status-badge ${licenseClass}">${formatDate(driver.license_expiry_date)}</span></td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        showToast('Error loading reports: ' + error.message);
    }
}

async function exportToCSV() {
    try {
        showLoading();
        
        // Get all data
        const [vehicles, drivers, trips] = await Promise.all([
            api.getVehicles(),
            api.getDrivers(),
            api.getTrips()
        ]);
        
        // Generate CSV content
        let csv = 'TransitOps Export Report\n\n';
        
        // Vehicles CSV
        csv += 'VEHICLES\n';
        csv += 'Registration,Name,Type,Capacity,Odometer,Status\n';
        vehicles.vehicles.forEach(v => {
            csv += `${v.registration_number},${v.vehicle_name},${v.vehicle_type},${v.max_load_capacity},${v.odometer},${v.status}\n`;
        });
        
        csv += '\nDRIVERS\n';
        csv += 'Name,License,Category,Expiry,Contact,Score,Status\n';
        drivers.drivers.forEach(d => {
            csv += `${d.name},${d.license_number},${d.license_category},${d.license_expiry_date},${d.contact_number},${d.safety_score},${d.status}\n`;
        });
        
        csv += '\nTRIPS\n';
        csv += 'ID,Source,Destination,Status,Cargo,Distance,Date\n';
        trips.trips.forEach(t => {
            csv += `${t.id},${t.source},${t.destination},${t.status},${t.cargo_weight},${t.actual_distance || t.planned_distance},${t.created_at}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TransitOps_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Report exported successfully!');
        
    } catch (error) {
        showToast('Error exporting report: ' + error.message);
    } finally {
        hideLoading();
    }
}
