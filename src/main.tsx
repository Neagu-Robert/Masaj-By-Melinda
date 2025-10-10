
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ServicesProvider } from './contexts/ServicesContext';
import { PhoneVerificationProvider } from './contexts/PhoneVerificationContext';
import { BrowserRouter as Router } from 'react-router-dom';

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
