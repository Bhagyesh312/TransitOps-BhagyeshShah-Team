# 🔐 Role-Based Access Control - Feature Guide

## Overview

TransitOps implements comprehensive Role-Based Access Control (RBAC) to provide different interfaces and permissions for each user role.

## 🎭 User Roles

### 1. Fleet Manager (Full Access) 👔
**Email**: `admin@transitops.com`

**Menu Access**:
- ✅ Dashboard
- ✅ Vehicles (Full CRUD)
- ✅ Drivers (Full CRUD)
- ✅ Trips (Create, Dispatch, Complete, Cancel)
- ✅ Maintenance (Create, Complete)
- ✅ Expenses (View, Create)
- ✅ Reports (View, Export)

**What They See**:
- All KPI metrics
- Add/Edit/Delete buttons for vehicles and drivers
- Full trip management controls
- Maintenance management
- Complete expense tracking
- Full analytics and export capabilities

**Typical Workflow**:
1. Add vehicles and drivers
2. Create and dispatch trips
3. Monitor fleet performance
4. Manage maintenance schedules
5. Review reports and analytics

---

### 2. Driver 🚗
**Email**: `driver@transitops.com`

**Menu Access**:
- ✅ Dashboard (Limited)
- ✅ Trips (Create, Dispatch, Complete)
- ✅ Expenses (Log fuel and expenses)
- ❌ Vehicles (Hidden)
- ❌ Drivers (Hidden)
- ❌ Maintenance (Hidden)
- ❌ Reports (Hidden)

**What They See**:
- Basic KPI metrics
- Trip creation and management
- Can dispatch trips
- Can complete assigned trips
- Can log fuel and expenses
- NO edit/delete buttons for vehicles or drivers

**Typical Workflow**:
1. View assigned trips
2. Create new trips
3. Dispatch trips
4. Complete trips with odometer readings
5. Log fuel expenses

---

### 3. Safety Officer 🛡️
**Email**: `safety@transitops.com`

**Menu Access**:
- ✅ Dashboard
- ✅ Drivers (View, Create, Edit)
- ✅ Trips (View only)
- ✅ Reports (Driver safety metrics)
- ❌ Vehicles (Hidden)
- ❌ Maintenance (Hidden)
- ❌ Expenses (Hidden)

**What They See**:
- Driver-focused KPIs
- Driver profiles with license information
- License expiry warnings (highlighted in red)
- Safety scores
- Trip history
- Can add/edit drivers
- Driver performance reports

**Typical Workflow**:
1. Monitor driver license expiry dates
2. Add new drivers with license verification
3. Update driver information
4. Track safety scores
5. Review driver performance reports

---

### 4. Financial Analyst 💰
**Email**: `finance@transitops.com`

**Menu Access**:
- ✅ Dashboard (Financial metrics)
- ✅ Expenses (View all)
- ✅ Reports (Financial analytics)
- ❌ Vehicles (Hidden)
- ❌ Drivers (Hidden)
- ❌ Trips (Hidden)
- ❌ Maintenance (Hidden)

**What They See**:
- Financial KPIs
- All fuel logs
- All expenses (tolls, maintenance, etc.)
- Operational cost reports
- ROI calculations
- Export capabilities for financial reports
- NO create/edit buttons for expenses

**Typical Workflow**:
1. Review operational costs
2. Analyze fuel efficiency
3. Calculate vehicle ROI
4. Export financial reports
5. Track expense trends

---

## 🎨 UI Differences by Role

### Dashboard View

**Fleet Manager**:
- All 7 KPI cards
- "New Trip" button visible
- Full recent trips table

**Driver**:
- All 7 KPI cards
- "New Trip" button visible
- Recent trips table (own trips highlighted)

**Safety Officer**:
- Focus on driver-related KPIs
- No "New Trip" button
- Recent trips table with driver focus

**Financial Analyst**:
- Financial KPIs emphasized
- No "New Trip" button
- Cost-related metrics highlighted

### Vehicles Page

**Fleet Manager**:
```
✅ Add Vehicle button
✅ Edit button per vehicle
✅ Delete button per vehicle
✅ All vehicle details
```

