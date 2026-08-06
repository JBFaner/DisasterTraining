import React from 'react';
import Chart from 'react-apexcharts';
import {
    AlertTriangle,
    Award,
    BookOpen,
    CalendarClock,
    ClipboardCheck,
    LayoutDashboard,
    MapPin,
    Play,
    Plus,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '../components/admin/AdminLayout';
import {
    auditLogsIndex,
    certificationIndex,
    evaluationsIndexWithFocus,
    hazardAssessmentProfileIndex,
    participantsIndex,
    simulationEventCreate,
    simulationEventsIndex,
} from '../utils/portalRoutes';

function formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const EMERALD = '#059669';
const EMERALD_SOFT = '#34D399';
const AMBER = '#F59E0B';
const SKY = '#0EA5E9';
const SLATE = '#64748B';
const CHART_COLORS = [EMERALD, SKY, AMBER, '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function KpiCard({ label, value, hint, href, Icon, iconClass = 'bg-emerald-50 text-emerald-700' }) {
    const body = (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md h-full">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
                </div>
                <div className={`rounded-xl p-2.5 shrink-0 ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
    return href ? <a href={href} className="block">{body}</a> : body;
}

function ChartCard({ title, subtitle, badge, children, emptyMessage, hasData = true }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
                </div>
                {badge ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{badge}</span>
                ) : null}
            </div>
            <div className="px-3 pb-3 pt-3 sm:px-4">
                {hasData ? children : (
                    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center text-sm text-slate-500">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

function PanelCard({ title, action, children, className = '' }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

function statusTone(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'ended') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'ongoing' || s === 'published') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (s === 'ready') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'pending' || s === 'in_progress') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
}

function readinessTone(tone) {
    const map = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        rose: 'bg-rose-50 text-rose-700 border-rose-200',
        sky: 'bg-sky-50 text-sky-700 border-sky-200',
        slate: 'bg-slate-50 text-slate-600 border-slate-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return map[tone] || map.slate;
}

export function AdminDashboardOverview({
    events = [],
    role,
    dashboardStats = {},
    dashboardCharts = {},
    dashboardExtras = {},
    hazardAnalytics = {},
}) {
    const stats = dashboardStats || {};
    const charts = dashboardCharts || {};
    const extras = dashboardExtras || {};
    const hazard = hazardAnalytics || {};
    const trends = extras.trends || {};
    const trainingModules = extras.training_modules || {};
    const campaignPipeline = extras.campaign_pipeline || {};
    const recentActivity = extras.recent_activity || [];

    const activeEvents = stats.active_events ?? 0;
    const upcomingEvents = stats.upcoming_events ?? 0;
    const totalParticipants = stats.total_participants ?? 0;
    const certificatesCount = stats.certificates_count ?? 0;
    const eventsStartingToday = stats.events_starting_today ?? 0;
    const pendingEvaluations = stats.pending_evaluations_count ?? 0;
    const pendingCertificates = stats.pending_certificates_count ?? 0;
    const averageScore = stats.average_score;
    const passRate = stats.pass_rate;
    const attendanceRate = stats.attendance_rate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const eventDateStr = (e) => {
        const d = e.event_date;
        return !d ? null : typeof d === 'string' ? d : (d.date || d);
    };
    const eventDate = (e) => {
        const str = eventDateStr(e);
        return str ? new Date(str) : null;
    };

    const weekDrills = (events || []).filter((e) => {
        const d = eventDate(e);
        return d && d >= today && d <= thisWeekEnd && ['published', 'ongoing', 'scheduled'].includes(e.status);
    }).slice(0, 5);

    const recentCompleted = (events || [])
        .filter((e) => {
            if (e.status !== 'completed') return false;
            const d = eventDate(e);
            return d && d >= weekAgo;
        })
        .slice(0, 5);

    const monthLabels = charts.drills_per_month?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const drillsData = charts.drills_per_month?.data || Array(12).fill(0);
    const drillsTotal = drillsData.reduce((sum, n) => sum + (Number(n) || 0), 0);

    const disasterLabels = charts.disaster_distribution?.labels || [];
    const disasterData = charts.disaster_distribution?.data || [];
    const disasterTotal = disasterData.reduce((sum, n) => sum + (Number(n) || 0), 0);

    const evalLabels = charts.evaluation_status?.labels || ['Evaluated', 'Not evaluated'];
    const evalData = charts.evaluation_status?.data || [0, 0];
    const evalTotal = evalData.reduce((sum, n) => sum + (Number(n) || 0), 0);

    const performanceData = (charts.performance_trend?.data || []).map((v) => (v == null ? 0 : Number(v)));
    const performanceHasData = performanceData.some((v) => v > 0);

    const attentionItems = [];
    if (eventsStartingToday > 0) {
        attentionItems.push({
            severity: 'critical',
            href: simulationEventsIndex(role),
            label: `${eventsStartingToday} event${eventsStartingToday !== 1 ? 's' : ''} starting today`,
        });
    }
    if (pendingEvaluations > 0) {
        attentionItems.push({
            severity: 'warning',
            href: evaluationsIndexWithFocus(role, 'pending'),
            label: `${pendingEvaluations} pending evaluation${pendingEvaluations !== 1 ? 's' : ''}`,
        });
    }
    if (pendingCertificates > 0) {
        attentionItems.push({
            severity: 'warning',
            href: `${certificationIndex(role)}?tab=eligible`,
            label: `${pendingCertificates} certificate${pendingCertificates !== 1 ? 's' : ''} ready to issue`,
        });
    }
    if ((campaignPipeline.pending_review_count || 0) > 0) {
        attentionItems.push({
            severity: 'info',
            href: '/admin/training-modules',
            label: `${campaignPipeline.pending_review_count} campaign request${campaignPipeline.pending_review_count !== 1 ? 's' : ''} awaiting review`,
        });
    }

    const severityStyles = {
        critical: 'border-rose-200 bg-rose-50/80 text-rose-800',
        warning: 'border-amber-200 bg-amber-50/80 text-amber-900',
        info: 'border-sky-200 bg-sky-50/80 text-sky-900',
    };

    const baseChartOptions = {
        chart: { fontFamily: 'inherit', toolbar: { show: false } },
    };

    const drillsBarOptions = {
        ...baseChartOptions,
        chart: {
            ...baseChartOptions.chart,
            type: 'bar',
            height: 320,
            animations: { enabled: true, speed: 700 },
        },
        colors: [EMERALD],
        plotOptions: {
            bar: { horizontal: false, columnWidth: '58%', borderRadius: 6, borderRadiusApplication: 'end' },
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        grid: { borderColor: '#e2e8f0', padding: { left: 8, right: 8 } },
        xaxis: {
            categories: monthLabels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: SLATE, fontSize: '12px' } },
        },
        yaxis: {
            labels: { style: { colors: SLATE, fontSize: '12px' }, formatter: (v) => Math.round(v) },
            title: { text: 'Drills', style: { color: SLATE, fontSize: '12px', fontWeight: 500 } },
        },
        tooltip: { y: { formatter: (val) => `${val} drill${val === 1 ? '' : 's'}` } },
        legend: { show: false },
    };

    const disasterDonutOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'donut', height: 320 },
        colors: CHART_COLORS,
        labels: disasterLabels,
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontSize: '12px' },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Events',
                            formatter: () => String(disasterTotal),
                        },
                    },
                },
            },
        },
    };

    const evalDonutOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'donut', height: 280 },
        colors: [EMERALD_SOFT, AMBER],
        labels: evalLabels,
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontSize: '12px' },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Present',
                            formatter: () => String(evalTotal),
                        },
                    },
                },
            },
        },
    };

    const performanceAreaOptions = {
        ...baseChartOptions,
        chart: {
            ...baseChartOptions.chart,
            type: 'area',
            height: 280,
            zoom: { enabled: false },
        },
        colors: [EMERALD],
        stroke: { width: 3, curve: 'smooth' },
        markers: { size: 4 },
        fill: {
            type: 'gradient',
            gradient: { opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 60, 100] },
        },
        dataLabels: { enabled: false },
        grid: { borderColor: '#e2e8f0' },
        xaxis: {
            categories: charts.performance_trend?.labels || monthLabels,
            labels: { style: { colors: SLATE, fontSize: '12px' } },
        },
        yaxis: {
            min: 0,
            max: 100,
            labels: { style: { colors: SLATE, fontSize: '12px' }, formatter: (v) => `${Math.round(v)}%` },
        },
        tooltip: { y: { formatter: (val) => `${val}%` } },
        legend: { show: false },
    };

    const approvedSchedules = campaignPipeline.approved_schedules || [];
    const hazardHasData = (hazard.total_barangays || 0) > 0;

    return (
        <AdminPageShell className="pb-8">
            <AdminPageHeader
                icon={LayoutDashboard}
                title="Dashboard"
                description="Operations overview for drills, campaigns, scoring, hazards, and participants."
                actions={(
                    <>
                        <AdminSecondaryButton href={simulationEventsIndex(role)}>
                            View Events
                        </AdminSecondaryButton>
                        <AdminPrimaryButton href={simulationEventCreate()}>
                            <Plus className="h-4 w-4" />
                            Plan Event
                        </AdminPrimaryButton>
                    </>
                )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <KpiCard label="Ongoing Events" value={activeEvents} hint={upcomingEvents > 0 ? `${upcomingEvents} upcoming` : 'Live operations'} Icon={Play} href={simulationEventsIndex(role)} iconClass="bg-emerald-50 text-emerald-700" />
                <KpiCard label="Events Today" value={eventsStartingToday} hint="Starting today" Icon={CalendarClock} href={simulationEventsIndex(role)} iconClass="bg-sky-50 text-sky-700" />
                <KpiCard label="Pending Evaluations" value={pendingEvaluations} hint={pendingEvaluations > 0 ? 'Needs scoring' : 'All clear'} Icon={ClipboardCheck} href={evaluationsIndexWithFocus(role, 'pending')} iconClass="bg-amber-50 text-amber-700" />
                <KpiCard label="Pending Certificates" value={pendingCertificates} hint={pendingCertificates > 0 ? 'Ready to issue' : 'All issued'} Icon={Award} href={`${certificationIndex(role)}?tab=eligible`} iconClass="bg-teal-50 text-teal-700" />
                <KpiCard label="Active Participants" value={totalParticipants} hint="Registered trainees" Icon={Users} href={participantsIndex()} iconClass="bg-slate-100 text-slate-700" />
                <KpiCard label="Certificates Issued" value={certificatesCount} hint={trends.certificates_this_week ? `${trends.certificates_this_week} this week` : 'All time'} Icon={Award} href={certificationIndex(role)} iconClass="bg-emerald-50 text-emerald-700" />
            </div>

            {attentionItems.length > 0 && (
                <PanelCard
                    title="Needs attention"
                    className="border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white"
                    action={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                >
                    <ul className="space-y-2 p-4">
                        {attentionItems.map((item) => (
                            <li key={item.href + item.label}>
                                <a href={item.href} className={`block rounded-xl border px-3 py-2.5 text-sm font-medium transition hover:shadow-sm ${severityStyles[item.severity]}`}>
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </PanelCard>
            )}

            {hazardHasData && (
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/70 via-white to-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Hazard intelligence</p>
                                <h2 className="text-lg font-bold text-slate-900">Community risk snapshot</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    {hazard.total_barangays} barangay profile{hazard.total_barangays === 1 ? '' : 's'} assessed
                                    {hazard.high_risk_barangays ? ` · ${hazard.high_risk_barangays} high risk` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
                            {[
                                { label: 'Flood prone', value: hazard.flood_prone ?? 0 },
                                { label: 'Fire prone', value: hazard.fire_prone ?? 0 },
                                { label: 'Earthquake prone', value: hazard.earthquake_prone ?? 0 },
                                { label: 'Avg risk score', value: hazard.average_risk_score ?? 0 },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-center">
                                    <p className="text-lg font-bold text-slate-900">{item.value}</p>
                                    <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <a href={hazardAssessmentProfileIndex()} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                            Open hazard profiles
                        </a>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <KpiCard label="Average Score" value={averageScore != null ? `${averageScore}%` : '—'} hint={trends.average_score_hint || 'Submitted drill evaluations'} Icon={TrendingUp} href="/admin/evaluations?tab=events" iconClass="bg-emerald-50 text-emerald-700" />
                <KpiCard label="Pass Rate" value={passRate != null ? `${passRate}%` : '—'} hint={trends.pass_rate_hint || 'Passed vs submitted'} Icon={TrendingUp} href="/admin/evaluations?tab=overall" iconClass="bg-teal-50 text-teal-700" />
                <KpiCard label="Attendance Rate" value={attendanceRate != null ? `${attendanceRate}%` : '—'} hint="Present vs marked attendance" Icon={TrendingUp} href={simulationEventsIndex(role)} iconClass="bg-slate-100 text-slate-700" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ChartCard title="Drills per month" subtitle="Current year simulation volume" badge={trends.drills_hint || 'This year'} hasData={drillsTotal > 0} emptyMessage="No drills recorded this year yet.">
                    <Chart options={drillsBarOptions} series={[{ name: 'Drills', data: drillsData }]} type="bar" height={320} width="100%" />
                </ChartCard>
                <ChartCard title="Disaster type mix" subtitle="Events grouped by hazard type" hasData={disasterTotal > 0} emptyMessage="No disaster-type data yet. Tag events with a hazard category.">
                    <Chart options={disasterDonutOptions} series={disasterData} type="donut" height={320} width="100%" />
                </ChartCard>
                <ChartCard title="Evaluation coverage" subtitle="Present attendees who have been scored" hasData={evalTotal > 0} emptyMessage="No attendance/evaluation records yet.">
                    <Chart options={evalDonutOptions} series={evalData} type="donut" height={280} width="100%" />
                    <div className="mt-2 grid grid-cols-2 gap-2 px-2 text-center text-xs text-slate-600">
                        {evalLabels.map((label, i) => (
                            <div key={label} className="rounded-lg bg-slate-50 px-2 py-2">
                                <p className="font-semibold text-slate-900">{evalData[i] ?? 0}</p>
                                <p>{label}</p>
                            </div>
                        ))}
                    </div>
                </ChartCard>
                <ChartCard title="Performance trend" subtitle="Average evaluation score by month" badge="Monthly" hasData={performanceHasData} emptyMessage="No submitted evaluations this year yet.">
                    <Chart options={performanceAreaOptions} series={[{ name: 'Average score', data: performanceData }]} type="area" height={280} width="100%" />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <PanelCard
                    title="This week"
                    action={<a href={simulationEventsIndex(role)} className="text-xs font-semibold text-emerald-700 hover:underline">View all</a>}
                >
                    <ul className="space-y-2 p-4">
                        {weekDrills.length > 0 ? weekDrills.map((e) => (
                            <li key={e.id}>
                                <a href={`/admin/simulation-events/${e.id}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(eventDateStr(e))}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(e.status)}`}>{e.status}</span>
                                </a>
                            </li>
                        )) : (
                            <li className="text-sm text-slate-500">No drills scheduled in the next 7 days.</li>
                        )}
                    </ul>
                </PanelCard>

                <PanelCard
                    title="Campaign pipeline"
                    action={<a href="/admin/training-modules" className="text-xs font-semibold text-emerald-700 hover:underline">Training modules</a>}
                >
                    <div className="space-y-3 p-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <p className="text-lg font-bold text-slate-900">{campaignPipeline.pending_review_count ?? 0}</p>
                                <p className="text-xs text-slate-500">Pending review</p>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <p className="text-lg font-bold text-slate-900">{approvedSchedules.length}</p>
                                <p className="text-xs text-slate-500">Approved schedules</p>
                            </div>
                        </div>
                        {approvedSchedules.length > 0 ? (
                            <ul className="space-y-2">
                                {approvedSchedules.map((schedule) => (
                                    <li key={schedule.campaign_request_id || schedule.campaign_id}>
                                        <a href={schedule.planning_href || `/admin/simulation-planning/${schedule.campaign_request_id}`} className="block rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-900">{schedule.campaign_title || schedule.training_title}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">{schedule.recommended_community || schedule.disaster_type || 'Approved campaign'}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${readinessTone(schedule.simulation_readiness_tone)}`}>
                                                    {schedule.simulation_readiness_label || 'Planning'}
                                                </span>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">No approved campaign schedules yet.</p>
                        )}
                    </div>
                </PanelCard>

                <PanelCard title="Training content">
                    <div className="space-y-3 p-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                                <p className="text-lg font-bold text-slate-900">{trainingModules.published ?? 0}</p>
                                <p className="text-xs text-slate-500">Published</p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
                                <p className="text-lg font-bold text-slate-900">{trainingModules.draft ?? 0}</p>
                                <p className="text-xs text-slate-500">Draft</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href="/admin/training-modules" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <BookOpen className="h-4 w-4" />
                                Manage modules
                            </a>
                            <a href="/admin/training-modules/create" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                                <Plus className="h-4 w-4" />
                                Create module
                            </a>
                        </div>
                        <p className="text-xs text-slate-500">{trainingModules.total ?? 0} total modules · {trainingModules.archived ?? 0} archived</p>
                    </div>
                </PanelCard>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <PanelCard title="Recent completed" action={<span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Last 7 days</span>}>
                    <ul className="space-y-2 p-4">
                        {recentCompleted.length > 0 ? recentCompleted.map((e) => (
                            <li key={e.id}>
                                <a href={`/admin/simulation-events/${e.id}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(eventDateStr(e))} · {e.disaster_type || e.event_category || 'Drill'}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone('completed')}`}>Completed</span>
                                </a>
                            </li>
                        )) : (
                            <li className="text-sm text-slate-500">No events completed in the last 7 days.</li>
                        )}
                    </ul>
                </PanelCard>

                <PanelCard title="Recent activity" action={<a href={auditLogsIndex()} className="text-xs font-semibold text-emerald-700 hover:underline">Audit logs</a>}>
                    <ul className="space-y-2 p-4">
                        {recentActivity.length > 0 ? recentActivity.map((log) => (
                            <li key={log.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                                <p className="text-sm font-medium text-slate-900">{log.description || log.action}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {[log.user_name, log.module, formatDateTime(log.performed_at)].filter(Boolean).join(' · ')}
                                </p>
                            </li>
                        )) : (
                            <li className="text-sm text-slate-500">No recent audit activity recorded.</li>
                        )}
                    </ul>
                </PanelCard>
            </div>
        </AdminPageShell>
    );
}
