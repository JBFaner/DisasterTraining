import React from 'react';
import ReactDOM from 'react-dom/client';
import '../css/app.css';
import { CampaignRegister, CampaignRegisterSuccess } from './components/CampaignRegister';

const registerRoot = document.getElementById('campaign-register-root');
if (registerRoot) {
    let campaignContext = null;
    let errors = {};
    try {
        campaignContext = JSON.parse(registerRoot.getAttribute('data-campaign-context') || 'null');
        errors = JSON.parse(registerRoot.getAttribute('data-errors') || '{}');
    } catch (_) {}

    const errorsObj = {};
    if (errors && typeof errors === 'object') {
        for (const key of Object.keys(errors)) {
            const value = errors[key];
            errorsObj[key] = Array.isArray(value) ? value[0] : value;
        }
    }

    const root = ReactDOM.createRoot(registerRoot);
    root.render(
        React.createElement(CampaignRegister, {
            campaignContext,
            alreadyRegistered: registerRoot.getAttribute('data-already-registered') === 'true',
            authenticated: registerRoot.getAttribute('data-authenticated') === 'true',
            registrationClosed: registerRoot.getAttribute('data-registration-closed') === 'true',
            errors: errorsObj,
        }),
    );
}

const successRoot = document.getElementById('campaign-register-success-root');
if (successRoot) {
    let campaignContext = null;
    try {
        campaignContext = JSON.parse(successRoot.getAttribute('data-campaign-context') || 'null');
    } catch (_) {}

    const root = ReactDOM.createRoot(successRoot);
    root.render(React.createElement(CampaignRegisterSuccess, { campaignContext }));
}
