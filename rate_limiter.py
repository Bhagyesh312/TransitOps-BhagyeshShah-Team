"""
Rate Limiting System for TransitOps
Prevents brute force attacks and API abuse
"""
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import time


class RateLimiter:
    """In-memory rate limiter (for production, use Redis)"""
    
    def __init__(self):
        self.requests = {}  # {key: [(timestamp, count), ...]}
        self.blocked = {}   # {key: blocked_until_timestamp}
    
    def _get_client_key(self):
        """Get unique key for the client (IP + endpoint)"""
        ip = request.remote_addr
        endpoint = request.endpoint or 'unknown'
        return f"{ip}:{endpoint}"
    
    def _cleanup_old_requests(self, key, window_seconds):
        """Remove old requests outside the time window"""
        if key not in self.requests:
            return
        
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        # Keep only recent requests
        self.requests[key] = [
            (ts, count) for ts, count in self.requests[key]
            if ts > cutoff_time
        ]
        
        if not self.requests[key]:
            del self.requests[key]
    
    def is_blocked(self, key):
        """Check if client is currently blocked"""
        if key in self.blocked:
            if time.time() < self.blocked[key]:
                return True
            else:
                # Block expired, remove it
                del self.blocked[key]
        return False
    
    def block_client(self, key, duration_seconds):
        """Block a client for specified duration"""
        self.blocked[key] = time.time() + duration_seconds
    
    def check_rate_limit(self, key, max_requests, window_seconds, block_duration=300):
        """
        Check if rate limit is exceeded
        
        Args:
            key: Client identifier
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            block_duration: How long to block if exceeded (seconds)
        
        Returns:
            (is_allowed, remaining_requests, reset_time)
        """
        # Check if already blocked
        if self.is_blocked(key):
            block_remaining = int(self.blocked[key] - time.time())
            return False, 0, block_remaining
        
        # Cleanup old requests
        self._cleanup_old_requests(key, window_seconds)
        
        # Initialize if new client
        if key not in self.requests:
            self.requests[key] = []
        
        # Count requests in current window
        current_time = time.time()
        request_count = sum(count for ts, count in self.requests[key])
        
        # Check limit
        if request_count >= max_requests:
            # Rate limit exceeded - block the client
            self.block_client(key, block_duration)
            return False, 0, block_duration
        
        # Add this request
        self.requests[key].append((current_time, 1))
        
        # Calculate remaining and reset time
        remaining = max_requests - request_count - 1
        reset_time = window_seconds
        
        return True, remaining, reset_time


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(max_requests=100, window_seconds=60, block_duration=300):
    """
    Decorator to apply rate limiting to endpoints
    
    Args:
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds (default: 60s = 1 minute)
        block_duration: How long to block if exceeded (default: 300s = 5 minutes)
    
    Usage:
        @rate_limit(max_requests=5, window_seconds=60)
        @app.route('/api/login')
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            key = rate_limiter._get_client_key()
            
            is_allowed, remaining, reset_time = rate_limiter.check_rate_limit(
                key, max_requests, window_seconds, block_duration
            )
            
            if not is_allowed:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Please try again in {reset_time} seconds.',
                    'retry_after': reset_time
                }), 429
            
            # Add rate limit headers to response
            response = f(*args, **kwargs)
            
            # If response is a tuple (data, status_code), handle it
            if isinstance(response, tuple):
                data, status_code = response[0], response[1]
                return data, status_code, {
                    'X-RateLimit-Limit': str(max_requests),
                    'X-RateLimit-Remaining': str(remaining),
                    'X-RateLimit-Reset': str(reset_time)
                }
            
            return response
        
        return decorated_function
    return decorator


def get_rate_limit_strict():
    """Strict rate limit for sensitive endpoints (login, register)"""
    return rate_limit(max_requests=5, window_seconds=60, block_duration=600)


def get_rate_limit_moderate():
    """Moderate rate limit for write operations"""
    return rate_limit(max_requests=30, window_seconds=60, block_duration=300)


def get_rate_limit_lenient():
    """Lenient rate limit for read operations"""
    return rate_limit(max_requests=100, window_seconds=60, block_duration=60)
