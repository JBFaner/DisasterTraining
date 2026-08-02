import React from 'react';
import Chart from 'react-apexcharts';
import {
    AlertTriangle,
    CalendarClock,
    ClipboardCheck,
    Play,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    participantsIndex,
    simulationEventsIndex,
} from '../utils/portalRoutes';

function formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMERALD = '#059669';
const EMERALD_SOFT = '#34D399';
const AMBER = '#F59E0B';
const SKY = '#0EA5E9';
const SLATE = '#64748B';

/**
 * InApp-inspired admin dashboard (ThemeWagon InApp / ApexCharts),
 * recolored to the ALERtARA emerald system palette.
 * Chart patterns follow src/assets/js/chart.js from the InApp template.
 */
export function AdminDashboardOverview({
    events = [],
    participants = [],
    role,
    dashboardStats = {},
    dashboardCharts = {},
}) {
    const stats = dashboardStats || {};
    const charts = dashboardCharts || {};
    const activeEvents = stats.active_events ?? 0;
    const upcomingEvents = stats.upcoming_events ?? 0;
    const totalParticipants = stats.total_participants ?? (participants?.length || 0);
    const certificatesCount = stats.certificates_count ?? 0;
    const eventsStartingToday = stats.events_starting_today ?? 0;
    const pendingEvaluations = stats.pending_evaluations_count ?? 0;
    const pendingCertificates = stats.pending_certificates_count ?? 0;
    const averageScore = stats.average_score;
    const passRate = stats.pass_rate;
    const attendanceRate = stats.attendance_rate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateStr = (e) => {
        const d = e.event_date;
        return !d ? null : typeof d === 'string' ? d : (d.date || d);
    };
    const eventDate = (e) => {
        const str = eventDateStr(e);
        return str ? new Date(str) : null;
    };
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const weekDrills = (events || []).filter((e) => {
        const d = eventDate(e);
        return d && d >= today && d <= thisWeekEnd && ['published', 'ongoing', 'scheduled'].includes(e.status);
    }).slice(0, 5);

    const recentCompleted = (events || [])
        .filter((e) => e.status === 'completed')
        .slice(0, 5);

    const monthLabels = charts.drills_per_month?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const drillsData = charts.drills_per_month?.data || Array(12).fill(0);
    const evalLabels = charts.evaluation_status?.labels || ['Evaluated', 'Not evaluated'];
    const evalData = charts.evaluation_status?.data || [0, 0];
    const evalTotal = evalData.reduce((sum, n) => sum + (Number(n) || 0), 0) || 1;
    const evalPercents = evalData.map((n) => Math.round(((Number(n) || 0) / evalTotal) * 100));

    const performanceData = (charts.performance_trend?.data || []).map((v) => (v == null ? 0 : Number(v)));

    const drillsBarOptions = {
        chart: {
            type: 'bar',
            height: 350,
            parentHeightOffset: 0,
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 120 },
                dynamicAnimation: { enabled: true, speed: 350 },
            },
            fontFamily: 'inherit',
        },
        colors: [EMERALD],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '58%',
                borderRadius: 6,
                borderRadiusApplication: 'end',
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        grid: {
            show: true,
            borderColor: '#e2e8f0',
            strokeDashArray: 0,
            padding: { left: 8, right: 8 },
        },
        xaxis: {
            categories: monthLabels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: SLATE, fontSize: '12px' } },
        },
        yaxis: {
            labels: {
                style: { colors: SLATE, fontSize: '12px' },
                formatter: (v) => Math.round(v),
            },
            title: { text: 'Drills', style: { color: SLATE, fontSize: '12px', fontWeight: 500 } },
        },
        fill: { opacity: 1 },
        tooltip: {
            y: { formatter: (val) => `${val} drill${val === 1 ? '' : 's'}` },
        },
        legend: { show: false },
    };

    const drillsBarSeries = [{ name: 'Drills', data: drillsData }];

    const evalRadialOptions = {
        chart: {
            type: 'radialBar',
            height: 280,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 900,
                animateGradually: { enabled: true, delay: 150 },
            },
            fontFamily: 'inherit',
        },
        colors: [EMERALD_SOFT, AMBER],
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 3,
                    size: '38%',
                    background: 'transparent',
                },
                track: {
                    background: '#f1f5f9',
                    strokeWidth: '45%',
                    margin: 6,
                },
                dataLabels: {
                    name: { fontSize: '13px', color: SLATE, offsetY: -4 },
                    value: {
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#0f172a',
                        formatter: (val) => `${Math.round(val)}%`,
                    },
                    total: {
                        show: true,
                        label: 'Scored',
                        fontSize: '12px',
                        color: SLATE,
                        formatter: () => `${evalPercents[0] ?? 0}%`,
                    },
                },
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                gradientToColors: [EMERALD, '#FBBF24'],
                stops: [0, 100],
            },
        },
        stroke: { lineCap: 'round' },
        labels: evalLabels,
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '12px',
            markers: { size: 6, shape: 'square' },
            itemMargin: { horizontal: 10, vertical: 4 },
        },
    };

    const performanceAreaOptions = {
        chart: {
            type: 'area',
            height: 300,
            zoom: { enabled: false },
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 850,
                animateGradually: { enabled: true, delay: 100 },
            },
            fontFamily: 'inherit',
        },
        colors: [EMERALD],
        stroke: { width: 3, curve: 'smooth' },
        markers: { size: 4, hover: { sizeOffset: 2 } },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 60, 100],
            },
        },
        dataLabels: { enabled: false },
        grid: { borderColor: '#e2e8f0' },
        xaxis: {
            categories: charts.performance_trend?.labels || monthLabels,
            tickPlacement: 'on',
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: SLATE, fontSize: '12px' } },
        },
        yaxis: {
            min: 0,
            max: 100,
            labels: {
                style: { colors: SLATE, fontSize: '12px' },
                formatter: (v) => `${Math.round(v)}%`,
            },
            title: { text: 'Avg score', style: { color: SLATE, fontSize: '12px', fontWeight: 500 } },
        },
        tooltip: {
            y: { formatter: (val) => `${val}%` },
        },
        legend: { show: false },
    };

    const performanceSeries = [{ name: 'Average score', data: performanceData }];

    const statusTone = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'completed' || s === 'ended') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (s === 'ongoing' || s === 'published') return 'bg-sky-50 text-sky-700 border-sky-200';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    const KpiTintCard = ({ label, value, hint, Icon, href, tint }) => {
        const tints = {
            emerald: {
                card: 'bg-emerald-50/80 border-emerald-200/70',
                icon: 'bg-emerald-600 text-white',
                hint: 'text-emerald-700',
            },
            sky: {
                card: 'bg-sky-50/80 border-sky-200/70',
                icon: 'bg-sky-500 text-white',
                hint: 'text-sky-700',
            },
            amber: {
                card: 'bg-amber-50/80 border-amber-200/70',
                icon: 'bg-amber-500 text-white',
                hint: 'text-amber-700',
            },
            slate: {
                card: 'bg-slate-50 border-slate-200/80',
                icon: 'bg-slate-700 text-white',
                hint: 'text-slate-600',
            },
        };
        const tone = tints[tint] || tints.emerald;
        const body = (
            <div className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.card}`}>
                <div className="flex gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${tone.icon}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-600">{label}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                        {hint ? <p className={`mt-1 text-xs font-medium ${tone.hint}`}>{hint}</p> : null}
                    </div>
                </div>
            </div>
        );
        return href ? <a href={href} className="block">{body}</a> : body;
    };

    const HighlightStat = ({ label, value, delta, href, iconBg }) => (
        <a
            href={href}
            className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                    <p className="mt-2 text-xs text-slate-500">{delta}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${iconBg || 'bg-emerald-50 text-emerald-700'}`}>
                    <TrendingUp className="h-5 w-5" />
                </div>
            </div>
            <span className="mt-4 inline-flex text-xs font-semibold text-emerald-700 group-hover:underline">View</span>
        </a>
    );

    const attentionItems = [];
    if (pendingEvaluations > 0) {
        attentionItems.push({ href: '/admin/evaluations', label: `${pendingEvaluations} pending evaluation${pendingEvaluations !== 1 ? 's' : ''}` });
    }
    if (pendingCertificates > 0) {
        attentionItems.push({ href: '/admin/certification', label: `${pendingCertificates} pending certificate${pendingCertificates !== 1 ? 's' : ''}` });
    }
    if (eventsStartingToday > 0) {
        attentionItems.push({ href: simulationEventsIndex(role), label: `${eventsStartingToday} event${eventsStartingToday !== 1 ? 's' : ''} starting today` });
    }

    return (
        <div className="space-y-5 pb-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">Operations overview for drills, scoring, and participants.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTintCard
                    label="Ongoing Events"
                    value={activeEvents}
                    hint={upcomingEvents > 0 ? `${upcomingEvents} upcoming` : 'Live operations'}
                    Icon={Play}
                    href={simulationEventsIndex(role)}
                    tint="emerald"
                />
                <KpiTintCard
                    label="Events Today"
                    value={eventsStartingToday}
                    hint="Starting today"
                    Icon={CalendarClock}
                    href={simulationEventsIndex(role)}
                    tint="sky"
                />
                <KpiTintCard
                    label="Pending Evaluations"
                    value={pendingEvaluations}
                    hint={pendingEvaluations > 0 ? 'Needs scoring' : 'All clear'}
                    Icon={ClipboardCheck}
                    href="/admin/evaluations"
                    tint="amber"
                />
                <KpiTintCard
                    label="Active Participants"
                    value={totalParticipants}
                    hint={certificatesCount > 0 ? `${certificatesCount} certificates` : 'Registered trainees'}
                    Icon={Users}
                    href={role !== 'PARTICIPANT' ? participantsIndex() : null}
                    tint="slate"
                />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <HighlightStat
                    label="Average Score"
                    value={averageScore != null ? `${averageScore}%` : '—'}
                    delta="+ from submitted drill evaluations"
                    href="/admin/evaluations?tab=events"
                    iconBg="bg-emerald-50 text-emerald-700"
                />
                <HighlightStat
                    label="Pass Rate"
                    value={passRate != null ? `${passRate}%` : '—'}
                    delta="Passed vs submitted"
                    href="/admin/evaluations?tab=overall"
                    iconBg="bg-teal-50 text-teal-700"
                />
                <HighlightStat
                    label="Attendance Rate"
                    value={attendanceRate != null ? `${attendanceRate}%` : '—'}
                    delta="Present vs marked attendance"
                    href={simulationEventsIndex(role)}
                    iconBg="bg-slate-100 text-slate-700"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-transparent px-5 py-3.5">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Drills per month</h2>
                            <p className="text-xs text-slate-500">Current year simulation volume</p>
                        </div>
                        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-[11px] font-semibold">
                            <span className="rounded-md bg-white px-2.5 py-1 text-emerald-700 shadow-sm">This year</span>
                        </div>
                    </div>
                    <div className="px-3 pb-2 pt-3 sm:px-4">
                        <Chart options={drillsBarOptions} series={drillsBarSeries} type="bar" height={350} width="100%" />
                    </div>
                </div>

                <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Evaluation status</h2>
                            <p className="text-xs text-slate-500">Present attendees vs scored</p>
                        </div>
                    </div>
                    <div className="px-3 py-4">
                        <Chart options={evalRadialOptions} series={evalPercents} type="radialBar" height={280} width="100%" />
                        <div className="mt-1 grid grid-cols-2 gap-2 px-2 text-center text-xs text-slate-600">
                            {evalLabels.map((label, i) => (
                                <div key={label} className="rounded-lg bg-slate-50 px-2 py-2">
                                    <p className="font-semibold text-slate-900">{evalData[i] ?? 0}</p>
                                    <p>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Performance trend</h2>
                        <p className="text-xs text-slate-500">Average evaluation score over time</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Monthly</span>
                </div>
                <div className="px-3 pb-2 pt-3 sm:px-4">
                    <Chart options={performanceAreaOptions} series={performanceSeries} type="area" height={300} width="100%" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <h2 className="text-base font-semibold text-slate-900">This week</h2>
                        <a href={simulationEventsIndex(role)} className="text-xs font-semibold text-emerald-700 hover:underline">View all</a>
                    </div>
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
                            <li className="text-sm text-slate-500">No drills in the next 7 days.</li>
                        )}
                    </ul>
                </div>

                <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 border-b border-amber-100/80 px-5 py-3.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <h2 className="text-base font-semibold text-slate-900">Needs attention</h2>
                    </div>
                    <ul className="space-y-2 p-4">
                        {attentionItems.length > 0 ? attentionItems.map((item) => (
                            <li key={item.href + item.label}>
                                <a href={item.href} className="block rounded-xl border border-amber-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
                                    {item.label}
                                </a>
                            </li>
                        )) : (
                            <li className="rounded-xl border border-emerald-100 bg-white/90 px-3 py-2.5 text-sm text-slate-500">
                                No pending items. You are clear.
                            </li>
                        )}
                    </ul>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                        <h2 className="text-base font-semibold text-slate-900">Recent completed</h2>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Weekly</span>
                    </div>
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
                            <li className="text-sm text-slate-500">No completed events yet.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
