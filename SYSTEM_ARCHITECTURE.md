# TransitOps - System Architecture & Workflow

## 🎯 Core System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER LOGIN (RBAC)                          │
│  Fleet Manager | Driver | Safety Officer | Financial Analyst       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD (KPI View)                          │
│  • Active Vehicles      • Available Vehicles                        │
│  • In Maintenance       • Active Trips                              │
│  • Pending Trips        • Drivers On Duty                           │
│  • Fleet Utilization %                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  VEHICLE    │  │   DRIVER    │  │    TRIP     │
    │  REGISTRY   │  │ MANAGEMENT  │  │ MANAGEMENT  │
    └─────────────┘  └─────────────┘  └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ MAINTENANCE │  │ FUEL & EXP  │  │  REPORTS &  │
    │   LOGS      │  │  TRACKING   │  │  ANALYTICS  │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## 📋 Detailed Entity Workflow

### 1️⃣ Vehicle Lifecycle
```
┌──────────────┐
│   REGISTER   │ → Registration #, Model, Type, Capacity
│   VEHICLE    │   Acquisition Cost, Initial Odometer
└──────┬───────┘
       │ Status: AVAILABLE
       ▼
┌──────────────────────────────────────────────────────────┐
│                    VEHICLE STATES                        │
├──────────────┬───────────────┬──────────────┬────────────┤
│  AVAILABLE   │   ON TRIP     │   IN SHOP    │  RETIRED   │
│              │               │              │            │
│ • Can be     │ • Assigned to │ • Under      │ • Cannot   │
│   dispatched │   active trip │   maintenance│   be used  │
│ • Shows in   │ • Cannot be   │ • Cannot be  │ • Hidden   │
│   selection  │   reassigned  │   dispatched │   from all │
└──────┬───────┴───────┬───────┴──────┬───────┴────────────┘
       │               │              │
       │  Dispatch     │  Complete    │  Create Maint.
       │  Trip         │  Trip        │  Record
       │               │              │
       └───────────────┴──────────────┘
```

### 2️⃣ Driver Lifecycle
```
┌──────────────┐
│   REGISTER   │ → Name, License #, Category
│    DRIVER    │   Expiry Date, Contact, Safety Score
└──────┬───────┘
       │ Status: AVAILABLE
       ▼
┌──────────────────────────────────────────────────────────┐
│                     DRIVER STATES                        │
├──────────────┬───────────────┬──────────────┬────────────┤
│  AVAILABLE   │   ON TRIP     │  OFF DUTY    │ SUSPENDED  │
│              │               │              │            │
│ • Valid      │ • Assigned to │ • Not        │ • Cannot   │
│   license    │   active trip │   available  │   be       │
│ • Can be     │ • Cannot be   │ • Cannot be  │   assigned │
│   assigned   │   reassigned  │   assigned   │ • Expired  │
│              │               │              │   license  │
└──────┬───────┴───────┬───────┴──────┬───────┴────────────┘
       │               │              │
       │  Dispatch     │  Complete    │  License Check
       │  Trip         │  Trip        │  (Automated)
       │               │              │
       └───────────────┴──────────────┘
```

### 3️⃣ Trip Management Flow
```
┌─────────────┐
│ CREATE TRIP │ (Status: DRAFT)
└──────┬──────┘
       │ Input: Source, Destination, Cargo Weight, Distance
       ▼
┌─────────────────────────────────────────┐
│      VALIDATION RULES ENGINE            │
├─────────────────────────────────────────┤
│ ✓ Vehicle Available?                    │
│ ✓ Driver Available?                     │
│ ✓ Cargo ≤ Max Capacity?                 │
│ ✓ Driver License Valid?                 │
│ ✓ Vehicle not In Shop/Retired?          │
└──────┬────────────────┬─────────────────┘
       │ PASS           │ FAIL
       ▼                ▼
┌─────────────┐   ┌──────────────┐
│  DISPATCH   │   │ SHOW ERROR   │
│    TRIP     │   │   MESSAGE    │
└──────┬──────┘   └──────────────┘
       │
       │ Auto Update:
       │ • Vehicle Status → ON TRIP
       │ • Driver Status → ON TRIP
       ▼
┌─────────────┐
│   ACTIVE    │ → Real-time tracking
│    TRIP     │   Status: DISPATCHED
└──────┬──────┘
       │
       ├─────► Complete Trip
       │       • Enter final odometer
       │       • Enter fuel consumed
       │       • Auto Status: Vehicle → AVAILABLE
       │       • Auto Status: Driver → AVAILABLE
       │       • Update KPIs
       │
       └─────► Cancel Trip
               • Auto Status: Vehicle → AVAILABLE
               • Auto Status: Driver → AVAILABLE
```

### 4️⃣ Maintenance Workflow
```
┌──────────────────┐
│ CREATE MAINT.    │
│    RECORD        │
└────────┬─────────┘
         │
         │ Auto Actions:
         │ • Vehicle Status → IN SHOP
         │ • Remove from dispatch pool
         │ • Log: Type, Cost, Date
         ▼
┌──────────────────┐
│ VEHICLE IN SHOP  │ → Cannot be selected for trips
└────────┬─────────┘
         │
         │ Complete Maintenance
         ▼
┌──────────────────┐
│ CLOSE RECORD     │ → Vehicle Status → AVAILABLE
│                  │   (unless Retired)
└──────────────────┘
```

