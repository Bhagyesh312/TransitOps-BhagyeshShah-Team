# 🎨 TransitOps - Visual Workflow Diagrams

## 🔄 Complete System Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            WEB BROWSER                                  │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Login    │  │Dashboard │  │ Vehicles │  │  Trips   │              │
│  │ Page     │→ │   Page   │→ │   Page   │→ │   Page   │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                      ↓                                                  │
└──────────────────────┼──────────────────────────────────────────────────┘
                       │ HTTP Requests (JSON)
                       ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS SERVER                                 │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    MIDDLEWARE LAYER                          │      │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │      │
│  │  │  CORS  │→ │  Auth  │→ │  RBAC  │→ │Validator│            │      │
│  │  └────────┘  └────────┘  └────────┘  └────────┘            │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    ROUTES LAYER                              │      │
│  │  /api/auth  /api/vehicles  /api/drivers  /api/trips          │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                  CONTROLLERS LAYER                           │      │
│  │  authController  vehicleController  tripController           │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                   SERVICES LAYER                             │      │
│  │  validationService  statusService  analyticsService          │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                             ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    MODELS (ORM)                              │      │
│  │  Vehicle  Driver  Trip  Maintenance  FuelLog  Expense        │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────┬───────────────────────────────────────────┘
                              ↓ SQL Queries
┌─────────────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL DATABASE                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  users  │ │vehicles │ │ drivers │ │  trips  │ │  fuel   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐                                               │
│  │  maint  │ │expenses │                                               │
│  └─────────┘ └─────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎬 Trip Creation - Step by Step

```
USER ACTION                    SYSTEM VALIDATION                  DATABASE UPDATE
═══════════════                ══════════════════                 ═══════════════

1. Click "Create Trip"
         │
         ▼
2. Fill Form:                  
   • Source: "Mumbai"
   • Destination: "Delhi"
   • Cargo: 450 kg
   • Distance: 1400 km
         │
         ▼
3. Select Vehicle              → Check: Vehicle Available?
   "MH-01-AB-1234"             → Check: Status = 'available'?     ✓ PASS
         │                     → Check: Not In Shop/Retired?      ✓ PASS
         ▼
4. Select Driver               → Check: Driver Available?
   "Alex Kumar"                → Check: Status = 'available'?     ✓ PASS
         │                     → Check: License Valid?            ✓ PASS
         ▼                     → Check: Expiry > Today?           ✓ PASS
                               → Check: Not Suspended?            ✓ PASS
5. Validate Cargo              → Check: 450 kg ≤ 500 kg?         ✓ PASS
         │
         ▼
6. Submit Form                 → All validations PASSED!
         │
         ▼
7. DISPATCH TRIP               → Update Trip Status              trips.status = 'dispatched'
         │                     → Update Vehicle Status            vehicles.status = 'on_trip'
         │                     → Update Driver Status             drivers.status = 'on_trip'
         │                     → Set Dispatch Time                trips.dispatched_at = NOW()
         ▼
8. Success Response            ← Return Trip Details
         │                     ← Return Updated Statuses
         ▼
9. UI Update                   
   • Show trip as "Active"
   • Remove vehicle from available list
   • Remove driver from available list
   • Update dashboard KPIs

═══════════════════════════════════════════════════════════════════════════

COMPLETE TRIP:

10. Click "Complete Trip"
         │
         ▼
11. Enter Details:
   • Final Odometer: 50,500 km
   • Fuel Consumed: 150 L
         │
         ▼
12. Submit                     → Calculate Distance              actual = end - start
         │                     → Update Trip Status              trips.status = 'completed'
         │                     → Restore Vehicle Status          vehicles.status = 'available'
         │                     → Restore Driver Status           drivers.status = 'available'
         │                     → Set Completion Time             trips.completed_at = NOW()
         │                     → Update Vehicle Odometer         vehicles.odometer = 50,500
         ▼
13. Success                    ← Recalculate KPIs
         │                     ← Update Analytics
         ▼
14. Dashboard Updates
   • Fleet utilization recalculated
   • Vehicle back in available pool
   • Driver back in available pool
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER VISITS WEBSITE                                          │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
                   ┌─────────────┐
                   │ Check Token │
                   │ in Storage? │
                   └──────┬──────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
           NO                          YES
            │                           │
            ▼                           ▼
    ┌───────────────┐          ┌────────────────┐
    │  SHOW LOGIN   │          │  VERIFY TOKEN  │
    │     PAGE      │          │   WITH SERVER  │
    └───────┬───────┘          └────────┬───────┘
            │                           │
            │                    ┌──────┴──────┐
            │                    │             │
            │                  VALID        INVALID
            │                    │             │
            │                    ▼             │
            │            ┌───────────────┐     │
            │            │ LOAD DASHBOARD│     │
            │            │  + USER DATA  │     │
            │            └───────────────┘     │
            │                                  │
            └──────────────────┬───────────────┘
                               ▼
                    ┌────────────────────┐
                    │ USER ENTERS:       │
                    │ • Email            │
                    │ • Password         │
                    └──────────┬─────────┘
                               ▼
                    ┌────────────────────┐
                    │ POST /api/auth/    │
                    │      login         │
                    └──────────┬─────────┘
                               ▼
                    ┌────────────────────┐
                    │ SERVER CHECKS:     │
                    │ • Email exists?    │
                    │ • Password match?  │
                    └──────────┬─────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                  VALID               INVALID
                    │                     │
                    ▼                     ▼
        ┌───────────────────┐   ┌─────────────────┐
        │ Generate JWT      │   │ Return Error    │
        │ Include:          │   │ "Invalid        │
        │ • User ID         │   │  credentials"   │
        │ • Email           │   └─────────────────┘
        │ • Role            │
        │ • Expiry (7 days) │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │ Return Response:  │
        │ • JWT Token       │
        │ • User Data       │
        │ • Role            │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │ Frontend:         │
        │ • Save token      │
        │ • Save user data  │
        │ • Redirect to     │
        │   dashboard       │
        └───────────────────┘
```

