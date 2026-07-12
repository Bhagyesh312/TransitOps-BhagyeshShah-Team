// Role-Based Permissions Helper

const RolePermissions = {
    fleet_manager: {
        canViewDashboard: true,
        canViewVehicles: true,
        canCreateVehicle: true,
        canEditVehicle: true,
        canDeleteVehicle: true,
        canViewDrivers: true,
        canCreateDriver: true,
        canEditDriver: true,
        canDeleteDriver: true,
        canViewTrips: true,
        canCreateTrip: true,
        canDispatchTrip: true,
        canCompleteTrip: true,
        canCancelTrip: true,
        canViewMaintenance: true,
        canCreateMaintenance: true,
        canCompleteMaintenance: true,
        canViewExpenses: true,
        canCreateExpense: true,
        canViewReports: true,
        canExportReports: true
    },
    driver: {
        canViewDashboard: true,
        canViewVehicles: false,
        canCreateVehicle: false,
        canEditVehicle: false,
        canDeleteVehicle: false,
        canViewDrivers: false,
        canCreateDriver: false,
        canEditDriver: false,
        canDeleteDriver: false,
        canViewTrips: true,
        canCreateTrip: true,
        canDispatchTrip: true,
        canCompleteTrip: true,
        canCancelTrip: false,
        canViewMaintenance: false,
        canCreateMaintenance: false,
        canCompleteMaintenance: false,
        canViewExpenses: true,
        canCreateExpense: true,
        canViewReports: false,
        canExportReports: false
    },
    safety_officer: {
        canViewDashboard: true,
        canViewVehicles: false,
        canCreateVehicle: false,
        canEditVehicle: false,
        canDeleteVehicle: false,
        canViewDrivers: true,
        canCreateDriver: true,
        canEditDriver: true,
        canDeleteDriver: false,
        canViewTrips: true,
        canCreateTrip: false,
        canDispatchTrip: false,
        canCompleteTrip: false,
        canCancelTrip: false,
        canViewMaintenance: false,
        canCreateMaintenance: false,
        canCompleteMaintenance: false,
        canViewExpenses: false,
        canCreateExpense: false,
        canViewReports: true,
        canExportReports: true
    },
    financial_analyst: {
        canViewDashboard: true,
        canViewVehicles: false,
        canCreateVehicle: false,
        canEditVehicle: false,
        canDeleteVehicle: false,
        canViewDrivers: false,
        canCreateDriver: false,
        canEditDriver: false,
        canDeleteDriver: false,
        canViewTrips: false,
        canCreateTrip: false,
        canDispatchTrip: false,
        canCompleteTrip: false,
        canCancelTrip: false,
        canViewMaintenance: false,
        canCreateMaintenance: false,
        canCompleteMaintenance: false,
        canViewExpenses: true,
        canCreateExpense: false,
        canViewReports: true,
        canExportReports: true
    }
};

function hasPermission(permission) {
    const user = window.currentUser || JSON.parse(localStorage.getItem('user'));
    if (!user || !user.role) return false;
    
    const rolePerms = RolePermissions[user.role];
    if (!rolePerms) return false;
    
    return rolePerms[permission] === true;
}

function getCurrentUser() {
    return window.currentUser || JSON.parse(localStorage.getItem('user'));
}

function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Export for global use
window.hasPermission = hasPermission;
window.getCurrentUser = getCurrentUser;
window.getUserRole = getUserRole;