### 5️⃣ Expense Tracking & Analytics
```
┌─────────────────────────────────────────────┐
│           DATA COLLECTION                   │
├─────────────┬─────────────┬─────────────────┤
│ FUEL LOGS   │ MAINTENANCE │ OTHER EXPENSES  │
│ • Liters    │ • Cost      │ • Tolls         │
│ • Cost      │ • Type      │ • Permits       │
│ • Date      │ • Date      │ • Repairs       │
└─────────────┴─────────────┴─────────────────┘
         │             │            │
         └─────────────┼────────────┘
                       ▼
         ┌─────────────────────────┐
         │  AUTO CALCULATIONS      │
         ├─────────────────────────┤
         │ • Total Operational     │
         │   Cost per Vehicle      │
         │ • Fuel Efficiency       │
         │   (Distance/Fuel)       │
         │ • Fleet Utilization %   │
         │ • Vehicle ROI           │
         └──────────┬──────────────┘
                    ▼
         ┌─────────────────────────┐
         │  REPORTS & DASHBOARDS   │
         ├─────────────────────────┤
         │ • KPI Cards             │
         │ • Charts & Graphs       │
         │ • CSV Export            │
         │ • PDF Export (Bonus)    │
         └─────────────────────────┘
```

## 🔐 Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────────────────────┐
│                        USER ROLES                              │
├────────────────┬─────────────┬──────────────┬──────────────────┤
│ FLEET MANAGER  │   DRIVER    │SAFETY OFFICER│FINANCIAL ANALYST │
├────────────────┼─────────────┼──────────────┼──────────────────┤
│ • Full Access  │ • Create    │ • View Driver│ • View Expenses  │
│ • Manage       │   Trips     │   Profiles   │ • View Fuel Logs │
│   Vehicles     │ • View      │ • Check      │ • View Maint.    │
│ • Manage       │   Available │   License    │   Costs          │
│   Drivers      │   Vehicles  │   Validity   │ • View Reports   │
│ • View All     │ • View Own  │ • Monitor    │ • Export Data    │
│   Reports      │   Trips     │   Safety     │ • ROI Analysis   │
│ • Maintenance  │ • Complete  │   Scores     │                  │
│   Approval     │   Trips     │ • Reports    │                  │
└────────────────┴─────────────┴──────────────┴──────────────────┘
```

## 📊 Database Schema Relationships

```
┌─────────────┐         ┌─────────────┐
│    USERS    │◄───────►│    ROLES    │
└─────────────┘         └─────────────┘
                               │
                               │
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  VEHICLES   │         │    TRIPS    │         │   DRIVERS   │
│             │◄───────►│             │◄───────►│             │
│ • Reg#      │         │ • Source    │         │ • License#  │
│ • Model     │         │ • Dest      │         │ • Expiry    │
│ • Type      │         │ • Status    │         │ • Status    │
│ • Capacity  │         │ • Cargo     │         │ • Safety    │
│ • Odometer  │         │ • Distance  │         │   Score     │
│ • Status    │         └──────┬──────┘         └─────────────┘
└──────┬──────┘                │
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│ MAINTENANCE │         │  FUEL LOGS  │
│    LOGS     │         │             │
│             │         │ • Liters    │
│ • Type      │         │ • Cost      │
│ • Cost      │         │ • Date      │
│ • Status    │         │ • Trip ID   │
└─────────────┘         └─────────────┘
       │
       │
       ▼
┌─────────────┐
│  EXPENSES   │
│             │
│ • Type      │
│ • Amount    │
│ • Date      │
│ • Vehicle   │
└─────────────┘
```

## 🎯 Key Business Rules Summary

1. **Uniqueness**: Vehicle Registration # must be unique
2. **Availability**: Only Available vehicles/drivers can be assigned
3. **Capacity**: Cargo ≤ Vehicle Max Capacity
4. **License**: Driver license must be valid (not expired)
5. **Exclusivity**: One vehicle/driver = One trip at a time
6. **Auto Status**: Dispatch/Complete/Cancel auto-updates status
7. **Maintenance Block**: In Shop vehicles hidden from dispatch
8. **Suspension**: Suspended drivers cannot be assigned

## 🚀 Implementation Priority

### Phase 1 (Core - Must Have)
1. Authentication & RBAC
2. Vehicle CRUD + Status Management
3. Driver CRUD + License Validation
4. Trip Creation + Validation Rules
5. Status Transitions (Auto)

### Phase 2 (Essential)
6. Maintenance Workflow
7. Fuel & Expense Tracking
8. Dashboard KPIs
9. Basic Reports

### Phase 3 (Enhanced)
10. CSV Export
11. Analytics & Charts
12. Search & Filters

### Phase 4 (Bonus)
13. PDF Export
14. Email Reminders
15. Document Management
16. Dark Mode
