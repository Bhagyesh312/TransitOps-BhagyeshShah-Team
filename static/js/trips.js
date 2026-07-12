// Trips Module - with full workflow
async function loadTrips() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-route"></i> Trip Management</h3>
                <button class="btn btn-primary" onclick="showAddTripModal()"><i class="fas fa-plus"></i> Create Trip</button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Route</th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th>Cargo (kg)</th>
                            <th>Distance (km)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tripsBody"><tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
        
        <!-- Trip Modal -->
        <div id="tripModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Trip</h3>
                    <button class="modal-close" onclick="closeTripModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="tripForm">
                        <div class="form-group">
                            <label><i class="fas fa-truck"></i> Select Vehicle *</label>
                            <select id="tripVehicle" required onchange="updateVehicleInfo()">
                                <option value="">Loading...</option>
                            </select>
                            <small id="vehicleInfo" style="display: block; margin-top: 0.5rem; color: var(--text-secondary);"></small>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Select Driver *</label>
                            <select id="tripDriver" required>
                                <option value="">Loading...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-map-marker-alt"></i> Source *</label>
                            <input type="text" id="tripSource" placeholder="e.g., Mumbai" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-map-marker"></i> Destination *</label>
                            <input type="text" id="tripDestination" placeholder="e.g., Pune" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-weight-hanging"></i> Cargo Weight (kg) *</label>
                            <input type="number" id="tripCargo" placeholder="e.g., 1200" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-road"></i> Planned Distance (km) *</label>
                            <input type="number" id="tripDistance" placeholder="e.g., 170" required min="0" step="0.01">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeTripModal()">Cancel</button>
                    <button class="btn btn-secondary" onclick="saveTripDraft()"><i class="fas fa-save"></i> Save as Draft</button>
                    <button class="btn btn-primary" onclick="saveTripAndDispatch()"><i class="fas fa-shipping-fast"></i> Dispatch Now</button>
                </div>
            </div>
        </div>
        
        <!-- Complete Trip Modal -->
        <div id="completeTripModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Complete Trip</h3>
                    <button class="modal-close" onclick="closeCompleteTripModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="completeTripId">
                    <div class="form-group">
                        <label><i class="fas fa-tachometer-alt"></i> End Odometer Reading (km) *</label>
                        <input type="number" id="endOdometer" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-gas-pump"></i> Fuel Consumed (liters)</label>
                        <input type="number" id="fuelConsumed" min="0" step="0.01" placeholder="Optional">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeCompleteTripModal()">Cancel</button>
                    <button class="btn btn-success" onclick="confirmCompleteTrip()"><i class="fas fa-check"></i> Complete Trip</button>
                </div>
            </div>
        </div>
    `;
    await refreshTrips();
}

async function refreshTrips() {
    const tbody = document.getElementById('tripsBody');
    try {
        const data = await api.getTrips();
        if (data.trips.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No trips found</td></tr>';
            return;
        }
        tbody.innerHTML = data.trips.map(trip => `
            <tr>
                <td><strong>#${trip.id}</strong></td>
                <td>${trip.source} → ${trip.destination}</td>
                <td>${trip.vehicle?.registration_number || '-'}</td>
                <td>${trip.driver?.name || '-'}</td>
                <td>${trip.cargo_weight}</td>
                <td>${trip.actual_distance || trip.planned_distance}</td>
                <td>${getStatusBadge(trip.status)}</td>
                <td class="actions">
                    ${trip.status === 'draft' ? `
                        <button class="btn btn-sm btn-primary" onclick="dispatchTrip(${trip.id})" title="Dispatch">
                            <i class="fas fa-shipping-fast"></i>
                        </button>
                    ` : ''}
                    ${trip.status === 'dispatched' ? `
                        <button class="btn btn-sm btn-success" onclick="showCompleteTripModal(${trip.id})" title="Complete">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    ${trip.status === 'draft' || trip.status === 'dispatched' ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelTripConfirm(${trip.id})" title="Cancel">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading trips: ' + error.message);
    }
}

async function showAddTripModal() {
    document.getElementById('tripForm').reset();
    const modal = document.getElementById('tripModal');
    const vehicleSelect = document.getElementById('tripVehicle');
    const driverSelect = document.getElementById('tripDriver');
    
    try {
        showLoading();
        const [vehicles, drivers] = await Promise.all([
            api.getAvailableVehicles(),
            api.getAvailableDrivers()
        ]);
        
        vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>' +
            vehicles.vehicles.map(v => `<option value="${v.id}" data-capacity="${v.max_load_capacity}">${v.registration_number} - ${v.vehicle_name} (${v.max_load_capacity}kg)</option>`).join('');
        
        driverSelect.innerHTML = '<option value="">Select Driver</option>' +
            drivers.drivers.map(d => `<option value="${d.id}">${d.name} - ${d.license_category}</option>`).join('');
        
        modal.classList.add('active');
    } catch (error) {
        showToast('Error loading data: ' + error.message);
    } finally {
        hideLoading();
    }
}

function updateVehicleInfo() {
    const select = document.getElementById('tripVehicle');
    const option = select.options[select.selectedIndex];
    const info = document.getElementById('vehicleInfo');
    if (option.value) {
        const capacity = option.getAttribute('data-capacity');
        info.textContent = `Maximum capacity: ${capacity} kg`;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

function closeTripModal() {
    document.getElementById('tripModal').classList.remove('active');
}

async function saveTripDraft() {
    const tripData = {
        vehicle_id: parseInt(document.getElementById('tripVehicle').value),
        driver_id: parseInt(document.getElementById('tripDriver').value),
        source: document.getElementById('tripSource').value,
        destination: document.getElementById('tripDestination').value,
        cargo_weight: parseFloat(document.getElementById('tripCargo').value),
        planned_distance: parseFloat(document.getElementById('tripDistance').value)
    };
    
    try {
        showLoading();
        await api.createTrip(tripData);
        showToast('Trip saved as draft!');
        closeTripModal();
        await refreshTrips();
    } catch (error) {
        showToast('Error creating trip: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function saveTripAndDispatch() {
    try {
        showLoading();
        const tripData = {
            vehicle_id: parseInt(document.getElementById('tripVehicle').value),
            driver_id: parseInt(document.getElementById('tripDriver').value),
            source: document.getElementById('tripSource').value,
            destination: document.getElementById('tripDestination').value,
            cargo_weight: parseFloat(document.getElementById('tripCargo').value),
            planned_distance: parseFloat(document.getElementById('tripDistance').value)
        };
        
        const result = await api.createTrip(tripData);
        await api.dispatchTrip(result.trip.id);
        showToast('Trip dispatched successfully!');
        closeTripModal();
        await refreshTrips();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function dispatchTrip(id) {
    try {
        showLoading();
        await api.dispatchTrip(id);
        showToast('Trip dispatched successfully!');
        await refreshTrips();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showCompleteTripModal(id) {
    document.getElementById('completeTripId').value = id;
    document.getElementById('endOdometer').value = '';
    document.getElementById('fuelConsumed').value = '';
    document.getElementById('completeTripModal').classList.add('active');
}

function closeCompleteTripModal() {
    document.getElementById('completeTripModal').classList.remove('active');
}

async function confirmCompleteTrip() {
    const id = document.getElementById('completeTripId').value;
    const data = {
        end_odometer: parseFloat(document.getElementById('endOdometer').value),
        fuel_consumed: document.getElementById('fuelConsumed').value ?
            parseFloat(document.getElementById('fuelConsumed').value) : null
    };
    
    try {
        showLoading();
        await api.completeTrip(id, data);
        showToast('Trip completed successfully!');
        closeCompleteTripModal();
        await refreshTrips();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function cancelTripConfirm(id) {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
        showLoading();
        await api.cancelTrip(id);
        showToast('Trip cancelled successfully!');
        await refreshTrips();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}
