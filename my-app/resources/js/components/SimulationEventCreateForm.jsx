import React from 'react';
import Swal from 'sweetalert2';
import { CalendarClock, ChevronLeft, MapPin, Users, Package, ClipboardList } from 'lucide-react';
import { HazardAssessmentIntelligencePanel } from './HazardAssessmentModule';

const inputClass =
    'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
const readOnlyClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-600 cursor-not-allowed';

function FormSection({ title, icon: Icon, first = false, children }) {
    return (
        <div className={first ? 'space-y-4' : 'pt-4 border-t border-slate-100 space-y-4'}>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function ReadOnlyField({ label, value, placeholder = '—' }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            <div className={readOnlyClass}>{value || placeholder}</div>
        </div>
    );
}

export function SimulationEventCreateForm({
    scenarios = [],
    trainers = [],
    barangayProfiles = [],
    disasterTypes = [],
    resourcePanel = null,
}) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const formRef = React.useRef(null);
    const minDate = new Date().toISOString().split('T')[0];

    const [eventTitle, setEventTitle] = React.useState('');
    const [eventCategory, setEventCategory] = React.useState('');
    const [selectedProfileId, setSelectedProfileId] = React.useState('');
    const [disasterType, setDisasterType] = React.useState('');
    const [intelligence, setIntelligence] = React.useState(null);
    const [loadingIntelligence, setLoadingIntelligence] = React.useState(false);

    const [eventDate, setEventDate] = React.useState('');
    const [startTime, setStartTime] = React.useState('');
    const [endTime, setEndTime] = React.useState('');

    const [venue, setVenue] = React.useState('');
    const [assemblyArea, setAssemblyArea] = React.useState('');
    const [specialInstructions, setSpecialInstructions] = React.useState('');

    const [targetAudience, setTargetAudience] = React.useState('');
    const [maxParticipants, setMaxParticipants] = React.useState('');
    const [registrationDeadline, setRegistrationDeadline] = React.useState('');

    const selectedProfile = (barangayProfiles || []).find(
        (p) => String(p.id) === String(selectedProfileId),
    );

    const profileHazardTypes = React.useMemo(() => {
        const fromRecords = (selectedProfile?.hazard_records || selectedProfile?.hazardRecords || []).map(
            (h) => h.hazard_type,
        );
        const fromIntelligence = (intelligence?.profile?.hazards || []).map((h) => h.hazard_type);
        const merged = [...new Set([...fromRecords, ...fromIntelligence].filter(Boolean))];
        return merged.length > 0 ? merged : disasterTypes;
    }, [selectedProfile, intelligence, disasterTypes]);

    const compatibleScenarios = React.useMemo(() => {
        if (!disasterType) return [];
        return (scenarios || []).filter(
            (s) => String(s.disaster_type).toLowerCase() === String(disasterType).toLowerCase(),
        );
    }, [scenarios, disasterType]);

    const autoScenario = compatibleScenarios[0] || null;

    const suggestedTrainers = intelligence?.suggested_trainers?.length
        ? intelligence.suggested_trainers
        : (trainers || []).slice(0, 5);

    const assignedTrainerId = suggestedTrainers[0]?.id || '';

    React.useEffect(() => {
        if (!selectedProfileId) {
            setIntelligence(null);
            setDisasterType('');
            setVenue('');
            setTargetAudience('');
            return;
        }

        setDisasterType('');
        setLoadingIntelligence(true);
        fetch(`/admin/hazard-assessment-profiles/${selectedProfileId}/intelligence`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((data) => {
                setIntelligence(data);
                const recommendedType =
                    data?.recommended_scenario?.hazard_type ||
                    data?.profile?.highest_risk_hazard ||
                    data?.profile?.hazards?.[0]?.hazard_type ||
                    '';
                if (recommendedType) {
                    setDisasterType(recommendedType);
                }
                if (data?.suggested_participants?.length) {
                    setTargetAudience(data.suggested_participants.join(', '));
                }
                if (data?.profile?.barangay_name) {
                    setVenue(`${data.profile.barangay_name} Hall`);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingIntelligence(false));
    }, [selectedProfileId]);

    const handleStartTimeChange = (e) => {
        const start = e.target.value;
        setStartTime(start);
        if (start && endTime && endTime < start) setEndTime('');
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;

        if (eventDate && eventDate < minDate) {
            Swal.fire({
                title: 'Invalid date',
                text: 'Event date cannot be in the past.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        if (startTime && endTime && endTime < startTime) {
            Swal.fire({
                title: 'Invalid time',
                text: 'End time must be the same as or later than start time.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        if (!selectedProfileId) {
            Swal.fire({
                title: 'Profile required',
                text: 'Please select a Hazard Assessment Profile.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        if (!disasterType) {
            Swal.fire({
                title: 'Disaster type required',
                text: 'Please select a disaster type.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        const summaryHtml = `
            <div style="text-align:left;font-size:14px;line-height:1.6">
                <p><strong>Title:</strong> ${eventTitle}</p>
                <p><strong>Category:</strong> ${eventCategory}</p>
                <p><strong>Disaster Type:</strong> ${disasterType}</p>
                <p><strong>Barangay:</strong> ${selectedProfile?.barangay_name || '—'}, ${selectedProfile?.municipality_city || ''}</p>
                <p><strong>Schedule:</strong> ${eventDate} · ${startTime} – ${endTime}</p>
                <p><strong>Venue:</strong> ${venue || '—'}</p>
                <p><strong>AI Scenario:</strong> ${autoScenario?.title || 'Will be auto-assigned on save'}</p>
                <p><strong>Trainer:</strong> ${suggestedTrainers[0]?.name || 'None assigned'}</p>
            </div>
        `;

        Swal.fire({
            title: 'Save as draft?',
            html: summaryHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save as draft',
            cancelButtonText: 'Go back',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
        }).then((result) => {
            if (result.isConfirmed && formRef.current) {
                formRef.current.submit();
            }
        });
    };

    const municipality =
        intelligence?.profile?.municipality_city || selectedProfile?.municipality_city || '';
    const province = intelligence?.profile?.province || selectedProfile?.province || '';
    const riskHazards = (intelligence?.profile?.hazards || selectedProfile?.hazard_records || [])
        .map((h) => h.hazard_type)
        .filter(Boolean);
    const suggestedEquipment = intelligence?.suggested_equipment || [];

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/admin/simulation-events"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Simulation Events
            </a>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-xl shadow-md">
                    <CalendarClock className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Create Simulation Event</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Plan a drill using hazard intelligence, AI scenarios, and registry data
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <form
                        id="simulation-event-create-form"
                        ref={formRef}
                        method="POST"
                        action="/admin/simulation-events"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                        onSubmit={handleFormSubmit}
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="status" value="draft" />
                        <input type="hidden" name="disaster_type" value={disasterType} />
                        <input type="hidden" name="scenario_id" value={autoScenario?.id || ''} />
                        {assignedTrainerId ? (
                            <input type="hidden" name="assigned_trainer_id" value={assignedTrainerId} />
                        ) : null}

                        <FormSection title="Basic Information" icon={ClipboardList} first>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_title">
                                    Event Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="event_title"
                                    name="title"
                                    type="text"
                                    required
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    placeholder="e.g. Earthquake Evacuation Drill"
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_category">
                                        Event Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="event_category"
                                        name="event_category"
                                        required
                                        value={eventCategory}
                                        onChange={(e) => setEventCategory(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select category…</option>
                                        <option value="Drill">Drill</option>
                                        <option value="Full-scale Exercise">Full-scale Exercise</option>
                                        <option value="Tabletop">Tabletop</option>
                                        <option value="Training Session">Training Session</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="disaster_type_select">
                                        Disaster Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="disaster_type_select"
                                        value={disasterType}
                                        onChange={(e) => setDisasterType(e.target.value)}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">Select disaster type…</option>
                                        {(selectedProfileId ? profileHazardTypes : disasterTypes).map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="barangay_profile_id">
                                    Hazard Assessment Profile <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="barangay_profile_id"
                                    name="barangay_profile_id"
                                    value={selectedProfileId}
                                    onChange={(e) => setSelectedProfileId(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Select hazard assessment profile…</option>
                                    {(barangayProfiles || []).map((bp) => (
                                        <option key={bp.id} value={bp.id}>
                                            {bp.barangay_name} — {bp.municipality_city}, {bp.province}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedProfileId && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ReadOnlyField label="Municipality / City" value={municipality} />
                                    <ReadOnlyField label="Province" value={province} />
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Risk Hazards</label>
                                        <div className={readOnlyClass}>
                                            {riskHazards.length > 0 ? riskHazards.join(', ') : 'No hazards recorded'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loadingIntelligence && (
                                <p className="text-xs text-slate-500">Loading hazard intelligence…</p>
                            )}

                            {selectedProfileId && !loadingIntelligence && (
                                <>
                                    <HazardAssessmentIntelligencePanel barangayProfileId={selectedProfileId} />

                                    {disasterType && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                            <p className="text-xs font-semibold text-slate-600">Suggested AI Scenarios</p>
                                            {compatibleScenarios.length > 0 ? (
                                                <ul className="text-sm text-slate-700 space-y-1">
                                                    {compatibleScenarios.map((s) => (
                                                        <li key={s.id} className="flex items-start gap-2">
                                                            <span className="text-emerald-600 mt-0.5">•</span>
                                                            <span>
                                                                <span className="font-medium">{s.title}</span>
                                                                {s.id === autoScenario?.id && (
                                                                    <span className="ml-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                                        Auto-selected
                                                                    </span>
                                                                )}
                                                                {s.difficulty && (
                                                                    <span className="text-slate-500"> · {s.difficulty}</span>
                                                                )}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500">
                                                    No published scenarios match this disaster type. One will be linked when available.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {suggestedEquipment.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                Recommended Equipment
                                            </label>
                                            <div className={readOnlyClass}>{suggestedEquipment.join(', ')}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </FormSection>

                        <FormSection title="Schedule" icon={CalendarClock}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_date">
                                        Event Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="event_date"
                                        name="event_date"
                                        type="date"
                                        required
                                        min={minDate}
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="start_time">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="start_time"
                                        name="start_time"
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={handleStartTimeChange}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="end_time">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="end_time"
                                        name="end_time"
                                        type="time"
                                        required
                                        min={startTime || undefined}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Location" icon={MapPin}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="venue">
                                        Venue
                                    </label>
                                    <input
                                        id="venue"
                                        name="venue"
                                        type="text"
                                        value={venue}
                                        onChange={(e) => setVenue(e.target.value)}
                                        placeholder="e.g. Barangay Covered Court"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="assembly_points">
                                        Assembly Area
                                    </label>
                                    <input
                                        id="assembly_points"
                                        name="assembly_points"
                                        type="text"
                                        value={assemblyArea}
                                        onChange={(e) => setAssemblyArea(e.target.value)}
                                        placeholder="e.g. Open field near barangay hall"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="accessibility_notes">
                                    Special Instructions <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    id="accessibility_notes"
                                    name="accessibility_notes"
                                    rows={3}
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    placeholder="Accessibility notes, evacuation routes, or safety reminders"
                                    className={inputClass}
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Participants" icon={Users}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="target_audience">
                                        Target Audience
                                    </label>
                                    <input
                                        id="target_audience"
                                        name="target_audience"
                                        type="text"
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        placeholder="Auto-suggested from hazard profile"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="max_participants">
                                        Maximum Participants
                                    </label>
                                    <input
                                        id="max_participants"
                                        name="max_participants"
                                        type="number"
                                        min="1"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(e.target.value)}
                                        placeholder="Leave blank for unlimited"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Assigned Trainer
                                        <span className="text-slate-400 font-normal ml-1">(from Trainer Registry)</span>
                                    </label>
                                    {suggestedTrainers.length > 0 ? (
                                        <ul className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
                                            {suggestedTrainers.map((t, index) => (
                                                <li
                                                    key={t.id}
                                                    className="px-3 py-2.5 text-sm text-slate-700 flex items-center justify-between"
                                                >
                                                    <span>
                                                        {t.name}
                                                        {t.specialization ? (
                                                            <span className="text-slate-500"> — {t.specialization}</span>
                                                        ) : null}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                            Assigned
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className={readOnlyClass}>No trainers available in the registry.</div>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="registration_deadline">
                                        Registration Deadline
                                    </label>
                                    <input
                                        id="registration_deadline"
                                        name="registration_deadline"
                                        type="datetime-local"
                                        value={registrationDeadline}
                                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Review" icon={ClipboardList}>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    <p><span className="font-semibold text-slate-600">Title:</span> {eventTitle || '—'}</p>
                                    <p><span className="font-semibold text-slate-600">Category:</span> {eventCategory || '—'}</p>
                                    <p><span className="font-semibold text-slate-600">Disaster Type:</span> {disasterType || '—'}</p>
                                    <p>
                                        <span className="font-semibold text-slate-600">Profile:</span>{' '}
                                        {selectedProfile
                                            ? `${selectedProfile.barangay_name}, ${selectedProfile.municipality_city}`
                                            : '—'}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-600">Schedule:</span>{' '}
                                        {eventDate && startTime && endTime
                                            ? `${eventDate} · ${startTime} – ${endTime}`
                                            : '—'}
                                    </p>
                                    <p><span className="font-semibold text-slate-600">Venue:</span> {venue || '—'}</p>
                                    <p>
                                        <span className="font-semibold text-slate-600">AI Scenario:</span>{' '}
                                        {autoScenario?.title || 'Auto-assigned on save'}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-600">Trainer:</span>{' '}
                                        {suggestedTrainers[0]?.name || '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-2">
                                <p className="text-xs text-slate-500">
                                    Saved as draft. Publish later from Simulation Events.
                                </p>
                                <div className="flex gap-2">
                                    <a
                                        href="/admin/simulation-events"
                                        className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        Save as Draft
                                    </button>
                                </div>
                            </div>
                        </FormSection>
                    </form>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    {resourcePanel || (
                        <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-sm font-semibold text-slate-800">Resources for Simulation</h3>
                            </div>
                            <p className="text-sm text-slate-500">Resource panel unavailable.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
