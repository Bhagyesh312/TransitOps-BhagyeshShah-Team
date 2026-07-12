from datetime import datetime, date
from models import db, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from sqlalchemy import func

class ValidationService:
    """Business rules validation service"""
    
    @staticmethod
    def validate_trip_dispatch(vehicle_id, driver_id, cargo_weight):
        """
        Validate all business rules before dispatching a trip
        Returns: (is_valid, error_message)
        """
        # Check vehicle exists
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return False, "Vehicle not found"
        
        # Check driver exists
        driver = Driver.query.get(driver_id)
        if not driver:
            return False, "Driver not found"
        
        # Rule: Retired or In Shop vehicles cannot be dispatched
        if vehicle.status in ['retired', 'in_shop']:
            return False, f"Vehicle is {vehicle.status} and cannot be dispatched"
        
        # Rule: Vehicle already on trip cannot be assigned
        if vehicle.status == 'on_trip':
            return False, "Vehicle is already assigned to another trip"
        
        # Rule: Driver with expired license cannot be assigned
        if not driver.is_license_valid():
            return False, "Driver's license has expired"
        
        # Rule: Suspended drivers cannot be assigned
        if driver.status == 'suspended':
            return False, "Driver is suspended and cannot be assigned"
        
        # Rule: Off duty drivers cannot be assigned
        if driver.status == 'off_duty':
            return False, "Driver is off duty"
        
        # Rule: Driver already on trip cannot be assigned
        if driver.status == 'on_trip':
            return False, "Driver is already assigned to another trip"
        
        # Rule: Cargo weight must not exceed vehicle capacity
        if cargo_weight > vehicle.max_load_capacity:
            return False, f"Cargo weight ({cargo_weight} kg) exceeds vehicle capacity ({vehicle.max_load_capacity} kg)"
        
        return True, None


class StatusService:
    """Automatic status management service"""
    
    @staticmethod
    def dispatch_trip(trip_id):
        """
        Dispatch a trip and update all related statuses
        """
        trip = Trip.query.get(trip_id)
        if not trip:
            return False, "Trip not found"
        
        if trip.status != 'draft':
            return False, "Only draft trips can be dispatched"
        
        # Validate before dispatch
        is_valid, error = ValidationService.validate_trip_dispatch(
            trip.vehicle_id, trip.driver_id, trip.cargo_weight
        )
        
        if not is_valid:
            return False, error
        
        # Update trip status
        trip.status = 'dispatched'
        trip.dispatched_at = datetime.utcnow()
        trip.start_odometer = trip.vehicle.odometer
        
        # Update vehicle status
        trip.vehicle.status = 'on_trip'
        
        # Update driver status
        trip.driver.status = 'on_trip'
        
        db.session.commit()
        return True, "Trip dispatched successfully"
    
    @staticmethod
    def complete_trip(trip_id, end_odometer, fuel_consumed=None):
        """
        Complete a trip and restore statuses
        """
        trip = Trip.query.get(trip_id)
        if not trip:
            return False, "Trip not found"
        
        if trip.status != 'dispatched':
            return False, "Only dispatched trips can be completed"
        
        # Update trip
        trip.status = 'completed'
        trip.completed_at = datetime.utcnow()
        trip.end_odometer = end_odometer
        trip.actual_distance = end_odometer - trip.start_odometer
        
        # Update vehicle
        trip.vehicle.status = 'available'
        trip.vehicle.odometer = end_odometer
        
        # Update driver
        trip.driver.status = 'available'
        
        # Log fuel if provided
        if fuel_consumed:
            fuel_log = FuelLog(
                vehicle_id=trip.vehicle_id,
                trip_id=trip.id,
                liters=fuel_consumed,
                cost=0,  # Can be updated later
                odometer_reading=end_odometer,
                fuel_date=date.today()
            )
            db.session.add(fuel_log)
        
        db.session.commit()
        return True, "Trip completed successfully"
    
    @staticmethod
    def cancel_trip(trip_id):
        """
        Cancel a trip and restore statuses
        """
        trip = Trip.query.get(trip_id)
        if not trip:
            return False, "Trip not found"
        
        if trip.status in ['completed', 'cancelled']:
            return False, f"Cannot cancel a {trip.status} trip"
        
        # Update trip
        trip.status = 'cancelled'
        
        # Restore vehicle status if it was dispatched
        if trip.status == 'dispatched':
            trip.vehicle.status = 'available'
            trip.driver.status = 'available'
        
        db.session.commit()
        return True, "Trip cancelled successfully"
    
    @staticmethod
    def create_maintenance(vehicle_id, maintenance_type, cost, scheduled_date, description=None):
        """
        Create maintenance record and update vehicle status
        """
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return False, "Vehicle not found"
        
        if vehicle.status == 'on_trip':
            return False, "Cannot create maintenance for vehicle on trip"
        
        # Create maintenance log
        maintenance = MaintenanceLog(
            vehicle_id=vehicle_id,
            maintenance_type=maintenance_type,
            description=description,
            cost=cost,
            scheduled_date=scheduled_date,
            status='active'
        )
        db.session.add(maintenance)
        
        # Update vehicle status to in_shop
        vehicle.status = 'in_shop'
        
        db.session.commit()
        return True, maintenance
    
    @staticmethod
    def complete_maintenance(maintenance_id):
        """
        Complete maintenance and restore vehicle status
        """
        maintenance = MaintenanceLog.query.get(maintenance_id)
        if not maintenance:
            return False, "Maintenance log not found"
        
        if maintenance.status != 'active':
            return False, "Maintenance is not active"
        
        # Update maintenance
        maintenance.status = 'completed'
        maintenance.completed_date = date.today()
        
        # Restore vehicle status (unless retired)
        if maintenance.vehicle.status == 'in_shop':
            maintenance.vehicle.status = 'available'
        
        db.session.commit()
        return True, "Maintenance completed successfully"


