// Vehicles Module

async function loadVehicles() {
    const content = document.getElementById('pageContent');
    
    // Check user permissions
    const user = window.currentUser || JSON.parse(localStorage.getItem('user'));
    const canManage = ['fleet_manager'].includes(user?.role);
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-truck"></i> Vehicle Fleet
                </h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <select id="vehicleStatusFilter" class="form-control" style="width: 200px;">
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="on_trip">On Trip</option>
                        <option value="in_shop">In Shop</option>
                        <option value="retired">Retired</option>
                    </select>
                    ${canManage ? `
                        <button class="btn btn-primary" onclick="showAddVehicleModal()">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="table-container">
                <table class="table" id="vehiclesTable">
                    <thead>
                        <tr>
                            <th>Registration #</th>
                            <th>Name/Model</th>
                            <th>Type</th>
                            <th>Capacity (kg)</th>
                            <th>Odometer (km)</th>
                            <th>Status</th>
                            ${canManage ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="vehiclesBody">
                        <tr>
                            <td colspan="${canManage ? '7' : '6'}" style="text-align: center; padding: 2rem;">
                                <i class="fas fa-spinner fa-spin"></i> Loading vehicles...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Add/Edit Vehicle Modal -->
        <div id="vehicleModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="vehicleModalTitle">Add Vehicle</h3>
                    <button class="modal-close" onclick="closeVehicleModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="vehicleForm">
                        <input type="hidden" id="vehicleId">
                        
                        <div class="form-group">
                            <label for="regNumber">
                                <i class="fas fa-hashtag"></i> Registration Number *
                            </label>
                            <input type="text" id="regNumber" placeholder="e.g., MH-01-AB-1234" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="vehicleName">
                                <i class="fas fa-truck"></i> Vehicle Name/Model *
                            </label>
                            <input type="text" id="vehicleName" placeholder="e.g., Tata Ace" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="vehicleType">
                                <i class="fas fa-tag"></i> Vehicle Type *
                            </label>
                            <select id="vehicleType" required>
                                <option value="">Select Type</option>
                                <option value="truck">Truck</option>
                                <option value="van">Van</option>
                                <option value="car">Car</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="maxCapacity">
                                <i class="fas fa-weight"></i> Maximum Load Capacity (kg) *
                            </label>
                            <input type="number" id="maxCapacity" placeholder="e.g., 1500" required min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label for="odometer">
                                <i class="fas fa-tachometer-alt"></i> Current Odometer (km)
                            </label>
                            <input type="number" id="odometer" placeholder="e.g., 50000" value="0" min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label for="acquisitionCost">
                                <i class="fas fa-rupee-sign"></i> Acquisition Cost (₹) *
                            </label>
                            <input type="number" id="acquisitionCost" placeholder="e.g., 450000" required min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label for="vehicleStatus">
                                <i class="fas fa-info-circle"></i> Status
                            </label>
                            <select id="vehicleStatus">
                                <option value="available">Available</option>
                                <option value="on_trip">On Trip</option>
                                <option value="in_shop">In Shop</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeVehicleModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveVehicle()">
                        <i class="fas fa-save"></i> Save Vehicle
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Load vehicles
    await refreshVehicles();
    
    // Add filter event listener
    document.getElementById('vehicleStatusFilter').addEventListener('change', refreshVehicles);
}

async function refreshVehicles() {
    const tbody = document.getElementById('vehiclesBody');
    const statusFilter = document.getElementById('vehicleStatusFilter')?.value;
    
    // Check user permissions
    const user = window.currentUser || JSON.parse(localStorage.getItem('user'));
    const canManage = ['fleet_manager'].includes(user?.role);
    
    try {
        const params = statusFilter ? { status: statusFilter } : {};
        const data = await api.getVehicles(params);
        
        if (data.vehicles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${canManage ? '7' : '6'}" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-inbox"></i> No vehicles found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.vehicles.map(vehicle => `
            <tr>
                <td><strong>${vehicle.registration_number}</strong></td>
                <td>${vehicle.vehicle_name}</td>
                <td><span style="text-transform: capitalize;">${vehicle.vehicle_type}</span></td>
                <td>${vehicle.max_load_capacity}</td>
                <td>${vehicle.odometer}</td>
                <td>${getStatusBadge(vehicle.status)}</td>
                ${canManage ? `
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editVehicle(${vehicle.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteVehicleConfirm(${vehicle.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                ` : ''}
            </tr>
        `).join('');
        
    } catch (error) {
        showToast('Error loading vehicles: ' + error.message);
        tbody.innerHTML = `
            <tr>
                <td colspan="${canManage ? '7' : '6'}" style="text-align: center; padding: 2rem; color: var(--danger);">
                    <i class="fas fa-exclamation-circle"></i> Error loading vehicles
                </td>
            </tr>
        `;
    }
}

function showAddVehicleModal() {
    document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleId').value = '';
    document.getElementById('vehicleModal').classList.add('active');
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('active');
}

async function editVehicle(id) {
    try {
        showLoading();
        const data = await api.getVehicle(id);
        const vehicle = data.vehicle;
        
        document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
        document.getElementById('vehicleId').value = vehicle.id;
        document.getElementById('regNumber').value = vehicle.registration_number;
        document.getElementById('vehicleName').value = vehicle.vehicle_name;
        document.getElementById('vehicleType').value = vehicle.vehicle_type;
        document.getElementById('maxCapacity').value = vehicle.max_load_capacity;
        document.getElementById('odometer').value = vehicle.odometer;
        document.getElementById('acquisitionCost').value = vehicle.acquisition_cost;
        document.getElementById('vehicleStatus').value = vehicle.status;
        
        document.getElementById('vehicleModal').classList.add('active');
        
    } catch (error) {
        showToast('Error loading vehicle: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function saveVehicle() {
    const id = document.getElementById('vehicleId').value;
    const vehicleData = {
        registration_number: document.getElementById('regNumber').value,
        vehicle_name: document.getElementById('vehicleName').value,
        vehicle_type: document.getElementById('vehicleType').value,
        max_load_capacity: parseFloat(document.getElementById('maxCapacity').value),
        odometer: parseFloat(document.getElementById('odometer').value),
        acquisition_cost: parseFloat(document.getElementById('acquisitionCost').value),
        status: document.getElementById('vehicleStatus').value
    };
    
    try {
        showLoading();
        
        if (id) {
            await api.updateVehicle(id, vehicleData);
            showToast('Vehicle updated successfully!');
        } else {
            await api.createVehicle(vehicleData);
            showToast('Vehicle created successfully!');
        }
        
        closeVehicleModal();
        await refreshVehicles();
        
    } catch (error) {
        showToast('Error saving vehicle: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteVehicleConfirm(id) {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
        return;
    }
    
    try {
        showLoading();
        await api.deleteVehicle(id);
        showToast('Vehicle deleted successfully!');
        await refreshVehicles();
    } catch (error) {
        showToast('Error deleting vehicle: ' + error.message);
    } finally {
        hideLoading();
    }
}
