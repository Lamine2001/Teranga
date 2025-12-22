import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppointmentResponseDTO, SearchAvailabilityRequestDTO } from './appointment.service';

@Injectable({
  providedIn: 'root'
})
export class MockAppointmentService {

  /**
   * Generate mock appointment data
   */
  private generateMockAppointments(): AppointmentResponseDTO[] {
    const appointments: AppointmentResponseDTO[] = [];
    const specialties = [
      'Psychologie', 'Coaching de vie', 'Médecine générale', 
      'Cardiologie', 'Dermatologie', 'Pédiatrie'
    ];
    
    const doctors = [
      { firstName: 'Aminata', lastName: 'Diop', specialty: 'Psychologie' },
      { firstName: 'Moussa', lastName: 'Sarr', specialty: 'Coaching de vie' },
      { firstName: 'Fatou', lastName: 'Fall', specialty: 'Médecine générale' },
      { firstName: 'Ibrahima', lastName: 'Ndiaye', specialty: 'Cardiologie' },
      { firstName: 'Aissatou', lastName: 'Ba', specialty: 'Dermatologie' },
      { firstName: 'Cheikh', lastName: 'Wade', specialty: 'Pédiatrie' }
    ];

    // Generate appointments for the next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      doctors.forEach((doctor, doctorIndex) => {
        // Generate 3-5 time slots per doctor per day
        const numSlots = Math.floor(Math.random() * 3) + 3;
        
        for (let slot = 0; slot < numSlots; slot++) {
          const appointmentTime = new Date(date);
          appointmentTime.setHours(9 + slot * 2 + (slot % 2 === 0 ? 0 : 1), slot % 2 === 0 ? 0 : 30, 0, 0);
          
          const endTime = new Date(appointmentTime);
          endTime.setMinutes(endTime.getMinutes() + (Math.random() > 0.5 ? 30 : 60));
          
          appointments.push({
            id: appointments.length + 1,
            patientId: 0,
            patientFirstName: '',
            patientLastName: '',
            patientEmail: '',
            patientPhone: '',
            doctorId: doctorIndex + 1,
            doctorFirstName: doctor.firstName,
            doctorLastName: doctor.lastName,
            doctorEmail: `${doctor.firstName.toLowerCase()}.${doctor.lastName.toLowerCase()}@teranga.com`,
            doctorSpecialty: doctor.specialty,
            doctorDepartment: doctor.specialty,
            appointmentTime: appointmentTime.toISOString(),
            endTime: endTime.toISOString(),
            appointmentType: Math.random() > 0.5 ? 'virtual' : 'onsite',
            consultationFee: Math.floor(Math.random() * 20000) + 10000, // 10,000 - 30,000 XOF
            status: 'available',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    }

    return appointments;
  }

  /**
   * Mock search for available slots
   */
  searchAvailableSlots(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        let mockAppointments = this.generateMockAppointments();
        
        // Apply filters
        if (request.date) {
          const requestDate = new Date(request.date);
          mockAppointments = mockAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentTime);
            return aptDate.toDateString() === requestDate.toDateString();
          });
        }
        
        if (request.specialty) {
          mockAppointments = mockAppointments.filter(apt => 
            apt.doctorSpecialty.toLowerCase().includes(request.specialty!.toLowerCase())
          );
        }
        
        if (request.doctorName) {
          mockAppointments = mockAppointments.filter(apt => {
            const fullName = `${apt.doctorFirstName} ${apt.doctorLastName}`.toLowerCase();
            return fullName.includes(request.doctorName!.toLowerCase());
          });
        }
        
        if (request.appointmentType) {
          mockAppointments = mockAppointments.filter(apt => 
            apt.appointmentType === request.appointmentType
          );
        }
        
        // Filter by preferred times if specified
        if (request.preferredTimes && request.preferredTimes.length > 0) {
          mockAppointments = mockAppointments.filter(apt => {
            const hour = new Date(apt.appointmentTime).getHours();
            return request.preferredTimes!.some(time => {
              switch (time) {
                case 'morning': return hour >= 8 && hour < 12;
                case 'afternoon': return hour >= 12 && hour < 17;
                case 'evening': return hour >= 17 && hour < 20;
                default: return true;
              }
            });
          });
        }
        
        // Limit results to prevent overwhelming the UI
        const limitedResults = mockAppointments.slice(0, 20);
        
        observer.next(limitedResults);
        observer.complete();
      }, 800); // Simulate network delay
    });
  }

  /**
   * Mock public search (same as regular search for development)
   */
  searchAvailableSlotsPublic(request: SearchAvailabilityRequestDTO): Observable<AppointmentResponseDTO[]> {
    return this.searchAvailableSlots(request);
  }

  /**
   * Mock booking appointment
   */
  bookAppointment(request: any): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        // Simulate successful booking
        const mockResponse = {
          success: true,
          appointment: {
            id: Math.floor(Math.random() * 1000) + 1,
            doctorId: request.availabilityId,
            patientId: request.patientId || 'mock-patient-id',
            appointmentTime: new Date().toISOString(),
            status: 'confirmed',
            appointmentType: request.appointmentType || 'virtual',
            reasonForVisit: request.reasonForVisit || 'Consultation générale',
            ...request
          },
          message: 'Rendez-vous confirmé avec succès'
        };
        
        observer.next(mockResponse);
        observer.complete();
      }, 1200);
    });
  }

  /**
   * Mock get patient appointments
   */
  getPatientAppointments(): Observable<AppointmentResponseDTO[]> {
    return new Observable(observer => {
      setTimeout(() => {
        // Return a few mock appointments for the current user
        const mockAppointments = this.generateMockAppointments().slice(0, 3);
        observer.next(mockAppointments);
        observer.complete();
      }, 600);
    });
  }

  /**
   * Mock get doctor appointments
   */
  getDoctorAppointments(): Observable<AppointmentResponseDTO[]> {
    return new Observable(observer => {
      setTimeout(() => {
        // Return mock appointments for a doctor
        const mockAppointments = this.generateMockAppointments().slice(0, 5);
        observer.next(mockAppointments);
        observer.complete();
      }, 600);
    });
  }

  /**
   * Mock cancel appointment
   */
  cancelAppointment(appointmentId: number): Observable<{ success: boolean; message?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Rendez-vous annulé avec succès'
        });
        observer.complete();
      }, 800);
    });
  }

  /**
   * Mock update appointment
   */
  updateAppointment(appointmentId: number, updates: any): Observable<{ success: boolean; appointment?: any; message?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          appointment: {
            id: appointmentId,
            ...updates,
            updatedAt: new Date().toISOString()
          },
          message: 'Rendez-vous mis à jour avec succès'
        });
        observer.complete();
      }, 800);
    });
  }
}
