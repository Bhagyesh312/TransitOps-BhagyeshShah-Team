from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """User model with RBAC support"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='driver')  
    # Roles: fleet_manager, driver, safety_officer, financial_analyst
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    # Links user to driver profile if role is 'driver'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    driver_profile = db.relationship('Driver', backref='user_account', foreign_keys=[driver_id], uselist=False)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        result = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }
        if self.driver_id:
            result['driver_id'] = self.driver_id
        return result


class Vehicle(db.Model):
    """Vehicle model with status management"""
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    vehicle_name = db.Column(db.String(255), nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)  # truck, van, car
    max_load_capacity = db.Column(db.Float, nullable=False)  # in kg
    odometer = db.Column(db.Float, default=0)  # in km
    acquisition_cost = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='available', nullable=False)  
    # Status: available, on_trip, in_shop, retired
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trips = db.relationship('Trip', backref='vehicle', lazy=True)
    maintenance_logs = db.relationship('MaintenanceLog', backref='vehicle', lazy=True)
    fuel_logs = db.relationship('FuelLog', backref='vehicle', lazy=True)
    expenses = db.relationship('Expense', backref='vehicle', lazy=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'vehicle_name': self.vehicle_name,
            'vehicle_type': self.vehicle_type,
            'max_load_capacity': self.max_load_capacity,
            'odometer': self.odometer,
            'acquisition_cost': self.acquisition_cost,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Driver(db.Model):
    """Driver model with license validation"""
    __tablename__ = 'drivers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    license_category = db.Column(db.String(50), nullable=False)
    license_expiry_date = db.Column(db.Date, nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    safety_score = db.Column(db.Float, default=5.0)
    status = db.Column(db.String(50), default='available', nullable=False)  
    # Status: available, on_trip, off_duty, suspended
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trips = db.relationship('Trip', backref='driver', lazy=True)
    
    def is_license_valid(self):
        """Check if license is still valid"""
        from datetime import date
        return self.license_expiry_date > date.today()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'license_number': self.license_number,
            'license_category': self.license_category,
            'license_expiry_date': self.license_expiry_date.isoformat(),
            'contact_number': self.contact_number,
            'safety_score': self.safety_score,
            'status': self.status,
            'license_valid': self.is_license_valid(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Trip(db.Model):
    """Trip model with lifecycle management"""
    __tablename__ = 'trips'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    source = db.Column(db.String(255), nullable=False)
    destination = db.Column(db.String(255), nullable=False)
    cargo_weight = db.Column(db.Float, nullable=False)  # in kg
    planned_distance = db.Column(db.Float, nullable=False)  # in km
    actual_distance = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), default='draft', nullable=False)  
    # Status: draft, dispatched, completed, cancelled
    start_odometer = db.Column(db.Float, nullable=True)
    end_odometer = db.Column(db.Float, nullable=True)
    dispatched_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fuel_logs = db.relationship('FuelLog', backref='trip', lazy=True)
    expenses = db.relationship('Expense', backref='trip', lazy=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'driver_id': self.driver_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'driver': self.driver.to_dict() if self.driver else None,
            'source': self.source,
            'destination': self.destination,
            'cargo_weight': self.cargo_weight,
            'planned_distance': self.planned_distance,
            'actual_distance': self.actual_distance,
            'status': self.status,
            'start_odometer': self.start_odometer,
            'end_odometer': self.end_odometer,
            'dispatched_at': self.dispatched_at.isoformat() if self.dispatched_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class MaintenanceLog(db.Model):
    """Maintenance log model"""
    __tablename__ = 'maintenance_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    maintenance_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    cost = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='active', nullable=False)  # active, completed
    scheduled_date = db.Column(db.Date, nullable=False)
    completed_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'maintenance_type': self.maintenance_type,
            'description': self.description,
            'cost': self.cost,
            'status': self.status,
            'scheduled_date': self.scheduled_date.isoformat(),
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class FuelLog(db.Model):
    """Fuel log model"""
    __tablename__ = 'fuel_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=True)
    liters = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    odometer_reading = db.Column(db.Float, nullable=True)
    fuel_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'trip_id': self.trip_id,
            'liters': self.liters,
            'cost': self.cost,
            'odometer_reading': self.odometer_reading,
            'fuel_date': self.fuel_date.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class Expense(db.Model):
    """Expense model"""
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=True)
    expense_type = db.Column(db.String(100), nullable=False)  # fuel, toll, maintenance, other
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    expense_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'trip_id': self.trip_id,
            'expense_type': self.expense_type,
            'amount': self.amount,
            'description': self.description,
            'expense_date': self.expense_date.isoformat(),
            'created_at': self.created_at.isoformat()
        }
