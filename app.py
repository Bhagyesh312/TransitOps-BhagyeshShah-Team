from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from services import ValidationService, StatusService, AnalyticsService
from audit_log import AuditLog, AuditLogger
from rate_limiter import rate_limit, get_rate_limit_strict, get_rate_limit_moderate, get_rate_limit_lenient
from validators import (
    InputValidator, RequestValidator, ValidationError,
    VehicleValidator, DriverValidator
)
import jwt
from functools import wraps
from datetime import datetime, timedelta, date
import os

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object(Config)
CORS(app)

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# ============================================
# Authentication Middleware
# ============================================

def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def role_required(roles):
    """Decorator to check user role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

# ============================================
# Authentication Routes
# ============================================

@app.route('/api/auth/register', methods=['POST'])
@get_rate_limit_strict()
def register():
    """Register new user with validation"""
    try:
        data = RequestValidator.validate_json_payload(
            required_fields=['email', 'password', 'name', 'role']
        )
        
        # Validate inputs
        email = InputValidator.validate_email(data['email'])
        password = InputValidator.validate_password(data['password'])
        name = InputValidator.validate_name(data['name'])
        
        # Validate role
        valid_roles = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']
        role = InputValidator.validate_enum(data['role'], valid_roles, 'Role')
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        user = User(
            email=email,
            name=name,
            role=role
        )
        user.set_password(password)
        
        # If driver role, link to driver profile if provided
        if role == 'driver' and data.get('driver_id'):
            driver_id = InputValidator.validate_integer(data['driver_id'], 'Driver ID')
            driver = Driver.query.get(driver_id)
            if driver:
                user.driver_id = driver_id
        
        db.session.add(user)
        db.session.commit()
        
        # Log registration
        AuditLogger.log_event(
            user=user,
            action='REGISTER',
            resource_type='User',
            resource_id=user.id,
            details={'email': email, 'role': role},
            status='SUCCESS'
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except ValidationError as e:
        return RequestValidator.handle_validation_error(e)
    except Exception as e:
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
@get_rate_limit_strict()
def login():
    """Login user with rate limiting and audit logging"""
    try:
        data = RequestValidator.validate_json_payload(
            required_fields=['email', 'password']
        )
        
        email = InputValidator.validate_email(data['email'])
        password = data['password']
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            # Log failed login attempt
            AuditLogger.log_login_attempt(email, success=False)
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        # Log successful login
        AuditLogger.log_login_attempt(email, success=True, user=user)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except ValidationError as e:
        return RequestValidator.handle_validation_error(e)
    except Exception as e:
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
@get_rate_limit_lenient()
def get_current_user(current_user):
    """Get current user info"""
    return jsonify({'user': current_user.to_dict()}), 200

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user - log the event"""
    AuditLogger.log_event(
        user=current_user,
        action='LOGOUT',
        resource_type='Authentication',
        status='SUCCESS'
    )
    return jsonify({'message': 'Logout successful'}), 200

# ============================================
# Vehicle Routes
# ============================================

