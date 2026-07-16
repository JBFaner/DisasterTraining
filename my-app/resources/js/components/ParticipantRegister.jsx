import React, { useMemo, useState } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight, Phone, CalendarDays, MapPin, Clock3, CheckCircle2, BookOpen, Users } from 'lucide-react';
import { PhilippineLocationSelect } from './PhilippineLocationSelect';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
    if (!timeString) return '—';
    const normalized = String(timeString);
    const match = normalized.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '—';
    const hour = Number(match[1]);
    const minute = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}

function parseMobileFromOldValues(oldValues = {}) {
    if (oldValues.mobileNumber) {
        return String(oldValues.mobileNumber);
    }

    const phone = String(oldValues.phone || '').trim();
    if (!phone) {
        return '';
    }

    const match = phone.match(/(\d{10})$/);
    return match ? match[1] : phone.replace(/\D/g, '').slice(-10);
}

export function ParticipantRegister({ errors = {}, oldValues = {}, campaignContext = null, openCampaigns = [] }) {
    const hasCampaignContext = Boolean(
        campaignContext?.campaign_event_id || campaignContext?.campaign_request_id,
    );
    const campaignBadgeLabel = campaignContext?.batch_label
        || (campaignContext?.campaign_event_id
            ? `Event #${campaignContext.campaign_event_id}`
            : campaignContext?.campaign_request_id
                ? `Batch #${campaignContext.campaign_request_id}`
                : null);
    const [formData, setFormData] = useState({
        name: oldValues.name || '',
        organization: oldValues.organization || '',
        email: oldValues.email || '',
        countryCode: oldValues.countryCode || '+63',
        mobileNumber: parseMobileFromOldValues(oldValues),
        street: oldValues.street || '',
        philippine_barangay_id: oldValues.philippine_barangay_id || '',
        region: oldValues.region || '',
        province: oldValues.province || '',
        municipality_city: oldValues.municipality_city || '',
        barangay_name: oldValues.barangay_name || '',
        password: '',
        password_confirmation: '',
        campaign_request: oldValues.campaign_request
            ? String(oldValues.campaign_request)
            : (campaignContext?.campaign_request_id ? String(campaignContext.campaign_request_id) : ''),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [clientErrors, setClientErrors] = useState({});

    const selectedOpenCampaign = useMemo(() => {
        if (hasCampaignContext) {
            return campaignContext;
        }
        if (!formData.campaign_request) {
            return null;
        }
        return openCampaigns.find(
            (campaign) => String(campaign.campaign_request_id) === String(formData.campaign_request),
        ) || null;
    }, [hasCampaignContext, campaignContext, formData.campaign_request, openCampaigns]);

    const passwordLiveState = useMemo(() => {
        const password = formData.password || '';
        const confirmation = formData.password_confirmation || '';
        const lengthOk = password.length >= 8;
        let status = null;
        if (confirmation) {
            status = password === confirmation ? 'match' : 'mismatch';
        }
        return { lengthOk, status };
    }, [formData.password, formData.password_confirmation]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setClientErrors((prev) => {
            if (!prev[name] && !(name === 'password' || name === 'password_confirmation')) {
                return prev;
            }
            const next = { ...prev };
            delete next[name];
            if (name === 'password' || name === 'password_confirmation') {
                delete next.password;
                delete next.password_confirmation;
            }
            if (name === 'campaign_request') {
                delete next.campaign_request;
            }
            return next;
        });
    };

    const validateForm = () => {
        const newErrors = {};

        // Mobile number validation
        if (!formData.mobileNumber) {
            newErrors.mobileNumber = 'Mobile number is required.';
        } else if (!/^\d+$/.test(formData.mobileNumber)) {
            newErrors.mobileNumber = 'Mobile number must contain digits only.';
        } else if (formData.mobileNumber.length !== 10) {
            newErrors.mobileNumber = 'Mobile number must be 10 digits (e.g. 9123456789).';
        } else         if (!formData.mobileNumber.startsWith('9')) {
            newErrors.mobileNumber = 'Mobile number must start with 9.';
        }

        if (!formData.philippine_barangay_id) {
            newErrors.location = 'Please select your complete address (Region through Barangay).';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters.';
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = 'Please confirm your password.';
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match.';
        }

        if (!hasCampaignContext && !formData.campaign_request) {
            newErrors.campaign_request = 'Please select the training batch / module you are joining.';
        }

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!acceptedTerms) {
            setClientErrors({ form: 'Please accept the Terms and Conditions before continuing.' });
            return;
        }

        if (!validateForm()) {
            return;
        }

        const barangayInput = e.target.querySelector('[name="philippine_barangay_id"]');
        const barangayNameInput = e.target.querySelector('[name="barangay_name"]');
        if (!barangayInput?.value) {
            setClientErrors({ location: 'Please select your complete address (Region through Barangay).' });
            return;
        }
        if (!barangayNameInput?.value) {
            setClientErrors({ location: 'Please wait for the address to load after selecting your barangay, then try again.' });
            return;
        }

        // Compose full phone value in Philippine format expected by backend
        const phoneInput = e.target.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.value = `${formData.countryCode} ${formData.mobileNumber}`;
        }

        setIsSubmitting(true);
        e.target.submit();
    };

    const hasErrors = Object.keys(errors).length > 0;
    const getFieldError = (fieldName) => {
        if (errors[fieldName] && Array.isArray(errors[fieldName])) {
            return errors[fieldName][0];
        }
        if (errors[fieldName]) {
            return errors[fieldName];
        }
        return null;
    };

    const getClientError = (fieldName) => clientErrors[fieldName] || null;
    const getMobileError = () => getClientError('mobileNumber') || getFieldError('phone');
    const getPasswordError = () => getClientError('password') || getFieldError('password');
    const getPasswordConfirmationError = () => getClientError('password_confirmation') || getFieldError('password_confirmation');
    const getLocationError = () => getClientError('location')
        || getFieldError('philippine_barangay_id')
        || getFieldError('barangay_name')
        || getFieldError('region')
        || getFieldError('province')
        || getFieldError('municipality_city');
    const serverErrorMessages = Object.entries(errors).flatMap(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages];
        return list.filter(Boolean).map((message) => ({ field, message }));
    });
    const displayCampaign = selectedOpenCampaign || campaignContext;
    const importantCampaignDetails = [
        {
            icon: BookOpen,
            label: 'Training Module',
            value: displayCampaign?.module_title || displayCampaign?.training_title || '—',
        },
        {
            icon: CalendarDays,
            label: 'Registration Opens',
            value: formatDate(displayCampaign?.registration_opens),
        },
        {
            icon: CalendarDays,
            label: 'Registration Deadline',
            value: formatDate(displayCampaign?.registration_deadline),
        },
        {
            icon: Clock3,
            label: 'Training Completion Deadline',
            value: formatDate(displayCampaign?.training_completion_deadline),
        },
        {
            icon: MapPin,
            label: 'Venue',
            value: displayCampaign?.venue || null,
        },
        {
            icon: Users,
            label: 'Seats Remaining',
            value: displayCampaign?.seats_remaining != null
                ? `${displayCampaign.seats_remaining} of ${displayCampaign.maximum_participants}`
                : null,
        },
    ].filter((item) => item.value && item.value !== '—');

    return (
        <div className="min-h-screen relative">
            {/* Hero Background with Gradient Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{
                    backgroundImage: 'url(/images/hero-training.jpg)',
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(5, 150, 105, 0.88))',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div
                    className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                    style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                >
                    <div className="flex flex-col lg:flex-row min-h-[460px]">
                        {/* Left panel - desktop only */}
                        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                            {/* Background photo with blur */}
                            <div
                                className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
                                style={{
                                    backgroundImage: 'url(/images/hero-training.jpg)',
                                }}
                            />
                            {/* Green overlay */}
                            <div className="absolute inset-0 bg-emerald-800/85" />
                            <div className="relative z-10 flex flex-col text-white p-10">
                                <div className="mb-8">
                                    <div
                                        className="inline-flex items-center justify-center"
                                        style={{
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(6px)',
                                            border: '1px solid rgba(255,255,255,0.25)',
                                            borderRadius: '999px',
                                            padding: '10px 18px',
                                            boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
                                        }}
                                    >
                                        <img
                                            src="/logo.svg"
                                            alt="LGU Logo"
                                            className="h-14 w-auto"
                                            style={{
                                                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.35))',
                                            }}
                                        />
                                    </div>
                                </div>
                                {hasCampaignContext || selectedOpenCampaign ? (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
                                                Walk-in / Campaign Registration
                                            </div>
                                            <h2 className="mt-3 text-3xl font-bold leading-tight">
                                                {displayCampaign?.training_title || 'Training Event'}
                                            </h2>
                                            <p className="mt-3 text-sm text-emerald-50/90 leading-6">
                                                {displayCampaign?.short_description
                                                    || 'You are registering for this training module only. After signup, this is the module you will see in your participant account.'}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                                                        Batch & Module Details
                                                    </div>
                                                    <p className="mt-2 text-xs text-emerald-50/80">
                                                        Confirm you are joining the correct open batch before continuing.
                                                    </p>
                                                </div>
                                                {(displayCampaign?.batch_label || campaignBadgeLabel) ? (
                                                    <span className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[0.72rem] font-semibold text-white">
                                                        {displayCampaign?.batch_label || campaignBadgeLabel}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-5 grid grid-cols-1 gap-3">
                                                {importantCampaignDetails.map(({ icon: Icon, label, value }) => (
                                                    <div key={label} className="rounded-xl border border-white/15 bg-slate-950/10 px-4 py-3">
                                                        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
                                                            <Icon className="h-3.5 w-3.5" />
                                                            {label}
                                                        </div>
                                                        <div className="mt-1.5 text-sm font-medium text-white">
                                                            {value || '—'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-4">
                                            Disaster Preparedness Training &amp; Simulation
                                        </h2>
                                        <p className="text-sm text-emerald-50 mb-3">
                                            A centralized platform designed for Barangays and Local Government Units to plan,
                                            manage, and conduct disaster preparedness training and simulation exercises.
                                        </p>
                                        <p className="text-sm text-emerald-50">
                                            This system supports training modules, simulation events, attendance tracking,
                                            evaluation, and certification to help communities stay prepared and resilient.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right panel - registration form */}
                        <div
                            className="w-full lg:w-1/2 bg-white/95 p-8"
                            style={{ borderLeft: '1px solid rgba(0,0,0,0.06)' }}
                        >
                            {/* Logo (mobile / small screens only) */}
                            <div className="flex justify-center mb-6 lg:hidden">
                                <img src="/logo.svg" alt="LGU Logo" className="h-16 w-auto" />
                            </div>

                            <div className="mb-6">
                                <h1
                                    className="text-2xl font-semibold mb-1"
                                    style={{ color: '#1f2937' }}
                                >
                                    Participant Registration
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {hasCampaignContext
                                        ? 'You opened a campaign registration link. This account will be registered only for that batch/module — no batch selection needed.'
                                        : selectedOpenCampaign
                                            ? 'Create your account for the selected training batch. You will only see that module after registration.'
                                            : 'Select an open training batch below, then create your participant account.'}
                                </p>
                            </div>

                {(hasErrors || clientErrors.form) && (
                    <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-1">
                                {clientErrors.form ? <div>{clientErrors.form}</div> : null}
                                {serverErrorMessages.map(({ field, message }, index) => (
                                    <div key={`${field}-${index}`}>{message}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <form method="POST" action="/participant/register/start" onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                    <input type="hidden" name="phone" />
                    {campaignContext?.campaign_event_id ? (
                        <input type="hidden" name="campaign_event" value={campaignContext.campaign_event_id} />
                    ) : null}
                    {hasCampaignContext && campaignContext?.campaign_request_id ? (
                        <input type="hidden" name="campaign_request" value={campaignContext.campaign_request_id} />
                    ) : null}

                    {/* Walk-in only: pick an open batch. Campaign links lock the batch and hide this field. */}
                    {!hasCampaignContext ? (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="campaign_request">
                                Training Batch / Module
                            </label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    id="campaign_request"
                                    name="campaign_request"
                                    value={formData.campaign_request}
                                    onChange={handleChange}
                                    required
                                    className={`w-full rounded-md border ${
                                        getClientError('campaign_request') || getFieldError('campaign_request')
                                            ? 'border-rose-300'
                                            : 'border-slate-300'
                                    } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] bg-white`}
                                >
                                    <option value="">Select an open batch to join</option>
                                    {openCampaigns.map((campaign) => (
                                        <option key={campaign.campaign_request_id} value={campaign.campaign_request_id}>
                                            {(campaign.batch_label || `Batch #${campaign.campaign_request_id}`)}
                                            {' — '}
                                            {campaign.module_title || campaign.training_title || 'Training module'}
                                            {campaign.seats_remaining != null
                                                ? ` (${campaign.seats_remaining} seats left)`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {(getClientError('campaign_request') || getFieldError('campaign_request')) && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {getClientError('campaign_request') || getFieldError('campaign_request')}
                                </p>
                            )}
                            {openCampaigns.length === 0 ? (
                                <p className="mt-1 text-xs text-amber-700">
                                    No open training batches are available right now. Finished or full batches are hidden.
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                    Only open batches with available seats are listed.
                                </p>
                            )}
                        </div>
                    ) : null}

                    {displayCampaign ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                        You are joining
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {displayCampaign.training_title || displayCampaign.module_title || 'Training Event'}
                                    </div>
                                    {displayCampaign.module_title && displayCampaign.training_title
                                        && displayCampaign.module_title !== displayCampaign.training_title ? (
                                        <div className="mt-0.5 text-xs text-slate-600">
                                            Module: {displayCampaign.module_title}
                                        </div>
                                    ) : null}
                                </div>
                                {(displayCampaign.batch_label || campaignBadgeLabel) ? (
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700">
                                        {displayCampaign.batch_label || campaignBadgeLabel}
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {importantCampaignDetails.slice(0, 4).map(({ icon: Icon, label, value }) => (
                                    <div key={`form-${label}`} className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                                        <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
                                            <Icon className="h-3.5 w-3.5 text-emerald-600" />
                                            {label}
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="name">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                autoFocus
                                className={`w-full rounded-md border ${
                                    getFieldError('name') ? 'border-rose-300' : 'border-slate-300'
                                } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                        </div>
                        {getFieldError('name') && (
                            <p className="mt-1 text-xs text-rose-600">{getFieldError('name')}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="organization">
                            Organization (optional)
                        </label>
                        <input
                            id="organization"
                            name="organization"
                            type="text"
                            placeholder="Agency, school, organization"
                            value={formData.organization}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463]"
                        />
                        {getFieldError('organization') && (
                            <p className="mt-1 text-xs text-rose-600">{getFieldError('organization')}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="email">
                            Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`w-full rounded-md border ${
                                    getFieldError('email') ? 'border-rose-300' : 'border-slate-300'
                                } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                        </div>
                        {getFieldError('email') && (
                            <p className="mt-1 text-xs text-rose-600">{getFieldError('email')}</p>
                        )}
                    </div>

                    {/* Contact Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="countryCode">
                                Country Code
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    id="countryCode"
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] bg-white"
                                >
                                    <option value="+63">+63 (Philippines)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="mobileNumber">
                                Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    placeholder="9123456789"
                                    value={formData.mobileNumber}
                                    onChange={(e) => {
                                        const digitsOnly = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, mobileNumber: digitsOnly }));
                                    }}
                                    className={`w-full rounded-md border ${
                                        getMobileError() ? 'border-rose-300' : 'border-slate-300'
                                    } pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463]`}
                                />
                            </div>
                            {getMobileError() && (
                                <p className="mt-1 text-xs text-rose-600">{getMobileError()}</p>
                            )}
                        </div>
                    </div>

                    {/* Standardized Philippine location */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                            Address <span className="text-rose-500">*</span>
                        </label>
                        <PhilippineLocationSelect
                            required
                            apiBase="/api/locations"
                            initialBarangayId={formData.philippine_barangay_id}
                            onResolved={(data) => {
                                if (data) {
                                    setFormData((prev) => ({
                                        ...prev,
                                        philippine_barangay_id: String(data.barangay_id || ''),
                                        region: data.location?.region || '',
                                        province: data.location?.province || '',
                                        municipality_city: data.location?.municipality_city || '',
                                        barangay_name: data.location?.barangay_name || '',
                                    }));
                                    setClientErrors((prev) => {
                                        if (!prev.location) {
                                            return prev;
                                        }
                                        const next = { ...prev };
                                        delete next.location;
                                        return next;
                                    });
                                }
                            }}
                        />
                        {getLocationError() && (
                            <p className="mt-1 text-xs text-rose-600">{getLocationError()}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="street">
                            Street / House No. (optional)
                        </label>
                        <input
                            id="street"
                            name="street"
                            type="text"
                            placeholder="Block 5 Lot 10, Street name"
                            value={formData.street}
                            onChange={handleChange}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                autoComplete="new-password"
                                className={`w-full rounded-md border ${
                                    getPasswordError()
                                        ? 'border-rose-300'
                                        : passwordLiveState.lengthOk
                                            ? 'border-emerald-300'
                                            : 'border-slate-300'
                                } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                        </div>
                        {getPasswordError() ? (
                            <p className="mt-1 text-xs text-rose-600">{getPasswordError()}</p>
                        ) : (
                            <p className={`mt-1 text-xs ${passwordLiveState.lengthOk ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {passwordLiveState.lengthOk ? 'Looks good — at least 8 characters' : 'Must be at least 8 characters'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password_confirmation">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className={`w-full rounded-md border ${
                                    getPasswordConfirmationError() || passwordLiveState.status === 'mismatch'
                                        ? 'border-rose-300'
                                        : passwordLiveState.status === 'match'
                                            ? 'border-emerald-300'
                                            : 'border-slate-300'
                                } pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                            {passwordLiveState.status === 'match' ? (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                            ) : null}
                            {passwordLiveState.status === 'mismatch' ? (
                                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                            ) : null}
                        </div>
                        {getPasswordConfirmationError() ? (
                            <p className="mt-1 text-xs text-rose-600">{getPasswordConfirmationError()}</p>
                        ) : passwordLiveState.status === 'match' ? (
                            <p className="mt-1 text-xs text-emerald-600">Passwords match</p>
                        ) : passwordLiveState.status === 'mismatch' ? (
                            <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
                        ) : formData.password_confirmation ? null : (
                            <p className="mt-1 text-xs text-slate-500">Re-enter your password to confirm</p>
                        )}
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                            className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-600">
                            I agree to the{' '}
                            <a href="/terms" className="text-emerald-600 hover:text-[#1FA463] underline underline-offset-2">
                                Terms and Conditions
                            </a>{' '}
                            and understand how my data will be used.
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting || !acceptedTerms}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-[#16A34A] hover:bg-[#1FA463] disabled:bg-[#16A34A]/60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                        After creating your account, a verification code will be sent to your email.
                        Your email must be verified before you can access training modules and simulation events.
                    </p>
                </form>

                <div className="mt-6 space-y-2">
                    <p className="text-xs text-slate-500 text-center">
                        Already have an account?{' '}
                        <a
                            href="/participant/login"
                            className="text-emerald-600 hover:text-[#1FA463] font-medium transition-all duration-200 ease-out"
                        >
                            Login here
                        </a>
                    </p>
                    <p className="text-xs text-slate-500 text-center">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-[#1FA463] font-medium transition-all duration-200 ease-out"
                        >
                            <span className="text-sm">&#8592;</span>
                            <span>Back</span>
                        </button>
                    </p>
                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
