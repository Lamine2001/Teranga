import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // Log for debugging
  console.log('Interceptor - Request URL:', req.url);
  console.log('Interceptor - Token available:', !!token);
  if (token) {
    console.log('Interceptor - Full token:', token);
    console.log('Interceptor - Token length:', token.length);
  }
  
  // Skip auth header for auth endpoints
  if (req.url.includes('/auth/apiLogin') || 
      req.url.includes('/auth/signup') ||
      req.url.includes('/auth/forgot-password') ||
      req.url.includes('/auth/reset-password') ||
      req.url.includes('/auth/register')) {
    console.log('Interceptor - Skipping auth header for auth endpoint');
    return next(req);
  }
  
  if (token) {
    // Clone the request and add the authorization header
    // Make sure the token format matches what the backend expects
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `${token}`, // Try without "Bearer " prefix first
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Interceptor - Headers being sent:', authReq.headers.keys());
    console.log('Interceptor - Authorization header:', authReq.headers.get('Authorization'));
    return next(authReq);
  }
  
  console.log('Interceptor - No token found, sending request without auth');
  return next(req);
};