## 🎯 Status Transition Matrix

```
ENTITY: VEHICLE
═══════════════════════════════════════════════════════════════════

Current Status    │ Action              │ New Status    │ Can Dispatch?
──────────────────┼─────────────────────┼───────────────┼──────────────
AVAILABLE         │ Dispatch Trip       │ ON TRIP       │ ✓ YES
AVAILABLE         │ Create Maintenance  │ IN SHOP       │ ✗ NO
ON TRIP           │ Complete Trip       │ AVAILABLE     │ ✓ YES
ON TRIP           │ Cancel Trip         │ AVAILABLE     │ ✓ YES
IN SHOP           │ Complete Maint      │ AVAILABLE     │ ✓ YES
IN SHOP           │ Mark as Retired     │ RETIRED       │ ✗ NO
RETIRED           │ No actions allowed  │ RETIRED       │ ✗ NO

ENTITY: DRIVER
═══════════════════════════════════════════════════════════════════

Current Status    │ Action              │ New Status    │ Can Assign?
──────────────────┼─────────────────────┼───────────────┼──────────────
AVAILABLE         │ Dispatch Trip       │ ON TRIP       │ ✓ YES
AVAILABLE         │ Mark Off Duty       │ OFF DUTY      │ ✗ NO
AVAILABLE         │ License Expired     │ SUSPENDED     │ ✗ NO
ON TRIP           │ Complete Trip       │ AVAILABLE     │ ✓ YES
ON TRIP           │ Cancel Trip         │ AVAILABLE     │ ✓ YES
OFF DUTY          │ Mark Available      │ AVAILABLE     │ ✓ YES
SUSPENDED         │ Renew License       │ AVAILABLE     │ ✓ YES

ENTITY: TRIP
═══════════════════════════════════════════════════════════════════

Current Status    │ Action              │ New Status    │ Notes
──────────────────┼─────────────────────┼───────────────┼──────────────
DRAFT             │ Dispatch            │ DISPATCHED    │ Validations run
DRAFT             │ Cancel              │ CANCELLED     │ No status change
DISPATCHED        │ Complete            │ COMPLETED     │ Enter odometer
DISPATCHED        │ Cancel              │ CANCELLED     │ Restore statuses
COMPLETED         │ No actions          │ COMPLETED     │ Read-only
CANCELLED         │ No actions          │ CANCELLED     │ Read-only
```

## 📊 KPI Calculation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD KPIs                               │
└─────────────────────────────────────────────────────────────────┘

1. ACTIVE VEHICLES
   ═══════════════
   SELECT COUNT(*) FROM vehicles 
   WHERE status IN ('available', 'on_trip', 'in_shop')
   
   Display: 45 vehicles

2. AVAILABLE VEHICLES
   ══════════════════
   SELECT COUNT(*) FROM vehicles 
   WHERE status = 'available'
   
   Display: 32 vehicles