@app.route('/api/vehicles', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver', 'safety_officer'])
@get_rate_limit_lenient()
def get_vehicles(current_user):
    """Get vehicles based on user role"""
    status = request.args.get('status')
    vehicle_type = request.args.get('type')
    
    # Role check: only fleet_manager, driver, and safety_officer can view vehicles
    if current_user.role not in ['fleet_manager', 'driver', 'safety_officer']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    query = Vehicle.query
    
    if status:
        query = query.filter_by(status=status)
    if vehicle_type:
        query = query.filter_by(vehicle_type=vehicle_type)
    
    vehicles = query.all()
    return jsonify({
        'vehicles': [v.to_dict() for v in vehicles]
    }), 200

@app.route('/api/vehicles/<int:id>', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver', 'safety_officer'])
@get_rate_limit_lenient()
def get_vehicle(current_user, id):
    """Get single vehicle"""
    vehicle = Vehicle.query.get_or_404(id)
    return jsonify({'vehicle': vehicle.to_dict()}), 200

@app.route('/api/vehicles', methods=['POST'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_moderate()
def create_vehicle(current_user):
    """Create new vehicle with validation and audit logging"""
    try:
        data = RequestValidator.validate_json_payload(
            required_fields=['registration_number', 'vehicle_name', 'vehicle_type', 
                           'max_load_capacity', 'acquisition_cost']
        )
        
        # Validate vehicle data
        validated_data = VehicleValidator.validate_vehicle_data(data, is_update=False)
        
        # Check if registration number exists
        if Vehicle.query.filter_by(registration_number=validated_data['registration_number']).first():
            return jsonify({'error': 'Registration number already exists'}), 400
        
        vehicle = Vehicle(
            registration_number=validated_data['registration_number'],
            vehicle_name=validated_data['vehicle_name'],
            vehicle_type=validated_data['vehicle_type'],
            max_load_capacity=validated_data['max_load_capacity'],
            acquisition_cost=validated_data['acquisition_cost'],
            odometer=validated_data.get('odometer', 0),
            status='available'
        )
        
        db.session.add(vehicle)
        db.session.commit()
        
        # Log vehicle creation
        AuditLogger.log_event(
            user=current_user,
            action='CREATE',
            resource_type='Vehicle',
            resource_id=vehicle.id,
            details={
                'registration_number': vehicle.registration_number,
                'vehicle_name': vehicle.vehicle_name,
                'vehicle_type': vehicle.vehicle_type
            },
            status='SUCCESS'
        )
        
        return jsonify({
            'message': 'Vehicle created successfully',
            'vehicle': vehicle.to_dict()
        }), 201
        
    except ValidationError as e:
        return RequestValidator.handle_validation_error(e)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create vehicle', 'message': str(e)}), 500

@app.route('/api/vehicles/<int:id>', methods=['PUT'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_moderate()
def update_vehicle(current_user, id):
    """Update vehicle with validation and audit logging"""
    try:
        vehicle = Vehicle.query.get_or_404(id)
        data = request.get_json()
        
        # Store old values for audit
        old_values = {
            'status': vehicle.status,
            'odometer': vehicle.odometer
        }
        
        # Validate update data
        validated_data = VehicleValidator.validate_vehicle_data(data, is_update=True)
        
        # Update fields
        for field in ['vehicle_name', 'vehicle_type', 'max_load_capacity', 
                      'acquisition_cost', 'odometer', 'status']:
            if field in validated_data:
                setattr(vehicle, field, validated_data[field])
        
        db.session.commit()
        
        # Log vehicle update
        AuditLogger.log_event(
            user=current_user,
            action='UPDATE',
            resource_type='Vehicle',
            resource_id=vehicle.id,
            details={
                'registration_number': vehicle.registration_number,
                'changed_fields': list(validated_data.keys()),
                'old_status': old_values['status'],
                'new_status': vehicle.status
            },
            status='SUCCESS'
        )
        
        return jsonify({
            'message': 'Vehicle updated successfully',
            'vehicle': vehicle.to_dict()
        }), 200
        
    except ValidationError as e:
        return RequestValidator.handle_validation_error(e)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update vehicle', 'message': str(e)}), 500

@app.route('/api/vehicles/<int:id>', methods=['DELETE'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_moderate()
def delete_vehicle(current_user, id):
    """Delete vehicle with audit logging"""
    vehicle = Vehicle.query.get_or_404(id)
    
    # Check if vehicle has active trips
    if vehicle.status == 'on_trip':
        AuditLogger.log_access_denied(
            current_user, 'Vehicle', id, 
            'Cannot delete vehicle with active trips'
        )
        return jsonify({'error': 'Cannot delete vehicle with active trips'}), 400
    
    # Store vehicle info for audit log
    vehicle_info = {
        'registration_number': vehicle.registration_number,
        'vehicle_name': vehicle.vehicle_name,
        'status': vehicle.status
    }
    
    db.session.delete(vehicle)
    db.session.commit()
    
    # Log vehicle deletion
    AuditLogger.log_event(
        user=current_user,
        action='DELETE',
        resource_type='Vehicle',
        resource_id=id,
        details=vehicle_info,
        status='SUCCESS'
    )
    
    return jsonify({'message': 'Vehicle deleted successfully'}), 200

@app.route('/api/vehicles/available', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver'])
def get_available_vehicles(current_user):
    """Get available vehicles for dispatch"""
    vehicles = Vehicle.query.filter_by(status='available').all()
    return jsonify({
        'vehicles': [v.to_dict() for v in vehicles]
    }), 200

# ============================================
# Driver Routes
# ============================================

@app.route('/api/drivers', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'safety_officer'])
def get_drivers(current_user):
    """Get all drivers - only fleet_manager and safety_officer"""
    status = request.args.get('status')
    
    query = Driver.query
    if status:
        query = query.filter_by(status=status)
    
    drivers = query.all()
    return jsonify({
        'drivers': [d.to_dict() for d in drivers]
    }), 200

@app.route('/api/drivers/<int:id>', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'safety_officer'])
def get_driver(current_user, id):
    """Get single driver - only fleet_manager and safety_officer"""
    driver = Driver.query.get_or_404(id)
    return jsonify({'driver': driver.to_dict()}), 200

@app.route('/api/drivers', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'safety_officer'])
def create_driver(current_user):
    """Create new driver"""
    data = request.get_json()
    
    required_fields = ['name', 'license_number', 'license_category', 
                       'license_expiry_date', 'contact_number']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if license number exists
    if Driver.query.filter_by(license_number=data['license_number']).first():
        return jsonify({'error': 'License number already exists'}), 400
    
    # Parse date
    try:
        expiry_date = datetime.strptime(data['license_expiry_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    driver = Driver(
        name=data['name'],
        license_number=data['license_number'],
        license_category=data['license_category'],
        license_expiry_date=expiry_date,
        contact_number=data['contact_number'],
        safety_score=data.get('safety_score', 5.0),
        status='available'
    )
    
    db.session.add(driver)
    db.session.commit()
    
    return jsonify({
        'message': 'Driver created successfully',
        'driver': driver.to_dict()
    }), 201

@app.route('/api/drivers/<int:id>', methods=['PUT'])
@token_required
@role_required(['fleet_manager', 'safety_officer'])
def update_driver(current_user, id):
    """Update driver"""
    driver = Driver.query.get_or_404(id)
    data = request.get_json()
    
    # Update fields
    for field in ['name', 'license_category', 'contact_number', 'safety_score', 'status']:
        if field in data:
            setattr(driver, field, data[field])
    
    if 'license_expiry_date' in data:
        try:
            driver.license_expiry_date = datetime.strptime(data['license_expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': 'Driver updated successfully',
        'driver': driver.to_dict()
    }), 200

@app.route('/api/drivers/<int:id>', methods=['DELETE'])
@token_required
@role_required(['fleet_manager'])
def delete_driver(current_user, id):
    """Delete driver"""
    driver = Driver.query.get_or_404(id)
    
    if driver.status == 'on_trip':
        return jsonify({'error': 'Cannot delete driver with active trips'}), 400
    
    db.session.delete(driver)
    db.session.commit()
    
    return jsonify({'message': 'Driver deleted successfully'}), 200

@app.route('/api/drivers/available', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver'])
def get_available_drivers(current_user):
    """Get available drivers for dispatch"""
    drivers = Driver.query.filter_by(status='available').filter(
        Driver.license_expiry_date > date.today()
    ).all()
    return jsonify({
        'drivers': [d.to_dict() for d in drivers]
    }), 200

# ============================================
# Trip Routes
# ============================================

@app.route('/api/trips', methods=['GET'])
@token_required
def get_trips(current_user):
    """Get trips based on user role"""
    status = request.args.get('status')
    
    query = Trip.query
    
    # Role-based data filtering
    if current_user.role == 'driver':
        # Drivers can only see their own trips
        if not current_user.driver_id:
            return jsonify({'trips': []}), 200
        query = query.filter_by(driver_id=current_user.driver_id)
    elif current_user.role == 'financial_analyst':
        # Financial analysts can only see completed trips for reporting
        query = query.filter_by(status='completed')
    # fleet_manager and safety_officer can see all trips
    
    if status:
        query = query.filter_by(status=status)
    
    trips = query.order_by(Trip.created_at.desc()).all()
    return jsonify({
        'trips': [t.to_dict() for t in trips]
    }), 200

@app.route('/api/trips/<int:id>', methods=['GET'])
@token_required
def get_trip(current_user, id):
    """Get single trip with role-based access"""
    trip = Trip.query.get_or_404(id)
    
    # Authorization check: drivers can only see their own trips
    if current_user.role == 'driver':
        if not current_user.driver_id or trip.driver_id != current_user.driver_id:
            return jsonify({'error': 'Access denied'}), 403
    
    # Financial analysts can only see completed trips
    if current_user.role == 'financial_analyst' and trip.status != 'completed':
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({'trip': trip.to_dict()}), 200

@app.route('/api/trips', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'driver'])
def create_trip(current_user):
    """Create new trip (draft)"""
    data = request.get_json()
    
    required_fields = ['vehicle_id', 'driver_id', 'source', 'destination', 
                       'cargo_weight', 'planned_distance']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Authorization: Drivers can only create trips for themselves
    if current_user.role == 'driver':
        if not current_user.driver_id:
            return jsonify({'error': 'Driver profile not linked to user account'}), 403
        if data['driver_id'] != current_user.driver_id:
            return jsonify({'error': 'Drivers can only create trips for themselves'}), 403
    
    trip = Trip(
        vehicle_id=data['vehicle_id'],
        driver_id=data['driver_id'],
        source=data['source'],
        destination=data['destination'],
        cargo_weight=data['cargo_weight'],
        planned_distance=data['planned_distance'],
        status='draft'
    )
    
    db.session.add(trip)
    db.session.commit()
    
    return jsonify({
        'message': 'Trip created as draft',
        'trip': trip.to_dict()
    }), 201

@app.route('/api/trips/<int:id>/dispatch', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'driver'])
def dispatch_trip(current_user, id):
    """Dispatch a trip (with validation)"""
    trip = Trip.query.get_or_404(id)
    
    # Authorization: Drivers can only dispatch their own trips
    if current_user.role == 'driver':
        if not current_user.driver_id or trip.driver_id != current_user.driver_id:
            return jsonify({'error': 'Access denied'}), 403
    
    success, message = StatusService.dispatch_trip(id)
    
    if not success:
        return jsonify({'error': message}), 400
    
    trip = Trip.query.get(id)
    return jsonify({
        'message': message,
        'trip': trip.to_dict()
    }), 200

@app.route('/api/trips/<int:id>/complete', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'driver'])
def complete_trip(current_user, id):
    """Complete a trip"""
    data = request.get_json()
    
    if 'end_odometer' not in data:
        return jsonify({'error': 'end_odometer is required'}), 400
    
    trip = Trip.query.get_or_404(id)
    
    # Authorization: Drivers can only complete their own trips
    if current_user.role == 'driver':
        if not current_user.driver_id or trip.driver_id != current_user.driver_id:
            return jsonify({'error': 'Access denied'}), 403
    
    success, message = StatusService.complete_trip(
        id, 
        data['end_odometer'],
        data.get('fuel_consumed')
    )
    
    if not success:
        return jsonify({'error': message}), 400
    
    trip = Trip.query.get(id)
    return jsonify({
        'message': message,
        'trip': trip.to_dict()
    }), 200

@app.route('/api/trips/<int:id>/cancel', methods=['POST'])
@token_required
@role_required(['fleet_manager'])
def cancel_trip(current_user, id):
    """Cancel a trip - only fleet managers can cancel"""
    success, message = StatusService.cancel_trip(id)
    
    if not success:
        return jsonify({'error': message}), 400
    
    trip = Trip.query.get(id)
    return jsonify({
        'message': message,
        'trip': trip.to_dict()
    }), 200

# ============================================
# Maintenance Routes
# ============================================

@app.route('/api/maintenance', methods=['GET'])
@token_required
def get_maintenance_logs(current_user):
    """Get all maintenance logs"""
    vehicle_id = request.args.get('vehicle_id')
    status = request.args.get('status')
    
    query = MaintenanceLog.query
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    if status:
        query = query.filter_by(status=status)
    
    logs = query.order_by(MaintenanceLog.scheduled_date.desc()).all()
    return jsonify({
        'maintenance_logs': [log.to_dict() for log in logs]
    }), 200

@app.route('/api/maintenance', methods=['POST'])
@token_required
@role_required(['fleet_manager'])
def create_maintenance(current_user):
    """Create maintenance record"""
    data = request.get_json()
    
    required_fields = ['vehicle_id', 'maintenance_type', 'cost', 'scheduled_date']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    success, result = StatusService.create_maintenance(
        data['vehicle_id'],
        data['maintenance_type'],
        data['cost'],
        scheduled_date,
        data.get('description')
    )
    
    if not success:
        return jsonify({'error': result}), 400
    
    return jsonify({
        'message': 'Maintenance created successfully',
        'maintenance': result.to_dict()
    }), 201

@app.route('/api/maintenance/<int:id>/complete', methods=['POST'])
@token_required
@role_required(['fleet_manager'])
def complete_maintenance(current_user, id):
    """Complete maintenance"""
    success, message = StatusService.complete_maintenance(id)
    
    if not success:
        return jsonify({'error': message}), 400
    
    maintenance = MaintenanceLog.query.get(id)
    return jsonify({
        'message': message,
        'maintenance': maintenance.to_dict()
    }), 200

# ============================================
# Expense & Fuel Routes
# ============================================

@app.route('/api/fuel-logs', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver', 'financial_analyst'])
def get_fuel_logs(current_user):
    """Get fuel logs based on role"""
    vehicle_id = request.args.get('vehicle_id')
    
    query = FuelLog.query
    
    # Drivers can only see fuel logs for their trips
    if current_user.role == 'driver':
        if not current_user.driver_id:
            return jsonify({'fuel_logs': []}), 200
        # Get trips assigned to this driver
        driver_trip_ids = [t.id for t in Trip.query.filter_by(driver_id=current_user.driver_id).all()]
        if driver_trip_ids:
            query = query.filter(FuelLog.trip_id.in_(driver_trip_ids))
        else:
            return jsonify({'fuel_logs': []}), 200
    
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    
    logs = query.order_by(FuelLog.fuel_date.desc()).all()
    return jsonify({
        'fuel_logs': [log.to_dict() for log in logs]
    }), 200

@app.route('/api/fuel-logs', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'driver'])
def create_fuel_log(current_user):
    """Create fuel log"""
    data = request.get_json()
    
    required_fields = ['vehicle_id', 'liters', 'cost', 'fuel_date']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # If trip_id is provided, verify driver owns the trip (for drivers)
    if current_user.role == 'driver':
        if not current_user.driver_id:
            return jsonify({'error': 'Driver profile not linked'}), 403
        if data.get('trip_id'):
            trip = Trip.query.get(data['trip_id'])
            if not trip or trip.driver_id != current_user.driver_id:
                return jsonify({'error': 'Access denied'}), 403
    
    try:
        fuel_date = datetime.strptime(data['fuel_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    fuel_log = FuelLog(
        vehicle_id=data['vehicle_id'],
        trip_id=data.get('trip_id'),
        liters=data['liters'],
        cost=data['cost'],
        odometer_reading=data.get('odometer_reading'),
        fuel_date=fuel_date
    )
    
    db.session.add(fuel_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Fuel log created successfully',
        'fuel_log': fuel_log.to_dict()
    }), 201

@app.route('/api/expenses', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'driver', 'financial_analyst'])
def get_expenses(current_user):
    """Get expenses based on role"""
    vehicle_id = request.args.get('vehicle_id')
    
    query = Expense.query
    
    # Drivers can only see expenses for their trips
    if current_user.role == 'driver':
        if not current_user.driver_id:
            return jsonify({'expenses': []}), 200
        driver_trip_ids = [t.id for t in Trip.query.filter_by(driver_id=current_user.driver_id).all()]
        if driver_trip_ids:
            query = query.filter(Expense.trip_id.in_(driver_trip_ids))
        else:
            return jsonify({'expenses': []}), 200
    
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    
    expenses = query.order_by(Expense.expense_date.desc()).all()
    return jsonify({
        'expenses': [exp.to_dict() for exp in expenses]
    }), 200

@app.route('/api/expenses', methods=['POST'])
@token_required
@role_required(['fleet_manager', 'driver'])
def create_expense(current_user):
    """Create expense"""
    data = request.get_json()
    
    required_fields = ['vehicle_id', 'expense_type', 'amount', 'expense_date']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # If trip_id is provided, verify driver owns the trip (for drivers)
    if current_user.role == 'driver':
        if not current_user.driver_id:
            return jsonify({'error': 'Driver profile not linked'}), 403
        if data.get('trip_id'):
            trip = Trip.query.get(data['trip_id'])
            if not trip or trip.driver_id != current_user.driver_id:
                return jsonify({'error': 'Access denied'}), 403
    
    try:
        expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    expense = Expense(
        vehicle_id=data['vehicle_id'],
        trip_id=data.get('trip_id'),
        expense_type=data['expense_type'],
        amount=data['amount'],
        description=data.get('description'),
        expense_date=expense_date
    )
    
    db.session.add(expense)
    db.session.commit()
    
    return jsonify({
        'message': 'Expense created successfully',
        'expense': expense.to_dict()
    }), 201

# ============================================
# Dashboard & Analytics Routes
# ============================================

@app.route('/api/dashboard/kpis', methods=['GET'])
@token_required
def get_dashboard_kpis(current_user):
    """Get dashboard KPIs based on user role"""
    if current_user.role == 'driver':
        # Drivers see only their own statistics
        return jsonify(AnalyticsService.get_driver_kpis(current_user.id)), 200
    elif current_user.role == 'financial_analyst':
        # Financial analysts see financial metrics only
        return jsonify(AnalyticsService.get_financial_kpis()), 200
    else:
        # Fleet managers and safety officers see full dashboard
        kpis = AnalyticsService.get_dashboard_kpis()
        return jsonify(kpis), 200

@app.route('/api/analytics/fuel-efficiency', methods=['GET'])
@token_required
def get_fuel_efficiency(current_user):
    """Get fuel efficiency"""
    vehicle_id = request.args.get('vehicle_id')
    efficiency = AnalyticsService.get_fuel_efficiency(vehicle_id)
    return jsonify({'fuel_efficiency': efficiency}), 200

@app.route('/api/analytics/operational-cost', methods=['GET'])
@token_required
def get_operational_cost(current_user):
    """Get operational cost"""
    vehicle_id = request.args.get('vehicle_id')
    days = int(request.args.get('days', 30))
    cost = AnalyticsService.get_operational_cost(vehicle_id, days)
    return jsonify({'operational_cost': cost}), 200

@app.route('/api/analytics/vehicle/<int:id>', methods=['GET'])
@token_required
@role_required(['fleet_manager', 'financial_analyst'])
def get_vehicle_analytics(current_user, id):
    """Get vehicle analytics - restricted to fleet_manager and financial_analyst"""
    analytics = AnalyticsService.get_vehicle_analytics(id)
    if not analytics:
        return jsonify({'error': 'Vehicle not found'}), 404
    return jsonify(analytics), 200

# ============================================
# Audit Log Routes (Admin/Fleet Manager Only)
# ============================================

@app.route('/api/audit/logs', methods=['GET'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_lenient()
def get_audit_logs(current_user):
    """Get audit logs with filtering"""
    try:
        # Get query parameters
        user_id = request.args.get('user_id', type=int)
        resource_type = request.args.get('resource_type')
        resource_id = request.args.get('resource_id', type=int)
        action = request.args.get('action')
        limit = min(request.args.get('limit', 100, type=int), 500)  # Max 500
        
        query = AuditLog.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        if resource_id:
            query = query.filter_by(resource_id=resource_id)
        if action:
            query = query.filter_by(action=action)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'audit_logs': [log.to_dict() for log in logs],
            'count': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch audit logs', 'message': str(e)}), 500


@app.route('/api/audit/user/<int:user_id>', methods=['GET'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_lenient()
def get_user_audit_logs(current_user, user_id):
    """Get audit logs for a specific user"""
    try:
        limit = min(request.args.get('limit', 50, type=int), 200)
        logs = AuditLogger.get_user_activity(user_id, limit)
        
        return jsonify({
            'user_id': user_id,
            'audit_logs': logs,
            'count': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user audit logs', 'message': str(e)}), 500


@app.route('/api/audit/resource/<string:resource_type>/<int:resource_id>', methods=['GET'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_lenient()
def get_resource_audit_logs(current_user, resource_type, resource_id):
    """Get audit history for a specific resource"""
    try:
        limit = min(request.args.get('limit', 50, type=int), 200)
        logs = AuditLogger.get_resource_history(resource_type, resource_id, limit)
        
        return jsonify({
            'resource_type': resource_type,
            'resource_id': resource_id,
            'audit_logs': logs,
            'count': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch resource history', 'message': str(e)}), 500


@app.route('/api/audit/security-events', methods=['GET'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_lenient()
def get_security_events(current_user):
    """Get recent security events (failed logins, access denied, etc.)"""
    try:
        hours = min(request.args.get('hours', 24, type=int), 168)  # Max 7 days
        limit = min(request.args.get('limit', 100, type=int), 500)
        
        logs = AuditLogger.get_security_events(hours, limit)
        
        return jsonify({
            'security_events': logs,
            'count': len(logs),
            'period_hours': hours
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch security events', 'message': str(e)}), 500


@app.route('/api/audit/failed-logins', methods=['GET'])
@token_required
@role_required(['fleet_manager'])
@get_rate_limit_lenient()
def get_failed_logins(current_user):
    """Get recent failed login attempts"""
    try:
        email = request.args.get('email')
        hours = min(request.args.get('hours', 24, type=int), 168)
        limit = min(request.args.get('limit', 50, type=int), 200)
        
        logs = AuditLogger.get_failed_login_attempts(email, hours, limit)
        
        return jsonify({
            'failed_logins': logs,
            'count': len(logs),
            'period_hours': hours
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch failed login attempts', 'message': str(e)}), 500


# ============================================
# Serve Frontend
# ============================================

@app.route('/')
def serve_index():
    """Serve index.html"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')

# ============================================
# Error Handlers
# ============================================

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    """Handle validation errors"""
    return jsonify({'error': 'Validation error', 'message': str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors - don't expose internal paths"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(403)
def forbidden(error):
    """Handle 403 errors"""
    return jsonify({'error': 'Access forbidden', 'message': 'Insufficient permissions'}), 403

@app.errorhandler(401)
def unauthorized(error):
    """Handle 401 errors"""
    return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors - don't expose internal details in production"""
    db.session.rollback()
    
    # In production, log the error but don't expose details
    if app.config.get('DEBUG'):
        return jsonify({'error': 'Internal server error', 'details': str(error)}), 500
    else:
        # Log error for debugging but return generic message
        app.logger.error(f"Internal error: {str(error)}")
        return jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred'}), 500

@app.errorhandler(429)
def rate_limit_exceeded(error):
    """Handle rate limit errors"""
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
