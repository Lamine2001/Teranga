# 🛠️ Development Setup - Mock Services

## 🎯 Problem Solved

The application was experiencing two main issues:
1. **Backend Connection Error**: `net::ERR_CONNECTION_REFUSED` - Backend server not running on `localhost:8080`
2. **No Authentication Token**: `Token available: false` - No valid token for API requests

## ✅ Solution Implemented

### 1. Mock Services Created
- **`MockAuthService`**: Generates mock JWT tokens and handles authentication
- **`MockAppointmentService`**: Provides mock appointment data and booking functionality
- **`MockHttpInterceptor`**: Intercepts HTTP requests and returns mock responses

### 2. Automatic Token Generation
- Mock JWT tokens are automatically generated when no token exists
- Tokens are stored in localStorage with 24-hour expiry
- Compatible with existing auth interceptor

### 3. Mock Data Features
- **Realistic appointment data** with Senegalese doctors
- **Multiple specialties**: Psychology, Life Coaching, General Medicine, etc.
- **Flexible filtering**: By date, specialty, doctor name, appointment type
- **Network simulation**: Realistic delays (800ms-1500ms)

## 🚀 How to Test

### 1. Access the Application
```
http://localhost:4200/
```

### 2. Test the Appointment Booking Flow
1. Click "Prendre rendez-vous" on homepage
2. Or go directly to: `http://localhost:4200/book-appointment`
3. Fill out the search form:
   - Select a date (tomorrow or later)
   - Choose specialty (optional)
   - Select appointment type (Virtual/On-site)
4. Click "Rechercher"

### 3. Expected Behavior
- ✅ No more connection errors
- ✅ Mock token automatically generated
- ✅ Mock appointment data displayed
- ✅ Search and booking functionality works
- ✅ Guest registration modal works
- ✅ Booking confirmation works

## 🔧 Technical Details

### Mock Token Format
```javascript
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "sub": "mock-user-id",
  "email": "mock@teranga.com", 
  "role": "patient",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Mock Data Structure
- **Doctors**: 6 Senegalese doctors with different specialties
- **Appointments**: 3-5 slots per doctor per day for 7 days
- **Pricing**: 10,000 - 30,000 XOF consultation fees
- **Types**: Mix of virtual and on-site appointments

### Interceptor Chain
```
Request → MockHttpInterceptor → AuthInterceptor → Backend
```

## 🎛️ Configuration

### Enable/Disable Mock Services
Edit `src/app/config/development.config.ts`:
```typescript
export const DEVELOPMENT_CONFIG: DevelopmentConfig = {
  useMockServices: true, // Set to false to use real backend
  mockDelay: 1000,
  enableLogging: true,
  mockTokenExpiry: 24
};
```

### Mock Data Customization
Edit `src/app/services/mock-appointment.service.ts`:
- Add more doctors in the `doctors` array
- Modify specialties in the `specialties` array
- Adjust pricing ranges
- Change availability patterns

## 📊 Mock Data Preview

### Available Specialties
- 🧠 Psychologie
- 💪 Coaching de vie  
- 🩺 Médecine générale
- ❤️ Cardiologie
- 🦋 Dermatologie
- 👶 Pédiatrie

### Sample Doctors
- **Dr. Aminata Diop** - Psychologie
- **Dr. Moussa Sarr** - Coaching de vie
- **Dr. Fatou Fall** - Médecine générale
- **Dr. Ibrahima Ndiaye** - Cardiologie
- **Dr. Aissatou Ba** - Dermatologie
- **Dr. Cheikh Wade** - Pédiatrie

## 🐛 Troubleshooting

### If Mock Services Don't Work
1. Check browser console for errors
2. Verify interceptor is registered in `app.config.ts`
3. Clear browser cache and localStorage
4. Restart Angular development server

### If You Want to Use Real Backend
1. Set `useMockServices: false` in development config
2. Start your Spring Boot backend on `localhost:8080`
3. Ensure backend APIs are available

## 🔄 Switching Between Mock and Real Backend

### For Development (Mock)
```typescript
// In development.config.ts
useMockServices: true
```

### For Production (Real Backend)
```typescript
// In development.config.ts  
useMockServices: false
```

## 📝 Next Steps

1. **Test the complete workflow**:
   - Guest search and registration
   - Appointment booking
   - Payment processing (mock)

2. **Customize mock data** as needed for your testing

3. **Implement real backend integration** when ready

4. **Add more mock endpoints** if needed

---

*This setup allows you to develop and test the frontend without requiring a running backend server.*
