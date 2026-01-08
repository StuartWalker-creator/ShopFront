
import { initializeApp, getApps, App } from 'firebase-admin/app';

/**
 * Returns a singleton Firebase Admin app using
 * Application Default Credentials (ADC).
 *
 * No service account keys, no secrets in code.
 * Works automatically on Firebase / Google Cloud.
 */
let adminApp: App | null = null;

export function getAdminApp(): App {
  // Return memoized instance if already initialized
  if (adminApp) {
    return adminApp;
  }

  // If an admin app already exists, reuse it
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Initialize using Application Default Credentials
  adminApp = initializeApp();

  return adminApp;
}