class AnalyticsService:
    """Analytics and KPI calculation service"""
    
    @staticmethod
    def get_dashboard_kpis():
        """Calculate all dashboard KPIs"""
        # Active vehicles (not retired)
        active_vehicles = Vehicle.query.filter(Vehicle.status != 'retired').count()
        
        # Available vehicles
        available_vehicles = Vehicle.query.filter_by(status='available').count()
        
        # Vehicles in maintenance
        vehicles_in_shop = Vehicle.query.filter_by(status='in_shop').count()
        
        # Active trips
        active_trips = Trip.query.filter_by(status='dispatched').count()
        
        # Pending trips
        pending_trips = Trip.query.filter_by(status='draft').count()
        
        # Drivers on duty (available or on trip)
        drivers_on_duty = Driver.query.filter(
            Driver.status.in_(['available', 'on_trip'])
        ).count()
        
        # Fleet utilization percentage
        vehicles_on_trip = Vehicle.query.filter_by(status='on_trip').count()
        fleet_utilization = (vehicles_on_trip / active_vehicles * 100) if active_vehicles > 0 else 0
        
        return {
            'active_vehicles': active_vehicles,
            'available_vehicles': available_vehicles,
            'vehicles_in_maintenance': vehicles_in_shop,
            'active_trips': active_trips,
            'pending_trips': pending_trips,
            'drivers_on_duty': drivers_on_duty,
            'fleet_utilization': round(fleet_utilization, 2)
        }
    
    @staticmethod
    def get_fuel_efficiency(vehicle_id=None):
        """Calculate fuel efficiency (km/liter)"""
        query = db.session.query(
            func.sum(Trip.actual_distance) / func.sum(FuelLog.liters)
        ).join(FuelLog, Trip.id == FuelLog.trip_id).filter(
            Trip.status == 'completed',
            Trip.actual_distance.isnot(None),
            FuelLog.liters > 0
        )
        
        if vehicle_id:
            query = query.filter(Trip.vehicle_id == vehicle_id)
        
        result = query.scalar()
        return round(result, 2) if result else 0
    
    @staticmethod
    def get_operational_cost(vehicle_id=None, days=30):
        """Calculate operational cost for last N days"""
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.expense_date >= start_date
        )
        
        if vehicle_id:
            query = query.filter(Expense.vehicle_id == vehicle_id)
        
        result = query.scalar()
        return round(result, 2) if result else 0
    
    @staticmethod
    def get_vehicle_roi(vehicle_id):
        """
        Calculate vehicle ROI
        Formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost * 100
        Note: Revenue calculation would require trip revenue data (not in current schema)
        """
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return None
        
        # Get total maintenance cost
        maintenance_cost = db.session.query(func.sum(MaintenanceLog.cost)).filter(
            MaintenanceLog.vehicle_id == vehicle_id
        ).scalar() or 0
        
        # Get total fuel cost
        fuel_cost = db.session.query(func.sum(FuelLog.cost)).filter(
            FuelLog.vehicle_id == vehicle_id
        ).scalar() or 0
        
        # Total operational cost
        total_cost = maintenance_cost + fuel_cost
        
        # For demo purposes, assume revenue is 2x operational cost
        # In real scenario, this should come from trip revenue
        estimated_revenue = total_cost * 2
        
        # Calculate ROI
        if vehicle.acquisition_cost > 0:
            roi = ((estimated_revenue - total_cost) / vehicle.acquisition_cost) * 100
            return round(roi, 2)
        
        return 0
    
    @staticmethod
    def get_vehicle_analytics(vehicle_id):
        """Get comprehensive analytics for a vehicle"""
        vehicle = Vehicle.query.get(vehicle_id)
        if not vehicle:
            return None
        
        # Total trips
        total_trips = Trip.query.filter_by(
            vehicle_id=vehicle_id,
            status='completed'
        ).count()
        
        # Total distance
        total_distance = db.session.query(func.sum(Trip.actual_distance)).filter(
            Trip.vehicle_id == vehicle_id,
            Trip.status == 'completed'
        ).scalar() or 0
        
        # Total fuel consumed
        total_fuel = db.session.query(func.sum(FuelLog.liters)).filter(
            FuelLog.vehicle_id == vehicle_id
        ).scalar() or 0
        
        # Fuel efficiency
        fuel_efficiency = (total_distance / total_fuel) if total_fuel > 0 else 0
        
        # Maintenance cost
        maintenance_cost = db.session.query(func.sum(MaintenanceLog.cost)).filter(
            MaintenanceLog.vehicle_id == vehicle_id
        ).scalar() or 0
        
        # Fuel cost
        fuel_cost = db.session.query(func.sum(FuelLog.cost)).filter(
            FuelLog.vehicle_id == vehicle_id
        ).scalar() or 0
        
        return {
            'vehicle': vehicle.to_dict(),
            'total_trips': total_trips,
            'total_distance': round(total_distance, 2),
            'total_fuel': round(total_fuel, 2),
            'fuel_efficiency': round(fuel_efficiency, 2),
            'maintenance_cost': round(maintenance_cost, 2),
            'fuel_cost': round(fuel_cost, 2),
            'total_operational_cost': round(maintenance_cost + fuel_cost, 2),
            'roi': AnalyticsService.get_vehicle_roi(vehicle_id)
        }
    
    @staticmethod
    def get_driver_kpis(driver_id):
        """Get KPIs specific to a driver"""
        # Driver's trips
        driver_trips = Trip.query.filter_by(driver_id=driver_id)
        active_trips = driver_trips.filter_by(status='dispatched').count()
        completed_trips = driver_trips.filter_by(status='completed').count()
        pending_trips = driver_trips.filter_by(status='draft').count()
        
        # Driver's total distance
        total_distance = db.session.query(func.sum(Trip.actual_distance)).filter(
            Trip.driver_id == driver_id,
            Trip.status == 'completed'
        ).scalar() or 0
        
        # Driver info
        driver = Driver.query.get(driver_id)
        
        return {
            'driver_name': driver.name if driver else 'Unknown',
            'active_trips': active_trips,
            'completed_trips': completed_trips,
            'pending_trips': pending_trips,
            'total_distance': round(total_distance, 2),
            'safety_score': driver.safety_score if driver else 0,
            'license_status': 'valid' if driver and driver.is_license_valid() else 'expired'
        }
    
    @staticmethod
    def get_financial_kpis():
        """Get financial KPIs for financial analysts"""
        from datetime import timedelta
        thirty_days_ago = date.today() - timedelta(days=30)
        
        # Total operational costs (last 30 days)
        total_fuel_cost = db.session.query(func.sum(FuelLog.cost)).filter(
            FuelLog.fuel_date >= thirty_days_ago
        ).scalar() or 0
        
        total_maintenance_cost = db.session.query(func.sum(MaintenanceLog.cost)).filter(
            MaintenanceLog.scheduled_date >= thirty_days_ago
        ).scalar() or 0
        
        total_other_expenses = db.session.query(func.sum(Expense.amount)).filter(
            Expense.expense_date >= thirty_days_ago
        ).scalar() or 0
        
        # Completed trips last 30 days
        trips_completed = Trip.query.filter(
            Trip.status == 'completed',
            Trip.completed_at >= datetime.now() - timedelta(days=30)
        ).count()
        
        # Average cost per trip
        total_cost = total_fuel_cost + total_maintenance_cost + total_other_expenses
        avg_cost_per_trip = (total_cost / trips_completed) if trips_completed > 0 else 0
        
        return {
            'total_fuel_cost': round(total_fuel_cost, 2),
            'total_maintenance_cost': round(total_maintenance_cost, 2),
            'total_other_expenses': round(total_other_expenses, 2),
            'total_operational_cost': round(total_cost, 2),
            'trips_completed_30d': trips_completed,
            'avg_cost_per_trip': round(avg_cost_per_trip, 2),
            'period': 'Last 30 days'
        }
