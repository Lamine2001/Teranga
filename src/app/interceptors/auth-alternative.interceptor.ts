import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authAlternativeInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // Skip auth header for auth endpoints
  if (req.url.includes('/auth/') || req.url.includes('/login') || req.url.includes('/signup')) {
    return next(req);
  }
  
  if (token) {
    // Try different authorization header formats
    let authHeader = token;
    
    // If token doesn't start with "Bearer ", add it
    if (!token.startsWith('Bearer ')) {
      authHeader = `Bearer ${token}`;
    }
    
    const authReq = req.clone({
      headers: req.headers
        .set('Authorization', authHeader)
        .set('Content-Type', 'application/json')
    });
    
    console.log('=== REQUEST BEING SENT ===');
    console.log('URL:', authReq.url);
    console.log('Method:', authReq.method);
    console.log('Authorization Header:', authReq.headers.get('Authorization'));
    console.log('All Headers:', authReq.headers.keys().map(key => `${key}: ${authReq.headers.get(key)}`));
    
    return next(authReq);
  }
  
  return next(req);
};
