import React from 'react';
import Swal from 'sweetalert2';
import { CalendarClock, ClipboardList, Play, Search, Users, CheckCircle2, BarChart3 } from 'lucide-react';
import { deriveSimulationEventStatus, getEventDateTime } from '../utils/simulationEventStatus';

// Date formatting utilities
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(timeString) {
    if (!timeString) return '';
    // If already in HH:MM format
    if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
}

function titleCaseStatus(status) {
    if (!status) return '—';
    return String(status)
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
}

function getDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const dt = new Date(dateStr);
    if (timeStr && timeStr.match(/^\d{2}:\d{2}/)) {
        const [h, m] = timeStr.split(':').map((v) => Number(v) || 0);
        dt.setHours(h, m, 0, 0);
    }
    return dt;
}

function formatDurationFromTimes(startTime, endTime) {
    if (!startTime || !endTime) return '—';
    const start = getDateTime('2000-01-01', startTime);
    const end = getDateTime('2000-01-01', endTime);
    if (!start || !end) return '—';
    const diffMins = Math.max(0, Math.round((end - start) / 60000));
    if (!Number.isFinite(diffMins) || diffMins <= 0) return '—';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    if (m === 0) return `${h} hr${h !== 1 ? 's' : ''}`;
    return `${h} hr${h !== 1 ? 's' : ''} ${m} min`;
}

