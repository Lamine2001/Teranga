import { HttpInterceptorFn, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MockAppointmentService } from '../services/mock-appointment.service';
import { MockAuthService } from '../services/mock-auth.service';
import { inject } from '@angular/core';

export const mockHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const mockAppointmentService = inject(MockAppointmentService);
  const mockAuthService = inject(MockAuthService);

  // Check if we should use mock services
  const useMock = shouldUseMockServices();
  
  if (!useMock) {
    // Use real backend
    return next(req);
  }

  // Mock different endpoints
  if (req.url.includes('/api/appointments/search')) {
    const requestData = req.body as any;
    
    if (req.url.includes('/search-public')) {
      // Public search endpoint
      return mockAppointmentService.searchAvailableSlotsPublic(requestData).pipe(
        delay(800),
        map(data => new HttpResponse({ status: 200, body: data }))
      );
    } else {
      // Regular search endpoint
      return mockAppointmentService.searchAvailableSlots(requestData).pipe(
        delay(800),
        map(data => new HttpResponse({ status: 200, body: data }))
      );
    }
  }

  if (req.url.includes('/api/appointments/book')) {
    const requestData = req.body as any;
    return mockAppointmentService.bookAppointment(requestData).pipe(
      delay(1200),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/appointments/patient')) {
    return mockAppointmentService.getPatientAppointments().pipe(
      delay(600),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/appointments/doctor')) {
    return mockAppointmentService.getDoctorAppointments().pipe(
      delay(600),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/auth/apiLogin')) {
    const credentials = req.body as any;
    return mockAuthService.login(credentials).pipe(
      delay(1000),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/auth/register')) {
    const userData = req.body as any;
    return mockAuthService.register(userData).pipe(
      delay(1500),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/auth/forgot-password')) {
    const { email } = req.body as any;
    return mockAuthService.forgotPassword(email).pipe(
      delay(1000),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  if (req.url.includes('/api/auth/reset-password')) {
    const { token, newPassword } = req.body as any;
    return mockAuthService.resetPassword(token, newPassword).pipe(
      delay(1000),
      map(data => new HttpResponse({ status: 200, body: data }))
    );
  }

  // For any other requests, return a mock response or pass through
  if (req.url.includes('/mock')) {
    // Return a generic mock response
    const mockResponse = new HttpResponse({
      status: 200,
      body: {
        success: true,
        message: 'Mock response',
        data: {}
      }
    });

    return of(mockResponse).pipe(
      delay(500)
    );
  }

  // Pass through to real backend if not mocked
  return next(req);
};

/**
 * Simple function to determine if we should use mock services
 */
function shouldUseMockServices(): boolean {
  // You can make this more sophisticated by checking:
  // - Environment variables
  // - Backend availability
  // - User preference
  // - etc.
  
  // For now, always use mock services in development
  return true;
}
