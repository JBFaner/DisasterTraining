import React from 'react';
import ReactDOM from 'react-dom/client';
import '../css/app.css';
import { ParticipantLogin } from './components/ParticipantLogin';
import { AdminLogin } from './components/AdminLogin';
import { ParticipantRegister } from './components/ParticipantRegister';
import { ParticipantRegisterVerify } from './components/ParticipantRegisterVerify';
import { PasswordRequest } from './components/PasswordRequest';
import { PasswordReset } from './components/PasswordReset';

// Participant Login
const participantLoginRoot = document.getElementById('participant-login-root');
if (participantLoginRoot) {
    const errorsJson = participantLoginRoot.getAttribute('data-errors') || '{}';
    const oldEmail = participantLoginRoot.getAttribute('data-old-email') || '';
    const lockoutRetryAfter = parseInt(participantLoginRoot.getAttribute('data-lockout-retry-after') || '0', 10);
    const sessionError = participantLoginRoot.getAttribute('data-session-error') || '';
    let errors = {};
    try {
        errors = JSON.parse(errorsJson);
    } catch (_) {}
    const errorsObj = {};
    if (Array.isArray(errors) && errors.length > 0) {
        errorsObj.email = errors[0];
    } else if (errors && typeof errors === 'object') {
        for (const k of Object.keys(errors)) {
            const v = errors[k];
            errorsObj[k] = Array.isArray(v) ? v[0] : v;
        }
    }
    if (sessionError) errorsObj.email = sessionError;
    const failedAttempts = parseInt(participantLoginRoot.getAttribute('data-failed-attempts') || '0', 10);
    const root = ReactDOM.createRoot(participantLoginRoot);
    root.render(React.createElement(ParticipantLogin, { errors: errorsObj, oldEmail, lockoutRetryAfter, failedAttempts }));
}

// Participant Register
const participantRegisterRoot = document.getElementById('participant-register-root');
if (participantRegisterRoot) {
    const errorsJson = participantRegisterRoot.getAttribute('data-errors') || '{}';
    const oldValuesJson = participantRegisterRoot.getAttribute('data-old-values') || '{}';
    let errors = {};
    let oldValues = {};
    
    try {
        errors = JSON.parse(errorsJson);
    } catch (e) {
        console.error('Error parsing errors JSON:', e);
    }
    
    try {
        oldValues = JSON.parse(oldValuesJson);
    } catch (e) {
        console.error('Error parsing old values JSON:', e);
    }
    
    // Laravel validation errors come as { field: [messages] }
    // Pass them directly to the component
    const root = ReactDOM.createRoot(participantRegisterRoot);
    root.render(React.createElement(ParticipantRegister, { errors, oldValues }));
}

// Participant Register Verify
const participantRegisterVerifyRoot = document.getElementById('participant-register-verify-root');
if (participantRegisterVerifyRoot) {
    const verificationMethod = participantRegisterVerifyRoot.getAttribute('data-verification-method') || 'email';
    const contact = participantRegisterVerifyRoot.getAttribute('data-contact') || '';
    const errorsJson = participantRegisterVerifyRoot.getAttribute('data-errors') || '{}';
    let errors = {};
    
    try {
        errors = JSON.parse(errorsJson);
    } catch (e) {
        console.error('Error parsing errors JSON:', e);
    }
    
    const root = ReactDOM.createRoot(participantRegisterVerifyRoot);
    root.render(React.createElement(ParticipantRegisterVerify, { 
        verificationMethod, 
        contact, 
        errors 
    }));
}

// Admin Login
const adminLoginRoot = document.getElementById('admin-login-root');
if (adminLoginRoot) {
    const errorsJson = adminLoginRoot.getAttribute('data-errors') || '{}';
    const oldEmail = adminLoginRoot.getAttribute('data-old-email') || '';
    const lockoutRetryAfter = parseInt(adminLoginRoot.getAttribute('data-lockout-retry-after') || '0', 10);
    const sessionError = adminLoginRoot.getAttribute('data-session-error') || '';
    let errors = {};
    try {
        errors = JSON.parse(errorsJson);
    } catch (_) {}
    const errorsObj = {};
    if (Array.isArray(errors) && errors.length > 0) {
        errorsObj.email = errors[0];
    } else if (errors && typeof errors === 'object') {
        for (const k of Object.keys(errors)) {
            const v = errors[k];
            errorsObj[k] = Array.isArray(v) ? v[0] : v;
        }
    }
    if (sessionError) errorsObj.email = sessionError;
    const failedAttempts = parseInt(adminLoginRoot.getAttribute('data-failed-attempts') || '0', 10);
    const root = ReactDOM.createRoot(adminLoginRoot);
    root.render(React.createElement(AdminLogin, { errors: errorsObj, oldEmail, lockoutRetryAfter, failedAttempts }));
}

// Password Request
const passwordRequestRoot = document.getElementById('password-request-root');
if (passwordRequestRoot) {
    const errorsJson = passwordRequestRoot.getAttribute('data-errors') || '{}';
    const oldEmail = passwordRequestRoot.getAttribute('data-old-email') || '';
    const status = passwordRequestRoot.getAttribute('data-status') || '';
    let errors = {};
    try {
        errors = JSON.parse(errorsJson);
    } catch (_) {}
    const errorsObj = {};
    if (errors && typeof errors === 'object') {
        for (const k of Object.keys(errors)) {
            const v = errors[k];
            errorsObj[k] = Array.isArray(v) ? v[0] : v;
        }
    }
    const root = ReactDOM.createRoot(passwordRequestRoot);
    root.render(React.createElement(PasswordRequest, { errors: errorsObj, oldEmail, status }));
}

// Password Reset
const passwordResetRoot = document.getElementById('password-reset-root');
if (passwordResetRoot) {
    const errorsJson = passwordResetRoot.getAttribute('data-errors') || '{}';
    const token = passwordResetRoot.getAttribute('data-token') || '';
    const email = passwordResetRoot.getAttribute('data-email') || '';
    let errors = {};
    try {
        errors = JSON.parse(errorsJson);
    } catch (_) {}
    const errorsObj = {};
    if (errors && typeof errors === 'object') {
        for (const k of Object.keys(errors)) {
            const v = errors[k];
            errorsObj[k] = Array.isArray(v) ? v[0] : v;
        }
    }
    const root = ReactDOM.createRoot(passwordResetRoot);
    root.render(React.createElement(PasswordReset, { errors: errorsObj, token, email }));
}
