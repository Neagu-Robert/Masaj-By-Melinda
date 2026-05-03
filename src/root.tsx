import React from "react";
import {
  Meta,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ServicesProvider } from "./contexts/ServicesContext";
import { PhoneVerificationProvider } from "./contexts/PhoneVerificationContext";
import "./index.css";

// Initialize Sentry before React render
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",
    tracesSampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_SAMPLE_RATE || "0.5"
    ),
    sampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_ERROR_SAMPLE_RATE || "1.0"
    ),
    enableLogs: true,
    integrations: [Sentry.browserTracingIntegration()],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection",
      "Non-Error exception captured",
      "ChunkLoadError",
      "Loading chunk",
      "Failed to fetch dynamically imported module",
    ],
    beforeSend(event, hint) {
      // Drop event if DSN is not set
      if (!import.meta.env.VITE_SENTRY_DSN) {
        return null;
      }

      // Sanitize email in user context
      if (event.user?.email) {
        const emailParts = event.user.email.split("@");
        if (emailParts.length === 2) {
          event.user.email = `***@${emailParts[1]}`;
        }
      }

      // Sanitize phone numbers in exception messages
      const phoneRegex = /\+40\d{9}/g;

      if (event.exception?.values) {
        event.exception.values.forEach((exception) => {
          if (exception.value) {
            exception.value = exception.value.replace(phoneRegex, "+40XXX***");
          }
        });
      }

      if (event.message) {
        event.message = event.message.replace(phoneRegex, "+40XXX***");
      }

      return event;
    },
  });
}

const queryClient = new QueryClient();

function AppContent() {
  const { status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"
          role="status"
        >
          <span className="sr-only">Se încarcă...</span>
        </div>
      </div>
    );
  }

  if (status === "banned") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-400">
            Cont Blocat
          </h2>
          <p className="text-white mb-4">
            Contul dumneavoastră a fost blocat. Vă rugăm să contactați suportul dacă credeți că este o eroare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/**
 * Single stable document shell used by React Router v7 to wrap both
 * the default Root component and HydrateFallback, ensuring identical
 * server/client markup and preventing hydration mismatches.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Analytics />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <ServicesProvider>
          <PhoneVerificationProvider>
            <AppContent />
          </PhoneVerificationProvider>
        </ServicesProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600" role="status">
        <span className="sr-only">Se încarcă...</span>
      </div>
    </div>
  );
}
