<div align="center">

# 🚚 TransitOps

### Smart Transport Operations Platform

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

**A comprehensive transport operations management system built for the hackathon challenge.**

TransitOps digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing business rules and providing operational insights.

> Built by Team TransitOps for the hackathon competition

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-project-structure) • [✨ Features](#-features) • [🎨 Screenshots](#-uiux-highlights) • [👤 Demo](#-demo-accounts)

</div>

---

## ✨ Features

## 🆕 Recent Updates
- Pulled the latest upstream changes from the GitHub repository and merged the newest project notes and timeline updates.
- Added role-aware loading screens that match the active interface:
  - Safety Officer: tools-style circular loader.
  - Fleet Manager and Driver: truck loader.
  - Financial Analyst: wallet loader.
- Kept the loaders visible for a readable minimum duration during login and page navigation.
- Refined the dashboard into a wider landscape layout with a right-side rail so the interface feels less congested.
- Improved notifications so login toasts show the user role and only one toast appears at a time.

### Mandatory Features ✅
- ✅ **Authentication with RBAC** - Role-based access control for different user types
- ✅ **Responsive Web Interface** - Beautiful, modern UI that works on all devices
- ✅ **Vehicle Management** - Complete CRUD with automatic status management
- ✅ **Driver Management** - Profile management with license validation
- ✅ **Trip Management** - Full lifecycle with business rule validations
- ✅ **Automatic Status Transitions** - Smart status updates across entities
- ✅ **Maintenance Workflow** - Vehicle maintenance tracking with auto-status
- ✅ **Fuel & Expense Tracking** - Comprehensive cost management
- ✅ **Dashboard with KPIs** - Real-time metrics and analytics
- ✅ **CSV Export** - Export reports for external analysis

### Business Rules Enforced ✅
- ✅ Unique vehicle registration numbers
- ✅ Retired/In Shop vehicles hidden from dispatch
- ✅ Driver license expiry validation
- ✅ Suspended drivers cannot be assigned
- ✅ One vehicle/driver per trip at a time
- ✅ Cargo weight validation against vehicle capacity
- ✅ Automatic status updates on dispatch/complete/cancel
- ✅ Maintenance auto-sets vehicle to "In Shop"

## 🏗️ Tech Stack

### Backend
- **Python 3.8+** - Programming language
- **Flask** - Web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database (easily switchable to PostgreSQL)
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with CSS Variables
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icons

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone/Download the project**
```bash
cd transitops
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
The `.env` file is already created with default values. For production, update:
- `SECRET_KEY` - Change to a random 32+ character string
- `JWT_SECRET_KEY` - Change to a random 32+ character string

4. **Initialize database with sample data**
```bash
python seed_data.py
```

This will create:
- Sample users (Fleet Manager, Driver, Safety Officer, Financial Analyst)
- 8 vehicles with different types and statuses
- 6 drivers with valid licenses
- 15 trips in various states
- Maintenance logs, fuel logs, and expenses

5. **Run the application**
```bash
python app.py
```

The application will start on `http://localhost:5000`

## 👤 Demo Accounts

After running `seed_data.py`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.com | password123 |
| Driver | driver@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Financial Analyst | finance@transitops.com | password123 |

## 📱 User Roles & Permissions

### Fleet Manager
- Full access to all features
- Manage vehicles and drivers
- Create, dispatch, and complete trips
- View all reports and analytics
- Manage maintenance records

### Driver
- View assigned trips
- Update trip status
- View own trip history
- Limited vehicle/driver information

### Safety Officer
- View and manage driver profiles
- Monitor license validity
- Track safety scores
- View driver-related reports

### Financial Analyst
- View all expenses and fuel logs
- Access financial reports
- Export cost analysis
- View ROI calculations

## 📊 Key Features Explained

### Dashboard
- Real-time KPI cards showing:
  - Active Vehicles
  - Available Vehicles
  - Vehicles in Maintenance
  - Active Trips
  - Pending Trips
  - Drivers On Duty
  - Fleet Utilization %
- Recent trips table
- Auto-refresh every 30 seconds

### Vehicle Management
- Add/Edit/Delete vehicles
- Track odometer readings
- Filter by status
- Automatic status management
- View operational costs per vehicle

### Driver Management
- Driver profiles with license information
- License expiry tracking (auto-validation)
- Safety score tracking
- Status management (Available, On Trip, Off Duty, Suspended)

### Trip Management
- **Create Trip** - Select vehicle, driver, route, cargo
- **Business Validations:**
  - Vehicle availability check
  - Driver license validity check
  - Cargo weight vs vehicle capacity
  - Status conflict prevention
- **Dispatch** - Automatically updates vehicle & driver status to "On Trip"
- **Complete** - Enter final odometer, fuel consumed
- **Cancel** - Restore vehicle & driver to available

### Maintenance Workflow
1. Create maintenance record
2. Vehicle automatically moved to "In Shop"
3. Vehicle removed from dispatch selection
4. Complete maintenance
5. Vehicle automatically restored to "Available"

### Expense Tracking
- **Fuel Logs** - Track liters, cost, odometer
- **Other Expenses** - Tolls, permits, repairs, etc.
- Automatic cost aggregation per vehicle
- Date-based filtering

### Reports & Analytics
- Fuel efficiency calculations (Distance/Fuel)
- Fleet utilization percentage
- Operational cost reports (last 30 days)
- Vehicle performance metrics
- Driver performance metrics
- CSV export functionality

## 🎨 UI/UX Highlights

- **Modern Design** - Clean, professional interface
- **Dark Sidebar** - Elegant navigation
- **Color-Coded Status** - Visual status indicators
- **Responsive Layout** - Works on mobile, tablet, desktop
- **Smooth Animations** - Transitions and hover effects
- **Icon-Rich** - Font Awesome icons throughout
- **Toast Notifications** - User-friendly feedback
- **Modal Forms** - Clean data entry experience
- **Role-Based Loaders** - Different loading animations for safety, fleet, driver, and finance workflows

## 📁 Project Structure

```
transitops/
├── app.py                 # Main Flask application
├── models.py             # Database models
├── services.py           # Business logic services
├── config.py             # Configuration
├── requirements.txt      # Python dependencies
├── seed_data.py         # Database seeder
├── .env                 # Environment variables
│
├── static/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── css/
│   │   └── style.css    # Comprehensive styles
│   └── js/
│       ├── api.js       # API wrapper
│       ├── auth.js      # Authentication
│       ├── dashboard.js # Dashboard logic
│       ├── vehicles.js  # Vehicle management
│       ├── drivers.js   # Driver management
│       ├── trips.js     # Trip management
│       ├── maintenance.js
│       ├── expenses.js
│       ├── reports.js
│       └── app.js       # Main app logic
│
└── transitops.db        # SQLite database (created on first run)
```

## 🔄 Upstream Sync

The repository has been synced with the latest commits from the upstream GitHub source. New project notes, contributor context, and timeline documentation have been pulled in, while the local UI updates and loader enhancements remain in place.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Vehicles
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/available` - Get available vehicles

### Drivers
- `GET /api/drivers` - List drivers
- `POST /api/drivers` - Create driver
- `GET /api/drivers/:id` - Get driver details
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver
- `GET /api/drivers/available` - Get available drivers

### Trips
- `GET /api/trips` - List trips
- `POST /api/trips` - Create trip (draft)
- `POST /api/trips/:id/dispatch` - Dispatch trip
- `POST /api/trips/:id/complete` - Complete trip
- `POST /api/trips/:id/cancel` - Cancel trip

### Maintenance
- `GET /api/maintenance` - List maintenance logs
- `POST /api/maintenance` - Create maintenance
- `POST /api/maintenance/:id/complete` - Complete maintenance

### Expenses
- `GET /api/fuel-logs` - List fuel logs
- `POST /api/fuel-logs` - Create fuel log
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

### Analytics
- `GET /api/dashboard/kpis` - Get KPIs
- `GET /api/analytics/fuel-efficiency` - Fuel efficiency
- `GET /api/analytics/operational-cost` - Operational cost
- `GET /api/analytics/vehicle/:id` - Vehicle analytics

## 🧪 Testing the Application

### Test Scenario 1: Complete Trip Workflow
1. Login as Fleet Manager
2. Go to Vehicles → Add a new vehicle
3. Go to Drivers → Add a new driver
4. Go to Trips → Create a trip
5. Select the vehicle and driver
6. Enter cargo weight (ensure it's below vehicle capacity)
7. Click "Dispatch Now"
8. Verify vehicle and driver status changed to "On Trip"
9. Complete the trip with odometer reading
10. Verify both statuses restored to "Available"

### Test Scenario 2: Maintenance Workflow
1. Go to Vehicles → Select an available vehicle
2. Go to Maintenance → Create new maintenance
3. Verify vehicle status changed to "In Shop"
4. Try to create a trip with that vehicle (should fail)
5. Complete the maintenance
6. Verify vehicle status restored to "Available"

### Test Scenario 3: Business Rule Validation
1. Try to dispatch trip with cargo > vehicle capacity (should fail)
2. Try to assign suspended driver (should fail)
3. Try to assign vehicle already on trip (should fail)
4. Try to assign driver with expired license (should fail)

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database
rm transitops.db
python seed_data.py
```

### Port Already in Use
```bash
# Change port in app.py (last line)
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Module Not Found
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## 🚀 Deployment

### For Production Deployment:

1. **Change to PostgreSQL**
```bash
pip install psycopg2-binary
# Update DATABASE_URL in .env
```

2. **Update secret keys in .env**
```bash
SECRET_KEY=<generate-random-32-char-string>
JWT_SECRET_KEY=<generate-random-32-char-string>
```

3. **Use Gunicorn**
```bash
pip install gunicorn
gunicorn app:app
```

4. **Deploy to:**
- **Railway.app** - Easy Python deployment
- **Render.com** - Free tier available
- **Heroku** - Classic PaaS
- **DigitalOcean** - VPS option

## 📝 Future Enhancements (Bonus Features)

- [ ] PDF Export
- [ ] Email reminders for license expiry
- [ ] Vehicle document management
- [ ] Advanced search and filters
- [ ] Dark mode toggle
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] GPS tracking integration
- [ ] Advanced analytics charts (Chart.js integration)
- [ ] Multi-tenant support

## 🤝 Contributing

This is a hackathon project, but suggestions are welcome!

## 📄 License

MIT License - Feel free to use this for learning and development

## 👨‍💻 Developer

Built with ❤️ for the hackathon challenge

---

## 🎯 Hackathon Checklist

### Mandatory Deliverables ✅
- [x] Responsive web interface
- [x] Authentication with RBAC
- [x] CRUD for Vehicles and Drivers
- [x] Trip Management with validations
- [x] Automatic status transitions
- [x] Maintenance workflow
- [x] Fuel & Expense tracking
- [x] Dashboard with KPIs

### Business Rules ✅
- [x] Unique registration numbers
- [x] Availability checks
- [x] License validation
- [x] Capacity validation
- [x] Status conflict prevention
- [x] Automatic status updates

### Bonus Features ✅
- [x] CSV export
- [x] Visual analytics
- [x] Search and filters
- [x] Modern UI/UX

---

**Ready to impress the judges! 🏆**
