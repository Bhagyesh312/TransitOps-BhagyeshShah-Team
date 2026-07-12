// Expenses Module
async function loadExpenses() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-money-bill-wave"></i> Expense & Fuel Management</h3>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="showAddFuelModal()"><i class="fas fa-gas-pump"></i> Log Fuel</button>
                    <button class="btn btn-secondary" onclick="showAddExpenseModal()"><i class="fas fa-plus"></i> Add Expense</button>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem; padding-left: 1rem;"><i class="fas fa-gas-pump"></i> Fuel Logs</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Date</th>
                            <th>Liters</th>
                            <th>Cost</th>
                            <th>Odometer</th>
                        </tr>
                    </thead>
                    <tbody id="fuelLogsBody"><tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem; padding-left: 1rem;"><i class="fas fa-receipt"></i> Other Expenses</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="expensesBody"><tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
        
        <!-- Fuel Modal -->
        <div id="fuelModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Log Fuel Entry</h3>
                    <button class="modal-close" onclick="closeFuelModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="fuelForm">
                        <div class="form-group">
                            <label><i class="fas fa-truck"></i> Vehicle *</label>
                            <select id="fuelVehicle" required><option value="">Loading...</option></select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-gas-pump"></i> Liters *</label>
                            <input type="number" id="fuelLiters" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-rupee-sign"></i> Cost (₹) *</label>
                            <input type="number" id="fuelCost" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-tachometer-alt"></i> Odometer Reading (km)</label>
                            <input type="number" id="fuelOdometer" min="0" step="0.01" placeholder="Optional">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar"></i> Date *</label>
                            <input type="date" id="fuelDate" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeFuelModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveFuelLog()"><i class="fas fa-save"></i> Save</button>
                </div>
            </div>
        </div>
        
        <!-- Expense Modal -->
        <div id="expenseModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Add Expense</h3>
                    <button class="modal-close" onclick="closeExpenseModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="expenseForm">
                        <div class="form-group">
                            <label><i class="fas fa-truck"></i> Vehicle *</label>
                            <select id="expenseVehicle" required><option value="">Loading...</option></select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Expense Type *</label>
                            <select id="expenseType" required>
                                <option value="">Select Type</option>
                                <option value="toll">Toll</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="permit">Permit/License</option>
                                <option value="insurance">Insurance</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-rupee-sign"></i> Amount (₹) *</label>
                            <input type="number" id="expenseAmount" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-file-alt"></i> Description</label>
                            <textarea id="expenseDescription" rows="3" placeholder="Optional details..."></textarea>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar"></i> Date *</label>
                            <input type="date" id="expenseDate" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeExpenseModal()">Cancel</button>
                    <button class="btn btn-secondary" onclick="saveExpense()"><i class="fas fa-save"></i> Save</button>
                </div>
            </div>
        </div>
    `;
    await refreshExpenses();
}

async function refreshExpenses() {
    try {
        const [fuelData, expenseData] = await Promise.all([
            api.getFuelLogs(),
            api.getExpenses()
        ]);
        
        const fuelBody = document.getElementById('fuelLogsBody');
        if (fuelData.fuel_logs.length === 0) {
            fuelBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No fuel logs found</td></tr>';
        } else {
            fuelBody.innerHTML = fuelData.fuel_logs.map(log => `
                <tr>
                    <td><strong>Vehicle #${log.vehicle_id}</strong></td>
                    <td>${formatDate(log.fuel_date)}</td>
                    <td>${log.liters} L</td>
                    <td>${formatCurrency(log.cost)}</td>
                    <td>${log.odometer_reading || '-'} km</td>
                </tr>
            `).join('');
        }
        
        const expenseBody = document.getElementById('expensesBody');
        if (expenseData.expenses.length === 0) {
            expenseBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-inbox"></i> No expenses found</td></tr>';
        } else {
            expenseBody.innerHTML = expenseData.expenses.map(exp => `
                <tr>
                    <td><strong>Vehicle #${exp.vehicle_id}</strong></td>
                    <td><span style="text-transform: capitalize;">${exp.expense_type}</span></td>
                    <td>${formatCurrency(exp.amount)}</td>
                    <td>${exp.description || '-'}</td>
                    <td>${formatDate(exp.expense_date)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Error loading expenses: ' + error.message);
    }
}

async function showAddFuelModal() {
    document.getElementById('fuelForm').reset();
    document.getElementById('fuelDate').valueAsDate = new Date();
    const select = document.getElementById('fuelVehicle');
    try {
        showLoading();
        const data = await api.getVehicles();
        select.innerHTML = '<option value="">Select Vehicle</option>' +
            data.vehicles.filter(v => v.status !== 'retired').map(v =>
                `<option value="${v.id}">${v.registration_number} - ${v.vehicle_name}</option>`
            ).join('');
        document.getElementById('fuelModal').classList.add('active');
    } catch (error) {
        showToast('Error loading vehicles: ' + error.message);
    } finally {
        hideLoading();
    }
}

function closeFuelModal() {
    document.getElementById('fuelModal').classList.remove('active');
}

async function saveFuelLog() {
    const data = {
        vehicle_id: parseInt(document.getElementById('fuelVehicle').value),
        liters: parseFloat(document.getElementById('fuelLiters').value),
        cost: parseFloat(document.getElementById('fuelCost').value),
        odometer_reading: document.getElementById('fuelOdometer').value ?
            parseFloat(document.getElementById('fuelOdometer').value) : null,
        fuel_date: document.getElementById('fuelDate').value
    };
    try {
        showLoading();
        await api.createFuelLog(data);
        showToast('Fuel log saved successfully!');
        closeFuelModal();
        await refreshExpenses();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function showAddExpenseModal() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    const select = document.getElementById('expenseVehicle');
    try {
        showLoading();
        const data = await api.getVehicles();
        select.innerHTML = '<option value="">Select Vehicle</option>' +
            data.vehicles.filter(v => v.status !== 'retired').map(v =>
                `<option value="${v.id}">${v.registration_number} - ${v.vehicle_name}</option>`
            ).join('');
        document.getElementById('expenseModal').classList.add('active');
    } catch (error) {
        showToast('Error loading vehicles: ' + error.message);
    } finally {
        hideLoading();
    }
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
}

async function saveExpense() {
    const data = {
        vehicle_id: parseInt(document.getElementById('expenseVehicle').value),
        expense_type: document.getElementById('expenseType').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        description: document.getElementById('expenseDescription').value,
        expense_date: document.getElementById('expenseDate').value
    };
    try {
        showLoading();
        await api.createExpense(data);
        showToast('Expense recorded successfully!');
        closeExpenseModal();
        await refreshExpenses();
    } catch (error) {
        showToast('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}
