import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight, Phone, CalendarDays, MapPin, Clock3, Building2 } from 'lucide-react';
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

export function ParticipantRegister({ errors = {}, oldValues = {}, campaignContext = null }) {
    const [formData, setFormData] = useState({
        name: oldValues.name || '',
        organization: oldValues.organization || '',
        email: oldValues.email || '',
        countryCode: oldValues.countryCode || '+63',
        mobileNumber: oldValues.mobileNumber || '',
        street: oldValues.street || '',
        philippine_barangay_id: oldValues.philippine_barangay_id || '',
        region: oldValues.region || '',
        province: oldValues.province || '',
        municipality_city: oldValues.municipality_city || '',
        barangay_name: oldValues.barangay_name || '',
        password: '',
        password_confirmation: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [clientErrors, setClientErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!acceptedTerms) return;

        if (!validateForm()) {
            return;
        }

        const barangayInput = e.target.querySelector('[name="philippine_barangay_id"]');
        if (!barangayInput?.value) {
            setClientErrors({ location: 'Please select your complete address (Region through Barangay).' });
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
        return null;
    };

    const getClientError = (fieldName) => clientErrors[fieldName] || null;

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
                                    Create an account to access training modules and simulation events.
                                </p>
                            </div>

                {hasErrors && Object.keys(errors).some(key => !['name', 'email', 'phone', 'password', 'password_confirmation'].includes(key)) && (
                    <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                {Object.entries(errors)
                                    .filter(([key]) => !['name', 'email', 'phone', 'password', 'password_confirmation'].includes(key))
                                    .map(([field, messages]) => (
                                        <div key={field}>
                                            {Array.isArray(messages) ? messages.map((msg, i) => (
                                                <div key={i}>{msg}</div>
                                            )) : <div>{messages}</div>}
                                        </div>
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

                    {campaignContext?.campaign_event_id ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Campaign Registration</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {campaignContext.training_title || 'Training Event'}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">
                                        You are registering through Campaign Planning &amp; Scheduling. Details below are read-only.
                                    </div>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700">
                                    Campaign #{campaignContext.campaign_event_id}
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                                    <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                        <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                                        Scheduled Date
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">{formatDate(campaignContext.scheduled_date)}</div>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                                    <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                        <Clock3 className="h-3.5 w-3.5 text-emerald-600" />
                                        Time
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                        {formatTime(campaignContext.start_time)} – {formatTime(campaignContext.end_time)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                        Venue
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">{campaignContext.venue || '—'}</div>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                        <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                                        Training Module ID
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">{campaignContext.training_module_id || '—'}</div>
                                </div>
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
                                        getClientError('mobileNumber') ? 'border-rose-300' : 'border-slate-300'
                                    } pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463]`}
                                />
                            </div>
                            {getClientError('mobileNumber') && (
                                <p className="mt-1 text-xs text-rose-600">{getClientError('mobileNumber')}</p>
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
                                }
                            }}
                        />
                        {getClientError('location') && (
                            <p className="mt-1 text-xs text-rose-600">{getClientError('location')}</p>
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
                                required
                                minLength={8}
                                className={`w-full rounded-md border ${
                                    getFieldError('password') ? 'border-rose-300' : 'border-slate-300'
                                } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                        </div>
                        {getFieldError('password') && (
                            <p className="mt-1 text-xs text-rose-600">{getFieldError('password')}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
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
                                required
                                className={`w-full rounded-md border ${
                                    getFieldError('password_confirmation') ? 'border-rose-300' : 'border-slate-300'
                                } pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1FA463] focus:border-[#1FA463] focus:bg-[rgba(22,163,74,0.08)] transition-all duration-200 ease-out`}
                            />
                        </div>
                        {getFieldError('password_confirmation') && (
                            <p className="mt-1 text-xs text-rose-600">{getFieldError('password_confirmation')}</p>
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
                        className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-[#16A34A] hover:bg-[#1FA463] disabled:bg-[#16A34A]/60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
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