export function ParticipantSimulationEventsList({ events }) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [registrationFilter, setRegistrationFilter] = React.useState('all');

    // Normalize and filter events
    const normalizedEvents = (events || []).map((event) => ({
        ...event,
        _title: (event.title || '').toLowerCase(),
        _disaster: (event.disaster_type || '').toLowerCase(),
    }));

    const filteredEvents = normalizedEvents.filter((event) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            event._title.includes(query) ||
            event._disaster.includes(query);

        const userRegistration = event.user_registration;
        const registrationStatus = userRegistration?.status || 'not_registered';
        
        let matchesFilter = true;
        if (registrationFilter === 'registered') {
            matchesFilter = registrationStatus === 'approved' || registrationStatus === 'pending';
        } else if (registrationFilter === 'not_registered') {
            matchesFilter = !userRegistration || registrationStatus === 'cancelled' || registrationStatus === 'rejected';
        }

        return matchesSearch && matchesFilter;
    });

    const searchSuggestions = searchQuery
        ? normalizedEvents
              .filter((event) =>
                  event._title.startsWith(searchQuery.toLowerCase()) ||
                  event._disaster.startsWith(searchQuery.toLowerCase())
              )
              .slice(0, 6)
        : [];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Simulation Events</h2>
            <p className="text-sm text-slate-600 mb-2">
                Browse upcoming disaster preparedness drills and simulations. Register to participate.
            </p>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="space-y-3">
                    {/* Search Bar with Dropdown */}
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search events by title or disaster type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                        </div>
                        {/* Search Suggestions Dropdown */}
                        {searchSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                {searchSuggestions.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                                        onClick={() => setSearchQuery(event.title)}
                                    >
                                        <div className="font-medium text-slate-900">{event.title}</div>
                                        <div className="text-xs text-slate-500">
                                            {event.disaster_type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRegistrationFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                registrationFilter === 'all'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setRegistrationFilter('registered')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                registrationFilter === 'registered'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Registered
                        </button>
                        <button
                            onClick={() => setRegistrationFilter('not_registered')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                registrationFilter === 'not_registered'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Not registered
                        </button>
                    </div>
                </div>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="rounded-xl bg-white border border-slate-200 px-4 py-6 text-sm text-slate-500 text-center shadow-sm">
                    No simulation events are available at this time. Please check back later.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => {
                        const userRegistration = event.user_registration;
                        const isRegistered = !!userRegistration;
                        const registrationStatus = userRegistration?.status || null;
                        const isPending = registrationStatus === 'pending';
                        const isApproved = registrationStatus === 'approved';
                        const isCancelled = registrationStatus === 'cancelled';
                        const isRejected = registrationStatus === 'rejected';

                        const now = new Date();
                        const derivedStatus = deriveSimulationEventStatus(event, now);
                        const startAt = getEventDateTime(event.event_date, event.start_time);

                        const statusBadge =
                            derivedStatus === 'ongoing'
                                ? 'Ongoing'
                                : derivedStatus === 'completed'
                                    ? 'Completed'
                                    : derivedStatus === 'ended'
                                        ? 'Ended'
                                        : derivedStatus === 'published' && startAt && now < startAt
                                            ? 'Upcoming'
                                            : titleCaseStatus(derivedStatus);

                        const cardBgClass =
                            derivedStatus === 'ongoing'
                                ? 'bg-emerald-700'
                                : derivedStatus === 'completed'
                                    ? 'bg-indigo-700'
                                    : derivedStatus === 'ended'
                                        ? 'bg-slate-600'
                                        : 'bg-slate-700';
                        
                        return (
                            <div
                                key={event.id}
                                className={`rounded-lg ${cardBgClass} shadow-md p-5 flex flex-col gap-4 text-white h-[320px] overflow-hidden transition-colors`}
                            >
                                <div>
                                    <h3 className="text-base font-semibold mb-3 line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <div className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-xs font-medium mb-2">
                                        {statusBadge}
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                                            {event.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    {event.disaster_type && (
                                        <div className="text-[0.75rem] text-slate-300 mb-1">
                                            <span>Disaster type: {event.disaster_type}</span>
                                        </div>
                                    )}
                                    {isRegistered && (isPending || isApproved) && (
                                        <button
                                            className="w-full py-2 rounded-md bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition-colors"
                                        >
                                            Registered
                                        </button>
                                    )}
                                    <a
                                        href={`/simulation-events/${event.id}`}
                                        className="w-full py-2 rounded-md bg-white text-slate-800 text-sm font-medium text-center hover:bg-slate-100 transition-colors"
                                    >
                                        Details
                                    </a>
                                    {isUpcoming && event.self_registration_enabled && (!isRegistered || isCancelled || isRejected) && (
                                        <a
                                            href={`/simulation-events/${event.id}`}
                                            className="w-full py-2 rounded-md bg-emerald-600 text-white text-sm font-medium text-center hover:bg-emerald-700 transition-colors"
                                        >
                                            Register
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function ParticipantSimulationEventDetail({ event, role }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const userRegistration = event.registrations?.[0] || null;
    const isRegistered = !!userRegistration;
    const registrationStatus = userRegistration?.status || null;
    const isPending = registrationStatus === 'pending';
    const isApproved = registrationStatus === 'approved';
    const isCancelled = registrationStatus === 'cancelled';
    const isRejected = registrationStatus === 'rejected';
    
    // Check if event hasn't started yet (event date + start time)
    const now = new Date();
    const eventDateOnly = new Date(event.event_date);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    // Parse start time (format: HH:MM)
    const [startHour, startMinute] = (event.start_time || '00:00').split(':').map(Number);
    const eventStartDateTime = new Date(event.event_date);
    eventStartDateTime.setHours(startHour, startMinute, 0, 0);
    
    // Event is upcoming if it hasn't started yet
    const isUpcoming = now < eventStartDateTime;
    const canRegister = isUpcoming && event.self_registration_enabled && (!isRegistered || isCancelled || isRejected);
    const canCancelRegistration = isRegistered && (isPending || isApproved);

    // Admin/Trainer: Calculate if Start Event button should be visible
    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);
    
    const eventStartTime = new Date(event.event_date);
    eventStartTime.setHours(startHour, startMinute, 0, 0);
    
    const isEventDateToday = eventDateOnly.getTime() === todayOnly.getTime();
    const isEventTimeReached = now >= eventStartTime;
    const canStartEvent = role !== 'PARTICIPANT' && event.status === 'published' && isEventDateToday && isEventTimeReached;

    const scenario = event.scenario;
    const trainingModule = scenario?.training_module;
    const lessons = trainingModule?.lessons || [];

    const startDt = getDateTime(event.event_date, event.start_time);
    const endDt = getDateTime(event.event_date, event.end_time);
    const hasEndedByTime =
        !!endDt &&
        ['published', 'ongoing'].includes(event.status) &&
        now >= endDt;

    const statusDisplay = (() => {
        if (event.status === 'ongoing' && !hasEndedByTime) return 'Ongoing';
        if (event.status === 'published' && startDt && now < startDt) return 'Scheduled';
        if (event.status === 'draft') return 'Draft';
        if (event.status === 'cancelled') return 'Cancelled';
        if (event.status === 'archived') return 'Archived';
        if (event.status === 'completed') return 'Completed';
        if (event.status === 'ended' || hasEndedByTime) return 'Ended';
        return titleCaseStatus(event.status);
    })();

    const statusBadgeClass = (() => {
        if (statusDisplay === 'Ongoing') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (statusDisplay === 'Scheduled') return 'bg-sky-50 text-sky-700 border-sky-200';
        if (statusDisplay === 'Draft') return 'bg-amber-50 text-amber-800 border-amber-200';
        if (statusDisplay === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-200';
        if (statusDisplay === 'Completed') return 'bg-slate-50 text-slate-700 border-slate-200';
        if (statusDisplay === 'Ended') return 'bg-slate-50 text-slate-700 border-slate-200';
        if (statusDisplay === 'Archived') return 'bg-slate-50 text-slate-600 border-slate-200';
        return 'bg-slate-50 text-slate-700 border-slate-200';
    })();

    const durationLabel = formatDurationFromTimes(event.start_time, event.end_time);
    const difficulty = scenario?.difficulty || '—';
    const severity = scenario?.severity_level || '—';

    const quickActions = role !== 'PARTICIPANT'
        ? [
            { label: 'Manage Participants', href: `/simulation-events/${event.id}/registrations`, Icon: Users },
            { label: 'View Attendance', href: `/simulation-events/${event.id}/attendance`, Icon: CheckCircle2 },
            { label: 'View Evaluation', href: `/simulation-events/${event.id}/evaluation`, Icon: ClipboardList },
            { label: 'View Reports', href: `/simulation-events/${event.id}/evaluation/summary`, Icon: BarChart3 },
        ]
        : [];

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Confirm Registration',
            text: 'Do you want to register for this simulation event?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, register me',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
        });
        if (result.isConfirmed) e.target.submit();
    };

    const handleCancelRegistrationSubmit = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Cancel Registration',
            text: 'Are you sure you want to cancel your registration?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel registration',
            cancelButtonText: 'Keep registration',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
        });
        if (result.isConfirmed) e.target.submit();
    };

    const handleStartEventSubmit = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Start Event',
            text: 'Start this simulation event? The status will change to Ongoing.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, start event',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
        });
        if (result.isConfirmed) e.target.submit();
    };

    return (
        <div className="space-y-6">
            {/* Event header */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-md p-6 md:p-7">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-2xl shadow-sm shrink-0">
                                <CalendarClock className="w-6 h-6 text-emerald-700" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                                    {event.title}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                                        {statusDisplay}
                                    </span>
                                    {role === 'PARTICIPANT' && isRegistered && !isCancelled && (
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {isPending ? 'Registration pending' : isApproved ? 'Registered' : isRejected ? 'Registration rejected' : 'Registered'}
                                        </span>
                                    )}
                                    <span className="text-xs font-medium text-slate-500">
                                        {event.disaster_type || '—'} • {event.event_category || '—'}
                                    </span>
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                    {formatDate(event.event_date)} • {formatTime(event.start_time)} – {formatTime(event.end_time)}
                                    {durationLabel !== '—' && <span className="text-slate-400"> • {durationLabel}</span>}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    {(event.location || 'Location TBD')}
                                    {event.building ? ` — ${event.building}` : ''}
                                    {event.room_zone ? ` (${event.room_zone})` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick header actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {role !== 'PARTICIPANT' && event.status === 'draft' && (
                            <a
                                href={`/simulation-events/${event.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all"
                            >
                                Edit
                            </a>
                        )}
                        {role !== 'PARTICIPANT' && canStartEvent && (
                            <form method="POST" action={`/simulation-events/${event.id}/start`} onSubmit={handleStartEventSubmit}>
                                <input type="hidden" name="_token" value={csrf} />
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
                                >
                                    <Play className="w-4 h-4" /> Start
                                </button>
                            </form>
                        )}
                        {role === 'PARTICIPANT' && (
                            <>
                                {canRegister && (
                                    <form method="POST" action={`/simulation-events/${event.id}/register`} onSubmit={handleRegisterSubmit}>
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button
                                            type="submit"
                                            className="inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
                                        >
                                            Register
                                        </button>
                                    </form>
                                )}
                                {canCancelRegistration && (
                                    <form method="POST" action={`/simulation-events/${event.id}/cancel-registration`} onSubmit={handleCancelRegistrationSubmit}>
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button
                                            type="submit"
                                            className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 text-sm font-semibold transition-colors"
                                        >
                                            Cancel registration
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* KPI strip */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">Duration</div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900">{durationLabel}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">Difficulty</div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900">{difficulty}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">Severity</div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900">{severity}</div>
                    </div>
                </div>
            </div>

            {/* Main 2-col layout */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
                {/* LEFT: Scenario overview */}
                <div className="lg:col-span-7 space-y-6">
                    {scenario && (
                        <div id="scenario" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <h2 className="text-lg font-bold text-slate-900">Scenario Overview</h2>
                                <div className="flex items-center gap-2">
                                    {scenario.severity_level && (
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Severity: {scenario.severity_level}
                                        </span>
                                    )}
                                    {scenario.difficulty && (
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Difficulty: {scenario.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">
                                This is a brief overview to help you prepare. Full scenario details may be revealed during the drill.
                            </p>
                            {scenario.short_description ? (
                                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                                    {scenario.short_description}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-500">No scenario summary available.</p>
                            )}
                        </div>
                    )}

                    {event.description && (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Event Description</h2>
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                                {event.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: context panel */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Event Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Disaster type</span>
                                <span className="font-medium text-slate-900">{event.disaster_type || '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Category</span>
                                <span className="font-medium text-slate-900">{event.event_category || '—'}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900">{formatDate(event.event_date)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Time</span>
                                <span className="font-medium text-slate-900">{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Duration</span>
                                <span className="font-medium text-slate-900">{durationLabel}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Location</div>
                                <div className="text-slate-900 font-medium">
                                    {event.location || 'To be announced'}
                                </div>
                                {(event.building || event.room_zone) && (
                                    <div className="text-xs text-slate-600 mt-1">
                                        {event.building ? `Building: ${event.building}` : ''}
                                        {event.building && event.room_zone ? ' • ' : ''}
                                        {event.room_zone ? `Zone: ${event.room_zone}` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {trainingModule && (
                        <div id="training" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-2">Linked Training Module</h3>
                            <div className="text-sm font-semibold text-slate-900 truncate" title={trainingModule.title}>
                                {trainingModule.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}{trainingModule.difficulty ? ` • ${trainingModule.difficulty}` : ''}
                            </div>
                            <div className="mt-3 flex gap-2">
                            <a
                                href={`/training-modules/${trainingModule.id}`}
                                className="inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 transition-colors"
                            >
                                View module
                            </a>
                                {lessons.length > 0 && (
                                    <a
                                        href={`/training-modules/${trainingModule.id}#lesson-${lessons[0]?.id}`}
                                        className="inline-flex items-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 transition-colors"
                                    >
                                        Start first lesson
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {role !== 'PARTICIPANT' && (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                {event.status === 'draft' && (
                                    <a
                                        href={`/simulation-events/${event.id}/edit`}
                                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                                    >
                                        <span>Edit event</span>
                                        <span className="text-slate-400">→</span>
                                    </a>
                                )}
                                {quickActions.map(({ label, href, Icon }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <Icon className="w-4 h-4 text-slate-500" />
                                        <span>{label}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <a
                    href="/simulation-events"
                    className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                    ← Back to Simulation Events
                </a>
            </div>
        </div>
    );
}
