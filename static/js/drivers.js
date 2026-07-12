// Drivers Module (similar structure to vehicles)

async function loadDrivers() {
    const content = document.getElementById('pageContent');
    
    // Check user permissions
    const canManage = hasPermission('canCreateDriver');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-id-card"></i> Driver Management
                </h3>
                ${canManage ? `
                    <button class="btn btn-primary" onclick="showAddDriverModal()">
                        <i class="fas fa-plus"></i> Add Driver
                    </button>
                ` : ''}
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>License #</th>
                            <th>Category</th>
                            <th>Expiry Date</th>
                            <th>Contact</th>
                            <th>Safety Score</th>
                            <th>Status</th>
                            ${canManage ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="driversBody">
                        <tr><td colspan="${canManage ? '8' : '7'}" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="driverModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="driverModalTitle">Add Driver</h3>
                    <button class="modal-close" onclick="closeDriverModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="driverForm">
                        <input type="hidden" id="driverId">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Full Name *</label>
                            <input type="text" id="driverName" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-id-card"></i> License Number *</label>
                            <input type="text" id="licenseNumber" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-certificate"></i> License Category *</label>
                            <select id="licenseCategory" required>
                                <option value="">Select Category</option>
                                <option value="LMV">LMV - Light Motor Vehicle</option>
                                <option value="HMV">HMV - Heavy Motor Vehicle</option>
                                <option value="TRANS">TRANS - Transport Vehicle</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar"></i> License Expiry Date *</label>
                            <input type="date" id="licenseExpiry" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-phone"></i> Contact Number *</label>
                            <input type="tel" id="contactNumber" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-star"></i> Safety Score</label>
                            <input type="number" id="safetyScore" value="5.0" min="0" max="5" step="0.1">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-info-circle"></i> Status</label>
                            <select id="driverStatus">
                                <option value="available">Available</option>
                                <option value="on_trip">On Trip</option>
                                <option value="off_duty">Off Duty</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeDriverModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveDriver()"><i class="fas fa-save"></i> Save</button>
                </div>
            </div>
        </div>
    `;
    
    await refreshDrivers();
}

async function refreshDrivers() {
    const tbody = document.getElementById('driversBody');
    const canManage = hasPermission('canEditDriver');
    
    try {
        const data = await api.getDrivers();
        if (data.drivers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${canManage ? '8' : '7'}" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No drivers found</td></tr>`;
            return;
        }
        tbody.innerHTML = data.drivers.map(driver => {
            const licenseValid = new Date(driver.license_expiry_date) > new Date();
            const licenseClass = licenseValid ? 'success' : 'danger';
            return `
                <tr>
                    <td><strong>${driver.name}</strong></td>
                    <td>${driver.license_number}</td>
                    <td>${driver.license_category}</td>
                    <td><span class="status-badge ${licenseClass}">${formatDate(driver.license_expiry_date)}</span></td>
                    <td>${driver.contact_number}</td>
                    <td><i class="fas fa-star" style="color: var(--warning);"></i> ${driver.safety_score}</td>
                    <td>${getStatusBadge(driver.status)}</td>
                    ${canManage ? `
                        <td class="actions">
                            <button class="btn btn-sm btn-primary" onclick="editDriver(${driver.id})"><i class="fas fa-edit"></i></button>
                            ${hasPermission('canDeleteDriver') ? `
                                <button class="btn btn-sm btn-danger" onclick="deleteDriverConfirm(${driver.id})"><i class="fas fa-trash"></i></button>
                            ` : ''}
                        </td>
                    ` : ''}
                </tr>
            `;
        }).join('');
    } catch (error) {
        showToast('Error loading drivers: ' + error.message);
    }
}

function showAddDriverModal() {
    document.getElementById('driverModalTitle').textContent = 'Add Driver';
    document.getElementById('driverForm').reset();
    document.getElementById('driverId').value = '';
    document.getElementById('driverModal').classList.add('active');
}

function closeDriverModal() {
    document.getElementById('driverModal').classList.remove('active');
}

async function editDriver(id) {
    try {
        showLoading();
        const data = await api.getDriver(id);
        const driver = data.driver;
        document.getElementById('driverModalTitle').textContent = 'Edit Driver';
        document.getElementById('driverId').value = driver.id;
        document.getElementById('driverName').value = driver.name;
        document.getElementById('licenseNumber').value = driver.license_number;
        document.getElementById('licenseCategory').value = driver.license_category;
        document.getElementById('licenseExpiry').value = driver.license_expiry_date;
        document.getElementById('contactNumber').value = driver.contact_number;
        document.getElementById('safetyScore').value = driver.safety_score;
        document.getElementById('driverStatus').value = driver.status;
        document.getElementById('driverModal').classList.add('active');
    } catch (error) {
        showToast('Error loading driver: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function saveDriver() {
    const id = document.getElementById('driverId').value;
    const driverData = {
        name: document.getElementById('driverName').value,
        license_number: document.getElementById('licenseNumber').value,
        license_category: document.getElementById('licenseCategory').value,
        license_expiry_date: document.getElementById('licenseExpiry').value,
        contact_number: document.getElementById('contactNumber').value,
        safety_score: parseFloat(document.getElementById('safetyScore').value),
        status: document.getElementById('driverStatus').value
    };
    try {
        showLoading();
        if (id) {
            await api.updateDriver(id, driverData);
            showToast('Driver updated successfully!');
        } else {
            await api.createDriver(driverData);
            showToast('Driver created successfully!');
        }
        closeDriverModal();
        await refreshDrivers();
    } catch (error) {
        showToast('Error saving driver: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteDriverConfirm(id) {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
        showLoading();
        await api.deleteDriver(id);
        showToast('Driver deleted successfully!');
        await refreshDrivers();
    } catch (error) {
        showToast('Error deleting driver: ' + error.message);
    } finally {
        hideLoading();
    }
}
