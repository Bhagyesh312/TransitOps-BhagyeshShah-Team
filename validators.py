"""
Input Validation and Sanitization for TransitOps
Prevents SQL injection, XSS, and other injection attacks
"""
import re
from datetime import datetime, date
from flask import jsonify


class ValidationError(Exception):
    """Custom validation error"""
    pass


class InputValidator:
    """Input validation and sanitization utilities"""
    
    # Regular expressions for validation
    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_REGEX = re.compile(r'^\+?[0-9]{10,15}$')
    ALPHANUMERIC_REGEX = re.compile(r'^[a-zA-Z0-9\s\-_]+$')
    REGISTRATION_NUMBER_REGEX = re.compile(r'^[A-Z0-9\-]+$')
    LICENSE_NUMBER_REGEX = re.compile(r'^[A-Z0-9\-]+$')
    
    # Dangerous patterns for SQL injection
    SQL_INJECTION_PATTERNS = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(--)",
        r"(/\*.*\*/)",
        r"(\bEXEC\b|\bEXECUTE\b)",
        r"(\bSCRIPT\b)",
        r"(<script>|</script>)"
    ]
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        if not email or not isinstance(email, str):
            raise ValidationError("Email is required")
        
        email = email.strip().lower()
        
        if len(email) > 255:
            raise ValidationError("Email is too long")
        
        if not InputValidator.EMAIL_REGEX.match(email):
            raise ValidationError("Invalid email format")
        
        return email
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if not password or not isinstance(password, str):
            raise ValidationError("Password is required")
        
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        if len(password) > 128:
            raise ValidationError("Password is too long")
        
        # Check for at least one number
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number")
        
        # Check for at least one letter
        if not re.search(r'[a-zA-Z]', password):
            raise ValidationError("Password must contain at least one letter")
        
        return password
    
    @staticmethod
    def validate_name(name, field_name="Name"):
        """Validate name fields"""
        if not name or not isinstance(name, str):
            raise ValidationError(f"{field_name} is required")
        
        name = name.strip()
        
        if len(name) < 2:
            raise ValidationError(f"{field_name} must be at least 2 characters")
        
        if len(name) > 255:
            raise ValidationError(f"{field_name} is too long")
        
        # Allow letters, spaces, hyphens, apostrophes
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", name):
            raise ValidationError(f"{field_name} contains invalid characters")
        
        return name
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number"""
        if not phone or not isinstance(phone, str):
            raise ValidationError("Phone number is required")
        
        # Remove spaces and hyphens
        phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        if not InputValidator.PHONE_REGEX.match(phone):
            raise ValidationError("Invalid phone number format")
        
        return phone
    
    @staticmethod
    def validate_registration_number(reg_number):
        """Validate vehicle registration number"""
        if not reg_number or not isinstance(reg_number, str):
            raise ValidationError("Registration number is required")
        
        reg_number = reg_number.strip().upper()
        
        if len(reg_number) < 4 or len(reg_number) > 20:
            raise ValidationError("Registration number must be between 4 and 20 characters")
        
        if not InputValidator.REGISTRATION_NUMBER_REGEX.match(reg_number):
            raise ValidationError("Registration number contains invalid characters")
        
        return reg_number
    
    @staticmethod
    def validate_license_number(license_number):
        """Validate driver license number"""
        if not license_number or not isinstance(license_number, str):
            raise ValidationError("License number is required")
        
        license_number = license_number.strip().upper()
        
        if len(license_number) < 5 or len(license_number) > 20:
            raise ValidationError("License number must be between 5 and 20 characters")
        
        if not InputValidator.LICENSE_NUMBER_REGEX.match(license_number):
            raise ValidationError("License number contains invalid characters")
        
        return license_number
    
    @staticmethod
    def validate_date(date_string, field_name="Date"):
        """Validate date format (YYYY-MM-DD)"""
        if not date_string:
            raise ValidationError(f"{field_name} is required")
        
        try:
            parsed_date = datetime.strptime(str(date_string), '%Y-%m-%d').date()
            return parsed_date
        except ValueError:
            raise ValidationError(f"{field_name} must be in YYYY-MM-DD format")
    
    @staticmethod
    def validate_positive_number(value, field_name="Value", allow_zero=False):
        """Validate positive numeric values"""
        try:
            num = float(value)
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a number")
        
        if allow_zero:
            if num < 0:
                raise ValidationError(f"{field_name} must be zero or positive")
        else:
            if num <= 0:
                raise ValidationError(f"{field_name} must be positive")
        
        return num
    
    @staticmethod
    def validate_integer(value, field_name="Value", min_value=None, max_value=None):
        """Validate integer values"""
        try:
            num = int(value)
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be an integer")
        
        if min_value is not None and num < min_value:
            raise ValidationError(f"{field_name} must be at least {min_value}")
        
        if max_value is not None and num > max_value:
            raise ValidationError(f"{field_name} must be at most {max_value}")
        
        return num
    
    @staticmethod
    def validate_enum(value, allowed_values, field_name="Value"):
        """Validate value against allowed enum values"""
        if value not in allowed_values:
            raise ValidationError(
                f"{field_name} must be one of: {', '.join(allowed_values)}"
            )
        return value
    
    @staticmethod
    def sanitize_string(text, max_length=None):
        """Sanitize string input to prevent XSS"""
        if not text:
            return text
        
        if not isinstance(text, str):
            text = str(text)
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        # Truncate if too long
        if max_length and len(text) > max_length:
            text = text[:max_length]
        
        return text
    
    @staticmethod
    def check_sql_injection(text):
        """Check for SQL injection patterns"""
        if not text or not isinstance(text, str):
            return False
        
        text_upper = text.upper()
        
        for pattern in InputValidator.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_upper, re.IGNORECASE):
                return True
        
        return False
    
    @staticmethod
    def validate_text_input(text, field_name="Field", min_length=0, max_length=1000):
        """Validate general text input"""
        if not text:
            if min_length > 0:
                raise ValidationError(f"{field_name} is required")
            return text
        
        if not isinstance(text, str):
            raise ValidationError(f"{field_name} must be text")
        
        text = InputValidator.sanitize_string(text, max_length)
        
        if len(text) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")
        
        if InputValidator.check_sql_injection(text):
            raise ValidationError(f"{field_name} contains invalid content")
        
        return text


class RequestValidator:
    """Validate Flask request data"""
    
    @staticmethod
    def validate_json_payload(required_fields=None):
        """Validate that request has JSON payload with required fields"""
        from flask import request
        
        if not request.is_json:
            raise ValidationError("Request must be JSON")
        
        data = request.get_json()
        
        if not data:
            raise ValidationError("Request body is empty")
        
        if required_fields:
            missing = [field for field in required_fields if field not in data]
            if missing:
                raise ValidationError(f"Missing required fields: {', '.join(missing)}")
        
        return data
    
    @staticmethod
    def handle_validation_error(error):
        """Convert validation error to JSON response"""
        return jsonify({
            'error': 'Validation error',
            'message': str(error)
        }), 400


# Vehicle validation
class VehicleValidator:
    VALID_TYPES = ['truck', 'van', 'car', 'trailer', 'bus']
    VALID_STATUSES = ['available', 'on_trip', 'in_shop', 'retired']
    
    @staticmethod
    def validate_vehicle_data(data, is_update=False):
        """Validate vehicle creation/update data"""
        errors = []
        
        if not is_update or 'registration_number' in data:
            try:
                data['registration_number'] = InputValidator.validate_registration_number(
                    data.get('registration_number')
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'vehicle_name' in data:
            try:
                data['vehicle_name'] = InputValidator.validate_name(
                    data.get('vehicle_name'), 'Vehicle name'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'vehicle_type' in data:
            try:
                data['vehicle_type'] = InputValidator.validate_enum(
                    data.get('vehicle_type'), 
                    VehicleValidator.VALID_TYPES,
                    'Vehicle type'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'max_load_capacity' in data:
            try:
                data['max_load_capacity'] = InputValidator.validate_positive_number(
                    data.get('max_load_capacity'), 'Max load capacity'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'acquisition_cost' in data:
            try:
                data['acquisition_cost'] = InputValidator.validate_positive_number(
                    data.get('acquisition_cost'), 'Acquisition cost'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if 'status' in data:
            try:
                data['status'] = InputValidator.validate_enum(
                    data.get('status'),
                    VehicleValidator.VALID_STATUSES,
                    'Status'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if errors:
            raise ValidationError('; '.join(errors))
        
        return data


# Driver validation
class DriverValidator:
    VALID_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended']
    VALID_LICENSE_CATEGORIES = ['LMV', 'HMV', 'TRANS', 'PSV']
    
    @staticmethod
    def validate_driver_data(data, is_update=False):
        """Validate driver creation/update data"""
        errors = []
        
        if not is_update or 'name' in data:
            try:
                data['name'] = InputValidator.validate_name(data.get('name'), 'Driver name')
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'license_number' in data:
            try:
                data['license_number'] = InputValidator.validate_license_number(
                    data.get('license_number')
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'license_category' in data:
            try:
                data['license_category'] = InputValidator.validate_enum(
                    data.get('license_category'),
                    DriverValidator.VALID_LICENSE_CATEGORIES,
                    'License category'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'license_expiry_date' in data:
            try:
                data['license_expiry_date'] = InputValidator.validate_date(
                    data.get('license_expiry_date'), 'License expiry date'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if not is_update or 'contact_number' in data:
            try:
                data['contact_number'] = InputValidator.validate_phone(
                    data.get('contact_number')
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if 'safety_score' in data:
            try:
                data['safety_score'] = InputValidator.validate_positive_number(
                    data.get('safety_score'), 'Safety score', allow_zero=True
                )
                if data['safety_score'] > 5.0:
                    errors.append("Safety score must be between 0 and 5")
            except ValidationError as e:
                errors.append(str(e))
        
        if 'status' in data:
            try:
                data['status'] = InputValidator.validate_enum(
                    data.get('status'),
                    DriverValidator.VALID_STATUSES,
                    'Status'
                )
            except ValidationError as e:
                errors.append(str(e))
        
        if errors:
            raise ValidationError('; '.join(errors))
        
        return data
