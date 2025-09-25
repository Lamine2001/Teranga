import { InjectionToken } from '@angular/core';

/**
 * Configuration for development mode
 */
export interface DevelopmentConfig {
  useMockServices: boolean;
  mockDelay: number;
  enableLogging: boolean;
  mockTokenExpiry: number; // in hours
}

export const DEVELOPMENT_CONFIG: DevelopmentConfig = {
  useMockServices: true, // Set to true when backend is not available
  mockDelay: 1000, // Simulate network delay in milliseconds
  enableLogging: true,
  mockTokenExpiry: 24 // 24 hours
};

export const DEVELOPMENT_CONFIG_TOKEN = new InjectionToken<DevelopmentConfig>('DevelopmentConfig');

/**
 * Helper function to check if we should use mock services
 */
export function shouldUseMockServices(): boolean {
  // Check if backend is available
  const backendUrl = 'http://localhost:8080';
  
  // In a real scenario, you might want to ping the backend
  // For now, we'll use a simple check based on environment
  return DEVELOPMENT_CONFIG.useMockServices;
}

/**
 * Helper function to get the appropriate service URL
 */
export function getServiceUrl(servicePath: string): string {
  if (shouldUseMockServices()) {
    // Return a mock URL or use interceptors
    return `/mock${servicePath}`;
  }
  return `http://localhost:8080/api${servicePath}`;
}