**Driver/Safety Officer/Financial Analyst**:
```
❌ Page not accessible (hidden from menu)
```

### Drivers Page

**Fleet Manager**:
```
✅ Add Driver button
✅ Edit button per driver
✅ Delete button per driver
✅ All driver details
```

**Safety Officer**:
```
✅ Add Driver button
✅ Edit button per driver
❌ NO Delete button
✅ License expiry highlighted
```

**Driver/Financial Analyst**:
```
❌ Page not accessible (hidden from menu)
```

### Trips Page

**Fleet Manager**:
```
✅ Create Trip button
✅ Dispatch button
✅ Complete button
✅ Cancel button
```

**Driver**:
```
✅ Create Trip button
✅ Dispatch button
✅ Complete button
❌ NO Cancel button (only fleet manager)
```

**Safety Officer**:
```
❌ View only (no action buttons)
```

**Financial Analyst**:
```
❌ Page not accessible
```

---

## 📱 Responsive Design Features

### Mobile (< 768px)
- Sidebar collapses into hamburger menu
- Metrics stack vertically
- Tables scroll horizontally
- Buttons stack vertically in action columns
- Touch-friendly 44px minimum button size
- Modal takes 95% of screen width

### Tablet (768px - 1024px)
- 2-column metrics grid
- Sidebar width reduced to 200px
- Horizontal scrolling for tables
- Landscape mode optimization

### Desktop (> 1024px)
- Full sidebar visible
- 3-4 column metrics grid
- All features fully visible
- No scrolling needed

### High Resolution (> 1920px)
- Content max-width: 1800px
- 4-column metrics grid
- Centered layout

---

## 🔧 Testing Role-Based Features

### Test Scenario 1: Fleet Manager
1. Login as `admin@transitops.com`
2. Verify all menu items visible
3. Check "Add" buttons on Vehicles, Drivers pages
4. Verify Edit/Delete buttons visible in tables
5. Create a trip and test all actions

### Test Scenario 2: Driver
1. Login as `driver@transitops.com`
2. Verify only Dashboard, Trips, Expenses visible
3. Check NO edit buttons in any table
4. Try to create and dispatch a trip
5. Verify can complete trips

### Test Scenario 3: Safety Officer
1. Login as `safety@transitops.com`
2. Verify Dashboard, Drivers, Trips, Reports visible
3. Check driver license expiry dates
4. Verify can edit drivers
5. Verify NO delete button for drivers

### Test Scenario 4: Financial Analyst
1. Login as `finance@transitops.com`
2. Verify only Dashboard, Expenses, Reports visible
3. Check all expense logs are visible
4. Verify can export reports
5. Verify NO create buttons for expenses

---

## 🎯 Permission System

Permissions are managed in `static/js/permissions.js`:

```javascript
// Example usage in code
if (hasPermission('canCreateVehicle')) {
    // Show "Add Vehicle" button
}

if (hasPermission('canEditDriver')) {
    // Show "Edit" button
}
```

### Available Permissions:
- `canViewDashboard`
- `canViewVehicles`, `canCreateVehicle`, `canEditVehicle`, `canDeleteVehicle`
- `canViewDrivers`, `canCreateDriver`, `canEditDriver`, `canDeleteDriver`
- `canViewTrips`, `canCreateTrip`, `canDispatchTrip`, `canCompleteTrip`, `canCancelTrip`
- `canViewMaintenance`, `canCreateMaintenance`, `canCompleteMaintenance`
- `canViewExpenses`, `canCreateExpense`
- `canViewReports`, `canExportReports`

---

## 🚀 Implementation Benefits

1. **Security**: Users only see what they need
2. **UX**: Cleaner interface per role
3. **Efficiency**: Faster navigation
4. **Compliance**: Audit trail by role
5. **Scalability**: Easy to add new roles

---

## 📝 Notes

- Menu items are dynamically hidden/shown
- Buttons are conditionally rendered
- API calls respect backend permissions
- UI matches backend authorization
- Responsive on all devices

---

**Test all roles to see the different experiences! 🎭**