3. VEHICLES IN MAINTENANCE
   ═══════════════════════
   SELECT COUNT(*) FROM vehicles 
   WHERE status = 'in_shop'
   
   Display: 8 vehicles

4. ACTIVE TRIPS
   ════════════
   SELECT COUNT(*) FROM trips 
   WHERE status = 'dispatched'
   
   Display: 12 trips

5. PENDING TRIPS
   ═════════════
   SELECT COUNT(*) FROM trips 
   WHERE status = 'draft'
   
   Display: 5 trips

6. DRIVERS ON DUTY
   ═══════════════
   SELECT COUNT(*) FROM drivers 
   WHERE status IN ('available', 'on_trip')
   
   Display: 28 drivers

7. FLEET UTILIZATION %
   ═══════════════════
   Formula: (Vehicles On Trip / Active Vehicles) × 100
   
   SELECT 
     (COUNT(*) FILTER (WHERE status = 'on_trip') * 100.0 / 
      COUNT(*) FILTER (WHERE status != 'retired')) 
   FROM vehicles
   
   Display: 26.7%

8. FUEL EFFICIENCY (km/L)
   ══════════════════════
   SELECT 
     AVG(actual_distance / fuel_consumed) 
   FROM trips t
   JOIN fuel_logs f ON t.id = f.trip_id
   WHERE t.status = 'completed'
   
   Display: 9.3 km/L

9. OPERATIONAL COST (Last 30 Days)
   ═══════════════════════════════
   SELECT SUM(amount) FROM expenses
   WHERE expense_date >= NOW() - INTERVAL '30 days'
   
   Display: ₹1,24,500

10. VEHICLE ROI
    ═══════════
    Formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    
    For specific vehicle:
    SELECT 
      (v.revenue - (
        SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id
      ) - (
        SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id
      )) / v.acquisition_cost * 100
    FROM vehicles v
    WHERE v.id = ?
    
    Display: 15.7% ROI
```

## 🔄 Real-Time Updates Flow

```
USER A (Fleet Manager)              SERVER                USER B (Driver)
══════════════════════              ══════                ═══════════════

Dispatch Trip                        
    │                                
    ├──POST /api/trips/123/dispatch─→ Validate
    │                                 Update DB
    │                                 • Trip: dispatched
    │                                 • Vehicle: on_trip
    │                                 • Driver: on_trip
    │                                     │
    ← Success Response ──────────────────┤
    │                                     │
Update UI:                                ├─→ Trigger Event
• Remove vehicle from                     │   (Optional: WebSocket)
  available list                          │
• Update KPIs                             │
                                          └─→ Notify Driver App
                                                  │
                                                  ← GET /api/trips/my-trips
                                                  │
                                                  Update Driver UI:
                                                  • Show new trip
                                                  • Status: Active
                                                  • Vehicle assigned
```

---

## 🎨 UI Screen Flow

```
┌─────────────┐
│  LOGIN      │
│   SCREEN    │
└──────┬──────┘
       │ Valid Credentials
       ▼
┌─────────────────────────────────────────────────────────┐
│                    DASHBOARD                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Active  │ │Available│ │In Maint│ │On Trip│          │
│  │Vehicles│ │Vehicles │ │        │ │       │          │
│  │   45   │ │   32    │ │   8    │ │  12   │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │     Fleet Utilization Chart               │          │
│  │     ████████████░░░░░░░░░░░░ 26.7%       │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Quick Actions:                                         │
│  [+ New Vehicle] [+ New Driver] [+ New Trip]           │
└────────┬────────────────────────────────────────────────┘
         │
    ┌────┴─────────┬──────────────┬───────────────┐
    │              │              │               │
    ▼              ▼              ▼               ▼
┌────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
│VEHICLES│   │ DRIVERS │   │  TRIPS   │   │ REPORTS  │
│  LIST  │   │  LIST   │   │   LIST   │   │& CHARTS  │
└────┬───┘   └────┬────┘   └────┬─────┘   └──────────┘
     │            │             │
     │            │             │
     ▼            ▼             ▼
┌────────┐   ┌─────────┐   ┌──────────┐
│ CRUD   │   │  CRUD   │   │ DISPATCH │
│VEHICLE │   │ DRIVER  │   │   FORM   │
└────────┘   └─────────┘   └──────────┘
```

This comprehensive documentation provides everything you need to understand and build the TransitOps platform! 🚀
