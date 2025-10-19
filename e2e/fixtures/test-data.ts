/**
 * Test Data Fixtures for Teranga MSanté E2E Tests
 */

export const testUsers = {
  doctor: {
    email: 'doctor.test@msante.sn',
    password: 'Doctor@123',
    firstName: 'Dr. Jean',
    lastName: 'Dupont',
    phone: '+221 77 123 45 67',
    userType: 'doctor' as const,
    specialization: 'Cardiologie',
    licenseNumber: 'DOC-2024-001',
  },
  
  patient: {
    email: 'patient.test@msante.sn',
    password: 'Patient@123',
    firstName: 'Marie',
    lastName: 'Sall',
    phone: '+221 77 987 65 43',
    userType: 'patient' as const,
    dateOfBirth: '1990-05-15',
    address: '15 Avenue Bourguiba, Dakar',
  },
  
  newPatient: {
    email: 'newpatient.test@msante.sn',
    password: 'NewPatient@123',
    confirmPassword: 'NewPatient@123',
    firstName: 'Fatou',
    lastName: 'Diop',
    phone: '+221 76 555 44 33',
    userType: 'patient' as const,
    dateOfBirth: '1995-08-20',
    address: '25 Rue Jules Ferry, Dakar',
  },
};

export const appointmentData = {
  consultation: {
    mode: 'cabinet' as const,
    specialty: 'cardiologie',
    reasonForVisit: 'Consultation de routine',
    symptoms: 'Douleur thoracique légère',
    urgency: 'medium' as const,
    appointmentType: 'onsite' as const,
  },
  
  videoConsultation: {
    mode: 'video' as const,
    specialty: 'psychologie',
    reasonForVisit: 'Consultation en ligne',
    symptoms: 'Stress et anxiété',
    urgency: 'low' as const,
    appointmentType: 'virtual' as const,
    technicalRequirements: {
      hasStableInternet: true,
      hasWebcam: true,
      hasMicrophone: true,
      hasSpeaker: true,
      platformPreference: 'zoom',
    },
  },
};

export const availabilityData = {
  slot: {
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    startTime: '09:00',
    endTime: '10:00',
    appointmentType: 'onsite',
    isBlocked: false,
  },
  
  multipleSlots: [
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '10:00',
    },
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '10:00',
      endTime: '11:00',
    },
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '14:00',
      endTime: '15:00',
    },
  ],
};

export const profileUpdateData = {
  firstName: 'Updated',
  lastName: 'Name',
  phone: '+221 77 111 22 33',
  address: '10 Avenue Pompidou, Dakar',
};

export const passwordChangeData = {
  currentPassword: 'Patient@123',
  newPassword: 'NewPassword@456',
  confirmPassword: 'NewPassword@456',
};

