"""
Audit Logging System for TransitOps
Logs all sensitive operations for security and compliance
"""
from models import db
from datetime import datetime
from flask import request
import json


class AuditLog(db.Model):
    """Audit log for tracking all sensitive operations"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_email = db.Column(db.String(255), nullable=False)
    user_role = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type = db.Column(db.String(50), nullable=False)  # Trip, Vehicle, Driver, etc.
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)  # JSON string with additional details
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), nullable=False)  # SUCCESS, FAILURE, DENIED
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': json.loads(self.details) if self.details else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }


class AuditLogger:
    """Service for logging audit events"""
    
    @staticmethod
    def log_event(user, action, resource_type, resource_id=None, details=None, status='SUCCESS'):
        """
        Log an audit event
        
        Args:
            user: Current user object
            action: Action performed (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS_DENIED, etc.)
            resource_type: Type of resource (Trip, Vehicle, Driver, User, etc.)
            resource_id: ID of the resource (optional)
            details: Additional details as dict (optional)
            status: Status of the operation (SUCCESS, FAILURE, DENIED)
        """
        try:
            # Get request information
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get('User-Agent', '')[:500] if request else None
            
            # Create audit log entry
            audit_log = AuditLog(
                user_id=user.id,
                user_email=user.email,
                user_role=user.role,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=json.dumps(details) if details else None,
                ip_address=ip_address,
                user_agent=user_agent,
                status=status
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
        except Exception as e:
            # Don't let audit logging failure break the application
            print(f"Audit logging error: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def log_login_attempt(email, success=True, user=None):
        """Log login attempts (both successful and failed)"""
        try:
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get('User-Agent', '')[:500] if request else None
            
            audit_log = AuditLog(
                user_id=user.id if user else None,
                user_email=email,
                user_role=user.role if user else 'UNKNOWN',
                action='LOGIN_SUCCESS' if success else 'LOGIN_FAILED',
                resource_type='Authentication',
                resource_id=None,
                details=json.dumps({'email': email}),
                ip_address=ip_address,
                user_agent=user_agent,
                status='SUCCESS' if success else 'FAILURE'
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
        except Exception as e:
            print(f"Login audit logging error: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def log_access_denied(user, resource_type, resource_id=None, reason=None):
        """Log access denied events"""
        AuditLogger.log_event(
            user=user,
            action='ACCESS_DENIED',
            resource_type=resource_type,
            resource_id=resource_id,
            details={'reason': reason} if reason else None,
            status='DENIED'
        )
    
    @staticmethod
    def get_user_activity(user_id, limit=50):
        """Get recent activity for a user"""
        logs = AuditLog.query.filter_by(user_id=user_id)\
            .order_by(AuditLog.created_at.desc())\
            .limit(limit)\
            .all()
        return [log.to_dict() for log in logs]
    
    @staticmethod
    def get_resource_history(resource_type, resource_id, limit=50):
        """Get history for a specific resource"""
        logs = AuditLog.query.filter_by(
            resource_type=resource_type,
            resource_id=resource_id
        ).order_by(AuditLog.created_at.desc())\
            .limit(limit)\
            .all()
        return [log.to_dict() for log in logs]
    
    @staticmethod
    def get_failed_login_attempts(email=None, hours=24, limit=50):
        """Get recent failed login attempts"""
        from datetime import timedelta
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        query = AuditLog.query.filter(
            AuditLog.action == 'LOGIN_FAILED',
            AuditLog.created_at >= time_threshold
        )
        
        if email:
            query = query.filter_by(user_email=email)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        return [log.to_dict() for log in logs]
    
    @staticmethod
    def get_security_events(hours=24, limit=100):
        """Get recent security-relevant events"""
        from datetime import timedelta
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        security_actions = ['LOGIN_FAILED', 'ACCESS_DENIED', 'DELETE', 'PERMISSION_CHANGE']
        
        logs = AuditLog.query.filter(
            AuditLog.action.in_(security_actions),
            AuditLog.created_at >= time_threshold
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return [log.to_dict() for log in logs]
