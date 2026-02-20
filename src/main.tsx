
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ServicesProvider } from './contexts/ServicesContext';
import { PhoneVerificationProvider } from './contexts/PhoneVerificationContext';
import { BrowserRouter as Router } from 'react-router-dom';
import * as Sentry from "@sentry/react";

// Initialize Sentry before React render
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || '0.5'),
    sampleRate: parseFloat(import.meta.env.VITE_SENTRY_ERROR_SAMPLE_RATE || '1.0'),
    enableLogs: true,
    integrations: [Sentry.browserTracingIntegration()],
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection',
      'Non-Error exception captured',
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch dynamically imported module',
    ],
    beforeSend(event, hint) {
      // Drop event if DSN is not set
      if (!import.meta.env.VITE_SENTRY_DSN) {
        return null;
      }

      // Sanitize email in user context
      if (event.user?.email) {
        const emailParts = event.user.email.split('@');
        if (emailParts.length === 2) {
          event.user.email = `***@${emailParts[1]}`;
        }
      }

      // Sanitize phone numbers in exception messages
      const phoneRegex = /\+40\d{9}/g;
      
      if (event.exception?.values) {
        event.exception.values.forEach(exception => {
          if (exception.value) {
            exception.value = exception.value.replace(phoneRegex, '+40XXX***');
          }
        });
      }

      if (event.message) {
        event.message = event.message.replace(phoneRegex, '+40XXX***');
      }

      return event;
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ServicesProvider>
          <PhoneVerificationProvider>
            <App />
          </PhoneVerificationProvider>
        </ServicesProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)
