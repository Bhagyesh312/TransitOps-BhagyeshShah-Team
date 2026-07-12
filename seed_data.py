"""
Seed database with sample data for testing
Author: Rishi Chavda
"""
from app import app
from models import db, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from datetime import datetime, date, timedelta
import random

def seed_database():
    """Seed the database with sample data"""
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()
        
        # Create users
        print("Creating users...")
        users = [
            User(email='admin@transitops.com', name='Admin User', role='fleet_manager'),
            User(email='driver@transitops.com', name='John Driver', role='driver'),
            User(email='safety@transitops.com', name='Safety Officer', role='safety_officer'),
            User(email='finance@transitops.com', name='Finance Manager', role='financial_analyst'),
        ]
        
        for user in users:
            user.set_password('password123')
            db.session.add(user)
        
        # Create vehicles
        print("Creating vehicles...")
        vehicle_data = [
            ('MH-01-AB-1234', 'Tata Ace', 'truck', 1500, 45000, 450000),
            ('MH-02-CD-5678', 'Mahindra Bolero', 'van', 1200, 32000, 550000),
            ('MH-03-EF-9012', 'Eicher Pro 3015', 'truck', 3000, 78000, 1200000),
            ('DL-04-GH-3456', 'Ashok Leyland Dost', 'truck', 1500, 23000, 480000),
            ('DL-05-IJ-7890', 'Force Traveller', 'van', 1800, 56000, 650000),
            ('KA-06-KL-1122', 'Maruti Suzuki Eeco', 'car', 500, 12000, 380000),
            ('KA-07-MN-3344', 'Tata Ace Gold', 'truck', 1000, 89000, 420000),
            ('TN-08-OP-5566', 'Mahindra Jeeto', 'truck', 800, 34000, 350000),
        ]
        
        vehicles = []
        for reg, name, vtype, capacity, odo, cost in vehicle_data:
            vehicle = Vehicle(
                registration_number=reg,
                vehicle_name=name,
                vehicle_type=vtype,
                max_load_capacity=capacity,
                odometer=odo,
                acquisition_cost=cost,
                status=random.choice(['available', 'available', 'available', 'on_trip'])
            )
            vehicles.append(vehicle)
            db.session.add(vehicle)
        
        # Create drivers
        print("Creating drivers...")
        driver_data = [
            ('Rajesh Kumar', 'DL-1234567890', 'LMV', date(2025, 12, 31), '+91-9876543210', 4.8),
            ('Amit Singh', 'MH-9876543210', 'HMV', date(2026, 6, 15), '+91-9876543211', 4.5),
            ('Suresh Patel', 'KA-1122334455', 'LMV', date(2025, 3, 20), '+91-9876543212', 4.9),
            ('Vijay Sharma', 'TN-5566778899', 'HMV', date(2026, 9, 10), '+91-9876543213', 4.7),
            ('Prakash Rao', 'DL-9988776655', 'LMV', date(2025, 11, 5), '+91-9876543214', 4.6),
            ('Ramesh Gupta', 'MH-4433221100', 'HMV', date(2026, 1, 25), '+91-9876543215', 4.8),
        ]
        
        drivers = []
        for name, lic_no, lic_cat, expiry, contact, score in driver_data:
            driver = Driver(
                name=name,
                license_number=lic_no,
                license_category=lic_cat,
                license_expiry_date=expiry,
                contact_number=contact,
                safety_score=score,
                status=random.choice(['available', 'available', 'available', 'on_trip'])
            )
            drivers.append(driver)
            db.session.add(driver)
        
        db.session.commit()
        
        # Create trips
        print("Creating trips...")
        routes = [
            ('Mumbai', 'Pune', 170),
            ('Delhi', 'Jaipur', 280),
            ('Bangalore', 'Chennai', 350),
            ('Mumbai', 'Nashik', 165),
            ('Delhi', 'Chandigarh', 250),
            ('Bangalore', 'Hyderabad', 570),
        ]
        
        for i in range(15):
            source, dest, distance = random.choice(routes)
            vehicle = random.choice([v for v in vehicles if v.status in ['available', 'on_trip']])
            driver = random.choice([d for d in drivers if d.status in ['available', 'on_trip']])
            
            trip = Trip(
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                source=source,
                destination=dest,
                cargo_weight=random.randint(200, int(vehicle.max_load_capacity * 0.9)),
                planned_distance=distance,
                actual_distance=distance + random.randint(-10, 20) if i < 10 else None,
                status=random.choice(['draft', 'dispatched', 'completed', 'completed', 'completed']),
                start_odometer=vehicle.odometer - random.randint(100, 500) if i < 10 else None,
                end_odometer=vehicle.odometer if i < 10 else None,
                dispatched_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if i < 12 else None,
                completed_at=datetime.utcnow() - timedelta(days=random.randint(0, 25)) if i < 10 else None,
            )
            db.session.add(trip)
        
        db.session.commit()
        
        # Create maintenance logs
        print("Creating maintenance logs...")
        maintenance_types = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Tune-up', 'Battery Replacement']
        
        for vehicle in vehicles[:5]:
            maintenance = MaintenanceLog(
                vehicle_id=vehicle.id,
                maintenance_type=random.choice(maintenance_types),
                description=f'Regular maintenance for {vehicle.vehicle_name}',
                cost=random.randint(2000, 15000),
                status=random.choice(['active', 'completed', 'completed']),
                scheduled_date=date.today() + timedelta(days=random.randint(-10, 30)),
                completed_date=date.today() - timedelta(days=random.randint(1, 10)) if random.random() > 0.5 else None
            )
            db.session.add(maintenance)
        
        db.session.commit()
        
        # Create fuel logs
        print("Creating fuel logs...")
        trips = Trip.query.filter_by(status='completed').all()
        for trip in trips[:10]:
            fuel_log = FuelLog(
                vehicle_id=trip.vehicle_id,
                trip_id=trip.id,
                liters=random.randint(15, 80),
                cost=random.randint(1200, 6500),
                odometer_reading=trip.end_odometer,
                fuel_date=trip.completed_at.date() if trip.completed_at else date.today()
            )
            db.session.add(fuel_log)
        
        db.session.commit()
        
        # Create expenses
        print("Creating expenses...")
        expense_types = ['fuel', 'toll', 'maintenance', 'other']
        
        for vehicle in vehicles:
            for _ in range(random.randint(2, 5)):
                expense = Expense(
                    vehicle_id=vehicle.id,
                    trip_id=None,
                    expense_type=random.choice(expense_types),
                    amount=random.randint(500, 5000),
                    description='Regular operational expense',
                    expense_date=date.today() - timedelta(days=random.randint(1, 60))
                )
                db.session.add(expense)
        
        db.session.commit()
        
        print("\n[OK] Database seeded successfully!")
        print("\nSample Login Credentials:")
        print("=" * 50)
        print("Fleet Manager:")
        print("  Email: admin@transitops.com")
        print("  Password: password123")
        print("\nDriver:")
        print("  Email: driver@transitops.com")
        print("  Password: password123")
        print("\nSafety Officer:")
        print("  Email: safety@transitops.com")
        print("  Password: password123")
        print("\nFinancial Analyst:")
        print("  Email: finance@transitops.com")
        print("  Password: password123")
        print("=" * 50)

if __name__ == '__main__':
    seed_database()
