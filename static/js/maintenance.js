// Maintenance Module
async function loadMaintenance() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-tools"></i> Maintenance Logs</h3>
                <button class="btn btn-primary" onclick="showAddMaintenanceModal()"><i class="fas fa-plus"></i> New Maintenance</button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Cost</th>
                            <th>Scheduled Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="maintenanceBody"><tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
        
        <div id="maintenanceModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Create Maintenance Record</h3>
                    <button class="modal-close" onclick="closeMaintenanceModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="maintenanceForm">
                        <div class="form-group">
                            <label><i class="fas fa-truck"></i> Select Vehicle *</label>
                            <select id="maintenanceVehicle" required><option value="">Loading...</option></select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-wrench"></i> Maintenance Type *</label>
                            <select id="maintenanceType" required>
                                <option value="">Select Type</option>
                                <option value="Oil Change">Oil Change</option>
                                <option value="Tire Replacement">Tire Replacement</option>
                                <option value="Brake Service">Brake Service</option>
                                <option value="Engine Tune-up">Engine Tune-up</option>
                                <option value="Battery Replacement">Battery Replacement</option>
                                <option value="General Inspection">General Inspection</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-file-alt"></i> Description</label>
                            <textarea id="maintenanceDescription" rows="3" placeholder="Optional details..."></textarea>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-rupee-sign"></i> Cost (₹) *</label>
                            <input type="number" id="maintenanceCost" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar"></i> Scheduled Date *</label>
                            <input type="date" id="maintenanceDate" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeMaintenanceModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveMaintenance()"><i class="fas fa-save"></i> Create</button>
                </div>
            </div>
        </div>
    `;
    await refreshMaintenance();
}

async function refreshMaintenance() {
    const tbody = document.getElementById('maintenanceBody');
    try {
        const data = await api.getMaintenanceLogs();
        if (data.maintenance_logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No maintenance logs found</td></tr>';
            return;
        }
        tbody.innerHTML = data.maintenance_logs.map(log => `
            <tr>
                <td><strong>${log.vehicle?.registration_number || '-'}</strong></td>
                <td>${log.maintenance_type}</td>
                <td>${log.description || '-'}</td>
                <td>${formatCurrency(log.cost)}</td>
                <td>${formatDate(log.scheduled_date)}</td>
                <td>${getStatusBadge(log.status)}</td>
                <td class="actions">
                    ${log.status === 'active' ? `
                        <button class="btn btn-sm btn-success" onclick="completeMaintenanceConfirm(${log.id})" title="Complete">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading maintenance logs: ' + error.message);
    }
}

async function showAddMaintenanceModal() {
    document.getElementById('maintenanceForm').reset();
    const vehicleSelect = document.getElementById('maintenanceVehicle');
    try {
        showLoading();
        const data = await api.getVehicles();
        vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>' +
            data.vehicles.filter(v => v.status !== 'retired').map(v =>
                `<option value="${v.id}">${v.registration_number} - ${v.vehicle_name}</option>`
            ).join('');
        document.getElementById('maintenanceModal').classList.add('active');
    } catch (error) {
        showToast('Error loading vehicles: ' + error.message);
    } finally {
        hideLoading();
    }
}

function closeMaintenanceModal() {
    document.getElementById('maintenanceModal').classList.remove('active');
}

async function saveMaintenance() {
    const data = {
        vehicle_id: parseInt(document.getElementById('maintenanceVehicle').value),
        maintenance_type: document.getElementById('maintenanceType').value,
        description: document.getElementById('maintenanceDescription').value,
        cost: parseFloat(document.getElementById('maintenanceCost').value),
        scheduled_date: document.getElementById('maintenanceDate').value
    };
    try {
        showLoading();
        await api.createMaintenance(data);
        showToast('Maintenance record created! Vehicle moved to "In Shop" status.');
        closeMaintenanceModal();
        await refreshMaintenance();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function completeMaintenanceConfirm(id) {
    if (!confirm('Mark this maintenance as completed?')) return;
    try {
        showLoading();
        await api.completeMaintenance(id);
        showToast('Maintenance completed! Vehicle status restored.');
        await refreshMaintenance();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}
