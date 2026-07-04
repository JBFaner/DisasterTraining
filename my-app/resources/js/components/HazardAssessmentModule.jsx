import React from 'react';
import {
    AlertTriangle,
    Eye,
    Pencil,
    Trash2,
    Plus,
    Filter,
    FileText,
    Download,
    CheckCircle2,
    MapPin,
    ChevronLeft,
    Upload,
    X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminFilterBar,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminSearchInput,
    adminSelectClass,
    adminCompactInputClass,
} from './admin/AdminLayout';
import {
    AdminDataTable,
    AdminTableActionButton,
} from './admin/AdminDataTable';
import { PhilippineLocationSelect } from './PhilippineLocationSelect';

const RISK_COLORS = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    'Very High': 'bg-rose-100 text-rose-800 border-rose-200',
};

const HAZARD_EMOJI = {
    Flood: '🌊',
    Fire: '🔥',
    Earthquake: '🌍',
    Landslide: '⛰️',
    Typhoon: '🌀',
    'Storm Surge': '🌊',
    Tsunami: '🌊',
    'Volcanic Eruption': '🌋',
    Tornado: '🌪️',
    Liquefaction: '〰️',
    Others: '⚠️',
};

const HAZARD_BADGE_COLORS = {
    Flood: 'bg-blue-100 text-blue-800 border-blue-200',
    Fire: 'bg-orange-100 text-orange-800 border-orange-200',
    Earthquake: 'bg-amber-100 text-amber-800 border-amber-200',
    Landslide: 'bg-stone-100 text-stone-800 border-stone-200',
    Typhoon: 'bg-sky-100 text-sky-800 border-sky-200',
    'Storm Surge': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Tsunami: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Volcanic Eruption': 'bg-rose-100 text-rose-800 border-rose-200',
    Tornado: 'bg-violet-100 text-violet-800 border-violet-200',
    Liquefaction: 'bg-slate-100 text-slate-800 border-slate-200',
    Others: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function RiskBadge({ level }) {
    if (!level) return <span className="text-slate-400">—</span>;
    return (
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${RISK_COLORS[level] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {level}
        </span>
    );
}

function HazardTypeBadge({ type }) {
    const emoji = HAZARD_EMOJI[type] || HAZARD_EMOJI.Others;
    return (
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${HAZARD_BADGE_COLORS[type] || HAZARD_BADGE_COLORS.Others}`}>
            <span aria-hidden="true">{emoji}</span>
            {type}
        </span>
    );
}

function AgencyBadge({ agency, labels = {} }) {
    if (!agency) return <span className="text-slate-400">—</span>;
    return (
        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
            {labels[agency] || agency}
        </span>
    );
}

function getHazardRecords(row) {
    return row.hazard_records || row.hazardRecords || [];
}

function HazardTypesCell({ row, hazardColors = {} }) {
    const [showModal, setShowModal] = React.useState(false);
    const hazards = getHazardRecords(row);
    const types = [...new Set(hazards.map((h) => h.hazard_type).filter(Boolean))];

    if (types.length === 0) return <span className="text-slate-400 text-sm">—</span>;

    const visible = types.slice(0, 2);
    const remaining = types.length - visible.length;

    return (
        <>
            <div className="flex flex-wrap items-center gap-1.5">
                {visible.map((type, index) => (
                    <HazardTypeBadge key={`${type}-${index}`} type={type} />
                ))}
                {remaining > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        +{remaining} more
                    </button>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">{row.barangay_name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Hazards</p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <ul className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
                            {types.map((type) => (
                                <li key={type} className="flex items-center gap-2 text-sm text-slate-800">
                                    <span className="text-slate-400">•</span>
                                    <span>{HAZARD_EMOJI[type] || HAZARD_EMOJI.Others} {type}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
}

function SourceAgenciesCell({ row, labels = {} }) {
    const agencies = [...new Set(getHazardRecords(row).map((h) => h.source_agency).filter(Boolean))];
    if (agencies.length === 0) return <span className="text-slate-400">—</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {agencies.slice(0, 2).map((a) => (
                <AgencyBadge key={a} agency={a} labels={labels} />
            ))}
            {agencies.length > 2 && (
                <span className="text-xs text-slate-500">+{agencies.length - 2}</span>
            )}
        </div>
    );
}

function RiskScoreBar({ score = 0, level }) {
    const pct = Math.max(0, Math.min(100, Number(score) || 0));
    const barColor = level === 'Very High' || level === 'High'
        ? 'bg-rose-500'
        : level === 'Moderate'
            ? 'bg-amber-500'
            : 'bg-emerald-500';

    return (
        <div className="space-y-1">
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{pct}%</span>
                <RiskBadge level={level} />
            </div>
        </div>
    );
}

function agencyLabel(agency, labels = {}) {
    return labels[agency] || agency || '—';
}

export function HazardAssessmentList({ profiles = [], summary = null, options = {} }) {
    const labels = options.source_agency_labels || {};
    const hazardTypes = options.hazard_types || [];
    const riskLevels = options.risk_levels || [];

    const [searchTerm, setSearchTerm] = React.useState('');
    const [hazardFilter, setHazardFilter] = React.useState('all');
    const [riskFilter, setRiskFilter] = React.useState('all');
    const [sortKey, setSortKey] = React.useState('barangay_name');
    const [sortDir, setSortDir] = React.useState('asc');
    const [profilesData, setProfilesData] = React.useState(profiles || []);
    const [pagination, setPagination] = React.useState(null);
    const [summaryData, setSummaryData] = React.useState(summary);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchProfiles = React.useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const url = new URL('/admin/api/hazard-assessment-profiles', window.location.origin);
            url.searchParams.set('page', page);
            if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
            if (hazardFilter !== 'all') url.searchParams.set('hazard_filter', hazardFilter);
            if (riskFilter !== 'all') url.searchParams.set('risk_filter', riskFilter);
            url.searchParams.set('sort_by', sortKey);
            url.searchParams.set('sort_dir', sortDir);

            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load profiles');
            const data = await res.json();
            setProfilesData(data.profiles || []);
            setPagination(data.pagination || null);
            setSummaryData(data.summary || summary);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, hazardFilter, riskFilter, sortKey, sortDir, summary]);

    React.useEffect(() => {
        const timer = setTimeout(() => fetchProfiles(1), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, hazardFilter, riskFilter, sortKey, sortDir, fetchProfiles]);

    const stats = summaryData || summary || {};

    const handleDelete = async (profile) => {
        const result = await Swal.fire({
            title: 'Delete Hazard Assessment?',
            text: `Remove "${profile.barangay_name}" and all hazard records?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!result.isConfirmed) return;

        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/hazard-assessment-profiles/${profile.id}`;
        ['_token', '_method'].forEach((name, i) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = i === 0 ? csrf : 'DELETE';
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    };

    const columns = [
        { key: 'barangay_name', label: 'Barangay', sortable: true, render: (r) => <span className="font-medium text-slate-900">{r.barangay_name}</span> },
        { key: 'municipality_city', label: 'Municipality', sortable: true, render: (r) => r.municipality_city || '—' },
        { key: 'province', label: 'Province', sortable: true, render: (r) => r.province || '—' },
        { key: 'hazard_types', label: 'Hazards', sortable: false, render: (r) => <HazardTypesCell row={r} /> },
        { key: 'highest_risk_hazard', label: 'Highest Risk Hazard', sortable: false, render: (r) => (
            r.highest_risk_hazard
                ? <HazardTypeBadge type={r.highest_risk_hazard} />
                : <span className="text-slate-400">—</span>
        ) },
        { key: 'highest_risk_level', label: 'Highest Risk Level', sortable: false, render: (r) => <RiskBadge level={r.highest_risk_level} /> },
        { key: 'highest_risk_score', label: 'Risk Score', sortable: false, render: (r) => (r.highest_risk_score != null ? `${r.highest_risk_score}%` : '—') },
        { key: 'source_agencies', label: 'Source Agencies', sortable: false, render: (r) => <SourceAgenciesCell row={r} labels={labels} /> },
        { key: 'last_assessed_at', label: 'Last Updated', sortable: true, render: (r) => formatDate(r.last_assessed_at || r.updated_at) },
    ];

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={AlertTriangle}
                title="Hazard Assessment Profile"
                description="Central master data for hazard intelligence, AI scenarios, simulation planning, and participant location linkage."
                actions={
                    <AdminPrimaryButton href="/admin/hazard-assessment-profiles/create">
                        <Plus className="w-4 h-4" />
                        Create Profile
                    </AdminPrimaryButton>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryCard label="Total Barangays" value={stats.total_barangays ?? 0} />
                <SummaryCard label="High Risk" value={stats.high_risk_barangays ?? 0} accent="rose" />
                <SummaryCard label="Flood Prone" value={stats.flood_prone ?? 0} accent="blue" />
                <SummaryCard label="Fire Prone" value={stats.fire_prone ?? 0} accent="amber" />
                <SummaryCard label="Earthquake Prone" value={stats.earthquake_prone ?? 0} accent="orange" />
                <SummaryCard label="Avg Risk Score" value={stats.average_risk_score != null ? `${stats.average_risk_score}%` : '—'} accent="slate" />
            </div>

            <AdminFilterBar>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <AdminSearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search barangay, municipality, province, or region..."
                    />
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select value={hazardFilter} onChange={(e) => setHazardFilter(e.target.value)} className={adminSelectClass}>
                            <option value="all">All Hazards</option>
                            {hazardTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className={adminSelectClass}>
                            <option value="all">All Risk Levels</option>
                            {riskLevels.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </AdminFilterBar>

            <AdminDataTable
                columns={columns}
                data={profilesData}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={(page) => fetchProfiles(page)}
                minWidth="1280px"
                emptyTitle="No hazard assessment profiles"
                emptyDescription="Create a profile to record official hazard data for your barangays."
                renderActions={(row) => (
                    <>
                        <AdminTableActionButton href={`/admin/hazard-assessment-profiles/${row.id}`} icon={Eye} title="View" variant="view" />
                        <AdminTableActionButton href={`/admin/hazard-assessment-profiles/${row.id}/edit`} icon={Pencil} title="Edit" variant="edit" />
                        <AdminTableActionButton onClick={() => handleDelete(row)} icon={Trash2} title="Delete" variant="danger" />
                    </>
                )}
            />
        </AdminPageShell>
    );
}

function SummaryCard({ label, value, accent = 'slate' }) {
    const colors = {
        slate: 'border-slate-200',
        rose: 'border-rose-200',
        blue: 'border-blue-200',
        amber: 'border-amber-200',
        orange: 'border-orange-200',
    };
    return (
        <div className={`bg-white rounded-xl border ${colors[accent]} shadow-sm p-4`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
    );
}

export function HazardAssessmentDetail({ profile, intelligence = null }) {
    const hazards = getHazardRecords(profile);
    const documents = profile?.documents || [];
    const intel = intelligence || {};
    const recommendations = intel.recommended_training_modules || [];
    const scenarios = intel.suggested_scenarios || [];

    return (
        <AdminPageShell>
            <a href="/admin/hazard-assessment-profiles" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
                <ChevronLeft className="w-4 h-4" /> Back to Hazard Assessment Profiles
            </a>

            <AdminPageHeader
                icon={MapPin}
                title={profile?.barangay_name}
                description={`${profile?.municipality_city}, ${profile?.province}${profile?.region ? ` — ${profile.region}` : ''}`}
                actions={
                    <AdminPrimaryButton href={`/admin/hazard-assessment-profiles/${profile.id}/edit`}>
                        <Pencil className="w-4 h-4" /> Edit Profile
                    </AdminPrimaryButton>
                }
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {hazards.map((h) => (
                    <HazardTypeBadge key={h.id || h.hazard_type} type={h.hazard_type} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <section className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">General Information</h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <DetailField label="Region" value={profile?.region || '—'} />
                            <DetailField label="Province" value={profile?.province || '—'} />
                            <DetailField label="Municipality" value={profile?.municipality_city || '—'} />
                            <DetailField label="Barangay" value={profile?.barangay_name || '—'} />
                            <DetailField label="Last Assessed" value={formatDate(profile?.last_assessed_at)} />
                            <DetailField label="Complete Barangay Address" value={profile?.barangay_address || '—'} className="col-span-2" />
                        </dl>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Hazard Records</h3>
                        {hazards.length === 0 ? (
                            <p className="text-sm text-slate-500">No hazard records documented yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {hazards.map((h) => (
                                    <div key={h.id || h.hazard_type} className="rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <HazardTypeBadge type={h.hazard_type} />
                                                    <AgencyBadge agency={h.source_agency} />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Assessed: {formatDate(h.date_assessed)} · Updated: {formatDate(h.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <RiskScoreBar score={h.risk_score} level={h.risk_level} />
                                        {h.description && <p className="text-sm text-slate-600 mt-3">{h.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {documents.length > 0 && (
                        <section className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Supporting Documents</h3>
                            <ul className="divide-y divide-slate-100">
                                {documents.map((doc) => (
                                    <li key={doc.id} className="py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{doc.original_filename}</p>
                                                <p className="text-xs text-slate-500">{doc.document_type}</p>
                                            </div>
                                        </div>
                                        <a href={`/admin/hazard-assessment-profiles/${profile.id}/documents/${doc.id}/download`} className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 shrink-0">
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <div className="space-y-4">
                    <section className="bg-white rounded-xl border border-emerald-200 p-5">
                        <h3 className="text-sm font-semibold text-emerald-800 mb-3">Recommended Training</h3>
                        {recommendations.length === 0 ? (
                            <p className="text-sm text-slate-500">Add hazard records to receive training recommendations.</p>
                        ) : (
                            <ul className="space-y-2">
                                {recommendations.map((m) => (
                                    <li key={m.id} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-slate-900">{m.title}</p>
                                            <p className="text-xs text-slate-500">Based on {m.reason}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {scenarios.length > 0 && (
                        <section className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Suggested Scenarios</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                {scenarios.map((s, i) => (
                                    <li key={i} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <HazardTypeBadge type={s.hazard_type} />
                                            <RiskBadge level={s.risk_level} />
                                        </div>
                                        <p className="text-xs mt-1">{s.scenario}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
}

function DetailField({ label, value, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-xs font-semibold text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-slate-900">{value}</dd>
        </div>
    );
}

function emptyHazard(options) {
    const defaultScores = { Low: 25, Moderate: 50, High: 75, 'Very High': 95 };
    const level = 'Moderate';
    return {
        hazard_type: options.hazard_types?.[0] || 'Flood',
        risk_level: level,
        risk_score: defaultScores[level] || 50,
        description: '',
        source_agency: options.source_agencies?.[0] || 'MDRRMO',
        date_assessed: new Date().toISOString().slice(0, 10),
    };
}

export function HazardAssessmentForm({ profile = null, options = {} }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const isEditing = !!profile;
    const existingHazards = getHazardRecords(profile);

    const [hazards, setHazards] = React.useState(
        existingHazards.length > 0
            ? existingHazards.map((h) => ({
                hazard_type: h.hazard_type,
                risk_level: h.risk_level,
                risk_score: h.risk_score,
                description: h.description || '',
                source_agency: h.source_agency,
                date_assessed: h.date_assessed ? String(h.date_assessed).slice(0, 10) : '',
            }))
            : [emptyHazard(options)],
    );

    const [docFiles, setDocFiles] = React.useState([]);
    const [docTypes, setDocTypes] = React.useState([]);
    const defaultScores = { Low: 25, Moderate: 50, High: 75, 'Very High': 95 };

    const updateHazard = (index, field, value) => {
        setHazards((prev) => prev.map((h, i) => {
            if (i !== index) return h;
            const updated = { ...h, [field]: value };
            if (field === 'risk_level' && defaultScores[value]) {
                updated.risk_score = defaultScores[value];
            }
            return updated;
        }));
    };

    const addHazard = () => setHazards((prev) => [...prev, emptyHazard(options)]);
    const removeHazard = (index) => setHazards((prev) => prev.filter((_, i) => i !== index));

    return (
        <AdminPageShell>
            <a href="/admin/hazard-assessment-profiles" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
                <ChevronLeft className="w-4 h-4" /> Back to Hazard Assessment Profiles
            </a>

            <AdminPageHeader
                icon={AlertTriangle}
                title={isEditing ? 'Edit Hazard Assessment Profile' : 'Create Hazard Assessment Profile'}
                description="Select the official barangay location and record all identified hazard types."
            />

            <form
                method="POST"
                action={isEditing ? `/admin/hazard-assessment-profiles/${profile.id}` : '/admin/hazard-assessment-profiles'}
                encType="multipart/form-data"
                className="space-y-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                {isEditing && <input type="hidden" name="_method" value="PUT" />}

                <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800">Location</h3>
                    <p className="text-xs text-slate-500">Select a Quezon City barangay. Region, province, and city are fixed; the complete address is generated automatically.</p>
                    <PhilippineLocationSelect
                        initialBarangayId={profile?.philippine_barangay_id || ''}
                        apiBase="/admin/api/locations"
                    />
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Hazard Records (multiple per barangay)</h3>
                        <AdminSecondaryButton type="button" onClick={addHazard}><Plus className="w-4 h-4" /> Add Hazard</AdminSecondaryButton>
                    </div>

                    {hazards.map((hazard, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-700">Hazard #{index + 1}</p>
                                {hazards.length > 1 && (
                                    <button type="button" onClick={() => removeHazard(index)} className="text-xs text-rose-600 hover:text-rose-700">Remove</button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hazard Type</label>
                                    <select name={`hazards[${index}][hazard_type]`} value={hazard.hazard_type} onChange={(e) => updateHazard(index, 'hazard_type', e.target.value)} className={adminSelectClass}>
                                        {(options.hazard_types || []).map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Risk Level</label>
                                    <select name={`hazards[${index}][risk_level]`} value={hazard.risk_level} onChange={(e) => updateHazard(index, 'risk_level', e.target.value)} className={adminSelectClass}>
                                        {(options.risk_levels || []).map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Risk Score (%)</label>
                                    <input type="number" min="0" max="100" name={`hazards[${index}][risk_score]`} value={hazard.risk_score} onChange={(e) => updateHazard(index, 'risk_score', e.target.value)} className={adminCompactInputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Source Agency</label>
                                    <select name={`hazards[${index}][source_agency]`} value={hazard.source_agency} onChange={(e) => updateHazard(index, 'source_agency', e.target.value)} className={adminSelectClass}>
                                        {(options.source_agencies || []).map((t) => <option key={t} value={t}>{options.source_agency_labels?.[t] || t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date Assessed</label>
                                    <input type="date" name={`hazards[${index}][date_assessed]`} value={hazard.date_assessed} onChange={(e) => updateHazard(index, 'date_assessed', e.target.value)} className={adminCompactInputClass} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hazard Description</label>
                                    <textarea name={`hazards[${index}][description]`} rows={2} value={hazard.description} onChange={(e) => updateHazard(index, 'description', e.target.value)} className={adminCompactInputClass} />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Supporting Documents</h3>
                    <input
                        type="file"
                        name="documents[]"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setDocFiles(files);
                            setDocTypes(files.map(() => options.document_types?.[0] || 'Other'));
                        }}
                        className="block w-full text-sm text-slate-600"
                    />
                    {docFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
                            <select name={`document_types[${i}]`} value={docTypes[i]} onChange={(e) => setDocTypes((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))} className={adminSelectClass}>
                                {(options.document_types || []).map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    ))}
                </section>

                <div className="flex gap-3">
                    <AdminPrimaryButton type="submit">{isEditing ? 'Save Changes' : 'Create Profile'}</AdminPrimaryButton>
                    <AdminSecondaryButton href="/admin/hazard-assessment-profiles">Cancel</AdminSecondaryButton>
                </div>
            </form>
        </AdminPageShell>
    );
}

function FormField({ label, name, required = false, type = 'text', defaultValue, step }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
                {label}{required && <span className="text-rose-500"> *</span>}
            </label>
            <input type={type} name={name} required={required} defaultValue={defaultValue ?? ''} step={step} className={adminCompactInputClass} />
        </div>
    );
}

/** Panel for simulation event planning and AI scenario generation */
export function HazardAssessmentIntelligencePanel({ barangayProfileId }) {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!barangayProfileId) {
            setData(null);
            return;
        }
        setLoading(true);
        fetch(`/admin/hazard-assessment-profiles/${barangayProfileId}/intelligence`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [barangayProfileId]);

    if (!barangayProfileId) return null;
    if (loading) return <div className="text-sm text-slate-500 p-4">Loading hazard intelligence...</div>;
    if (!data?.profile) return null;

    const p = data.profile;
    const hazards = p.hazards || [];

    return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-emerald-900">Hazard Intelligence — {p.barangay_name}</h4>

            <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Detected Hazards</p>
                <div className="flex flex-wrap gap-1.5">
                    {hazards.map((h) => (
                        <HazardTypeBadge key={h.hazard_type} type={h.hazard_type} />
                    ))}
                </div>
            </div>

            {data.recommended_scenario && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Recommended Scenario</p>
                    <p className="text-sm text-slate-800">{data.recommended_scenario.scenario}</p>
                </div>
            )}

            {data.suggested_equipment?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Suggested Equipment</p>
                    <p className="text-sm text-slate-700">{data.suggested_equipment.join(', ')}</p>
                </div>
            )}

            {data.suggested_participants?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Suggested Participants</p>
                    <p className="text-sm text-slate-700">{data.suggested_participants.join(', ')}</p>
                </div>
            )}

            {data.suggested_trainers?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Suggested Trainers</p>
                    <ul className="text-sm space-y-1">
                        {data.suggested_trainers.map((t) => (
                            <li key={t.id} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {t.name}{t.specialization ? ` (${t.specialization})` : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.recommended_training_modules?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Recommended Training</p>
                    <ul className="text-sm space-y-1">
                        {data.recommended_training_modules.map((m) => (
                            <li key={m.id}>{m.title}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
