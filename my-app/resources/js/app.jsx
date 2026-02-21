import React from 'react';
import ReactDOM from 'react-dom/client';
import './bootstrap';
import '../css/app.css';
import { SidebarLayout } from './components/SidebarLayout';
import { SessionTimeout } from './components/SessionTimeout';
import { ParticipantSimulationEventsList, ParticipantSimulationEventDetail } from './components/ParticipantSimulationEvents';
import { ResourceInventory } from './pages/ResourceInventory';
import { AuditLogs } from './pages/AuditLogs';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { UserDetailsPage } from './pages/UserDetailsPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { RoleEditPage } from './pages/RoleEditPage';
import { PermissionEditPage } from './pages/PermissionEditPage';
import { UserMonitoringPage } from './pages/UserMonitoringPage';
import * as Toast from '@radix-ui/react-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, X, Pencil, Send, Undo2, XCircle, Archive, Trash2, Search, Filter, ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Play, Lock, ClipboardCheck, Eye, Users, Settings, BookOpen, Activity, CalendarClock, LayoutDashboard, ClipboardList, Download, Printer, Award, Copy, RotateCcw, FileText, Zap, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

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

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
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

// Pagination Component – modern redesign
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
    const maxVisiblePages = typeof window !== 'undefined' && window.innerWidth >= 768 ? 7 : 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    const btnBase = 'inline-flex items-center justify-center min-w-[2.25rem] h-9 rounded-xl text-sm font-medium transition-all duration-200';
    const btnPrevNext = `${btnBase} px-3 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none`;
    const btnPage = (active) => active
        ? `${btnBase} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-600 shadow-sm hover:shadow`
        : `${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800`;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-sm text-slate-600 order-2 sm:order-1">
                <span className="font-medium text-slate-800">{startItem}</span>
                <span className="mx-1">–</span>
                <span className="font-medium text-slate-800">{endItem}</span>
                <span className="mx-1 text-slate-400">of</span>
                <span className="font-semibold text-slate-800">{totalItems}</span>
                <span className="ml-1 text-slate-500">results</span>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={btnPrevNext}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {startPage > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => onPageChange(1)}
                                className={btnPage(false)}
                            >
                                1
                            </button>
                            {startPage > 2 && (
                                <span className="min-w-[2.25rem] h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                            )}
                        </>
                    )}
                    {pages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={btnPage(page === currentPage)}
                        >
                            {page}
                        </button>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <span className="min-w-[2.25rem] h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                            )}
                            <button
                                type="button"
                                onClick={() => onPageChange(totalPages)}
                                className={btnPage(false)}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={btnPrevNext}
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

const rootElement = document.getElementById('app');

if (rootElement) {
    const roleAttr = rootElement.getAttribute('data-role');
    const sectionAttr = rootElement.getAttribute('data-section') || 'dashboard';
    const modulesJson = rootElement.getAttribute('data-modules');
    const scenariosJson = rootElement.getAttribute('data-scenarios');
    const moduleJson = rootElement.getAttribute('data-module');
    const scenarioJson = rootElement.getAttribute('data-scenario');
    const eventsJson = rootElement.getAttribute('data-events');
    const eventJson = rootElement.getAttribute('data-event');
    const participantsJson = rootElement.getAttribute('data-participants');
    const participantJson = rootElement.getAttribute('data-participant');
    const registrationsJson = rootElement.getAttribute('data-registrations');
    const usersJson = rootElement.getAttribute('data-users');
    const rolesJson = rootElement.getAttribute('data-roles');
    const permissionsJson = rootElement.getAttribute('data-permissions');
    const flashStatus = rootElement.getAttribute('data-status');

    let modules = [];
    let scenarios = [];
    let currentModule = null;
    let currentScenario = null;
    let events = [];
    let currentEvent = null;
    let participants = [];
    let users = [];
    let currentParticipant = null;
    let registrations = [];
    if (modulesJson) {
        try {
            modules = JSON.parse(modulesJson);
        } catch (e) {
            console.error('Failed to parse modules JSON', e);
        }
    }
    if (moduleJson) {
        try {
            currentModule = JSON.parse(moduleJson);
        } catch (e) {
            console.error('Failed to parse module JSON', e);
        }
    }
    if (scenarioJson) {
        try {
            currentScenario = JSON.parse(scenarioJson);
        } catch (e) {
            console.error('Failed to parse scenario JSON', e);
        }
    }
    if (scenariosJson) {
        try {
            scenarios = JSON.parse(scenariosJson);
        } catch (e) {
            console.error('Failed to parse scenarios JSON', e);
        }
    }
    if (eventsJson) {
        try {
            events = JSON.parse(eventsJson);
        } catch (e) {
            console.error('Failed to parse events JSON', e);
        }
    }
    if (eventJson) {
        try {
            currentEvent = JSON.parse(eventJson);
            // Debug: Log event resources when editing
            if (currentEvent && currentEvent.resources) {
                console.log('Parsed event from JSON - resources:', currentEvent.resources, 'Type:', typeof currentEvent.resources, 'Is Array:', Array.isArray(currentEvent.resources));
            }
        } catch (e) {
            console.error('Failed to parse event JSON', e);
        }
    }
    if (participantsJson) {
        try {
            participants = JSON.parse(participantsJson);
        } catch (e) {
            console.error('Failed to parse participants JSON', e);
        }
    }
    if (participantJson) {
        try {
            currentParticipant = JSON.parse(participantJson);
        } catch (e) {
            console.error('Failed to parse participant JSON', e);
        }
    }
    if (registrationsJson) {
        try {
            registrations = JSON.parse(registrationsJson);
        } catch (e) {
            console.error('Failed to parse registrations JSON', e);
        }
    }

    if (usersJson) {
        try {
            users = JSON.parse(usersJson);
        } catch (e) {
            console.error('Failed to parse users JSON', e);
        }
    }

    let roles = [];
    if (rolesJson) {
        try {
            roles = JSON.parse(rolesJson);
        } catch (e) {
            console.error('Failed to parse roles JSON', e);
        }
    }

    let permissions = [];
    if (permissionsJson) {
        try {
            permissions = JSON.parse(permissionsJson);
        } catch (e) {
            console.error('Failed to parse permissions JSON', e);
        }
    }

    let editingRole = null;
    const editingRoleJson = rootElement.getAttribute('data-editing-role');
    if (editingRoleJson) {
        try {
            editingRole = JSON.parse(editingRoleJson);
        } catch (e) {
            console.error('Failed to parse editing role JSON', e);
        }
    }

    let editingPermission = null;
    const editingPermissionJson = rootElement.getAttribute('data-editing-permission');
    if (editingPermissionJson) {
        try {
            editingPermission = JSON.parse(editingPermissionJson);
        } catch (e) {
            console.error('Failed to parse editing permission JSON', e);
        }
    }

    let assignedRoleIds = [];
    const assignedRoleIdsJson = rootElement.getAttribute('data-assigned-role-ids');
    if (assignedRoleIdsJson) {
        try {
            assignedRoleIds = JSON.parse(assignedRoleIdsJson);
        } catch (e) {
            console.error('Failed to parse assigned role IDs JSON', e);
        }
    }

    let groupedPermissions = [];
    const groupedPermissionsJson = rootElement.getAttribute('data-grouped-permissions');
    if (groupedPermissionsJson) {
        try {
            groupedPermissions = JSON.parse(groupedPermissionsJson);
        } catch (e) {
            console.error('Failed to parse grouped permissions JSON', e);
        }
    }

    let assignedPermissionIds = [];
    const assignedPermissionIdsJson = rootElement.getAttribute('data-assigned-permission-ids');
    if (assignedPermissionIdsJson) {
        try {
            assignedPermissionIds = JSON.parse(assignedPermissionIdsJson);
        } catch (e) {
            console.error('Failed to parse assigned permission IDs JSON', e);
        }
    }

    // Parse evaluation data
    let evaluation = null;
    let criteria = null;
    let attendances = null;
    let participantEvaluations = null;
    let currentUser = null;
    let currentUserData = null;
    let canViewSecurity = false;
    let recentLogins = [];
    let recentActions = [];
    let maskedUsbKeyHash = null;
    let currentAttendance = null;
    let currentParticipantEvaluation = null;
    let currentScores = null;
    let currentCriterionAverages = null;
    let currentTotalParticipants = null;
    let currentPassedCount = null;
    let currentFailedCount = null;
    let currentOverallAverage = null;

    const evaluationJson = rootElement.getAttribute('data-evaluation');
    const criteriaJson = rootElement.getAttribute('data-criteria');
    const attendancesJson = rootElement.getAttribute('data-attendances');
    const participantEvaluationsJson = rootElement.getAttribute('data-participant-evaluations');
    const userJson = rootElement.getAttribute('data-user');
    const evaluateeUserJson = rootElement.getAttribute('data-evaluatee-user');
    const attendanceJson = rootElement.getAttribute('data-attendance');
    const participantEvaluationJson = rootElement.getAttribute('data-participant-evaluation');
    const barangayProfileJson = rootElement.getAttribute('data-barangay-profile');
    const barangayProfilesJson = rootElement.getAttribute('data-barangay-profiles');
    const scoresJson = rootElement.getAttribute('data-scores');
    const criterionAveragesJson = rootElement.getAttribute('data-criterion-averages');

    if (evaluationJson) {
        try {
            evaluation = JSON.parse(evaluationJson);
        } catch (e) {
            console.error('Failed to parse evaluation JSON', e);
        }
    }
    if (criteriaJson) {
        try {
            criteria = JSON.parse(criteriaJson);
        } catch (e) {
            console.error('Failed to parse criteria JSON', e);
        }
    }
    if (attendancesJson) {
        try {
            attendances = JSON.parse(attendancesJson);
        } catch (e) {
            console.error('Failed to parse attendances JSON', e);
        }
    }
    if (participantEvaluationsJson) {
        try {
            participantEvaluations = JSON.parse(participantEvaluationsJson);
        } catch (e) {
            console.error('Failed to parse participantEvaluations JSON', e);
        }
    }
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
            // Debug: Log currentUser role for troubleshooting
            if (window.location.pathname.includes('/admin/users/create')) {
                console.log('Current User:', currentUser);
                console.log('Current User Role:', currentUser?.role);
            }
        } catch (e) {
            console.error('Failed to parse user JSON', e);
        }
    }
    let evaluateeUser = null;
    if (evaluateeUserJson) {
        try {
            evaluateeUser = JSON.parse(evaluateeUserJson);
        } catch (e) {
            console.error('Failed to parse evaluatee user JSON', e);
        }
    }
    if (attendanceJson) {
        try {
            currentAttendance = JSON.parse(attendanceJson);
        } catch (e) {
            console.error('Failed to parse attendance JSON', e);
        }
    }
    if (participantEvaluationJson) {
        try {
            currentParticipantEvaluation = JSON.parse(participantEvaluationJson);
        } catch (e) {
            console.error('Failed to parse participantEvaluation JSON', e);
        }
    }
    if (scoresJson) {
        try {
            currentScores = JSON.parse(scoresJson);
        } catch (e) {
            console.error('Failed to parse scores JSON', e);
        }
    }
    if (criterionAveragesJson) {
        try {
            currentCriterionAverages = JSON.parse(criterionAveragesJson);
        } catch (e) {
            console.error('Failed to parse criterionAverages JSON', e);
        }
    }

    currentTotalParticipants = rootElement.getAttribute('data-total-participants');
    currentPassedCount = rootElement.getAttribute('data-passed-count');
    currentFailedCount = rootElement.getAttribute('data-failed-count');
    currentOverallAverage = rootElement.getAttribute('data-overall-average');

    let certificationSummaryStats = null;
    let certificationEligibleParticipants = [];
    let certificationTemplates = [];
    let certificationIssuedCertificates = [];
    let certificationEventsForFilter = [];
    let certificationFilters = {};
    let certificationAutomationSettings = {};
    const summaryStatsJson = rootElement.getAttribute('data-summary-stats');
    const eligibleParticipantsJson = rootElement.getAttribute('data-eligible-participants');
    const templatesJson = rootElement.getAttribute('data-templates');
    const issuedCertificatesJson = rootElement.getAttribute('data-issued-certificates');
    const eventsForFilterJson = rootElement.getAttribute('data-events-for-filter');
    const certificationFiltersJson = rootElement.getAttribute('data-filters');
    const automationSettingsJson = rootElement.getAttribute('data-automation-settings');
    if (summaryStatsJson) {
        try { certificationSummaryStats = JSON.parse(summaryStatsJson); } catch (e) { console.error('Failed to parse summaryStats', e); }
    }
    if (eligibleParticipantsJson) {
        try { certificationEligibleParticipants = JSON.parse(eligibleParticipantsJson); } catch (e) { console.error('Failed to parse eligibleParticipants', e); }
    }
    if (templatesJson) {
        try { certificationTemplates = JSON.parse(templatesJson); } catch (e) { console.error('Failed to parse templates', e); }
    }
    if (issuedCertificatesJson) {
        try { certificationIssuedCertificates = JSON.parse(issuedCertificatesJson); } catch (e) { console.error('Failed to parse issuedCertificates', e); }
    }
    if (eventsForFilterJson) {
        try { certificationEventsForFilter = JSON.parse(eventsForFilterJson); } catch (e) { console.error('Failed to parse eventsForFilter', e); }
    }
    if (certificationFiltersJson) {
        try { certificationFilters = JSON.parse(certificationFiltersJson); } catch (e) { console.error('Failed to parse certification filters', e); }
    }
    if (automationSettingsJson) {
        try { certificationAutomationSettings = JSON.parse(automationSettingsJson); } catch (e) { console.error('Failed to parse automation settings', e); }
    }

    const sessionTimeoutMinutes = parseInt(rootElement.getAttribute('data-session-timeout-minutes') || '10', 10);
    const warningBeforeLogoutSeconds = parseInt(rootElement.getAttribute('data-warning-before-logout-seconds') || '60', 10);

    let barangayProfile = null;
    let barangayProfiles = [];
    if (barangayProfileJson) {
        try {
            barangayProfile = JSON.parse(barangayProfileJson);
        } catch (e) {
            console.error('Failed to parse barangay profile JSON', e);
        }
    }
    if (barangayProfilesJson) {
        try {
            barangayProfiles = JSON.parse(barangayProfilesJson);
        } catch (e) {
            console.error('Failed to parse barangay profiles JSON', e);
        }
    }

    // Parse user details page data
    const viewingUserJson = rootElement.getAttribute('data-viewing-user');
    const canViewSecurityAttr = rootElement.getAttribute('data-can-view-security');
    const recentLoginsJson = rootElement.getAttribute('data-recent-logins');
    const recentActionsJson = rootElement.getAttribute('data-recent-actions');
    const maskedUsbKeyHashAttr = rootElement.getAttribute('data-masked-usb-key-hash');

    if (viewingUserJson) {
        try {
            currentUserData = JSON.parse(viewingUserJson);
        } catch (e) {
            console.error('Failed to parse viewing user JSON', e);
        }
    }

    if (canViewSecurityAttr) {
        canViewSecurity = canViewSecurityAttr === 'true';
    }

    if (recentLoginsJson) {
        try {
            recentLogins = JSON.parse(recentLoginsJson);
        } catch (e) {
            console.error('Failed to parse recent logins JSON', e);
        }
    }

    if (recentActionsJson) {
        try {
            recentActions = JSON.parse(recentActionsJson);
        } catch (e) {
            console.error('Failed to parse recent actions JSON', e);
        }
    }

    if (maskedUsbKeyHashAttr) {
        maskedUsbKeyHash = maskedUsbKeyHashAttr;
    }

    const role =
        roleAttr === 'LGU_ADMIN' || roleAttr === 'LGU_TRAINER' || roleAttr === 'PARTICIPANT'
            ? roleAttr
            : 'PARTICIPANT';

    const sectionConfig = {
        dashboard: {
            title: 'Dashboard',
            description: 'Overview of training modules, simulation events, participants, and resources.',
        },
        training: {
            title: 'Training Module Management',
            description: 'Create and manage disaster preparedness training modules, lessons, and quizzes.',
        },
        scenario: {
            title: 'Scenario-based Exercise Design',
            description: 'Design realistic disaster scenarios with hazards, injects, and expected actions.',
        },
        simulation: {
            title: 'Simulation Event Planning',
            description: 'Plan and schedule drills, assign roles, and link scenarios and training modules.',
        },
        participants: {
            title: 'Participant Registration & Attendance',
            description: 'Register participants, manage attendance, and view participation history.',
        },
        resources: {
            title: 'Resource & Equipment Inventory',
            description: 'Track and assign equipment, PPE, rescue tools, and their usage during simulations.',
        },
        evaluation: {
            title: 'Evaluation & Scoring System',
            description: 'Record performance scores, timings, and feedback for participants and teams.',
        },
        certification: {
            title: 'Certification Issuance',
            description: 'Issue, manage, and verify certificates for participants who pass evaluations.',
        },
        audit_logs: {
            title: 'Audit Logs',
            description: 'Review system activity, security events, and administrative actions across the platform.',
        },
    };

    const navSection =
        sectionAttr.startsWith('training') ? 'training' :
            sectionAttr.startsWith('scenario') ? 'scenario' :
                sectionAttr.startsWith('simulation') ? 'simulation' :
                    sectionAttr.startsWith('participant') ? 'participants' :
                        sectionAttr.startsWith('event_registration') ? 'participants' :
                            sectionAttr.startsWith('event_attendance') ? 'participants' :
                                sectionAttr.startsWith('resources') ? 'resources' :
                                    sectionAttr.startsWith('evaluation') ? 'evaluation' :
                                        sectionAttr.startsWith('barangay_profile') ? 'barangay_profile' :
                                            sectionAttr;

    // Breadcrumb configuration
    const getBreadcrumbs = () => {
        if (sectionAttr === 'dashboard') {
            return [{ label: 'Dashboard', href: '/dashboard' }];
        }

        if (sectionAttr === 'training') {
            return [{ label: 'Training Module Management', href: '/training-modules' }];
        }
        if (sectionAttr === 'training_create') {
            return [
                { label: 'Training Module Management', href: '/training-modules' },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'training_edit') {
            return [
                { label: 'Training Module Management', href: '/training-modules' },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'training_detail') {
            return [
                { label: 'Training Module Management', href: '/training-modules' },
                { label: currentModule?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'scenario') {
            return [{ label: 'Scenario-based Exercise Design', href: '/scenarios' }];
        }
        if (sectionAttr === 'scenario_create') {
            return [
                { label: 'Scenario-based Exercise Design', href: '/scenarios' },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'scenario_edit') {
            return [
                { label: 'Scenario-based Exercise Design', href: '/scenarios' },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'scenario_detail') {
            return [
                { label: 'Scenario-based Exercise Design', href: '/scenarios' },
                { label: currentScenario?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'simulation') {
            return [{ label: 'Simulation Event Planning', href: '/simulation-events' }];
        }
        if (sectionAttr === 'simulation_create') {
            return [
                { label: 'Simulation Event Planning', href: '/simulation-events' },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'simulation_edit') {
            return [
                { label: 'Simulation Event Planning', href: '/simulation-events' },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'simulation_detail') {
            return [
                { label: 'Simulation Event Planning', href: '/simulation-events' },
                { label: currentEvent?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'participants') {
            return [{ label: 'Participant Registration & Attendance', href: '/participants' }];
        }
        if (sectionAttr === 'participant_detail') {
            return [
                { label: 'Participant Registration & Attendance', href: '/participants' },
                { label: currentParticipant?.name || 'Details', href: null }
            ];
        }
        if (sectionAttr === 'event_registrations') {
            return [
                { label: 'Simulation Event Planning', href: '/simulation-events' },
                { label: currentEvent?.title || 'Event', href: null },
                { label: 'Registrations', href: null }
            ];
        }
        if (sectionAttr === 'event_attendance') {
            return [
                { label: 'Simulation Event Planning', href: '/simulation-events' },
                { label: currentEvent?.title || 'Event', href: null },
                { label: 'Attendance', href: null }
            ];
        }

        if (sectionAttr === 'resources') {
            return [{ label: 'Resource & Equipment Inventory', href: '/resources' }];
        }

        if (sectionAttr === 'evaluation_dashboard') {
            return [{ label: 'Evaluation & Scoring System', href: '/evaluations' }];
        }

        if (sectionAttr === 'evaluation_participants') {
            return [
                { label: 'Evaluation & Scoring System', href: '/evaluations' },
                { label: 'Participants', href: null }
            ];
        }

        if (sectionAttr === 'evaluation_form') {
            return [
                { label: 'Evaluation & Scoring System', href: '/evaluations' },
                { label: 'Evaluate Participant', href: null }
            ];
        }

        if (sectionAttr === 'evaluation_summary') {
            return [
                { label: 'Evaluation & Scoring System', href: '/evaluations' },
                { label: 'Summary', href: null }
            ];
        }

        if (sectionAttr === 'certification') {
            return [{ label: 'Certification Issuance', href: '/certification' }];
        }

        if (sectionAttr === 'barangay_profile') {
            return [{ label: 'Barangay Profile', href: '/barangay-profile' }];
        }
        if (sectionAttr === 'barangay_profile_create') {
            return [
                { label: 'Barangay Profile', href: '/barangay-profile' },
                { label: 'Create', href: null },
            ];
        }
        if (sectionAttr === 'barangay_profile_show') {
            return [
                { label: 'Barangay Profile', href: '/barangay-profile' },
                { label: barangayProfile?.barangay_name || 'View', href: null },
            ];
        }
        if (sectionAttr === 'barangay_profile_edit') {
            return [
                { label: 'Barangay Profile', href: '/barangay-profile' },
                { label: 'Edit', href: null },
            ];
        }

        // Users administration (Users, Permissions, Roles)
        if (sectionAttr === 'admin_users_index') {
            return [{ label: 'Users', href: '/admin/users' }];
        }

        if (sectionAttr === 'admin_users_create') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Create', href: null },
            ];
        }

        if (sectionAttr === 'admin_users_show') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Details', href: null },
            ];
        }

        if (sectionAttr === 'admin_permissions') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Permissions', href: null },
            ];
        }

        if (sectionAttr === 'admin_permissions_edit') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Permissions', href: '/admin/permissions' },
                { label: 'Edit', href: null },
            ];
        }

        if (sectionAttr === 'admin_roles') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Roles', href: null },
            ];
        }

        if (sectionAttr === 'admin_roles_edit') {
            return [
                { label: 'Users', href: '/admin/users' },
                { label: 'Roles', href: '/admin/roles' },
                { label: 'Edit', href: null },
            ];
        }

        if (sectionAttr === 'user_monitoring') {
            return [{ label: 'User Monitoring', href: '/admin/user-monitoring' }];
        }

        return [{ label: 'Dashboard', href: '/dashboard' }];
    };

    const breadcrumbs = getBreadcrumbs();

    // Generate page title from breadcrumbs
    const getPageTitle = () => {
        // Explicit title for Users & Roles admin module (Users, Permissions, Roles)
        if (
            sectionAttr === 'admin_users_index' ||
            sectionAttr === 'admin_users_create' ||
            sectionAttr === 'admin_users_edit' ||
            sectionAttr === 'admin_users_show' ||
            sectionAttr === 'admin_permissions' ||
            sectionAttr === 'admin_permissions_edit' ||
            sectionAttr === 'admin_roles' ||
            sectionAttr === 'admin_roles_edit'
        ) {
            return 'Users & Roles';
        }
        if (sectionAttr === 'user_monitoring') {
            return 'User Monitoring';
        }
        if (
            sectionAttr === 'barangay_profile' ||
            sectionAttr === 'barangay_profile_create' ||
            sectionAttr === 'barangay_profile_show' ||
            sectionAttr === 'barangay_profile_edit'
        ) {
            return 'Barangay Profile';
        }

        if (breadcrumbs.length === 1) {
            return breadcrumbs[0].label;
        }
        // For multi-level breadcrumbs, combine them (e.g., "Training Module / Create" -> "Create Training Module")
        const last = breadcrumbs[breadcrumbs.length - 1];
        const parent = breadcrumbs[breadcrumbs.length - 2];
        if (last.label === 'Create') {
            return `Create ${parent.label}`;
        }
        if (last.label === 'Edit') {
            return `Edit ${parent.label}`;
        }
        return last.label;
    };

    const pageTitle = getPageTitle();

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Toast.Provider swipeDirection="right">
                <SessionTimeout timeoutMinutes={sessionTimeoutMinutes} warningSeconds={warningBeforeLogoutSeconds} />
                <SidebarLayout
                    role={role}
                    currentSection={navSection}
                    moduleName={pageTitle}
                    breadcrumbs={breadcrumbs}
                    user={currentUser}
                >
                    <div className="w-full max-w-full mx-auto overflow-x-hidden">

                        {sectionAttr === 'dashboard' && (
                            <DashboardOverview modules={modules} events={events} participants={participants} role={role} />
                        )}

                        {sectionAttr === 'training' && (
                            role === 'PARTICIPANT' ? (
                                <ParticipantTrainingModulesList modules={modules || []} />
                            ) : (
                                <TrainingModulesTable modules={modules || []} />
                            )
                        )}

                        {sectionAttr === 'training_create' && (
                            <TrainingModuleCreateForm barangayProfile={barangayProfile} />
                        )}

                        {sectionAttr === 'training_edit' && currentModule && (
                            <TrainingModuleEditForm module={currentModule} />
                        )}

                        {sectionAttr === 'training_detail' && (
                            currentModule ? (
                                role === 'PARTICIPANT' ? (
                                    <ParticipantTrainingLessonView module={currentModule} />
                                ) : (
                                    <TrainingModuleDetail module={currentModule} />
                                )
                            ) : (
                                <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
                                    <p className="text-slate-600">Loading module details...</p>
                                </div>
                            )
                        )}

                        {sectionAttr === 'scenario' && (
                            <ScenariosTable scenarios={scenarios || []} role={role} />
                        )}

                        {sectionAttr === 'scenario_create' && (
                            <ScenarioCreateForm modules={modules} />
                        )}

                        {sectionAttr === 'scenario_edit' && currentScenario && (
                            <ScenarioEditForm scenario={currentScenario} modules={modules} />
                        )}

                        {sectionAttr === 'scenario_detail' && (
                            currentScenario ? (
                                <ScenarioDetail scenario={currentScenario} />
                            ) : (
                                <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
                                    <p className="text-slate-600">Loading scenario details...</p>
                                </div>
                            )
                        )}

                        {sectionAttr === 'simulation' && (
                            role === 'PARTICIPANT' ? (
                                <ParticipantSimulationEventsList events={events} />
                            ) : (
                                <SimulationEventsTable events={events} role={role} />
                            )
                        )}

                        {sectionAttr === 'simulation_create' && (
                            <SimulationEventCreateForm scenarios={scenarios} />
                        )}

                        {sectionAttr === 'simulation_edit' && currentEvent && (
                            <SimulationEventEditForm event={currentEvent} scenarios={scenarios} />
                        )}

                        {sectionAttr === 'simulation_detail' && currentEvent && (
                            <ParticipantSimulationEventDetail event={currentEvent} role={role} />
                        )}

                        {sectionAttr === 'participants' && (
                            <ParticipantRegistrationAttendanceModule events={events} participants={participants} role={role} />
                        )}

                        {sectionAttr === 'certification' && (
                            <CertificationModule
                                summaryStats={certificationSummaryStats}
                                eligibleParticipants={certificationEligibleParticipants}
                                templates={certificationTemplates}
                                issuedCertificates={certificationIssuedCertificates}
                                eventsForFilter={certificationEventsForFilter}
                                filters={certificationFilters}
                                automationSettings={certificationAutomationSettings}
                            />
                        )}

                        {sectionAttr === 'participant_detail' && currentParticipant && (
                            <ParticipantDetail participant={currentParticipant} />
                        )}

                        {sectionAttr === 'admin_users_index' && (
                            <AdminUsersPage users={users} currentUser={currentUser} />
                        )}

                        {sectionAttr === 'admin_users_show' && (
                            <UserDetailsPage
                                user={currentUserData}
                                currentUser={currentUser}
                                canViewSecurity={canViewSecurity}
                                recentLogins={recentLogins}
                                recentActions={recentActions}
                                maskedUsbKeyHash={maskedUsbKeyHash}
                            />
                        )}

                        {sectionAttr === 'admin_roles' && (
                            <RolesPage roles={roles || []} />
                        )}

                        {sectionAttr === 'admin_roles_edit' && (
                            <RoleEditPage
                                role={editingRole}
                                groupedPermissions={groupedPermissions || []}
                                assignedPermissionIds={assignedPermissionIds || []}
                            />
                        )}

                        {sectionAttr === 'admin_permissions' && (
                            <PermissionsPage permissions={permissions || []} />
                        )}

                        {sectionAttr === 'admin_permissions_edit' && (
                            <PermissionEditPage
                                permission={editingPermission}
                                roles={roles || []}
                                assignedRoleIds={assignedRoleIds || []}
                            />
                        )}

                        {sectionAttr === 'admin_users_create' && (
                            <div className="w-full max-w-full py-2">
                                <a href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Users
                                </a>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                                        <Users className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Add User</h2>
                                        <p className="text-sm text-slate-500 mt-0.5">Create a new LGU Admin, Trainer, or Participant account</p>
                                    </div>
                                </div>
                                {flashStatus && (
                                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                                        {flashStatus}
                                    </div>
                                )}
                                <div className="training-module-card-enter bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg">
                                    <form id="admin-registration-form" method="POST" action="/admin/users" className="space-y-6">
                                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Account Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="account_type">Account Type</label>
                                                    <select id="account_type" name="account_type" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" defaultValue="LGU_ADMIN">
                                                        <option value="LGU_ADMIN">LGU Admin</option>
                                                        <option value="LGU_TRAINER">LGU Trainer</option>
                                                        <option value="PARTICIPANT">Participant</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="barangay_id">Barangay Assignment</label>
                                                    <select id="barangay_id" name="barangay_id" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                                                        <option value="">— None —</option>
                                                        {(barangayProfiles || []).map((bp) => (
                                                            <option key={bp.id} value={bp.id}>{bp.barangay_name || 'Unnamed'} ({bp.municipality_city || ''}, {bp.province || ''})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="last_name">Surname / Last Name <span className="text-rose-500">*</span></label>
                                                        <input id="last_name" name="last_name" type="text" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="first_name">First Name <span className="text-rose-500">*</span></label>
                                                        <input id="first_name" name="first_name" type="text" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="middle_name">Middle Name (optional)</label>
                                                        <input id="middle_name" name="middle_name" type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="email">Official LGU Email <span className="text-rose-500">*</span></label>
                                                    <input id="email" name="email" type="email" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password">Initial Password <span className="text-rose-500">*</span></label>
                                                    <input id="password" name="password" type="password" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                    <p className="mt-1 text-xs text-slate-500">Minimum 8 characters. User can change after first login.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password_confirmation">Confirm Password <span className="text-rose-500">*</span></label>
                                                    <input id="password_confirmation" name="password_confirmation" type="password" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                            <a href="/admin/users" className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancel</a>
                                            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200">
                                                Register Account
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {sectionAttr === 'admin_users_edit' && currentUserData && (
                            <div className="w-full max-w-full py-2">
                                <a href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Users
                                </a>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                                        <Users className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
                                        <p className="text-sm text-slate-500 mt-0.5">Update name, email, role, barangay, or password</p>
                                    </div>
                                </div>
                                {flashStatus && (
                                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                                        {flashStatus}
                                    </div>
                                )}
                                <div className="training-module-card-enter bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg">
                                    <form id="admin-edit-user-form" method="POST" action={`/admin/users/${currentUserData.id}`} className="space-y-6">
                                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                                        <input type="hidden" name="_method" value="PUT" />
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Account Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_account_type">Account Type</label>
                                                    <select id="edit_account_type" name="account_type" defaultValue={currentUserData.role} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                                                        <option value="LGU_ADMIN">LGU Admin</option>
                                                        <option value="LGU_TRAINER">LGU Trainer</option>
                                                        <option value="STAFF">Staff</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_barangay_id">Barangay Assignment</label>
                                                    <select id="edit_barangay_id" name="barangay_id" defaultValue={currentUserData.barangay_id ?? ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                                                        <option value="">— None —</option>
                                                        {(barangayProfiles || []).map((bp) => (
                                                            <option key={bp.id} value={bp.id}>{bp.barangay_name || 'Unnamed'} ({bp.municipality_city || ''}, {bp.province || ''})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_name">Full Name <span className="text-rose-500">*</span></label>
                                                    <input id="edit_name" name="name" type="text" required defaultValue={currentUserData.name ?? ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_email">Email Address <span className="text-rose-500">*</span></label>
                                                    <input id="edit_email" name="email" type="email" required defaultValue={currentUserData.email ?? ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_password">New Password (leave blank to keep current)</label>
                                                    <input id="edit_password" name="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" autoComplete="new-password" />
                                                    <p className="mt-1 text-xs text-slate-500">Minimum 8 characters. Only fill to change password.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_password_confirmation">Confirm New Password</label>
                                                    <input id="edit_password_confirmation" name="password_confirmation" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" autoComplete="new-password" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                            <a href="/admin/users" className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">Cancel</a>
                                            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {sectionAttr === 'audit_logs' && (
                            <AuditLogs />
                        )}

                        {sectionAttr === 'user_monitoring' && (
                            <UserMonitoringPage users={users || []} />
                        )}

                        {sectionAttr === 'resources' && (
                            <ResourceInventory />
                        )}

                        {sectionAttr === 'event_registrations' && currentEvent && registrations && (
                            <EventRegistrationsTable event={currentEvent} registrations={registrations} />
                        )}

                        {sectionAttr === 'event_attendance' && currentEvent && registrations && (
                            <EventAttendanceTable event={currentEvent} registrations={registrations} />
                        )}

                        {sectionAttr === 'evaluation_dashboard' && (
                            <EvaluationDashboard events={events} />
                        )}

                        {sectionAttr === 'evaluation_participants' && (
                            <EvaluationParticipantsList
                                event={currentEvent}
                                evaluation={evaluation}
                                criteria={criteria}
                                attendances={attendances}
                                participantEvaluations={participantEvaluations}
                            />
                        )}

                        {sectionAttr === 'evaluation_form' && (
                            <EvaluationForm
                                event={currentEvent}
                                evaluation={evaluation}
                                user={evaluateeUser ?? currentUser}
                                attendance={currentAttendance}
                                participantEvaluation={currentParticipantEvaluation}
                                criteria={criteria}
                                scores={currentScores}
                            />
                        )}

                        {sectionAttr === 'evaluation_summary' && (
                            <EvaluationSummary
                                event={currentEvent}
                                evaluation={evaluation}
                                participantEvaluations={participantEvaluations}
                                criteria={criteria}
                                criterionAverages={currentCriterionAverages}
                                totalParticipants={currentTotalParticipants}
                                passedCount={currentPassedCount}
                                failedCount={currentFailedCount}
                                overallAverage={currentOverallAverage}
                            />
                        )}

                        {sectionAttr === 'barangay_profile' && (
                            <BarangayProfileList profiles={barangayProfiles} />
                        )}
                        {sectionAttr === 'barangay_profile_create' && (
                            <BarangayProfileForm profile={null} />
                        )}
                        {sectionAttr === 'barangay_profile_show' && barangayProfile && (
                            <BarangayProfileDetail profile={barangayProfile} />
                        )}
                        {sectionAttr === 'barangay_profile_edit' && barangayProfile && (
                            <BarangayProfileForm profile={barangayProfile} />
                        )}
                    </div>
                </SidebarLayout>

                {flashStatus && (
                    <StatusToast message={flashStatus} />
                )}

                <Toast.Viewport className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 outline-none" />
            </Toast.Provider>
        </React.StrictMode>,
    );
}

function DashboardOverview({ modules, events, participants, role }) {
    // Calculate statistics
    const totalModules = modules?.length || 0;
    const activeModules = modules?.filter(m => m.status === 'active')?.length || 0;
    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter(e => new Date(e.scheduled_date) > new Date())?.length || 0;
    const totalParticipants = participants?.length || 0;
    const activeParticipants = participants?.filter(p => p.status === 'active')?.length || 0;

    // Get recent items
    const recentModules = modules?.slice(0, 3) || [];
    const recentEvents = events?.slice(0, 3) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg shadow-md">
                    <LayoutDashboard className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            </div>
            {/* Key Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Training Modules */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Training Modules</p>
                            <p className="text-2xl font-bold text-blue-900">{totalModules}</p>
                            <p className="text-xs text-blue-600 mt-2">{activeModules} active</p>
                        </div>
                        <div className="text-4xl text-blue-200 drop-shadow-md">📚</div>
                    </div>
                </div>

                {/* Simulation Events */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 mb-1">Simulation Events</p>
                            <p className="text-2xl font-bold text-purple-900">{totalEvents}</p>
                            <p className="text-xs text-purple-600 mt-2">{upcomingEvents} upcoming</p>
                        </div>
                        <div className="text-4xl text-purple-200 drop-shadow-md">🎯</div>
                    </div>
                </div>

                {/* Participants */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 mb-1">Participants</p>
                            <p className="text-2xl font-bold text-green-900">{totalParticipants}</p>
                            <p className="text-xs text-green-600 mt-2">{activeParticipants} active</p>
                        </div>
                        <div className="text-4xl text-green-200 drop-shadow-md">👥</div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600 mb-1">System Status</p>
                            <p className="text-lg font-bold text-amber-900">Operational</p>
                            <p className="text-xs text-amber-600 mt-2">All systems nominal</p>
                        </div>
                        <div className="text-4xl text-amber-200 drop-shadow-md">✅</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Training Modules */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-semibold text-slate-900">Recent Training Modules</h2>
                        </div>
                        <div className="divide-y divide-slate-200">
                            {recentModules.length > 0 ? (
                                recentModules.map((module) => (
                                    <div key={module.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{module.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{module.disaster_type} • {module.lessons?.length || 0} lessons</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${module.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                                module.status === 'archived' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {module.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center">
                                    <p className="text-sm text-slate-500">No training modules yet</p>
                                    {role !== 'PARTICIPANT' && (
                                        <a href="/training-modules/create" className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
                                            Create first module →
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        {role !== 'PARTICIPANT' && (
                            <>
                                <a href="/training-modules/create" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors">
                                    <span className="drop-shadow-sm">➕</span> Create Module
                                </a>
                                <a href="/scenarios/create" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium transition-colors">
                                    <span className="drop-shadow-sm">🎯</span> Create Scenario
                                </a>
                                <a href="/simulation-events/create" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors">
                                    <span className="drop-shadow-sm">📅</span> Schedule Event
                                </a>
                            </>
                        )}
                        <a href="/participants" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors">
                            <span className="drop-shadow-sm">👥</span> View Participants
                        </a>
                        <a href="/evaluation" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-colors">
                            <span className="drop-shadow-sm">📊</span> View Results
                        </a>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Section */}
            {recentEvents.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-sm font-semibold text-slate-900">Upcoming Simulation Events</h2>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {recentEvents.slice(0, 4).map((event) => (
                            <div key={event.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                                        <div className="flex gap-4 mt-2">
                                            <span className="text-xs text-slate-500">📅 {formatDate(event.scheduled_date)}</span>
                                            <span className="text-xs text-slate-500">⏰ {event.start_time || 'TBA'}</span>
                                            <span className={`text-xs font-medium ${event.status === 'published' ? 'text-emerald-600' :
                                                event.status === 'draft' ? 'text-slate-600' :
                                                    event.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">{event.registrations?.length || 0} registrations</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Future Features Placeholder */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Coming Soon 🚀</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">📱</span> Mobile App Integration</p>
                        <p className="text-xs text-slate-500">Real-time check-in and notifications on mobile devices</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">🤖</span> AI-Powered Analytics</p>
                        <p className="text-xs text-slate-500">Advanced performance insights and recommendations</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">📹</span> Video Integration</p>
                        <p className="text-xs text-slate-500">Record and review simulation sessions</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">🌐</span> API Access</p>
                        <p className="text-xs text-slate-500">Third-party integrations and data sync</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">📊</span> Advanced Reporting</p>
                        <p className="text-xs text-slate-500">Custom reports and data exports</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2"><span className="drop-shadow-sm">🔐</span> Role-Based Dashboard</p>
                        <p className="text-xs text-slate-500">Customized views per user role</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrainingModulesTable({ modules = [] }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showFilters, setShowFilters] = React.useState(false);
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDifficulty, setFilterDifficulty] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10; // Fixed to 10 items per page
    const filterRef = React.useRef(null);

    // Get unique disaster types for filter
    const disasterTypes = [...new Set((modules || []).map(m => m.category).filter(Boolean))];

    // Close filter dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Filter modules
    const filteredModules = (modules || []).filter((module) => {
        const matchesSearch = !searchQuery ||
            module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !filterStatus || module.status === filterStatus;
        const matchesDifficulty = !filterDifficulty || module.difficulty === filterDifficulty;
        const matchesDisasterType = !filterDisasterType || module.category === filterDisasterType;

        return matchesSearch && matchesStatus && matchesDifficulty && matchesDisasterType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModules = filteredModules.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, filterDifficulty, filterDisasterType]);

    const formatCreatedDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div>
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <BookOpen className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Training Modules</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Create and manage training modules, lessons, and materials for disaster preparedness.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <a
                            href="/training-modules/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Create Training Module
                        </a>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar - Evaluations style */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4 mb-6">
                <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 drop-shadow-sm" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                            <option value="archived">Archived</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </form>
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                                <select
                                    value={filterDifficulty}
                                    onChange={(e) => setFilterDifficulty(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            {disasterTypes.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Disaster Type</label>
                                    <select
                                        value={filterDisasterType}
                                        onChange={(e) => setFilterDisasterType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="">All Types</option>
                                        {disasterTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => { setFilterStatus(''); setFilterDifficulty(''); setFilterDisasterType(''); setShowFilters(false); }}
                            className="mt-3 text-xs text-slate-600 hover:text-slate-800 underline transition-colors duration-200"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Card grid or empty state */}
            {filteredModules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        {(modules || []).length === 0 ? (
                            <>
                                <div className="text-7xl mb-4 opacity-90" aria-hidden="true">📦</div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">No training modules yet.</h3>
                                <p className="text-slate-600 max-w-sm mb-6">
                                    Create your first disaster simulation module to begin.
                                </p>
                                <a
                                    href="/training-modules/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Training Module
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-3 opacity-80" aria-hidden="true">🔍</div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">No modules match your filters.</h3>
                                <p className="text-slate-600 text-sm mb-4">Try adjusting search or filter criteria.</p>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterDifficulty(''); setFilterDisasterType(''); }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    Clear filters
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedModules.map((module, index) => (
                        <div
                            key={module.id}
                            className="training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
                            style={{ animationDelay: `${index * 0.06}s` }}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-slate-600 drop-shadow-sm" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 truncate" title={module.title}>
                                            {module.title || 'Untitled Module'}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                {module.category ?? '—'}
                                            </span>
                                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {module.difficulty ?? '—'}
                                            </span>
                                            <span
                                                className={'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold border transition-all duration-200 ' +
                                                    (module.status === 'published'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : module.status === 'draft'
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600')
                                                }
                                            >
                                                {module.status ? module.status.charAt(0).toUpperCase() + module.status.slice(1) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">
                                    Created: {formatCreatedDate(module.created_at)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={`/training-modules/${module.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:shadow-sm transition-all duration-200"
                                        title="View Lessons"
                                    >
                                        <Eye className="w-3.5 h-3.5 drop-shadow-sm" />
                                        View
                                    </a>
                                    {module.status === 'draft' && (
                                        <>
                                            <form method="POST" action={`/training-modules/${module.id}/publish`} onSubmit={async (e) => {
                                                e.preventDefault();
                                                const result = await Swal.fire({
                                                    title: 'Publish Training Module',
                                                    html: '<p class="text-left mb-3">Are you sure you want to publish this training module?</p><p class="text-left text-sm text-slate-600 mb-2">Please ensure: Title is filled, Difficulty is selected, at least one lesson is added.</p>',
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, publish',
                                                    cancelButtonText: 'Cancel',
                                                    confirmButtonColor: '#16a34a',
                                                    cancelButtonColor: '#64748b',
                                                });
                                                if (result.isConfirmed) e.target.submit();
                                            }} className="inline-block">
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all duration-200" title="Publish">
                                                    <Send className="w-3.5 h-3.5 drop-shadow-sm" />
                                                    Publish
                                                </button>
                                            </form>
                                            <a href={`/training-modules/${module.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200" title="Edit">
                                                <Pencil className="w-3.5 h-3.5 drop-shadow-sm" />
                                                Edit
                                            </a>
                                        </>
                                    )}
                                    {module.status !== 'published' && module.status !== 'draft' && (
                                        <a href={`/training-modules/${module.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200" title="Edit">
                                            <Pencil className="w-3.5 h-3.5 drop-shadow-sm" />
                                            Edit
                                        </a>
                                    )}
                                    <form method="POST" action={`/training-modules/${module.id}/archive`} onSubmit={async (e) => {
                                        e.preventDefault();
                                        const result = await Swal.fire({
                                            title: 'Warning!',
                                            text: 'Archive this module? It will no longer be assignable to new simulations.',
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'Yes, archive it',
                                            cancelButtonText: 'Cancel',
                                            confirmButtonColor: '#f97316',
                                            cancelButtonColor: '#64748b',
                                        });
                                        if (result.isConfirmed) e.target.submit();
                                    }} className="inline-block">
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:shadow-sm transition-all duration-200" title="Archive">
                                            <Archive className="w-3.5 h-3.5 drop-shadow-sm" />
                                            Archive
                                        </button>
                                    </form>
                                    <form method="POST" action={`/training-modules/${module.id}`} onSubmit={async (e) => {
                                        e.preventDefault();
                                        const result = await Swal.fire({
                                            title: 'Warning!',
                                            text: 'Permanently delete this module? This action cannot be undone.',
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'Yes, delete it',
                                            cancelButtonText: 'Cancel',
                                            confirmButtonColor: '#dc2626',
                                            cancelButtonColor: '#64748b',
                                        });
                                        if (result.isConfirmed) e.target.submit();
                                    }} className="inline-block">
                                        <input type="hidden" name="_token" value={csrf} />
                                        <input type="hidden" name="_method" value="DELETE" />
                                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:shadow-sm transition-all duration-200" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5 drop-shadow-sm" />
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredModules.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredModules.length}
                    />
                </div>
            )}
        </div>
    );
}

function ParticipantTrainingModulesList({ modules }) {
    const publishedModules = modules || [];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Training Modules</h2>
            <p className="text-sm text-slate-600 mb-2">
                Browse available training modules. Click a module to start the first lesson.
            </p>
            {publishedModules.length === 0 ? (
                <div className="rounded-xl bg-white border border-slate-200 px-4 py-6 text-sm text-slate-500 text-center shadow-sm">
                    No training modules are available yet. Please check back later.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publishedModules.map((module) => (
                        <a
                            key={module.id}
                            href={`/training-modules/${module.id}`}
                            className="group rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-2 hover:border-emerald-400 hover:shadow-md transition-all"
                        >
                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                                {module.title}
                            </h3>
                            {module.description && (
                                <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-line">
                                    {module.description}
                                </p>
                            )}
                            <div className="mt-auto flex items-center justify-between text-[0.7rem] text-slate-500 pt-1">
                                <span>
                                    Difficulty: {module.difficulty || '—'}
                                </span>
                                {module.category && (
                                    <span>
                                        Disaster type: {module.category}
                                    </span>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function ParticipantTrainingLessonView({ module }) {
    const lessons = module.lessons || [];
    const sortedLessons = React.useMemo(
        () =>
            [...lessons].sort(
                (a, b) => (a.order || 0) - (b.order || 0),
            ),
        [lessons],
    );

    const initialSelectedId = sortedLessons[0]?.id || null;
    const initialCompleted = React.useMemo(
        () =>
            (sortedLessons || [])
                .filter((l) => l.is_completed)
                .map((l) => l.id),
        [sortedLessons],
    );

    const [selectedLessonId, setSelectedLessonId] =
        React.useState(initialSelectedId);
    const [completedLessonIds, setCompletedLessonIds] =
        React.useState(initialCompleted);

    React.useEffect(() => {
        if (!selectedLessonId && sortedLessons[0]) {
            setSelectedLessonId(sortedLessons[0].id);
        }
    }, [selectedLessonId, sortedLessons]);

    const selectedLesson =
        sortedLessons.find((l) => l.id === selectedLessonId) ||
        sortedLessons[0] ||
        null;

    const handleLessonSelect = (lessonId) => {
        setSelectedLessonId(lessonId);
    };

    const toggleCompleted = async (lessonId) => {
        const isCompleted = completedLessonIds.includes(lessonId);
        const next = !isCompleted;

        // Optimistic update
        setCompletedLessonIds((prev) =>
            next ? [...prev, lessonId] : prev.filter((id) => id !== lessonId),
        );

        try {
            const csrf =
                document.head.querySelector('meta[name="csrf-token"]')
                    ?.content || '';

            await fetch(
                `/training-modules/${module.id}/lessons/${lessonId}/completion`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ completed: next }),
                },
            );
        } catch (e) {
            console.error('Failed to update completion', e);
            // Revert optimistic update on error
            setCompletedLessonIds((prev) =>
                isCompleted
                    ? [...prev, lessonId]
                    : prev.filter((id) => id !== lessonId),
            );
        }
    };

    const totalLessons = sortedLessons.length;
    const completedCount = completedLessonIds.length;
    const progressPercent =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const renderMaterial = (mat) => {
        const type = (mat.type || '').toLowerCase();
        const url = mat.path;
        const label = mat.label || url;

        const youtubeMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
        );
        const isYouTube = youtubeMatch && youtubeMatch[1];

        if (type === 'video') {
            if (isYouTube) {
                const embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                return (
                    <div className="space-y-1">
                        <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black">
                            <iframe
                                src={embedUrl}
                                title={label}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                        <p className="text-xs text-slate-600">{label}</p>
                    </div>
                );
            }

            return (
                <div className="space-y-1">
                    <video
                        controls
                        src={url}
                        className="w-full rounded-lg border border-slate-200 bg-black"
                    />
                    <p className="text-xs text-slate-600">{label}</p>
                </div>
            );
        }

        if (type === 'image') {
            return (
                <div className="space-y-1">
                    <img
                        src={url}
                        alt={label}
                        className="w-full rounded-lg border border-slate-200 object-contain"
                    />
                    <p className="text-xs text-slate-600">{label}</p>
                </div>
            );
        }

        if (type === 'pdf') {
            return (
                <div className="space-y-1">
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 text-sm"
                    >
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-600">
                            PDF
                        </span>
                        <span>{label}</span>
                    </a>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[0.7rem] text-slate-500">
                        PDF previews may open in a new tab depending on your
                        browser settings.
                    </div>
                </div>
            );
        }

        // Default: external link / other material
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 text-sm"
            >
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-600">
                    {mat.type || 'Link'}
                </span>
                <span>{label}</span>
            </a>
        );
    };

    return (
        <div className="py-2 space-y-6">
            {/* Back + breadcrumb */}
            <div className="flex items-center justify-between mb-1">
                <a
                    href="/training-modules"
                    className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    ← Back to Training Modules
                </a>
                <div className="text-[0.7rem] text-slate-500">
                    <a
                        href="/training-modules"
                        className="hover:text-slate-700 hover:underline underline-offset-2"
                    >
                        Training Modules
                    </a>
                    <span className="mx-1">/</span>
                    <span className="font-semibold text-slate-700">
                        {module.title}
                    </span>
                </div>
            </div>

            {/* Module overview + progress */}
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Training module
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        {module.title}
                    </h2>
                    {module.description && (
                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                            {module.description}
                        </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-slate-600">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                            Difficulty: {module.difficulty || '—'}
                        </span>
                        {module.category && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                                Disaster type: {module.category}
                            </span>
                        )}
                    </div>
                </div>

                {totalLessons > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1 text-xs text-slate-600">
                            <span>Module progress</span>
                            <span>
                                {completedCount} / {totalLessons} lessons ({progressPercent}
                                %)
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Lesson list */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Lessons
                    </h3>
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
                        {sortedLessons.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                No lessons are available yet for this module.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {sortedLessons.map((lesson, index) => {
                                    const isSelected =
                                        lesson.id === selectedLessonId;
                                    const isCompleted = completedLessonIds.includes(
                                        lesson.id,
                                    );
                                    return (
                                        <li
                                            key={lesson.id}
                                            className={`px-4 py-3 text-sm cursor-pointer transition-colors ${isSelected
                                                ? 'bg-emerald-50 border-l-2 border-emerald-500'
                                                : 'hover:bg-slate-50'
                                                }`}
                                            onClick={() =>
                                                handleLessonSelect(lesson.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400">
                                                            #{index + 1}
                                                        </span>
                                                        <span className="font-medium text-slate-800">
                                                            {lesson.title}
                                                        </span>
                                                    </div>
                                                    {lesson.description && (
                                                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                                                            {lesson.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[0.7rem] text-slate-500">
                                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isCompleted}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            toggleCompleted(
                                                                lesson.id,
                                                            );
                                                        }}
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span>Mark as completed</span>
                                                </label>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Lesson content */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedLesson ? (
                        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                            <div className="mb-3">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Lesson
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {selectedLesson.title}
                                </h3>
                                {selectedLesson.description && (
                                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                                        {selectedLesson.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(!selectedLesson.materials ||
                                    selectedLesson.materials.length === 0) && (
                                        <p className="text-sm text-slate-500">
                                            No learning materials have been added to
                                            this lesson yet.
                                        </p>
                                    )}

                                {selectedLesson.materials &&
                                    selectedLesson.materials.map((mat) => (
                                        <div
                                            key={mat.id}
                                            className="border border-slate-200 rounded-lg p-3 space-y-2"
                                        >
                                            <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                                {mat.type || 'Material'}
                                            </div>
                                            {renderMaterial(mat)}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm text-sm text-slate-500">
                            Select a lesson from the list to view its content.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusToast({ message }) {
    return (
        <Toast.Root
            duration={4000}
            className="bg-slate-900 text-slate-50 rounded-lg shadow-lg border border-emerald-500/50 px-4 py-3 text-sm flex items-start gap-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-2"
        >
            <div className="mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
                <div className="font-semibold text-[0.9rem]">
                    Action successful
                </div>
                <div className="text-[0.8rem] text-slate-300">
                    {message}
                </div>
            </div>
            <Toast.Close className="text-slate-400 hover:text-slate-200 text-xs font-medium">
                Close
            </Toast.Close>
        </Toast.Root>
    );
}

const QUICK_TEMPLATES = [
    {
        name: 'Basic Earthquake Drill',
        title: 'Basic Earthquake Drill',
        description: 'Introduction to earthquake preparedness: drop, cover, and hold. Covers evacuation routes and safe zones.',
        difficulty: 'Beginner',
        category: 'Earthquake',
        objectives: ['Identify safe spots in a room', 'Practice drop, cover, and hold', 'Know evacuation routes'],
    },
    {
        name: 'Fire Evacuation Drill',
        title: 'Fire Evacuation Drill',
        description: 'Fire safety and evacuation procedures. Includes use of extinguishers, assembly points, and head count.',
        difficulty: 'Beginner',
        category: 'Fire',
        objectives: ['Recognize fire exits and assembly points', 'Demonstrate safe evacuation', 'Understand basic fire extinguisher use'],
    },
    {
        name: 'Flood Response Simulation',
        title: 'Flood Response Simulation',
        description: 'Simulation training for flood early warning response and coordinated evacuation planning.',
        difficulty: 'Intermediate',
        category: 'Flood',
        objectives: ['Interpret flood warnings and advisories', 'Coordinate evacuation with local protocols', 'Identify safe routes and shelters'],
    },
];

function TrainingModuleCreateForm({ barangayProfile }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [difficulty, setDifficulty] = React.useState('Beginner');
    const [category, setCategory] = React.useState('');
    const [showObjectives, setShowObjectives] = React.useState(true);
    const [objectives, setObjectives] = React.useState(['']);

    const addObjective = () => {
        setObjectives([...objectives, '']);
    };

    const removeObjective = (index) => {
        setObjectives(objectives.filter((_, i) => i !== index));
    };

    const updateObjective = (index, value) => {
        const newObjectives = [...objectives];
        newObjectives[index] = value;
        setObjectives(newObjectives);
    };

    const applyTemplate = (t) => {
        setTitle(t.title);
        setDescription(t.description);
        setDifficulty(t.difficulty);
        setCategory(t.category);
        setObjectives(t.objectives && t.objectives.length > 0 ? [...t.objectives] : ['']);
        setShowObjectives(true);
    };

    const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200';
    const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';

    const hazards = barangayProfile?.hazards && Array.isArray(barangayProfile.hazards) ? barangayProfile.hazards : [];
    const templateCategories = ['Earthquake', 'Fire', 'Flood'];
    const categoryOptions = hazards.length > 0
        ? [...new Set([...hazards, ...templateCategories])].sort()
        : [];
    const useCategorySelect = categoryOptions.length > 0;

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/training-modules"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Training Modules
            </a>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-xl shadow-md">
                    <BookOpen className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        Create Training Module
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Add a new disaster preparedness training module
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: widened form (takes most space) */}
                <div className="lg:col-span-8">
                    <form
                        method="POST"
                        action="/training-modules"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="status" value="draft" />

                        <div>
                            <label className={labelClass} htmlFor="title">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Earthquake Response & Evacuation"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief overview of what this module covers..."
                                className={inputClass}
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-semibold text-slate-600">
                                    Learning Objectives
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowObjectives(!showObjectives)}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow transition-all duration-200"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {showObjectives ? 'Hide' : 'Show'} Objectives
                                </button>
                            </div>
                            {showObjectives && (
                                <div className="space-y-3">
                                    {objectives.map((objective, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                name={`learning_objectives[${index}]`}
                                                value={objective}
                                                onChange={(e) => updateObjective(index, e.target.value)}
                                                placeholder={`Objective ${index + 1}`}
                                                className={inputClass}
                                            />
                                            {objectives.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeObjective(index)}
                                                    className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-300 w-10 h-10 text-slate-600 hover:bg-slate-50 hover:shadow-sm transition-all duration-200"
                                                    aria-label="Remove objective"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addObjective}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors duration-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add another objective
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass} htmlFor="difficulty">
                                    Difficulty
                                </label>
                                <select
                                    id="difficulty"
                                    name="difficulty"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="category">
                                    Disaster type
                                </label>
                                {useCategorySelect ? (
                                    <select
                                        id="category"
                                        name="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select disaster type</option>
                                        {categoryOptions.map((hazard, index) => (
                                            <option key={index} value={hazard}>{hazard}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id="category"
                                        name="category"
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Earthquake, Fire"
                                        className={inputClass}
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="visibility">
                                Visibility
                            </label>
                            <select id="visibility" name="visibility" className={inputClass}>
                                <option value="all">All participants</option>
                                <option value="group">Specific groups (later)</option>
                                <option value="staff_only">Staff only</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
                            <a
                                href="/training-modules"
                                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all duration-200"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" />
                                Create Module
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: Module Writing Tips + Quick Templates */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-slate-100">
                                <ClipboardList className="w-5 h-5 text-slate-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Module Writing Tips</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                <span>Keep title clear and scenario-based</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                <span>Limit description to 3–5 sentences</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                <span>Objectives should be measurable</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                <span>Match difficulty to target participants</span>
                            </li>
                        </ul>
                    </div>

                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-amber-100">
                                <Zap className="w-5 h-5 text-amber-700" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Quick Templates</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                            Click one to auto-fill the form.
                        </p>
                        <div className="space-y-2">
                            {QUICK_TEMPLATES.map((t, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => applyTemplate(t)}
                                    className="w-full text-left rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-all duration-200"
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrainingModuleEditForm({ module }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    // Parse existing learning_objectives from module (already cast to array by model)
    const initialObjectives = module.learning_objectives && Array.isArray(module.learning_objectives)
        ? module.learning_objectives.filter(obj => obj && obj.trim() !== '')
        : [];

    const [showObjectives, setShowObjectives] = React.useState(initialObjectives.length > 0);
    const [objectives, setObjectives] = React.useState(
        initialObjectives.length > 0 ? initialObjectives : ['']
    );

    const addObjective = () => {
        setObjectives([...objectives, '']);
    };

    const removeObjective = (index) => {
        setObjectives(objectives.filter((_, i) => i !== index));
    };

    const updateObjective = (index, value) => {
        const newObjectives = [...objectives];
        newObjectives[index] = value;
        setObjectives(newObjectives);
    };

    return (
        <div className="max-w-5xl py-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Edit Training Module
            </h2>
            <form
                method="POST"
                action={`/training-modules/${module.id}`}
                className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="_method" value="PUT" />
                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="title"
                    >
                        Title
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        defaultValue={module.title}
                        required
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="description"
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={module.description || ''}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-600">
                            Learning Objectives
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowObjectives(!showObjectives)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 hover:border-emerald-700 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Objectives
                        </button>
                    </div>
                    {showObjectives && (
                        <div className="space-y-2">
                            {objectives.map((objective, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <input
                                        type="text"
                                        name={`learning_objectives[${index}]`}
                                        value={objective}
                                        onChange={(e) => updateObjective(index, e.target.value)}
                                        placeholder={`Objective ${index + 1}`}
                                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {objectives.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeObjective(index)}
                                            className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addObjective}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                            >
                                <Plus className="w-3 h-3" />
                                Add another objective
                            </button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="difficulty"
                        >
                            Difficulty
                        </label>
                        <select
                            id="difficulty"
                            name="difficulty"
                            defaultValue={module.difficulty}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="category"
                        >
                            Disaster type
                        </label>
                        <input
                            id="category"
                            name="category"
                            type="text"
                            placeholder="e.g. Earthquake, Fire"
                            defaultValue={module.category || ''}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="status"
                        >
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={module.status}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div>
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="visibility"
                        >
                            Visibility
                        </label>
                        <select
                            id="visibility"
                            name="visibility"
                            defaultValue={module.visibility}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All participants</option>
                            <option value="group">Specific groups (later)</option>
                            <option value="staff_only">Staff only</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <a
                        href="/training-modules"
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

function TrainingModuleDetail({ module }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const lessons = module.lessons || [];
    const [selectedLesson, setSelectedLesson] = React.useState(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [editFormData, setEditFormData] = React.useState({
        title: '',
        description: '',
    });

    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setIsEditMode(false);
        setEditFormData({
            title: lesson.title || '',
            description: lesson.description || '',
        });
    };

    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        const form = e.target;
        form.submit();
    };

    const handleCloseModal = () => {
        setSelectedLesson(null);
        setIsEditMode(false);
        setEditFormData({
            title: '',
            description: '',
        });
    };

    return (
        <div className="py-2 space-y-6">
            {/* Back + breadcrumb */}
            <div className="flex items-center justify-between mb-1">
                <a
                    href="/training-modules"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Training Modules
                </a>
                <div className="text-[0.7rem] text-slate-500">
                    <a href="/training-modules" className="hover:text-slate-700 hover:underline underline-offset-2">
                        Training Modules
                    </a>
                    <span className="mx-1">/</span>
                    <span className="font-semibold text-slate-700">{module.title}</span>
                </div>
            </div>

            {/* Module header card */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            Training module
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {module.title}
                        </h2>
                        {module.description && (
                            <div className="mt-1 relative">
                                <p className={`text-sm text-slate-600 whitespace-pre-line ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                                    {module.description}
                                </p>
                                <div className="flex justify-end mt-1">
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 transition-colors duration-200"
                                    >
                                        {isDescriptionExpanded ? <>See less <ChevronUp className="w-3 h-3" /></> : <>See more <ChevronDown className="w-3 h-3" /></>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <a
                        href={`/training-modules/${module.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 p-2.5 text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 shrink-0"
                        title="Edit module settings"
                    >
                        <Pencil className="w-4 h-4 drop-shadow-sm" />
                    </a>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                        Difficulty: {module.difficulty}
                    </span>
                    {module.category && (
                        <span className="inline-flex items-center rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 font-medium">
                            {module.category}
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 font-medium">
                        {module.status}
                    </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap gap-4">
                    <span><span className="font-semibold text-slate-600">Created by:</span> {module.owner?.name ?? '—'}</span>
                    <span><span className="font-semibold text-slate-600">Created:</span> {module.created_at ? formatDateTime(module.created_at) : '—'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Add Lesson - sidebar */}
                <div className="lg:order-2 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Add Lesson</h3>
                    <form
                        method="POST"
                        action={`/training-modules/${module.id}/lessons`}
                        className="space-y-3 rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-200 hover:shadow-lg"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <div>
                            <label htmlFor="lesson_title" className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
                                Lesson title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="lesson_title"
                                name="title"
                                type="text"
                                required
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
                            />
                        </div>
                        <div>
                            <label htmlFor="lesson_description" className="block text-[0.7rem] font-semibold text-slate-600 mb-1">
                                Description / key points
                            </label>
                            <textarea
                                id="lesson_description"
                                name="description"
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add lesson
                        </button>
                    </form>
                </div>

                {/* Lessons - card grid */}
                <div className="lg:col-span-2 lg:order-1 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Lessons</h3>
                    {lessons.length === 0 ? (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="text-6xl mb-3 opacity-90" aria-hidden="true">📖</div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">No lessons yet.</h3>
                                <p className="text-slate-600 text-sm">
                                    Add your first lesson using the form on the right.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {lessons.map((lesson, index) => (
                                <div
                                    key={lesson.id}
                                    className="lesson-card-enter rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div
                                        className="p-5 cursor-pointer"
                                        onClick={() => handleLessonClick(lesson)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-slate-600 drop-shadow-sm" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                                                    <h4 className="font-semibold text-slate-900 truncate">{lesson.title}</h4>
                                                </div>
                                                {lesson.description && (
                                                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{lesson.description}</p>
                                                )}
                                                <div className="mt-2">
                                                    {(!lesson.materials || lesson.materials.length === 0) ? (
                                                        <span className="text-[0.7rem] text-slate-400">No materials</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {lesson.materials.slice(0, 3).map((mat) => (
                                                                <a
                                                                    key={mat.id}
                                                                    href={mat.path}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                                                                >
                                                                    {mat.type}
                                                                </a>
                                                            ))}
                                                            {lesson.materials.length > 3 && (
                                                                <span className="text-[0.65rem] text-slate-400">+{lesson.materials.length - 3}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5 pt-4 flex flex-wrap items-center gap-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleLessonClick(lesson)}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:shadow-sm transition-all duration-200"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        <form method="POST" action={`/training-modules/${module.id}/lessons/${lesson.id}`} onSubmit={async (e) => {
                                            e.preventDefault();
                                            const result = await Swal.fire({
                                                title: 'Warning!',
                                                text: 'Remove this lesson from the module?',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, remove lesson',
                                                cancelButtonText: 'Cancel',
                                                confirmButtonColor: '#dc2626',
                                                cancelButtonColor: '#64748b',
                                            });
                                            if (result.isConfirmed) e.target.submit();
                                        }} className="inline-block">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:shadow-sm transition-all duration-200">
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        </form>
                                    </div>
                                    <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wide">Add material</div>
                                        <form method="POST" action={`/training-modules/${module.id}/lessons/${lesson.id}/materials`} className="space-y-2">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <select name="type" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.7rem] focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option value="PDF">PDF</option>
                                                <option value="Video">Video</option>
                                                <option value="Image">Image</option>
                                                <option value="PPT">PPT</option>
                                                <option value="Link">Link</option>
                                            </select>
                                            <input name="label" type="text" placeholder="Label (optional)" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.7rem] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <input name="url" type="url" required placeholder="https://..." className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.7rem] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[0.7rem] font-medium px-2.5 py-1.5 transition-all duration-200">
                                                <Plus className="w-3 h-3" />
                                                Add material
                                            </button>
                                        </form>
                                        {lesson.materials && lesson.materials.length > 0 && (
                                            <ul className="space-y-1 mt-2">
                                                {lesson.materials.map((mat) => (
                                                    <li key={mat.id} className="flex items-center justify-between gap-2 text-[0.75rem]">
                                                        <a href={mat.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 hover:underline truncate min-w-0">
                                                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-600">{mat.type}</span>
                                                            <span className="truncate">{mat.label || mat.path}</span>
                                                        </a>
                                                        <form method="POST" action={`/training-modules/${module.id}/lessons/${lesson.id}/materials/${mat.id}`} onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const result = await Swal.fire({
                                                                title: 'Warning!',
                                                                text: 'Remove this learning material from the lesson?',
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Yes, remove it',
                                                                cancelButtonText: 'Cancel',
                                                                confirmButtonColor: '#dc2626',
                                                                cancelButtonColor: '#64748b',
                                                            });
                                                            if (result.isConfirmed) e.target.submit();
                                                        }} className="shrink-0">
                                                            <input type="hidden" name="_token" value={csrf} />
                                                            <input type="hidden" name="_method" value="DELETE" />
                                                            <button type="submit" className="text-[0.7rem] font-medium text-rose-600 hover:text-rose-800">Remove</button>
                                                        </form>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson View/Edit Modal */}
            <Dialog.Root open={selectedLesson !== null} onOpenChange={(open) => !open && handleCloseModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        <Dialog.Title className="sr-only">Lesson Details</Dialog.Title>
                        {selectedLesson && (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-800">
                                            {isEditMode ? 'Edit Lesson' : selectedLesson.title}
                                        </h2>
                                        {!isEditMode && selectedLesson.description && (
                                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                                {selectedLesson.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditMode && (
                                            <button
                                                onClick={handleEditClick}
                                                className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4 drop-shadow-sm" />
                                            </button>
                                        )}
                                        <Dialog.Close asChild>
                                            <button className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {isEditMode ? (
                                        <form
                                            method="POST"
                                            action={`/training-modules/${module.id}/lessons/${selectedLesson.id}`}
                                            onSubmit={handleSaveChanges}
                                            className="space-y-4"
                                        >
                                            <input type="hidden" name="_token" value={csrf} />
                                            <input type="hidden" name="_method" value="PUT" />
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_lesson_title">
                                                    Lesson Title
                                                </label>
                                                <input
                                                    id="edit_lesson_title"
                                                    name="title"
                                                    type="text"
                                                    required
                                                    value={editFormData.title}
                                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_lesson_description">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="edit_lesson_description"
                                                    name="description"
                                                    rows={6}
                                                    value={editFormData.description}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditMode(false)}
                                                    className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Lesson Info */}
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                                    Lesson Details
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-600">Title:</span>
                                                        <p className="text-sm text-slate-800 mt-1">{selectedLesson.title}</p>
                                                    </div>
                                                    {selectedLesson.description && (
                                                        <div>
                                                            <span className="text-xs font-semibold text-slate-600">Description:</span>
                                                            <p className="text-sm text-slate-800 mt-1 whitespace-pre-line">{selectedLesson.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Materials */}
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                                    Learning Materials
                                                </div>
                                                {(!selectedLesson.materials || selectedLesson.materials.length === 0) ? (
                                                    <p className="text-sm text-slate-500">No materials linked to this lesson.</p>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {selectedLesson.materials.map((mat) => (
                                                            <li
                                                                key={mat.id}
                                                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                            >
                                                                <a
                                                                    href={mat.path}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 flex-1"
                                                                >
                                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                                                                        {mat.type}
                                                                    </span>
                                                                    <span className="text-sm">{mat.label || mat.path}</span>
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

function ScenariosTable({ scenarios = [], role }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const canDelete = role === 'LGU_ADMIN';
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showFilters, setShowFilters] = React.useState(false);
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDifficulty, setFilterDifficulty] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10; // Fixed to 10 items per page
    const filterRef = React.useRef(null);

    // Get unique values for filters
    const disasterTypes = [...new Set((scenarios || []).map(s => s.disaster_type).filter(Boolean))];

    // Close filter dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Filter scenarios
    const filteredScenarios = (scenarios || []).filter((scenario) => {
        const matchesSearch = !searchQuery ||
            scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (scenario.short_description && scenario.short_description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !filterStatus || scenario.status === filterStatus;
        const matchesDifficulty = !filterDifficulty || scenario.difficulty === filterDifficulty;
        const matchesDisasterType = !filterDisasterType || scenario.disaster_type === filterDisasterType;

        return matchesSearch && matchesStatus && matchesDifficulty && matchesDisasterType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredScenarios.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedScenarios = filteredScenarios.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, filterDifficulty, filterDisasterType]);

    const formatCreatedDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div>
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Activity className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Scenarios</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Design scenario-based exercises and disaster response simulations.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <a
                            href="/scenarios/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Create Scenario
                        </a>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar - Evaluations style */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4 mb-6">
                <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 drop-shadow-sm" />
                        <input
                            type="text"
                            placeholder="Search scenarios..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </form>
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                                <select
                                    value={filterDifficulty}
                                    onChange={(e) => setFilterDifficulty(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="Basic">Basic</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            {disasterTypes.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Disaster Type</label>
                                    <select
                                        value={filterDisasterType}
                                        onChange={(e) => setFilterDisasterType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="">All Types</option>
                                        {disasterTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => { setFilterStatus(''); setFilterDifficulty(''); setFilterDisasterType(''); setShowFilters(false); }}
                            className="mt-3 text-xs text-slate-600 hover:text-slate-800 underline transition-colors duration-200"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Card grid or empty state */}
            {filteredScenarios.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        {(scenarios || []).length === 0 ? (
                            <>
                                <div className="text-7xl mb-4 opacity-90" aria-hidden="true">🎯</div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">No scenarios yet.</h3>
                                <p className="text-slate-600 max-w-sm mb-6">
                                    Create your first scenario-based exercise to run simulations.
                                </p>
                                <a
                                    href="/scenarios/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Scenario
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-3 opacity-80" aria-hidden="true">🔍</div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">No scenarios match your filters.</h3>
                                <p className="text-slate-600 text-sm mb-4">Try adjusting search or filter criteria.</p>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterDifficulty(''); setFilterDisasterType(''); }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    Clear filters
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedScenarios.map((s, index) => (
                        <div
                            key={s.id}
                            className="training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
                            style={{ animationDelay: `${index * 0.06}s` }}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-slate-600 drop-shadow-sm" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 truncate" title={s.title}>
                                            {s.title || 'Untitled Scenario'}
                                        </h3>
                                        {s.training_module?.title && (
                                            <p className="text-xs text-slate-500 mt-0.5 truncate" title={s.training_module.title}>
                                                {s.training_module.title}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                {s.disaster_type ?? '—'}
                                            </span>
                                            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {s.difficulty ?? '—'}
                                            </span>
                                            <span
                                                className={'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold border transition-all duration-200 ' +
                                                    (s.status === 'published'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : s.status === 'draft'
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600')
                                                }
                                            >
                                                {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">
                                    Created: {formatCreatedDate(s.created_at)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={`/scenarios/${s.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:shadow-sm transition-all duration-200"
                                        title="View Scenario"
                                    >
                                        <Eye className="w-3.5 h-3.5 drop-shadow-sm" />
                                        View
                                    </a>
                                    {s.status !== 'published' && (
                                        <>
                                            <a
                                                href={`/scenarios/${s.id}/edit`}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5 drop-shadow-sm" />
                                                Edit
                                            </a>
                                            <form method="POST" action={`/scenarios/${s.id}/publish`} onSubmit={async (e) => {
                                                e.preventDefault();
                                                const result = await Swal.fire({
                                                    title: 'Warning!',
                                                    text: 'Publish this scenario? It will become selectable for events.',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, publish',
                                                    cancelButtonText: 'Cancel',
                                                    confirmButtonColor: '#16a34a',
                                                    cancelButtonColor: '#64748b',
                                                });
                                                if (result.isConfirmed) e.target.submit();
                                            }} className="inline-block">
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all duration-200" title="Publish">
                                                    <Send className="w-3.5 h-3.5 drop-shadow-sm" />
                                                    Publish
                                                </button>
                                            </form>
                                        </>
                                    )}
                                    <form method="POST" action={`/scenarios/${s.id}/archive`} onSubmit={async (e) => {
                                        e.preventDefault();
                                        const result = await Swal.fire({
                                            title: 'Warning!',
                                            text: 'Archive this scenario? It will be hidden from selection.',
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'Yes, archive',
                                            cancelButtonText: 'Cancel',
                                            confirmButtonColor: '#f97316',
                                            cancelButtonColor: '#64748b',
                                        });
                                        if (result.isConfirmed) e.target.submit();
                                    }} className="inline-block">
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:shadow-sm transition-all duration-200" title="Archive">
                                            <Archive className="w-3.5 h-3.5 drop-shadow-sm" />
                                            Archive
                                        </button>
                                    </form>
                                    {canDelete && (
                                        <form method="POST" action={`/scenarios/${s.id}`} onSubmit={async (e) => {
                                            e.preventDefault();
                                            const result = await Swal.fire({
                                                title: 'Warning!',
                                                text: 'Permanently delete this scenario? This cannot be undone.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, delete',
                                                cancelButtonText: 'Cancel',
                                                confirmButtonColor: '#dc2626',
                                                cancelButtonColor: '#64748b',
                                            });
                                            if (result.isConfirmed) e.target.submit();
                                        }} className="inline-block">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:shadow-sm transition-all duration-200" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5 drop-shadow-sm" />
                                                Delete
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredScenarios.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredScenarios.length}
                    />
                </div>
            )}
        </div>
    );
}

const SCENARIO_QUICK_TEMPLATES = [
    {
        name: 'Earthquake Response Drill',
        title: 'Magnitude 6.5 Earthquake – Downtown Response',
        short_description: 'A strong earthquake has struck the downtown area during business hours. Multiple buildings have sustained damage, power is out in several blocks, and there are reports of trapped persons.',
        difficulty: 'Basic',
        affected_area: 'Barangay Central',
        incident_time_text: '2:30 PM',
        general_situation: 'Buildings damaged, power outage, roads cracked. Emergency services mobilizing.',
        severity_level: 'High',
        intended_participants: 'Barangay DRRM, volunteers, first responders',
        criteria: ['All participants accounted for within 15 minutes', 'Triage areas established', 'Communication with LGU reported'],
    },
    {
        name: 'Fire Evacuation Scenario',
        title: 'Commercial Building Fire – Evacuation Drill',
        short_description: 'Fire reported on the second floor of a three-story commercial building. Smoke spreading. Evacuation and assembly point management required.',
        difficulty: 'Basic',
        affected_area: 'Multi-tenant building',
        incident_time_text: '10:00 AM',
        general_situation: 'Active fire, smoke on upper floors. Occupants evacuating.',
        severity_level: 'Medium',
        intended_participants: 'Building occupants, safety officers, fire responders',
        criteria: ['Full evacuation within 5 minutes', 'Assembly point headcount completed', 'Injured persons triaged'],
    },
    {
        name: 'Flood Response Simulation',
        title: 'Flash Flood – Low-Lying Barangay',
        short_description: 'Heavy rainfall has caused flash flooding in low-lying areas. Some residents need evacuation; roads are impassable.',
        difficulty: 'Intermediate',
        affected_area: 'Barangay Riverside',
        incident_time_text: '6:00 AM',
        general_situation: 'Rising water, some houses flooded. Evacuation centers opening.',
        severity_level: 'High',
        intended_participants: 'Barangay DRRM, rescue teams, health workers',
        criteria: ['Evacuation routes communicated', 'Vulnerable households identified', 'Shelter capacity reported'],
    },
];

function ScenarioCreateForm({ modules }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedModuleId, setSelectedModuleId] = React.useState('');
    const [showAiChat, setShowAiChat] = React.useState(false);
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [aiGenerating, setAiGenerating] = React.useState(false);
    const [aiError, setAiError] = React.useState(null);
    const [showCriteria, setShowCriteria] = React.useState(true);
    const [criteria, setCriteria] = React.useState(['']);
    const publishedModules = (modules || []).filter((m) => m.status === 'published');
    const selectedModule =
        publishedModules.find((m) => String(m.id) === String(selectedModuleId)) || null;
    const derivedDisasterType = selectedModule?.category || '';
    const learningObjectives = selectedModule?.learning_objectives || [];

    const formRef = React.useRef(null);

    const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200';
    const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';

    const applyScenarioTemplate = (t) => {
        if (formRef.current) {
            const set = (name, value) => {
                const el = formRef.current.querySelector(`[name="${name}"]`);
                if (el) el.value = value ?? '';
            };
            set('title', t.title);
            set('short_description', t.short_description);
            set('difficulty', t.difficulty);
            set('affected_area', t.affected_area);
            set('incident_time_text', t.incident_time_text);
            set('general_situation', t.general_situation);
            set('severity_level', t.severity_level);
            set('intended_participants', t.intended_participants);
            set('injured_victims_count', t.injured_victims_count ?? 0);
            set('trapped_persons_count', t.trapped_persons_count ?? 0);
        }
        setCriteria(t.criteria && t.criteria.length > 0 ? [...t.criteria] : ['']);
        setShowCriteria(true);
    };

    const addCriterion = () => {
        setCriteria([...criteria, '']);
    };

    const removeCriterion = (index) => {
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const updateCriterion = (index, value) => {
        const newCriteria = [...criteria];
        newCriteria[index] = value;
        setCriteria(newCriteria);
    };

    const handleGenerateWithAi = async (e) => {
        e.preventDefault();
        if (!aiPrompt.trim()) {
            setAiError('Please enter a scenario description');
            return;
        }

        setAiGenerating(true);
        setAiError(null);

        try {
            const formData = new FormData();
            formData.append('prompt', aiPrompt);
            formData.append('disaster_type', derivedDisasterType || '');
            formData.append('difficulty', formRef.current?.querySelector('[name="difficulty"]')?.value || 'Medium');
            formData.append('_token', csrf);

            const response = await fetch('/scenarios/generate-ai', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            // Handle validation and server errors explicitly so the user sees the real reason
            if (!response.ok) {
                let message = 'Failed to generate scenario';
                try {
                    const data = await response.json();
                    if (data.errors) {
                        // Grab the first validation error message
                        const allErrors = Object.values(data.errors).flat();
                        if (allErrors.length > 0) {
                            message = allErrors[0];
                        }
                    } else if (data.error) {
                        message = data.error;
                    }
                } catch (_) {
                    // ignore JSON parse errors and fall back to generic message
                }
                throw new Error(message);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate scenario');
            }

            // Populate form fields with generated data
            const data = result.data;
            if (formRef.current) {
                if (data.title) formRef.current.querySelector('[name="title"]').value = data.title;
                if (data.short_description) formRef.current.querySelector('[name="short_description"]').value = data.short_description;
                if (data.affected_area) formRef.current.querySelector('[name="affected_area"]').value = data.affected_area;
                if (data.incident_time_text) formRef.current.querySelector('[name="incident_time_text"]').value = data.incident_time_text;
                if (data.general_situation) formRef.current.querySelector('[name="general_situation"]').value = data.general_situation;
                if (data.severity_level) formRef.current.querySelector('[name="severity_level"]').value = data.severity_level;
                if (data.difficulty) formRef.current.querySelector('[name="difficulty"]').value = data.difficulty;
                if (data.intended_participants) formRef.current.querySelector('[name="intended_participants"]').value = data.intended_participants;
                if (data.injured_victims_count !== undefined) formRef.current.querySelector('[name="injured_victims_count"]').value = data.injured_victims_count;
                if (data.trapped_persons_count !== undefined) formRef.current.querySelector('[name="trapped_persons_count"]').value = data.trapped_persons_count;
                if (data.infrastructure_damage) formRef.current.querySelector('[name="infrastructure_damage"]').value = data.infrastructure_damage;
                if (data.communication_status) formRef.current.querySelector('[name="communication_status"]').value = data.communication_status;
            }

            // Close chat popup
            setShowAiChat(false);
            setAiPrompt('');

            // Show success message (optional - could use a toast notification)
            alert('Scenario generated successfully! Please review and adjust the fields before saving.');
        } catch (error) {
            setAiError(error.message || 'Failed to generate scenario. Please try again.');
        } finally {
            setAiGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/scenarios"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Scenarios
            </a>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-xl shadow-md">
                    <FileText className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        Create Scenario
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Add a new disaster scenario for training exercises
                    </p>
                </div>
            </div>

            {/* AI Scenario Generator modal – blurred backdrop, page visible behind */}
            {showAiChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-amber-100">
                                    <Zap className="w-5 h-5 text-amber-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                    AI Scenario Generator
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAiChat(false);
                                    setAiPrompt('');
                                    setAiError(null);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Describe the scenario you want to generate
                            </label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., A magnitude 7.2 earthquake strikes downtown at 2:30 PM during business hours. Multiple buildings collapse, roads are damaged, power is out, and there are reports of trapped people. The scenario should focus on emergency response coordination."
                                rows={6}
                                disabled={aiGenerating}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-shadow duration-200"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Be as detailed as possible. The AI will generate a complete scenario with all relevant fields populated.
                            </p>

                            {aiError && (
                                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                                    {aiError}
                                </div>
                            )}

                            {selectedModule && (
                                <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800">
                                    <strong>Note:</strong> Disaster type from selected module ({selectedModule.title}): {derivedDisasterType || 'N/A'}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAiChat(false);
                                    setAiPrompt('');
                                    setAiError(null);
                                }}
                                disabled={aiGenerating}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateWithAi}
                                disabled={aiGenerating || !aiPrompt.trim()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-400 disabled:to-amber-500 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                {aiGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        <span>Generate Scenario</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

                    <form
                        ref={formRef}
                        method="POST"
                        action="/scenarios"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="disaster_type" value={derivedDisasterType} />
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-700">Scenario details</h3>
                            <button
                                type="button"
                                onClick={() => setShowAiChat(true)}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                            >
                                <Zap className="w-4 h-4" />
                                Generate with AI
                            </button>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="scenario_title">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="scenario_title"
                                name="title"
                                type="text"
                                required
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="scenario_short_description">
                                Short description
                            </label>
                            <textarea
                                id="scenario_short_description"
                                name="short_description"
                                rows={3}
                                className={inputClass}
                            />
                        </div>

                        {/* Training Module and Disaster Type Section */}
                        <div className="border-t border-slate-200 pt-4 mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass} htmlFor="training_module_id">
                                        Training Module <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="training_module_id"
                                        name="training_module_id"
                                        required
                                        value={selectedModuleId}
                                        onChange={(e) => setSelectedModuleId(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select a training module…</option>
                                        {publishedModules.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[0.7rem] text-slate-500">
                                        This scenario will be the practical application of the selected training module.
                                    </p>
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor="scenario_difficulty">
                                        Difficulty <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="scenario_difficulty"
                                        name="difficulty"
                                        required
                                        className={inputClass}
                                    >
                                        <option value="Basic">Basic</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className={labelClass}>
                                    Disaster type (from training module)
                                </label>
                                <input
                                    type="text"
                                    value={derivedDisasterType || ''}
                                    disabled
                                    placeholder="Select a training module to auto-fill"
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                                />
                            </div>

                    {/* Learning Objectives from Training Module */}
                    {selectedModule && learningObjectives && learningObjectives.length > 0 && (
                        <div className="mt-4">
                            <label className={labelClass}>
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                                <ul className="space-y-2">
                                    {learningObjectives.map((objective, index) => (
                                        <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                                            <span className="text-emerald-600 mt-0.5">•</span>
                                            <span>{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="mt-1 text-[0.7rem] text-slate-500">
                                Learning objectives from the selected training module.
                            </p>
                        </div>
                    )}
                    {selectedModule && (!learningObjectives || learningObjectives.length === 0) && (
                        <div className="mt-4">
                            <label className={labelClass}>
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                                <p className="text-sm text-rose-700">
                                    No learning objectives found in the selected training module. Please add learning objectives to the training module first.
                                </p>
                            </div>
                        </div>
                    )}
                    {!selectedModule && (
                        <div className="mt-4">
                            <label className={labelClass}>
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-sm text-slate-500">
                                    Please select a training module to view learning objectives.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Criteria Section */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-slate-600">
                                Criterion <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowCriteria(!showCriteria)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 hover:border-emerald-700 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Criteria
                            </button>
                        </div>
                        {showCriteria && (
                            <div className="space-y-2">
                                {criteria.map((criterion, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            name={`criteria[${index}]`}
                                            value={criterion}
                                            onChange={(e) => updateCriterion(index, e.target.value)}
                                            placeholder={`Criterion ${index + 1}`}
                                            required
                                            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        {criteria.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCriterion(index)}
                                                className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addCriterion}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add another criterion
                                </button>
                            </div>
                        )}
                        {!showCriteria && (
                            <p className="text-[0.7rem] text-rose-600">
                                Criteria is required. Please click "+ Criteria" to add at least one criterion.
                            </p>
                        )}
                    </div>
                </div>

                {/* Scenario Overview Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Scenario Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="affected_area"
                            >
                                Affected area
                            </label>
                            <input
                                id="affected_area"
                                name="affected_area"
                                type="text"
                                placeholder="e.g. Barangay Central"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="incident_time_text"
                            >
                                Time of incident
                            </label>
                            <input
                                id="incident_time_text"
                                name="incident_time_text"
                                type="text"
                                placeholder="e.g. 10:17 AM"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="general_situation"
                        >
                            General situation
                        </label>
                        <textarea
                            id="general_situation"
                            name="general_situation"
                            rows={3}
                            placeholder="e.g. Buildings damaged, power outage"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="severity_level"
                        >
                            Severity level
                        </label>
                        <select
                            id="severity_level"
                            name="severity_level"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select severity…</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Core Scenario Details Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Core Scenario Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="injured_victims_count"
                            >
                                Number of injured victims
                            </label>
                            <input
                                id="injured_victims_count"
                                name="injured_victims_count"
                                type="number"
                                min="0"
                                defaultValue="0"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="trapped_persons_count"
                            >
                                Number of trapped persons
                            </label>
                            <input
                                id="trapped_persons_count"
                                name="trapped_persons_count"
                                type="number"
                                min="0"
                                defaultValue="0"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="infrastructure_damage"
                        >
                            Infrastructure damage
                        </label>
                        <textarea
                            id="infrastructure_damage"
                            name="infrastructure_damage"
                            rows={2}
                            placeholder="e.g. Roads blocked, building collapse"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="communication_status"
                        >
                            Communication status
                        </label>
                        <select
                            id="communication_status"
                            name="communication_status"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select status…</option>
                            <option value="working">Working</option>
                            <option value="unstable">Unstable</option>
                            <option value="down">Down</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="intended_participants"
                    >
                        Intended participants
                    </label>
                    <input
                        id="intended_participants"
                        name="intended_participants"
                        type="text"
                        placeholder="e.g. students, staff, volunteers"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
                    <a
                        href="/scenarios"
                        className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                    >
                        Save Scenario
                    </button>
                </div>
            </form>
        </div>
    );
}

function ScenarioEditForm({ scenario, modules }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedModuleId, setSelectedModuleId] = React.useState(
        String(scenario.training_module_id || '')
    );
    const selectedModule =
        (modules || []).find((m) => String(m.id) === String(selectedModuleId)) || null;
    const derivedDisasterType = selectedModule?.category || scenario.disaster_type || '';
    const learningObjectives = selectedModule?.learning_objectives || [];

    // Initialize criteria from existing scenario data
    const initialCriteria = scenario.criteria && Array.isArray(scenario.criteria)
        ? scenario.criteria.filter(c => c && c.trim() !== '')
        : [];
    const [showCriteria, setShowCriteria] = React.useState(initialCriteria.length > 0 || true);
    const [criteria, setCriteria] = React.useState(
        initialCriteria.length > 0 ? initialCriteria : ['']
    );

    const addCriterion = () => {
        setCriteria([...criteria, '']);
    };

    const removeCriterion = (index) => {
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const updateCriterion = (index, value) => {
        const newCriteria = [...criteria];
        newCriteria[index] = value;
        setCriteria(newCriteria);
    };

    return (
        <div className="py-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Edit Scenario
            </h2>
            <form
                method="POST"
                action={`/scenarios/${scenario.id}`}
                className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="_method" value="PUT" />
                <input type="hidden" name="disaster_type" value={derivedDisasterType} />

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_title_edit">
                        Title
                    </label>
                    <input
                        id="scenario_title_edit"
                        name="title"
                        type="text"
                        defaultValue={scenario.title}
                        required
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_desc_edit">
                        Short description
                    </label>
                    <textarea
                        id="scenario_desc_edit"
                        name="short_description"
                        rows={3}
                        defaultValue={scenario.short_description || ''}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                {/* Training Module and Disaster Type Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="training_module_id_edit">
                                Training Module <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="training_module_id_edit"
                                name="training_module_id"
                                required
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Select a training module…</option>
                                {(modules || []).map((m) => (
                                    <option
                                        key={m.id}
                                        value={m.id}
                                        disabled={m.status !== 'published'}
                                    >
                                        {m.title}{m.status !== 'published' ? ' (Not published)' : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[0.7rem] text-slate-500">
                                This scenario will be the practical application of the selected training module.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_difficulty_edit">
                                Difficulty <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="scenario_difficulty_edit"
                                name="difficulty"
                                required
                                defaultValue={scenario.difficulty}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Disaster type (from training module)
                        </label>
                        <input
                            type="text"
                            value={derivedDisasterType || ''}
                            disabled
                            placeholder="Select a training module to auto-fill"
                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                        />
                    </div>

                    {/* Learning Objectives from Training Module */}
                    {selectedModule && learningObjectives && learningObjectives.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
                                <ul className="space-y-2">
                                    {learningObjectives.map((objective, index) => (
                                        <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                                            <span className="text-emerald-600 mt-0.5">•</span>
                                            <span>{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="mt-1 text-[0.7rem] text-slate-500">
                                Learning objectives from the selected training module.
                            </p>
                        </div>
                    )}
                    {selectedModule && (!learningObjectives || learningObjectives.length === 0) && (
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                                <p className="text-sm text-rose-700">
                                    No learning objectives found in the selected training module. Please add learning objectives to the training module first.
                                </p>
                            </div>
                        </div>
                    )}
                    {!selectedModule && (
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Learning Objectives <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-sm text-slate-500">
                                    Please select a training module to view learning objectives.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Criteria Section */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-slate-600">
                                Criterion <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowCriteria(!showCriteria)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 hover:border-emerald-700 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Criteria
                            </button>
                        </div>
                        {showCriteria && (
                            <div className="space-y-2">
                                {criteria.map((criterion, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            name={`criteria[${index}]`}
                                            value={criterion}
                                            onChange={(e) => updateCriterion(index, e.target.value)}
                                            placeholder={`Criterion ${index + 1}`}
                                            required
                                            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        {criteria.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCriterion(index)}
                                                className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addCriterion}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add another criterion
                                </button>
                            </div>
                        )}
                        {!showCriteria && (
                            <p className="text-[0.7rem] text-rose-600">
                                Criteria is required. Please click "+ Criteria" to add at least one criterion.
                            </p>
                        )}
                    </div>
                </div>

                {/* Scenario Overview Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Scenario Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="affected_area_edit"
                            >
                                Affected area
                            </label>
                            <input
                                id="affected_area_edit"
                                name="affected_area"
                                type="text"
                                defaultValue={scenario.affected_area || ''}
                                placeholder="e.g. Barangay Central"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="incident_time_text_edit"
                            >
                                Time of incident
                            </label>
                            <input
                                id="incident_time_text_edit"
                                name="incident_time_text"
                                type="text"
                                defaultValue={scenario.incident_time_text || ''}
                                placeholder="e.g. 10:17 AM"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="general_situation_edit"
                        >
                            General situation
                        </label>
                        <textarea
                            id="general_situation_edit"
                            name="general_situation"
                            rows={3}
                            defaultValue={scenario.general_situation || ''}
                            placeholder="e.g. Buildings damaged, power outage"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="severity_level_edit"
                        >
                            Severity level
                        </label>
                        <select
                            id="severity_level_edit"
                            name="severity_level"
                            defaultValue={scenario.severity_level || ''}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select severity…</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Core Scenario Details Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Core Scenario Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="injured_victims_count_edit"
                            >
                                Number of injured victims
                            </label>
                            <input
                                id="injured_victims_count_edit"
                                name="injured_victims_count"
                                type="number"
                                min="0"
                                defaultValue={scenario.injured_victims_count || 0}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-xs font-semibold text-slate-600 mb-1"
                                htmlFor="trapped_persons_count_edit"
                            >
                                Number of trapped persons
                            </label>
                            <input
                                id="trapped_persons_count_edit"
                                name="trapped_persons_count"
                                type="number"
                                min="0"
                                defaultValue={scenario.trapped_persons_count || 0}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="infrastructure_damage_edit"
                        >
                            Infrastructure damage
                        </label>
                        <textarea
                            id="infrastructure_damage_edit"
                            name="infrastructure_damage"
                            rows={2}
                            defaultValue={scenario.infrastructure_damage || ''}
                            placeholder="e.g. Roads blocked, building collapse"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="mt-4">
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="communication_status_edit"
                        >
                            Communication status
                        </label>
                        <select
                            id="communication_status_edit"
                            name="communication_status"
                            defaultValue={scenario.communication_status || ''}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select status…</option>
                            <option value="working">Working</option>
                            <option value="unstable">Unstable</option>
                            <option value="down">Down</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_difficulty_edit">
                            Difficulty
                        </label>
                        <select
                            id="scenario_difficulty_edit"
                            name="difficulty"
                            defaultValue={scenario.difficulty}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Disaster type (from training module)
                        </label>
                        <input
                            type="text"
                            value={derivedDisasterType || ''}
                            disabled
                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="intended_participants_edit">
                        Intended participants
                    </label>
                    <input
                        id="intended_participants_edit"
                        name="intended_participants"
                        type="text"
                        defaultValue={scenario.intended_participants || ''}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <a
                        href="/scenarios"
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

function ScenarioDetail({ scenario }) {
    // Debug: Log scenario data to help troubleshoot
    React.useEffect(() => {
        console.log('Scenario data:', scenario);
        console.log('Injects:', scenario.injects);
        console.log('Expected Actions:', scenario.expectedActions);
    }, [scenario]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical':
                return 'bg-rose-50 text-rose-700';
            case 'High':
                return 'bg-amber-50 text-amber-700';
            case 'Medium':
                return 'bg-yellow-50 text-yellow-700';
            case 'Low':
                return 'bg-emerald-50 text-emerald-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const getCommunicationStatusColor = (status) => {
        switch (status) {
            case 'working':
                return 'bg-emerald-50 text-emerald-700';
            case 'unstable':
                return 'bg-amber-50 text-amber-700';
            case 'down':
                return 'bg-rose-50 text-rose-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="py-2 space-y-6">
            {/* Back + breadcrumb */}
            <div className="flex items-center justify-between mb-1">
                <a
                    href="/scenarios"
                    className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    ← Back to Scenarios
                </a>
                <div className="text-[0.7rem] text-slate-500">
                    <a
                        href="/scenarios"
                        className="hover:text-slate-700 hover:underline underline-offset-2"
                    >
                        Scenarios
                    </a>
                    <span className="mx-1">/</span>
                    <span className="font-semibold text-slate-700">
                        {scenario.title}
                    </span>
                </div>
            </div>

            {/* Scenario Header */}
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            Scenario
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {scenario.title}
                        </h2>
                        {scenario.short_description && (
                            <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                                {scenario.short_description}
                            </p>
                        )}
                    </div>
                    <a
                        href={`/scenarios/${scenario.id}/edit`}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                        title="Edit scenario"
                    >
                        <Pencil className="w-4 h-4 drop-shadow-sm" />
                    </a>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                        Difficulty: {scenario.difficulty}
                    </span>
                    {scenario.disaster_type && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                            Disaster type: {scenario.disaster_type}
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                        Status: {scenario.status}
                    </span>
                    {scenario.training_module && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                            Module: {scenario.training_module.title}
                        </span>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <span className="font-semibold text-slate-600">Created By:</span> {scenario.creator?.name ?? '—'}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-600">Created Date:</span> {scenario.created_at ? formatDateTime(scenario.created_at) : '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scenario Overview */}
            {(scenario.affected_area || scenario.incident_time_text || scenario.general_situation || scenario.severity_level) && (
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Scenario Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenario.affected_area && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Affected area
                                </div>
                                <div className="text-sm text-slate-800">
                                    {scenario.affected_area}
                                </div>
                            </div>
                        )}
                        {scenario.incident_time_text && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Time of incident
                                </div>
                                <div className="text-sm text-slate-800">
                                    {scenario.incident_time_text}
                                </div>
                            </div>
                        )}
                        {scenario.severity_level && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Severity level
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${getSeverityColor(scenario.severity_level)}`}>
                                    {scenario.severity_level}
                                </span>
                            </div>
                        )}
                    </div>
                    {scenario.general_situation && (
                        <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                General situation
                            </div>
                            <div className="text-sm text-slate-800 whitespace-pre-line">
                                {scenario.general_situation}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Core Scenario Details */}
            {(scenario.injured_victims_count !== undefined || scenario.trapped_persons_count !== undefined || scenario.infrastructure_damage || scenario.communication_status) && (
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Core Scenario Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenario.injured_victims_count !== undefined && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Injured victims
                                </div>
                                <div className="text-sm font-semibold text-slate-800">
                                    {scenario.injured_victims_count}
                                </div>
                            </div>
                        )}
                        {scenario.trapped_persons_count !== undefined && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Trapped persons
                                </div>
                                <div className="text-sm font-semibold text-slate-800">
                                    {scenario.trapped_persons_count}
                                </div>
                            </div>
                        )}
                        {scenario.communication_status && (
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Communication status
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm capitalize ${getCommunicationStatusColor(scenario.communication_status)}`}>
                                    {scenario.communication_status}
                                </span>
                            </div>
                        )}
                    </div>
                    {scenario.infrastructure_damage && (
                        <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                Infrastructure damage
                            </div>
                            <div className="text-sm text-slate-800 whitespace-pre-line">
                                {scenario.infrastructure_damage}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

// Simulation Events Components
function SimulationEventsTable({ events, role }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [autoApprovalEnabled, setAutoApprovalEnabled] = React.useState(false);
    const [isLoadingToggle, setIsLoadingToggle] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showFilters, setShowFilters] = React.useState(false);
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [filterCategory, setFilterCategory] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10; // Fixed to 10 items per page
    const filterRef = React.useRef(null);

    // Get unique values for filters
    const disasterTypes = [...new Set(events.map(e => e.disaster_type).filter(Boolean))];
    const categories = [...new Set(events.map(e => e.event_category).filter(Boolean))];

    // Close filter dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Filter events
    const filteredEvents = events.filter((event) => {
        const matchesSearch = !searchQuery ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !filterStatus || event.status === filterStatus;
        const matchesDisasterType = !filterDisasterType || event.disaster_type === filterDisasterType;
        const matchesCategory = !filterCategory || event.event_category === filterCategory;

        return matchesSearch && matchesStatus && matchesDisasterType && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, filterDisasterType, filterCategory]);

    // Load initial auto-approval setting
    React.useEffect(() => {
        fetch('/settings/auto-approval')
            .then(res => res.json())
            .then(data => setAutoApprovalEnabled(data.enabled))
            .catch(err => console.error('Failed to load auto-approval setting:', err));
    }, []);

    const handleToggleAutoApproval = async () => {
        setIsLoadingToggle(true);
        try {
            const response = await fetch('/settings/auto-approval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ enabled: !autoApprovalEnabled }),
            });

            const data = await response.json();

            if (data.success) {
                setAutoApprovalEnabled(data.enabled);
                Swal.fire({
                    icon: 'success',
                    title: 'Settings Updated',
                    text: data.message,
                    timer: 3000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error('Failed to toggle auto-approval:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update auto-approval setting.',
            });
        } finally {
            setIsLoadingToggle(false);
        }
    };

    const getStatusClass = (status) => {
        const map = {
            published: 'bg-emerald-100 text-emerald-700',
            ongoing: 'bg-blue-100 text-blue-700',
            completed: 'bg-indigo-100 text-indigo-700',
            draft: 'bg-slate-100 text-slate-600',
            archived: 'bg-amber-100 text-amber-700',
            cancelled: 'bg-rose-100 text-rose-700',
            ended: 'bg-slate-100 text-slate-600',
        };
        return map[status] || 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="space-y-6">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <CalendarClock className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Simulation Event Planning</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Plan and manage disaster simulation events, schedules, and participant registration.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                            <span className="text-sm font-medium text-slate-700">Auto-Approve</span>
                            <button
                                type="button"
                                onClick={handleToggleAutoApproval}
                                disabled={isLoadingToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${autoApprovalEnabled ? 'bg-emerald-600' : 'bg-slate-300'} ${isLoadingToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                role="switch"
                                aria-checked={autoApprovalEnabled}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoApprovalEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-xs text-slate-500">{autoApprovalEnabled ? 'On' : 'Off'}</span>
                        </div>
                        <a
                            href="/simulation-events/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Create Event
                        </a>
                    </div>
                </div>
            </div>

            {/* Search and filters - Evaluations style */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4">
                <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 drop-shadow-sm" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="ended">Ended</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="archived">Archived</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </form>
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {disasterTypes.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Disaster Type</label>
                                    <select
                                        value={filterDisasterType}
                                        onChange={(e) => setFilterDisasterType(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="">All Types</option>
                                        {disasterTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {categories.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => { setFilterStatus(''); setFilterDisasterType(''); setFilterCategory(''); setShowFilters(false); }}
                            className="mt-3 text-xs text-slate-600 hover:text-slate-800 underline transition-colors duration-200"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Content: empty state or card grid */}
            {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-12 text-center">
                    {events.length === 0 ? (
                        <>
                            <div className="text-5xl mb-4 opacity-80">📅</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">No simulation events yet</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Create your first event to schedule drills and exercises for your team.</p>
                            <a
                                href="/simulation-events/create"
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Create Event
                            </a>
                        </>
                    ) : (
                        <>
                            <div className="text-4xl mb-4 opacity-80">🔍</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">No events match your filters</h3>
                            <p className="text-slate-500 text-sm mb-6">Try adjusting search or filter criteria.</p>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterDisasterType(''); setFilterCategory(''); }}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Clear filters
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginatedEvents.map((event, index) => (
                            <div
                                key={event.id}
                                className="training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex flex-col"
                                style={{ animationDelay: `${index * 0.06}s` }}
                            >
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                                            <CalendarClock className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <a
                                                href={event.status === 'draft' ? `/simulation-events/${event.id}/edit` : `/simulation-events/${event.id}`}
                                                className="font-semibold text-slate-800 hover:text-emerald-700 line-clamp-2 transition-colors"
                                            >
                                                {event.title}
                                            </a>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {event.disaster_type && (
                                                    <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                                                        {event.disaster_type}
                                                    </span>
                                                )}
                                                {event.event_category && (
                                                    <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                                                        {event.event_category}
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${getStatusClass(event.status)}`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 space-y-1 mt-auto">
                                        <div>{formatDate(event.event_date)} · {formatTime(event.start_time)} – {formatTime(event.end_time)}</div>
                                        <div className="text-slate-500">{event.location || '—'}</div>
                                        <div className="text-xs text-slate-400">By {event.creator?.name ?? '—'} · {event.created_at ? formatDate(event.created_at) : '—'}</div>
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-2">
                                    <a
                                        href={`/simulation-events/${event.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> View
                                    </a>
                                    {event.status === 'draft' && (
                                        <a
                                            href={`/simulation-events/${event.id}/edit`}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </a>
                                    )}
                                    {event.status === 'draft' && (
                                        <form method="POST" action={`/simulation-events/${event.id}/publish`} onSubmit={async (e) => {
                                            e.preventDefault();
                                            const missingFields = [];
                                            if (!event.title) missingFields.push('Event Title');
                                            if (!event.disaster_type) missingFields.push('Disaster Type');
                                            if (!event.event_category) missingFields.push('Event Category');
                                            if (!event.event_date) missingFields.push('Event Date');
                                            if (!event.start_time) missingFields.push('Start Time');
                                            if (!event.end_time) missingFields.push('End Time');
                                            if (missingFields.length > 0) {
                                                Swal.fire({ title: 'Validation Error!', html: `Please fill in:<br><br>${missingFields.map(f => `• ${f}`).join('<br>')}`, icon: 'error', confirmButtonColor: '#64748b' });
                                                return;
                                            }
                                            const result = await Swal.fire({ title: 'Warning!', text: 'Publish this event? It will become visible to participants.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, publish', cancelButtonText: 'Cancel', confirmButtonColor: '#16a34a', cancelButtonColor: '#64748b' });
                                            if (result.isConfirmed) e.target.submit();
                                        }} className="inline-block">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors" title="Publish">
                                                <Send className="w-3.5 h-3.5" /> Publish
                                            </button>
                                        </form>
                                    )}
                                    {event.status === 'published' && (() => {
                                        const eventDate = new Date(event.event_date);
                                        const today = new Date();
                                        const isEventDateToday = eventDate.toDateString() === today.toDateString();
                                        if (!isEventDateToday) return null;
                                        const parseTime = (timeStr) => {
                                            if (!timeStr) return null;
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const d = new Date(event.event_date);
                                            d.setHours(hours, minutes, 0, 0);
                                            return d;
                                        };
                                        const startTime = parseTime(event.start_time);
                                        const now = new Date();
                                        const canStart = startTime && now.getTime() >= startTime.getTime();
                                        if (!canStart) return null;
                                        return (
                                            <form method="POST" action={`/simulation-events/${event.id}/start`} onSubmit={async (e) => {
                                                e.preventDefault();
                                                const result = await Swal.fire({ title: 'Start Event!', text: 'Start this simulation event? Status will change to Ongoing.', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, start', cancelButtonText: 'Cancel', confirmButtonColor: '#16a34a', cancelButtonColor: '#64748b' });
                                                if (result.isConfirmed) e.target.submit();
                                            }} className="inline-block">
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Start">
                                                    <Play className="w-3.5 h-3.5" /> Start
                                                </button>
                                            </form>
                                        );
                                    })()}
                                    {(event.status === 'published' || event.status === 'draft') && (
                                        <form method="POST" action={`/simulation-events/${event.id}/cancel`} onSubmit={async (e) => {
                                            e.preventDefault();
                                            const result = await Swal.fire({ title: 'Warning!', text: 'Cancel this event? It will be marked cancelled and hidden from registration.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, cancel', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b' });
                                            if (result.isConfirmed) e.target.submit();
                                        }} className="inline-block">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors" title="Cancel">
                                                <XCircle className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                        </form>
                                    )}
                                    {event.status !== 'archived' && event.status !== 'cancelled' && (
                                        <form method="POST" action={`/simulation-events/${event.id}/archive`} onSubmit={async (e) => {
                                            e.preventDefault();
                                            const result = await Swal.fire({ title: 'Warning!', text: 'Archive this event? It will become read-only.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, archive', cancelButtonText: 'Cancel', confirmButtonColor: '#f97316', cancelButtonColor: '#64748b' });
                                            if (result.isConfirmed) e.target.submit();
                                        }} className="inline-block">
                                            <input type="hidden" name="_token" value={csrf} />
                                            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors" title="Archive">
                                                <Archive className="w-3.5 h-3.5" /> Archive
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredEvents.length}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Resource Selection Component (inline = true for create form right panel, no modal)
function ResourceSelectionSection({ eventResources = [], inline = false }) {
    const parseEventResources = (resources) => {
        if (!resources || !Array.isArray(resources) || resources.length === 0) {
            console.log('parseEventResources: No resources or empty array', resources);
            return [];
        }

        console.log('parseEventResources: Raw resources data', resources);

        const parsed = resources.map(r => {
            // Handle both direct resource objects and pivot relationships
            // Laravel returns resources with pivot data when using belongsToMany
            const resource = r.resource || r;
            const pivot = r.pivot || resource.pivot || {};

            const parsedResource = {
                id: resource.id || r.resource_id || r.id,
                name: resource.name || r.name,
                category: resource.category || r.category,
                quantity: pivot.quantity_needed || resource.quantity_needed || r.quantity_needed || 1,
                available: resource.available || r.available || resource.quantity || r.quantity || 1,
            };

            console.log('parseEventResources: Parsed resource', parsedResource, 'from raw', r);
            return parsedResource;
        });

        console.log('parseEventResources: Final parsed array', parsed);
        return parsed;
    };

    const [selectedResources, setSelectedResources] = React.useState(() => {
        return parseEventResources(eventResources);
    });
    const [showModal, setShowModal] = React.useState(false);
    const [resources, setResources] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [loading, setLoading] = React.useState(false);
    const [tempSelections, setTempSelections] = React.useState({});

    // Track if we've initialized from eventResources to prevent infinite loops
    const initializedRef = React.useRef(false);
    const eventResourcesStringRef = React.useRef(JSON.stringify(eventResources || []));
    const isManualUpdateRef = React.useRef(false);
    const selectedResourcesRef = React.useRef(parseEventResources(eventResources));

    // Keep ref updated with latest selectedResources
    React.useEffect(() => {
        selectedResourcesRef.current = selectedResources;
    }, [selectedResources]);

    // Update selectedResources when eventResources prop changes (e.g., when editing)
    React.useEffect(() => {
        // Skip if this is a manual update from the modal
        if (isManualUpdateRef.current) {
            isManualUpdateRef.current = false;
            return;
        }

        // Create a stable string representation for comparison
        const currentResourcesString = JSON.stringify(eventResources || []);

        // Only update if the content actually changed (not just reference)
        if (currentResourcesString !== eventResourcesStringRef.current) {
            eventResourcesStringRef.current = currentResourcesString;

            if (eventResources && eventResources.length > 0) {
                const parsed = parseEventResources(eventResources);
                if (parsed.length > 0) {
                    console.log('Loading event resources:', eventResources, 'Parsed:', parsed);
                    setSelectedResources(parsed);
                    initializedRef.current = true;
                } else {
                    console.warn('parseEventResources returned empty array for:', eventResources);
                }
            } else {
                console.log('No eventResources provided or empty array:', eventResources);
                if (!initializedRef.current) {
                    // Only reset if we haven't initialized yet
                    setSelectedResources([]);
                    initializedRef.current = true;
                }
            }
        }
    }, [eventResources]);

    // Fetch available resources on mount
    React.useEffect(() => {
        fetchAvailableResources();
    }, []);

    const fetchAvailableResources = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/resources');
            const data = await response.json();
            // Show all resources that have remaining quantity > 0 (regardless of status)
            const available = (data.resources || data).filter(r =>
                (r.available ?? r.quantity ?? 0) > 0
            );
            setResources(available);
        } catch (error) {
            console.error('Error fetching resources:', error);
            Swal.fire('Error', 'Failed to load resources', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = !searchQuery ||
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.serial_number && r.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(resources.map(r => r.category))];

    const handleAddResources = () => {
        setShowModal(true);
        // Initialize temp selections with current selections
        const temp = {};
        selectedResources.forEach(r => {
            temp[r.id] = r.quantity;
        });
        setTempSelections(temp);
    };

    const handleToggleResource = (resource) => {
        const availableQty = resource.available || resource.quantity;

        if (tempSelections[resource.id]) {
            // Remove from selection
            const newTemp = { ...tempSelections };
            delete newTemp[resource.id];
            setTempSelections(newTemp);
        } else {
            // Add to selection
            if (availableQty === 0) {
                Swal.fire({
                    title: 'Resource Unavailable',
                    html: `
                        <p class="text-left mb-3">This resource currently has 0 available units.</p>
                        <p class="text-left text-sm text-slate-600">Do you want to add it anyway? You can specify the quantity needed.</p>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, add it',
                    cancelButtonText: 'Cancel',
                }).then((result) => {
                    if (result.isConfirmed) {
                        setTempSelections({ ...tempSelections, [resource.id]: 1 });
                    }
                });
            } else {
                setTempSelections({ ...tempSelections, [resource.id]: 1 });
            }
        }
    };

    const handleQuantityChange = (resourceId, quantity) => {
        const resource = resources.find(r => r.id === resourceId);
        const availableQty = resource?.available || resource?.quantity || 0;
        const numQuantity = parseInt(quantity) || 0;

        if (numQuantity > availableQty) {
            Swal.fire({
                title: 'Quantity Exceeds Available',
                html: `
                    <p class="text-left mb-2">Available quantity: <strong>${availableQty}</strong></p>
                    <p class="text-left text-sm text-slate-600">You cannot request more than what's available.</p>
                `,
                icon: 'warning',
                confirmButtonText: 'OK',
            });
            return;
        }

        if (numQuantity < 1) {
            setTempSelections({ ...tempSelections, [resourceId]: 1 });
        } else {
            setTempSelections({ ...tempSelections, [resourceId]: numQuantity });
        }
    };

    // Function to ensure hidden input exists and is updated
    const ensureHiddenInput = (resourcesToSave) => {
        let hiddenInput = document.getElementById('selected_resources_input');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'resources';
            hiddenInput.id = 'selected_resources_input';

            // Find the simulation event form specifically (not logout form or other forms)
            // Priority 1: Forms with specific IDs
            let form = document.getElementById('simulation-event-create-form') ||
                document.getElementById('simulation-event-edit-form');

            // Priority 2: Forms with action containing "simulation-events"
            if (!form) {
                form = document.querySelector('form[action*="simulation-events"]');
            }

            // Fallback: find form with POST/PUT method that's not logout
            if (!form) {
                const allForms = document.querySelectorAll('form[method="POST"], form[method="PUT"]');
                form = Array.from(allForms).find(f =>
                    f.action &&
                    !f.action.includes('/logout') &&
                    (f.action.includes('simulation-events') || f.closest('.py-2'))
                );
            }

            // Last resort: find any form in the main content area (not in header/sidebar)
            if (!form) {
                const mainContent = document.querySelector('main, .py-2, [class*="space-y-6"]');
                if (mainContent) {
                    form = mainContent.querySelector('form');
                }
            }

            if (form) {
                form.appendChild(hiddenInput);
                console.log('Created hidden input for resources in form:', form, 'Action:', form.action);
            } else {
                console.warn('No simulation event form found to attach resources input');
                return;
            }
        }

        // Use provided resources, or fall back to ref (which always has latest value)
        const resourcesToUse = resourcesToSave || selectedResourcesRef.current;
        const resourcesData = resourcesToUse.map(r => ({
            id: r.id,
            quantity: r.quantity || 1,
        }));
        hiddenInput.value = JSON.stringify(resourcesData);
        console.log('Updated hidden input with resources:', resourcesData);
    };

    const handleSaveResources = () => {
        const newResources = Object.keys(tempSelections).map(id => {
            const resource = resources.find(r => r.id === parseInt(id));
            if (!resource) return null;
            return {
                id: parseInt(id),
                name: resource.name,
                category: resource.category,
                quantity: tempSelections[id],
                available: resource.available || resource.quantity,
            };
        }).filter(Boolean);

        // Mark as manual update to prevent useEffect from overriding
        isManualUpdateRef.current = true;
        setSelectedResources(newResources);
        setShowModal(false);
        // When inline, keep tempSelections in sync so checkboxes stay checked
        if (inline) {
            const nextTemp = {};
            newResources.forEach(r => { nextTemp[r.id] = r.quantity; });
            setTempSelections(nextTemp);
        } else {
            setTempSelections({});
        }

        console.log('Saved resources:', newResources);

        ensureHiddenInput(newResources);
        setTimeout(() => ensureHiddenInput(newResources), 10);
        setTimeout(() => ensureHiddenInput(newResources), 100);
    };

    // When inline: on mount sync tempSelections from selectedResources so checkboxes match
    React.useEffect(() => {
        if (!inline) return;
        const temp = {};
        selectedResources.forEach(r => { temp[r.id] = r.quantity; });
        setTempSelections(temp);
    }, [inline]);

    const handleRemoveResource = (resourceId) => {
        isManualUpdateRef.current = true;
        const updatedResources = selectedResources.filter(r => r.id !== resourceId);
        setSelectedResources(updatedResources);
        if (inline) {
            setTempSelections(prev => {
                const next = { ...prev };
                delete next[resourceId];
                return next;
            });
        }
        setTimeout(() => ensureHiddenInput(updatedResources), 10);
    };

    // Store selected resources in hidden input for form submission
    React.useEffect(() => {
        // Skip if this is a manual update (handled by handleSaveResources/handleRemoveResource)
        if (isManualUpdateRef.current) {
            isManualUpdateRef.current = false;
            return;
        }

        // Update hidden input
        ensureHiddenInput();

        // Also try after a short delay to ensure form exists
        const timeout = setTimeout(() => ensureHiddenInput(), 100);
        return () => clearTimeout(timeout);
    }, [selectedResources]);

    // Set up form submit listener to ensure resources are included before submission
    React.useEffect(() => {
        const handleFormSubmitBeforeSend = (e) => {
            // Only handle simulation event forms
            const form = e.target;
            if (!form || !form.action || !form.action.includes('simulation-events')) {
                return;
            }

            // Ensure hidden input exists and is updated right before form submits
            // Use the ref to get the latest value
            ensureHiddenInput(selectedResourcesRef.current);
            console.log('Form submit event - ensuring resources are included:', selectedResourcesRef.current);
        };

        // Find the simulation event form specifically
        let form = document.getElementById('simulation-event-create-form') ||
            document.getElementById('simulation-event-edit-form') ||
            document.querySelector('form[action*="simulation-events"]');

        if (!form) {
            // Try again after a delay
            const timeout = setTimeout(() => {
                const retryForm = document.getElementById('simulation-event-create-form') ||
                    document.getElementById('simulation-event-edit-form') ||
                    document.querySelector('form[action*="simulation-events"]');
                if (retryForm) {
                    retryForm.addEventListener('submit', handleFormSubmitBeforeSend, true);
                }
            }, 500);
            return () => clearTimeout(timeout);
        }

        form.addEventListener('submit', handleFormSubmitBeforeSend, true);

        return () => {
            form.removeEventListener('submit', handleFormSubmitBeforeSend, true);
        };
    }, []); // Empty deps - we use ref for latest value

    const pickerContent = (
        <>
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            {loading ? (
                <div className="py-6 text-center text-sm text-slate-500">Loading resources…</div>
            ) : filteredResources.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">No resources match your search.</div>
            ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {filteredResources.map((resource) => {
                        const availableQty = resource.available || resource.quantity || 0;
                        const isSelected = !!tempSelections[resource.id];
                        const selectedQty = tempSelections[resource.id] || 0;
                        return (
                            <div
                                key={resource.id}
                                className={`rounded-xl border-2 p-3 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}`}
                            >
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleResource(resource)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{resource.name}</p>
                                        <p className="text-xs text-slate-500">{resource.category}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Available: <span className="font-medium text-slate-700">{availableQty}</span> units
                                        </p>
                                        {isSelected && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <label className="text-xs font-medium text-slate-600">Qty:</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={availableQty}
                                                    value={selectedQty}
                                                    onChange={(e) => handleQuantityChange(resource.id, e.target.value)}
                                                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );

    const selectedListBlock = selectedResources.length > 0 && (
        <div className="border-t border-slate-200 pt-3 mt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Selected for this event</p>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {selectedResources.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-slate-100 border border-slate-200">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                            <p className="text-xs text-slate-500">{r.category} · {r.quantity} unit{r.quantity !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemoveResource(r.id)}
                            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    if (inline) {
        return (
            <div className="space-y-4">
                {pickerContent}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveResources}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add selected to event
                    </button>
                </div>
                {selectedListBlock}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">10. Resources</h3>
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={handleAddResources}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    + Resources
                </button>
                {selectedResources.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600">Selected:</p>
                        {selectedResources.map((resource) => (
                            <div key={resource.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{resource.name}</p>
                                    <p className="text-xs text-slate-600">{resource.category} · {resource.quantity}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveResource(resource.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800">Select resources</h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setTempSelections({}); }}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto space-y-4">
                                {pickerContent}
                                {selectedListBlock}
                            </div>
                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setTempSelections({}); }}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveResources}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                                >
                                    Add selected
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SimulationEventCreateForm({ scenarios }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedScenarioId, setSelectedScenarioId] = React.useState('');
    const selectedScenario = (scenarios || []).find((s) => String(s.id) === String(selectedScenarioId)) || null;
    const formRef = React.useRef(null);
    const [startTimeValue, setStartTimeValue] = React.useState('');
    const [endTimeValue, setEndTimeValue] = React.useState('');
    // Pre-launch checklist (driven by form fields)
    const [checklistTitle, setChecklistTitle] = React.useState('');
    const [checklistEventDate, setChecklistEventDate] = React.useState('');
    const [checklistLocation, setChecklistLocation] = React.useState('');

    const minDate = new Date().toISOString().split('T')[0];

    const eventTitleAdded = checklistTitle.trim() !== '';
    const disasterTypeSelected = !!(selectedScenario && selectedScenario.disaster_type);
    const scenarioAssigned = selectedScenarioId !== '';
    const dateTimeSet = !!(checklistEventDate && startTimeValue && endTimeValue);
    const locationFilled = checklistLocation.trim() !== '';
    const allReady = eventTitleAdded && disasterTypeSelected && scenarioAssigned && dateTimeSet && locationFilled;

    const handleStartTimeChange = (e) => {
        const start = e.target.value;
        setStartTimeValue(start);
        if (start && endTimeValue && endTimeValue < start) setEndTimeValue('');
        if (formRef.current && start) {
            const endInput = formRef.current.querySelector('#end_time');
            if (endInput && endInput.value && endInput.value < start) endInput.value = '';
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const form = formRef.current;
        if (!form) return;

        const eventDateInput = form.querySelector('#event_date');
        const startTimeInput = form.querySelector('#start_time');
        const endTimeInput = form.querySelector('#end_time');

        if (eventDateInput && eventDateInput.value && eventDateInput.value < minDate) {
            Swal.fire({
                title: 'Invalid date',
                text: 'Event date cannot be in the past. Please select today or a future date.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        if (startTimeInput?.value && endTimeInput?.value && endTimeInput.value < startTimeInput.value) {
            Swal.fire({
                title: 'Invalid time',
                text: 'End time must be the same as or later than start time.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        const hiddenInput = document.getElementById('selected_resources_input');
        if (hiddenInput && formRef.current) {
            const resourcesData = hiddenInput.value ? JSON.parse(hiddenInput.value) : [];
            console.log('Form submitting with resources:', resourcesData);
        } else {
            setTimeout(() => {
                const input = document.getElementById('selected_resources_input');
                if (!input && formRef.current) {
                    const formEl = formRef.current;
                    const resourcesInput = document.createElement('input');
                    resourcesInput.type = 'hidden';
                    resourcesInput.name = 'resources';
                    resourcesInput.id = 'selected_resources_input';
                    resourcesInput.value = '[]';
                    formEl.appendChild(resourcesInput);
                }
            }, 0);
        }

        Swal.fire({
            title: 'Save as draft?',
            text: 'Are you sure you want to save this event as draft? You can edit and publish it later.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save as draft',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
        }).then((result) => {
            if (result.isConfirmed && formRef.current) {
                formRef.current.submit();
            }
        });
    };

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/simulation-events"
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
                    <h2 className="text-xl font-semibold text-slate-800">
                        Create Simulation Event
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Schedule a new disaster simulation drill or exercise
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <form
                        id="simulation-event-create-form"
                        ref={formRef}
                        method="POST"
                        action="/simulation-events"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                        onSubmit={handleFormSubmit}
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="status" value="draft" />
                        <input type="hidden" name="disaster_type" value={selectedScenario?.disaster_type || ''} />

                        {/* Section 1: Basic Event Information */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_title">
                                    Event Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="event_title"
                                    name="title"
                                    type="text"
                                    required
                                    value={checklistTitle}
                                    onChange={(e) => setChecklistTitle(e.target.value)}
                                    placeholder="e.g. Earthquake Evacuation Drill"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="disaster_type">
                                        Disaster Type <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="disaster_type"
                                        type="text"
                                        value={selectedScenario ? selectedScenario.disaster_type : ''}
                                        readOnly
                                        disabled
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                        placeholder="Select a scenario first"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_category">
                                        Event Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="event_category"
                                        name="event_category"
                                        required
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select category…</option>
                                        <option value="Drill">Drill</option>
                                        <option value="Full-scale Exercise">Full-scale Exercise</option>
                                        <option value="Tabletop">Tabletop</option>
                                        <option value="Training Session">Training Session</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_description">
                                    Event Description
                                </label>
                                <textarea
                                    id="event_description"
                                    name="description"
                                    rows={4}
                                    placeholder="What the drill is about and the main learning objectives"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Scenario Assignment */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h3 className="text-sm font-semibold text-slate-800">Scenario Assignment</h3>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_id">
                                    Select Scenario <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="scenario_id"
                                    name="scenario_id"
                                    value={selectedScenarioId}
                                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select a scenario…</option>
                                    {(scenarios || []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title} ({s.disaster_type} - {s.difficulty})
                                        </option>
                                    ))}
                                </select>
                                {selectedScenario && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                                        <div className="font-semibold mb-1">Scenario Preview</div>
                                        <div>Hazard: {selectedScenario.disaster_type}</div>
                                        <div>Difficulty: {selectedScenario.difficulty}</div>
                                        {selectedScenario.short_description && (
                                            <div className="mt-1">{selectedScenario.short_description}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Event Schedule */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">2. Event Schedule</h3>
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
                                        value={checklistEventDate}
                                        onChange={(e) => setChecklistEventDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                        value={startTimeValue}
                                        onChange={handleStartTimeChange}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                        min={startTimeValue || undefined}
                                        value={endTimeValue}
                                        onChange={(e) => setEndTimeValue(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Event Location */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800">3. Event Location</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="location">
                                        Location / Building / Area
                                    </label>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        value={checklistLocation}
                                        onChange={(e) => setChecklistLocation(e.target.value)}
                                        placeholder="e.g. Barangay Hall"
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="room_zone">
                                        Room / Zone
                                    </label>
                                    <input
                                        id="room_zone"
                                        name="room_zone"
                                        type="text"
                                        placeholder="e.g. Main Hall, Zone A"
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="location_notes">
                                    Location Notes
                                </label>
                                <textarea
                                    id="location_notes"
                                    name="location_notes"
                                    rows={3}
                                    placeholder="Accessibility notes, exits, hazard zones, assembly points"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Publishing Controls */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                                This event will be saved as a draft. You can publish it later from the Simulation Events page.
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href="/simulation-events"
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
                    </form>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    {/* Panel 1: Pre-Launch Checklist */}
                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">✅ Simulation Readiness</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-sm">
                                {eventTitleAdded ? (
                                    <span className="text-emerald-600">✅</span>
                                ) : (
                                    <span className="text-slate-300">⬜</span>
                                )}
                                <span className={eventTitleAdded ? 'text-slate-700' : 'text-slate-400'}>Event title added</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {disasterTypeSelected ? (
                                    <span className="text-emerald-600">✅</span>
                                ) : (
                                    <span className="text-slate-300">⬜</span>
                                )}
                                <span className={disasterTypeSelected ? 'text-slate-700' : 'text-slate-400'}>Disaster type selected</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {scenarioAssigned ? (
                                    <span className="text-emerald-600">✅</span>
                                ) : (
                                    <span className="text-slate-300">⬜</span>
                                )}
                                <span className={scenarioAssigned ? 'text-slate-700' : 'text-slate-400'}>Scenario assigned</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {dateTimeSet ? (
                                    <span className="text-emerald-600">✅</span>
                                ) : (
                                    <span className="text-slate-300">⬜</span>
                                )}
                                <span className={dateTimeSet ? 'text-slate-700' : 'text-slate-400'}>Date & time set</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {locationFilled ? (
                                    <span className="text-emerald-600">✅</span>
                                ) : (
                                    <span className="text-slate-300">⬜</span>
                                )}
                                <span className={locationFilled ? 'text-slate-700' : 'text-slate-400'}>Location filled</span>
                            </div>
                        </div>
                        {allReady && (
                            <div className="mt-4 pt-4 border-t border-emerald-100">
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                    <span className="text-lg">🟢</span>
                                    <span>Ready to Publish</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel 2: Resources for Simulation */}
                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">Resources for Simulation</h3>
                        <ResourceSelectionSection inline={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SimulationEventEditForm({ event, scenarios }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedScenarioId, setSelectedScenarioId] = React.useState(String(event.scenario_id || ''));
    const selectedScenario = (scenarios || []).find((s) => String(s.id) === String(selectedScenarioId)) || null;

    // Format date for date input (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Format time for time input (HH:MM)
    const formatTimeForInput = (timeString) => {
        if (!timeString) return '';
        // Handle both "HH:MM:SS" and "HH:MM" formats
        return timeString.substring(0, 5);
    };

    // Get allowed participant types as array
    const allowedTypes = event.allowed_participant_types || [];

    return (
        <div className="py-2">
            <form
                id="simulation-event-edit-form"
                method="POST"
                action={`/simulation-events/${event.id}`}
                className="space-y-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="_method" value="PUT" />
                <input type="hidden" name="_method" value="PUT" />

                {/* Section 1: Basic Event Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">1. Basic Event Information</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_title_edit">
                                    Event Title *
                                </label>
                                <input
                                    id="event_title_edit"
                                    name="title"
                                    type="text"
                                    required
                                    defaultValue={event.title}
                                    placeholder="e.g. Earthquake Evacuation Drill"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_category_edit">
                                    Event Category *
                                </label>
                                <select
                                    id="event_category_edit"
                                    name="event_category"
                                    required
                                    defaultValue={event.event_category}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select category…</option>
                                    <option value="Drill">Drill</option>
                                    <option value="Full-scale Exercise">Full-scale Exercise</option>
                                    <option value="Tabletop">Tabletop</option>
                                    <option value="Training Session">Training Session</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="disaster_type_edit">
                                Disaster Type *
                            </label>
                            <select
                                id="disaster_type_edit"
                                name="disaster_type"
                                required
                                defaultValue={event.disaster_type}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Select disaster type…</option>
                                <option value="Earthquake">Earthquake</option>
                                <option value="Fire">Fire</option>
                                <option value="Flood">Flood</option>
                                <option value="Typhoon">Typhoon</option>
                                <option value="Landslide">Landslide</option>
                                <option value="Chemical Spill">Chemical Spill</option>
                                <option value="Multi-hazard">Multi-hazard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_description_edit">
                                Event Description
                            </label>
                            <textarea
                                id="event_description_edit"
                                name="description"
                                rows={4}
                                defaultValue={event.description || ''}
                                placeholder="What the drill is about & learning objective"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Event Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">2. Event Schedule</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_date_edit">
                                Event Date *
                            </label>
                            <input
                                id="event_date_edit"
                                name="event_date"
                                type="date"
                                required
                                defaultValue={formatDateForInput(event.event_date)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="start_time_edit">
                                Start Time *
                            </label>
                            <input
                                id="start_time_edit"
                                name="start_time"
                                type="time"
                                required
                                defaultValue={formatTimeForInput(event.start_time)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="end_time_edit">
                                End Time *
                            </label>
                            <input
                                id="end_time_edit"
                                name="end_time"
                                type="time"
                                required
                                defaultValue={formatTimeForInput(event.end_time)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            id="is_recurring_edit"
                            name="is_recurring"
                            type="checkbox"
                            value="1"
                            defaultChecked={event.is_recurring}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="is_recurring_edit" className="text-sm text-slate-700">
                            Repeat event
                        </label>
                    </div>
                </div>

                {/* Section 3: Event Location */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">3. Event Location</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="location_edit">
                                    Location / Building / Area
                                </label>
                                <input
                                    id="location_edit"
                                    name="location"
                                    type="text"
                                    defaultValue={event.location || ''}
                                    placeholder="e.g. Barangay Hall"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="room_zone_edit">
                                    Room / Zone
                                </label>
                                <input
                                    id="room_zone_edit"
                                    name="room_zone"
                                    type="text"
                                    defaultValue={event.room_zone || ''}
                                    placeholder="e.g. Main Hall, Zone A"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="location_notes_edit">
                                Location Notes
                            </label>
                            <textarea
                                id="location_notes_edit"
                                name="location_notes"
                                rows={3}
                                defaultValue={event.location_notes || ''}
                                placeholder="Accessibility notes, exits, hazard zones, assembly points"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="is_high_risk_location_edit"
                                name="is_high_risk_location"
                                type="checkbox"
                                value="1"
                                defaultChecked={event.is_high_risk_location}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="is_high_risk_location_edit" className="text-sm text-slate-700">
                                Mark location as &quot;high risk&quot;
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 4: Scenario Assignment */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">4. Scenario Assignment</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_id_edit">
                                Select Scenario
                            </label>
                            <select
                                id="scenario_id_edit"
                                name="scenario_id"
                                value={selectedScenarioId}
                                onChange={(e) => setSelectedScenarioId(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Select a scenario…</option>
                                {(scenarios || []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title} ({s.disaster_type} - {s.difficulty})
                                    </option>
                                ))}
                            </select>
                            {selectedScenario && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-md text-xs text-slate-600">
                                    <div className="font-semibold mb-1">Scenario Preview:</div>
                                    <div>Hazard: {selectedScenario.disaster_type}</div>
                                    <div>Difficulty: {selectedScenario.difficulty}</div>
                                    {selectedScenario.short_description && (
                                        <div className="mt-1">{selectedScenario.short_description}</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="scenario_is_required_edit"
                                name="scenario_is_required"
                                type="checkbox"
                                value="1"
                                defaultChecked={event.scenario_is_required}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="scenario_is_required_edit" className="text-sm text-slate-700">
                                Required scenario
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 6: Participant Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">6. Participant Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Who can join (select all that apply)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Staff', 'Volunteers', 'Students', 'Responders'].map((type) => (
                                    <label key={type} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="allowed_participant_types[]"
                                            value={type.toLowerCase()}
                                            defaultChecked={allowedTypes.includes(type.toLowerCase())}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-slate-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="max_participants_edit">
                                    Max Participant Limit
                                </label>
                                <input
                                    id="max_participants_edit"
                                    name="max_participants"
                                    type="number"
                                    min="1"
                                    defaultValue={event.max_participants || ''}
                                    placeholder="No limit if empty"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="self_registration_enabled"
                                        value="1"
                                        defaultChecked={event.self_registration_enabled}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-700">Enable self-registration</span>
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="qr_code_enabled"
                                        value="1"
                                        defaultChecked={event.qr_code_enabled}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-700">Enable QR code</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 8: Safety & Compliance */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">8. Safety & Compliance</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="safety_guidelines_edit">
                                    Safety Guidelines
                                </label>
                                <textarea
                                    id="safety_guidelines_edit"
                                    name="safety_guidelines"
                                    rows={3}
                                    defaultValue={event.safety_guidelines || ''}
                                    placeholder="Safety rules and guidelines"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="hazard_warnings_edit">
                                    Hazard Warnings
                                </label>
                                <textarea
                                    id="hazard_warnings_edit"
                                    name="hazard_warnings"
                                    rows={3}
                                    defaultValue={event.hazard_warnings || ''}
                                    placeholder="Known hazards and warnings"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 10: Resources */}
                <ResourceSelectionSection eventResources={(event.resources && Array.isArray(event.resources)) ? event.resources : []} />
                {console.log('SimulationEventEditForm - event.resources:', event.resources, 'Type:', typeof event.resources, 'Is Array:', Array.isArray(event.resources))}

                {/* Section 12: Publishing Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">12. Publishing Controls</h3>
                    <div className="flex justify-end gap-2">
                        <a
                            href="/simulation-events"
                            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// Template Editor Modal for Certification (supports template_content with {name}, {date}, etc. and background upload)
const DEFAULT_TEMPLATE_CONTENT = `<div class="certificate" style="font-family:serif; max-width:800px; margin:0 auto; padding:40px; border:2px solid #16a34a; text-align:center;">
<h1 style="color:#16a34a;">Certificate of Completion</h1>
<p style="font-size:18px; margin-top:30px;">This is to certify that</p>
<p style="font-size:24px; font-weight:bold; margin:15px 0;">{name}</p>
<p style="font-size:16px;">has successfully completed</p>
<p style="font-size:18px; font-weight:bold;">{training_type}</p>
<p style="font-size:14px; margin-top:20px;">Event: {event} &nbsp;|&nbsp; Date: {date}</p>
<p style="font-size:14px;">Certificate No: {certificate_number} &nbsp;|&nbsp; Score: {score}%</p>
</div>`;

function TemplateEditorModal({ template, csrf, onClose, onSaved }) {
    const isEdit = !!template;
    const [paperSize, setPaperSize] = React.useState(template?.paper_size || 'a4');
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const fileInput = form.querySelector('input[name="background"]');
        const hasFile = fileInput?.files?.length > 0;
        // When uploading a file, use POST (not PUT) so PHP populates $_FILES reliably
        const url = hasFile && isEdit
            ? `/certification/templates/${template.id}/update`
            : isEdit ? `/certification/templates/${template.id}` : '/certification/templates';

        if (hasFile) {
            // Ensure form has enctype for file uploads
            form.setAttribute('action', url);
            form.setAttribute('method', 'post');
            form.setAttribute('enctype', 'multipart/form-data');
            // Add _method field if using PUT route (for consistency)
            if (isEdit && url.includes('/update')) {
                // POST route, no _method needed
            } else if (isEdit) {
                // Add _method=PUT for Laravel
                let methodInput = form.querySelector('input[name="_method"]');
                if (!methodInput) {
                    methodInput = document.createElement('input');
                    methodInput.type = 'hidden';
                    methodInput.name = '_method';
                    form.appendChild(methodInput);
                }
                methodInput.value = 'PUT';
            }
            // Close modal before submit to prevent stale data
            onClose();
            form.submit();
            return;
        }

        const payload = {
            name: form.name?.value,
            type: form.type?.value || 'completion',
            title_text: form.title_text?.value || null,
            template_content: form.template_content?.value || null,
            certificate_number_format: form.certificate_number_format?.value || null,
            status: form.status?.value || 'active',
            background_opacity: form.background_opacity?.value ? parseFloat(form.background_opacity.value) : 0.35,
            paper_size: paperSize,
            _token: csrf,
        };
        try {
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', text: isEdit ? 'Template updated.' : 'Template created.' });
                onSaved();
            } else {
                Swal.fire({ icon: 'error', text: data.message || 'Failed.' });
            }
        } catch (_) {
            Swal.fire({ icon: 'error', text: 'Request failed.' });
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 overflow-y-auto py-6" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 my-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{isEdit ? 'Edit Template' : 'Add Template'}</h3>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <input type="hidden" name="_token" value={csrf} />
                    <input type="hidden" name="paper_size" value={paperSize} />
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Template Name</label>
                            <input type="text" name="name" required defaultValue={template?.name} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Default Completion" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                            <select name="type" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={template?.type || 'completion'}>
                                <option value="completion">Completion</option>
                                <option value="participation">Participation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Print size</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setPaperSize('a4')} className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${paperSize === 'a4' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>A4</button>
                                <button type="button" onClick={() => setPaperSize('letter')} className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${paperSize === 'letter' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>Letter</button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Choose paper size for a clean print or PDF. A4: 210×297mm · Letter: 8.5×11 in.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Certificate content (HTML with placeholders)</label>
                            <p className="text-xs text-slate-500 mb-1">Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{date}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{event}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{certificate_number}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{score}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{training_type}'}</code> — the system will replace these with the participant data.</p>
                            <textarea name="template_content" rows={10} defaultValue={template?.template_content ?? DEFAULT_TEMPLATE_CONTENT} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" placeholder="HTML with {name}, {date}, etc." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Background image (optional)</label>
                            {isEdit && template?.background_path && (
                                <p className="text-xs text-emerald-700 mb-1">Current: {template.background_path.replace(/^.*[/\\]/, '')}</p>
                            )}
                            <input type="file" name="background" accept="image/*,.pdf" className="w-full text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700" />
                            <p className="text-xs text-slate-500 mt-1">Uploaded image is shown behind the certificate text with reduced opacity so text stays readable.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Background opacity</label>
                            <input type="number" name="background_opacity" min="0.1" max="0.8" step="0.05" defaultValue={template?.background_opacity ?? 0.35} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                            <p className="text-xs text-slate-500 mt-1">0.1 = very faint, 0.35 = default (readable text), 0.8 = stronger. Lower = more readable text.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Title Text</label>
                            <input type="text" name="title_text" defaultValue={template?.title_text} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Certificate of Completion" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Certificate Number Format</label>
                            <input type="text" name="certificate_number_format" defaultValue={template?.certificate_number_format} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="CERT-{YEAR}-{SEQ}" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                            <select name="status" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={template?.status || 'active'}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2">{isEdit ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Certification Issuance Module
function CertificationModule({
    summaryStats = null,
    eligibleParticipants = [],
    templates = [],
    issuedCertificates = [],
    eventsForFilter = [],
    filters = {},
    automationSettings = {},
}) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [activeTab, setActiveTab] = React.useState('eligible');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [certIdSearch, setCertIdSearch] = React.useState('');
    const [eventFilter, setEventFilter] = React.useState(filters.event_id || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    const [issuedStatusFilter, setIssuedStatusFilter] = React.useState(filters.issued_status || 'active');
    const [issueModalOpen, setIssueModalOpen] = React.useState(false);
    const [issueRow, setIssueRow] = React.useState(null);
    const [certType, setCertType] = React.useState('completion');
    const [autoIssue, setAutoIssue] = React.useState(!!automationSettings.auto_issue_when_passed);
    const [requireAttendance, setRequireAttendance] = React.useState(!!automationSettings.require_attendance);
    const [requireApproval, setRequireApproval] = React.useState(!!automationSettings.require_supervisor_approval);
    const [templateEditorOpen, setTemplateEditorOpen] = React.useState(false);
    const [editingTemplate, setEditingTemplate] = React.useState(null);

    const stats = summaryStats || { total_certified: 0, pending_certifications: 0, issued_today: 0, trend_this_week: 0 };

    const filteredEligible = eligibleParticipants.filter((row) => {
        const matchSearch = !searchTerm || row.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || row.event_title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEvent = !eventFilter || String(row.event_id) === String(eventFilter);
        const matchStatus = !statusFilter || row.cert_status === statusFilter;
        return matchSearch && matchEvent && matchStatus;
    });

    const filteredIssued = issuedCertificates.filter((c) => {
        const q = (searchTerm || '').toLowerCase().trim();
        const matchSearch = !q || (c.user?.name || '').toLowerCase().includes(q) || (c.simulation_event?.title || '').toLowerCase().includes(q) || (c.certificate_number || '').toLowerCase().includes(q);
        const matchCertId = !certIdSearch || (c.certificate_number || '').toLowerCase().includes(certIdSearch.toLowerCase());
        const matchDateFrom = !dateFrom || (c.issued_at && c.issued_at.slice(0, 10) >= dateFrom);
        const matchDateTo = !dateTo || (c.issued_at && c.issued_at.slice(0, 10) <= dateTo);
        return matchSearch && matchCertId && matchDateFrom && matchDateTo;
    });

    const buildFilterUrl = (extra = {}) => {
        const params = new URLSearchParams();
        if (eventFilter) params.set('event_id', eventFilter);
        if (statusFilter) params.set('status', statusFilter);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (issuedStatusFilter && issuedStatusFilter !== 'active') params.set('issued_status', issuedStatusFilter);
        Object.entries(extra).forEach(([k, v]) => { if (v != null && v !== '') params.set(k, v); });
        const q = params.toString();
        return q ? `/certification?${q}` : '/certification';
    };

    const handleApplyHistoryFilters = () => {
        window.location.href = buildFilterUrl();
    };

    const handleIssueCertificate = (row) => {
        setIssueRow(row);
        setIssueModalOpen(true);
    };

    const handleSubmitIssue = async (e) => {
        e.preventDefault();
        const form = e.target;
        const payload = {
            user_id: form.user_id?.value || issueRow?.user_id,
            simulation_event_id: form.simulation_event_id?.value || issueRow?.event_id,
            participant_evaluation_id: issueRow?.participant_evaluation_id || null,
            type: form.type?.value || certType,
            training_type: form.training_type?.value || '',
            completion_date: form.completion_date?.value || null,
            _token: csrf,
        };
        try {
            const res = await fetch('/certification/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Certificate Issued', text: data.message });
                setIssueModalOpen(false);
                setIssueRow(null);
                window.location.href = '/certification';
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to issue certificate.' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Request failed.' });
        }
    };

    const handleRevoke = async (certId) => {
        const { value: reason } = await Swal.fire({
            title: 'Revoke Certificate',
            input: 'textarea',
            inputLabel: 'Reason (optional)',
            showCancelButton: true,
            confirmButtonText: 'Revoke',
            confirmButtonColor: '#dc2626',
        });
        if (reason === undefined) return;
        const formData = new FormData();
        formData.append('_token', csrf);
        formData.append('reason', reason || '');
        try {
            const res = await fetch(`/certificates/${certId}/revoke`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) { Swal.fire({ icon: 'success', text: data.message }); window.location.href = '/certification'; }
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed to revoke.' }); }
    };

    const handleSaveAutomation = async () => {
        const formData = new FormData();
        formData.append('_token', csrf);
        formData.append('auto_issue_when_passed', autoIssue ? '1' : '0');
        formData.append('require_attendance', requireAttendance ? '1' : '0');
        formData.append('require_supervisor_approval', requireApproval ? '1' : '0');
        try {
            await fetch('/certification/settings', { method: 'POST', body: formData });
            Swal.fire({ icon: 'success', text: 'Settings saved.' });
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed to save.' }); }
    };

    const handleDuplicateTemplate = async (template) => {
        const formData = new FormData();
        formData.append('_token', csrf);
        try {
            const res = await fetch(`/certification/templates/${template.id}/duplicate`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) { Swal.fire({ icon: 'success', text: 'Template duplicated.' }); window.location.href = '/certification'; }
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed.' }); }
    };

    const handleDeleteTemplate = async (template) => {
        const ok = await Swal.fire({
            title: 'Delete template?',
            text: 'This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
        });
        if (!ok.isConfirmed) return;
        try {
            await fetch(`/certification/templates/${template.id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf } });
            Swal.fire({ icon: 'success', text: 'Deleted.' });
            window.location.href = '/certification';
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed.' }); }
    };

    return (
        <div className="space-y-8">
            {/* Hero Header - Premium */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <GraduationCap className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Certification Issuance</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage templates, issue certificates, and track issuance history.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => { setIssueRow(null); setIssueModalOpen(true); }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Issue Certificate
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEditingTemplate(null); setTemplateEditorOpen(true); }}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-0.5 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Add Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium KPI Cards - always on top */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Issued</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{stats.total_certified}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {typeof stats.trend_this_week === 'number' && stats.trend_this_week !== 0 ? (
                            <span className={stats.trend_this_week > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                {stats.trend_this_week > 0 ? '↑' : '↓'} {Math.abs(stats.trend_this_week)}% this week
                            </span>
                        ) : 'All time certified'}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 group">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending</p>
                    <p className="text-[32px] font-bold text-amber-800 mt-1 flex items-center gap-2">
                        {stats.pending_certifications}
                        {(stats.pending_certifications || 0) > 0 && (
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Awaiting issuance" />
                        )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting issuance</p>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Issued Today</p>
                    <p className="text-[32px] font-bold text-emerald-800 mt-1">{stats.issued_today}</p>
                    <p className="text-xs text-slate-500 mt-1">Certificates issued today</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-fit">
                <div className="flex gap-1 flex-wrap">
                    {['eligible', 'templates', 'history', 'automation'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 ${
                                activeTab === tab
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab === 'eligible' && 'Eligible Participants'}
                            {tab === 'templates' && 'Templates'}
                            {tab === 'history' && 'Issued History'}
                            {tab === 'automation' && 'Automation Rules'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters - contextual per tab */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
                <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={activeTab === 'history' ? 'Name, event, or certificate ID...' : activeTab === 'templates' ? 'Search template name...' : 'Search by name or event...'}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                    </div>
                    {(activeTab === 'eligible' || activeTab === 'history') && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Event</label>
                            <select
                                value={eventFilter}
                                onChange={(e) => setEventFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                            >
                                <option value="">All Events</option>
                                {eventsForFilter?.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 'eligible' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                            >
                                <option value="">All</option>
                                <option value="eligible">Eligible</option>
                                <option value="not_eligible">Not Eligible</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Certificate ID</label>
                                <input type="text" value={certIdSearch} onChange={(e) => setCertIdSearch(e.target.value)} placeholder="Search by cert number..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Date From</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Date To</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                                <select value={issuedStatusFilter} onChange={(e) => setIssuedStatusFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white">
                                    <option value="active">Active</option>
                                    <option value="revoked">Revoked</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                            <button type="button" onClick={handleApplyHistoryFilters} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 text-white rounded-xl font-medium text-sm transition-all duration-250">
                                <Filter className="w-4 h-4" />
                                Apply Filters
                            </button>
                        </>
                    )}
                </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <a href={`/certification/export/csv?${eventFilter ? 'event_id=' + eventFilter : ''}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all duration-200">
                            <Download className="w-4 h-4" /> Export CSV
                        </a>
                        <a href="/certification/export/pdf" className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-all duration-200">
                            <Download className="w-4 h-4" /> Export PDF
                        </a>
                    </div>
                </div>
            </div>

            {/* Eligible Participants - Profile-style rows */}
            {activeTab === 'eligible' && (
                <div className="space-y-3 transition-opacity duration-300">
                    {filteredEligible.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">No participants match filters.</div>
                    ) : (
                        filteredEligible.map((row) => {
                            const initials = getInitials(row.user_name);
                            const avatarColor = getAvatarColor(row.user_name);
                            return (
                                <div key={`${row.user_id}-${row.event_id}`} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-250">
                                    <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-md ${avatarColor}`}>
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900">{row.user_name}</p>
                                        <p className="text-sm text-slate-600 truncate">{row.event_title}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-xs text-slate-500">{row.score != null ? `${row.score}%` : '—'} score</span>
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                                                row.attendance_status === 'present' || row.attendance_status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {row.attendance_status === 'present' || row.attendance_status === 'completed' ? '✓ Present' : (row.attendance_status || '—')}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                                                row.cert_status === 'eligible' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 ring-1 ring-emerald-200/50' :
                                                row.cert_status === 'not_eligible' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                            }`}>
                                                {row.cert_status === 'eligible' ? 'Eligible' : row.cert_status === 'not_eligible' ? 'Not Eligible' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {row.certificate_issued ? (
                                            row.certificate_id && (
                                                <a href={`/certificates/${row.certificate_id}/view`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-md transition-all duration-250" title="Preview Certificate">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )
                                        ) : (
                                            <>
                                                <a href={`/simulation-events/${row.event_id}/evaluation/summary`} className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-md transition-all duration-250" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                {row.cert_status === 'eligible' && (
                                                    <button type="button" onClick={() => handleIssueCertificate(row)} className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all duration-250" title="Issue Certificate">
                                                        <Award className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <a href={`/certification/preview-participant?user_id=${row.user_id}&event_id=${row.event_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-md transition-all duration-250" title="Preview Template">
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Templates tab - Card layout */}
            {activeTab === 'templates' && (
                <div className="space-y-4 transition-opacity duration-300">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-800">Certificate Templates</h3>
                        <button type="button" onClick={() => { setEditingTemplate(null); setTemplateEditorOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 text-white rounded-xl text-sm font-medium transition-all duration-250">Add Template</button>
                    </div>
                    {templates.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">No templates yet. Add one to get started.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {templates.map((t) => (
                                <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-250">
                                    <h4 className="text-lg font-semibold text-slate-900 mb-2">{t.name}</h4>
                                    <div className="text-sm text-slate-600 space-y-1 mb-4">
                                        <p><span className="font-medium text-slate-500">Type:</span> {t.type || 'Completion'}</p>
                                        <p><span className="font-medium text-slate-500">Last Used:</span> {t.last_used_at ? formatDate(t.last_used_at) : '—'}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                            t.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {t.status === 'active' ? 'Active' : (t.status || '—')}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <a href={`/certification/templates/${t.id}/preview`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-md transition-all duration-250" title="Preview"> <Eye className="w-4 h-4" /> </a>
                                            <button type="button" onClick={() => { setEditingTemplate(t); setTemplateEditorOpen(true); }} className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all duration-250" title="Edit"> <Pencil className="w-4 h-4" /> </button>
                                            <button type="button" onClick={() => handleDuplicateTemplate(t)} className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:shadow-md transition-all duration-250" title="Duplicate"> <Copy className="w-4 h-4" /> </button>
                                            <button type="button" onClick={() => handleDeleteTemplate(t)} className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow-md transition-all duration-250" title="Delete"> <Trash2 className="w-4 h-4" /> </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Issued History - Modern table */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800">Issued Certificates</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Certificate ID</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Issue Date</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Issued By</th>
                                    <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredIssued.length === 0 ? (
                                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No issued certificates.</td></tr>
                                ) : (
                                    filteredIssued.map((c, idx) => (
                                        <tr key={c.id} className={`hover:bg-slate-50/80 transition-colors duration-200 ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                                            <td className="px-5 py-4 font-mono text-xs text-slate-700">{c.certificate_number}</td>
                                            <td className="px-5 py-4 font-medium text-slate-800">{c.user?.name}</td>
                                            <td className="px-5 py-4 text-slate-600">{c.simulation_event?.title}</td>
                                            <td className="px-5 py-4 text-slate-600">{c.issued_at ? formatDateTime(c.issued_at) : '—'}</td>
                                            <td className="px-5 py-4 text-slate-600">{c.issuer?.name || '—'}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a href={`/certificates/${c.id}/view`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-md transition-all" title="View / Print PDF">
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                    <button type="button" onClick={() => handleRevoke(c.id)} className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow-md transition-all" title="Revoke">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    <a href="/certification" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all" title="Reissue">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Automation Rules - Rule cards */}
            {activeTab === 'automation' && (
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-800">Automation Rules</h3>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-250">
                            <div className="flex items-start gap-4">
                                <input type="checkbox" checked={autoIssue} onChange={(e) => setAutoIssue(e.target.checked)} className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">When score ≥ 70%</p>
                                    <p className="text-sm text-slate-600 mt-0.5">AND certification eligible = Yes</p>
                                    <p className="text-sm text-emerald-600 font-medium mt-2">→ Auto Issue Certificate</p>
                                    <span className={`inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 text-xs font-semibold ${autoIssue ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${autoIssue ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {autoIssue ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-250">
                            <div className="flex items-start gap-4">
                                <input type="checkbox" checked={requireAttendance} onChange={(e) => setRequireAttendance(e.target.checked)} className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">Require attendance</p>
                                    <p className="text-sm text-slate-600 mt-0.5">Participant must be marked present or completed</p>
                                    <span className={`inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 text-xs font-semibold ${requireAttendance ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${requireAttendance ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {requireAttendance ? 'Required' : 'Not required'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-250">
                            <div className="flex items-start gap-4">
                                <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">Require supervisor approval</p>
                                    <p className="text-sm text-slate-600 mt-0.5">Before auto-issuing certificate</p>
                                    <span className={`inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 text-xs font-semibold ${requireApproval ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${requireApproval ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {requireApproval ? 'Required' : 'Not required'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleSaveAutomation} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250">
                        <Zap className="w-4 h-4" /> Save Settings
                    </button>
                </div>
            )}

            {/* Issue Certificate Modal */}
            {issueModalOpen && issueRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50" onClick={() => setIssueModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Issue Certificate</h3>
                        <form onSubmit={handleSubmitIssue}>
                            <input type="hidden" name="_token" value={csrf} />
                            <input type="hidden" name="user_id" value={issueRow.user_id} />
                            <input type="hidden" name="simulation_event_id" value={issueRow.event_id} />
                            <input type="hidden" name="participant_evaluation_id" value={issueRow.participant_evaluation_id || ''} />
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Participant Name</label>
                                    <p className="text-sm text-slate-800">{issueRow.user_name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Event Name</label>
                                    <p className="text-sm text-slate-800">{issueRow.event_title}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Training Type</label>
                                    <input type="text" name="training_type" defaultValue="Disaster Preparedness Training" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Completion Date</label>
                                    <input type="date" name="completion_date" defaultValue={issueRow.event_date ? issueRow.event_date.slice(0, 10) : ''} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Final Score</label>
                                    <p className="text-sm text-slate-800">{issueRow.score != null ? `${issueRow.score}%` : '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Certificate Type</label>
                                    <select name="type" value={certType} onChange={(e) => setCertType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                                        <option value="completion">Completion</option>
                                        <option value="participation">Participation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIssueModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2">Generate Certificate</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Editor Modal */}
            {templateEditorOpen && (
                <TemplateEditorModal
                    template={editingTemplate}
                    csrf={csrf}
                    onClose={() => { setTemplateEditorOpen(false); setEditingTemplate(null); }}
                    onSaved={() => { setTemplateEditorOpen(false); setEditingTemplate(null); window.location.href = '/certification'; }}
                />
            )}
        </div>
    );
}

// Participant Components
// Participant Registration & Attendance Module
function ParticipantRegistrationAttendanceModule({ events = [], participants = [], role }) {
    const [activeTab, setActiveTab] = React.useState('participants');

    const PARTICIPANT_TABS = [
        { id: 'participants', label: 'Participant List', icon: '👥' },
        { id: 'registrations', label: 'Event Registrations', icon: '📋' },
        { id: 'attendance', label: 'Event Attendance', icon: '✓' },
    ];

    // Stats for summary cards (Certification-style, shown when on participants tab)
    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.status === 'active').length;
    const inactiveParticipants = participants.filter(p => p.status === 'inactive').length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const registeredThisMonth = participants.filter(p => {
        if (!p.created_at) return false;
        return new Date(p.created_at) >= thisMonth;
    }).length;

    return (
        <div className="space-y-6">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Users className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Participant Registration & Management</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage participant list, event registrations, and attendance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards - Certification style (below header, above tabs) */}
            {activeTab === 'participants' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Participants</p>
                        <p className="text-[32px] font-bold text-slate-900 mt-1">{totalParticipants}</p>
                        <p className="text-xs text-slate-500 mt-1">All registered</p>
                    </div>
                    <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active</p>
                        <p className="text-[32px] font-bold text-emerald-800 mt-1">{activeParticipants}</p>
                        <p className="text-xs text-slate-500 mt-1">Currently active</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inactive</p>
                        <p className="text-[32px] font-bold text-slate-900 mt-1">{inactiveParticipants}</p>
                        <p className="text-xs text-slate-500 mt-1">Deactivated</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered This Month</p>
                        <p className="text-[32px] font-bold text-slate-900 mt-1">{registeredThisMonth}</p>
                        <p className="text-xs text-slate-500 mt-1">New this month</p>
                    </div>
                </div>
            )}

            {/* Tabs - Certification style (pill strip, green active) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-fit">
                <div className="flex gap-1 flex-wrap">
                    {PARTICIPANT_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'participants' ? (
                <ParticipantsListTab participants={participants} />
            ) : activeTab === 'registrations' ? (
                <RegistrationEventsTable events={events} />
            ) : (
                <AttendanceEventsTable events={events} />
            )}
        </div>
    );
}

// Helper: Generate initials from name
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Helper: Get avatar color based on name
function getAvatarColor(name) {
    const colors = [
        'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
        'bg-amber-500', 'bg-indigo-500', 'bg-rose-500', 'bg-teal-500'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

// Tab 1: Participants List
function ParticipantsListTab({ participants = [] }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const filteredParticipants = participants.filter((p) => {
        const matchesSearch = !searchTerm ||
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.participant_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Filters - card with shadow */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <a
                            href="/participants/export/csv"
                            className="inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium px-3 py-2 w-full justify-center transition-colors"
                        >
                            📥 Export CSV
                        </a>
                    </div>
                </div>
            </div>

            {/* Participants Table - Profile Row Style */}
            <div className="space-y-3">
                {filteredParticipants.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-12 text-center text-slate-500">
                        {participants.length === 0
                            ? 'No participants registered yet. Participants will appear here after self-registration.'
                            : 'No participants match your search criteria.'}
                    </div>
                ) : (
                    filteredParticipants.map((participant) => {
                        const initials = getInitials(participant.name);
                        const avatarColor = getAvatarColor(participant.name);
                        return (
                            <div
                                key={participant.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Avatar */}
                                        <div className={`${avatarColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                                            {initials}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <a
                                                    href={`/participants/${participant.id}`}
                                                    className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors text-base"
                                                >
                                                    {participant.name}
                                                </a>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-1">{participant.email}</p>
                                            <p className="text-xs text-slate-500 font-mono">ID: {participant.participant_id || 'N/A'}</p>
                                        </div>
                                        {/* Status & Events */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    participant.status === 'active' 
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                        : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    {participant.status === 'active' ? '🟢' : '🔴'} {participant.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                <a
                                                    href={`/participants/${participant.id}`}
                                                    className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-semibold hover:bg-blue-100 transition-colors"
                                                >
                                                    Events: {participant.event_registrations_count || 0}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4 shrink-0">
                                        <a
                                            href={`/participants/${participant.id}`}
                                            className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 hover:shadow-sm transition-all duration-200"
                                        >
                                            View Profile
                                        </a>
                                        {participant.status === 'active' ? (
                                            <form
                                                method="POST"
                                                action={`/participants/${participant.id}/deactivate`}
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const result = await Swal.fire({
                                                        title: 'Deactivate Participant?',
                                                        text: 'This will prevent them from accessing the system.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Yes, deactivate',
                                                        cancelButtonText: 'Cancel',
                                                        confirmButtonColor: '#dc2626',
                                                        cancelButtonColor: '#64748b',
                                                    });
                                                    if (result.isConfirmed) e.target.submit();
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:shadow-sm transition-all duration-200"
                                                >
                                                    Deactivate
                                                </button>
                                            </form>
                                        ) : (
                                            <form
                                                method="POST"
                                                action={`/participants/${participant.id}/reactivate`}
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const result = await Swal.fire({
                                                        title: 'Reactivate Participant?',
                                                        text: 'This will restore their access to the system.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Yes, reactivate',
                                                        cancelButtonText: 'Cancel',
                                                        confirmButtonColor: '#16a34a',
                                                        cancelButtonColor: '#64748b',
                                                    });
                                                    if (result.isConfirmed) e.target.submit();
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 hover:shadow-sm transition-all duration-200"
                                                >
                                                    Reactivate
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Registrations Tab - Shows events with registration management
function RegistrationEventsTable({ events = [] }) {
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const visibleEvents = events.filter(e => ['published', 'ongoing', 'completed'].includes(e.status));

    const filteredEvents = visibleEvents.filter((e) => {
        const matchesSearch = !searchTerm ||
            e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.scenario?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalItems = filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleExportCsv = () => {
        const escapeCsv = (value) => {
            const str = String(value ?? '');
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = [
            ['Event Title', 'Scenario', 'Status', 'Date', 'Start Time', 'End Time', 'Location', 'Registrations'],
            ...filteredEvents.map((event) => ([
                event.title ?? '',
                event.scenario?.title ?? '',
                event.status ?? '',
                formatDate(event.event_date),
                formatTime(event.start_time),
                formatTime(event.end_time),
                event.location ?? '',
                event.registrations_count ?? 0,
            ])),
        ];

        const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    React.useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1);
    }, [currentPage, totalPages]);

    return (
        <div>
            {/* Filters - card with shadow like Resources */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by event title, scenario, or location..."
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium px-3 py-2 w-full justify-center"
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Cards Layout */}
            <div className="space-y-4">
                {pageEvents.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-12 text-center text-slate-500">
                        {visibleEvents.length === 0 ? 'No published/ongoing/completed events yet.' : 'No events match your search criteria.'}
                    </div>
                ) : (
                    <>
                        {pageEvents.map((event) => {
                            const statusColor = event.status === 'published' ? 'bg-blue-100 text-blue-800' :
                                event.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' :
                                    event.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-slate-100 text-slate-700';
                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-2">📘 {event.title}</h3>
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <span>📍</span>
                                                        <span>{event.location || 'Location TBD'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>🗓</span>
                                                        <span>
                                                            {formatDate(event.event_date)} | {formatTime(event.start_time)}–{formatTime(event.end_time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600">👥</span>
                                                <span className="text-sm font-medium text-slate-900">{event.registrations_count || 0} Registered</span>
                                            </div>
                                            <a
                                                href={`/simulation-events/${event.id}/registrations`}
                                                className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                            >
                                                Manage Registrations
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={totalItems}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

// Attendance Tab - Shows events with attendance tracking (card + shadow style like Resources)
function AttendanceEventsTable({ events = [] }) {
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const visibleEvents = events.filter(e => ['published', 'ongoing', 'completed'].includes(e.status));

    const filteredEvents = visibleEvents.filter((e) => {
        const matchesSearch = !searchTerm ||
            e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.scenario?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalItems = filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleExportCsv = () => {
        const escapeCsv = (value) => {
            const str = String(value ?? '');
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = [
            ['Event Title', 'Scenario', 'Status', 'Date', 'Start Time', 'End Time', 'Location', 'Approved Participants'],
            ...filteredEvents.map((event) => ([
                event.title ?? '',
                event.scenario?.title ?? '',
                event.status ?? '',
                formatDate(event.event_date),
                formatTime(event.start_time),
                formatTime(event.end_time),
                event.location ?? '',
                event.approved_registrations_count ?? 0,
            ])),
        ];

        const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_attendance_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    React.useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1);
    }, [currentPage, totalPages]);

    return (
        <div>
            {/* Filters - card with shadow like Resources */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by event title, scenario, or location..."
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium px-3 py-2 w-full justify-center"
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Cards Layout */}
            <div className="space-y-4">
                {pageEvents.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-12 text-center text-slate-500">
                        {visibleEvents.length === 0 ? 'No published/ongoing/completed events yet.' : 'No events match your search criteria.'}
                    </div>
                ) : (
                    <>
                        {pageEvents.map((event) => {
                            const statusColor = event.status === 'published' ? 'bg-blue-100 text-blue-800' :
                                event.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' :
                                    event.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-slate-100 text-slate-700';
                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-2">📘 {event.title}</h3>
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <span>📍</span>
                                                        <span>{event.location || 'Location TBD'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>🗓</span>
                                                        <span>
                                                            {formatDate(event.event_date)} | {formatTime(event.start_time)}–{formatTime(event.end_time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600">👥</span>
                                                <span className="text-sm font-medium text-slate-900">{event.approved_registrations_count || 0} Approved Participants</span>
                                            </div>
                                            <a
                                                href={`/simulation-events/${event.id}/attendance`}
                                                className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                            >
                                                Track Attendance
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={totalItems}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

function ParticipantsTable({ participants = [], role }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const filteredParticipants = participants.filter((p) => {
        const matchesSearch = !searchTerm ||
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.participant_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Standardized status colors - stronger and consistent
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'inactive': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg shadow-md">
                        <Users className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Participants</h2>
                </div>
                <div className="flex gap-2">
                    <a
                        href="/participants/export/csv"
                        className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium px-3 py-1.5"
                    >
                        Export CSV
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or Participant ID..."
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Participant ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Phone</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Events Registered</th>
                            <th className="px-4 py-2 text-left">Attendances</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-slate-500 text-sm">
                                    {participants.length === 0
                                        ? 'No participants registered yet.'
                                        : 'No participants match your search criteria.'}
                                </td>
                            </tr>
                        ) : (
                            filteredParticipants.map((participant) => (
                                <tr key={participant.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                                        {participant.participant_id || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                        <a
                                            href={`/participants/${participant.id}`}
                                            className="text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                        >
                                            {participant.name}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">{participant.email}</td>
                                    <td className="px-4 py-2 text-slate-600">{participant.phone || '—'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(participant.status)}`}>
                                            {participant.status === 'active' ? '🟢' : '🔴'} {participant.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-center">
                                        {participant.event_registrations_count || 0}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-center">
                                        {participant.attendances_count || 0}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2 items-center">
                                            {participant.status === 'active' ? (
                                                <form
                                                    method="POST"
                                                    action={`/participants/${participant.id}/deactivate`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Deactivate this participant?',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, deactivate',
                                                            cancelButtonText: 'Cancel',
                                                            confirmButtonColor: '#f97316',
                                                            cancelButtonColor: '#64748b',
                                                        });
                                                        if (result.isConfirmed) e.target.submit();
                                                    }}
                                                >
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 hover:shadow-sm transition-all duration-200"
                                                    >
                                                        Deactivate
                                                    </button>
                                                </form>
                                            ) : (
                                                <form
                                                    method="POST"
                                                    action={`/participants/${participant.id}/reactivate`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Reactivate this participant?',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, reactivate',
                                                            cancelButtonText: 'Cancel',
                                                            confirmButtonColor: '#16a34a',
                                                            cancelButtonColor: '#64748b',
                                                        });
                                                        if (result.isConfirmed) e.target.submit();
                                                    }}
                                                >
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 hover:shadow-sm transition-all duration-200"
                                                    >
                                                        Reactivate
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ParticipantDetail({ participant }) {
    const [activeTab, setActiveTab] = React.useState('overview');
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const initials = getInitials(participant.name);
    const avatarColor = getAvatarColor(participant.name);
    const statusColor = participant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
    const statusIcon = participant.status === 'active' ? '🟢' : '🔴';

    return (
        <div>
            <div className="mb-4">
                <a href="/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors">
                    ← Back to Participants
                </a>
            </div>

            {/* Profile Header Card */}
            <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`${avatarColor} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0`}>
                            {initials}
                        </div>
                        {/* Info */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">{participant.name}</h1>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                                    {statusIcon} {participant.status === 'active' ? 'Active Participant' : 'Inactive Participant'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600">
                                Registered: {formatDateTime(participant.registered_at || participant.created_at)}
                            </p>
                        </div>
                    </div>
                    {/* Action Button */}
                    <div>
                        {participant.status === 'active' ? (
                            <form
                                method="POST"
                                action={`/participants/${participant.id}/deactivate`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const result = await Swal.fire({
                                        title: 'Deactivate Participant?',
                                        text: 'This will prevent them from accessing the system.',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonText: 'Yes, deactivate',
                                        cancelButtonText: 'Cancel',
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#64748b',
                                    });
                                    if (result.isConfirmed) e.target.submit();
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:shadow-sm transition-all duration-200"
                                >
                                    Deactivate
                                </button>
                            </form>
                        ) : (
                            <form
                                method="POST"
                                action={`/participants/${participant.id}/reactivate`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const result = await Swal.fire({
                                        title: 'Reactivate Participant?',
                                        text: 'This will restore their access to the system.',
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonText: 'Yes, reactivate',
                                        cancelButtonText: 'Cancel',
                                        confirmButtonColor: '#16a34a',
                                        cancelButtonColor: '#64748b',
                                    });
                                    if (result.isConfirmed) e.target.submit();
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 hover:shadow-sm transition-all duration-200"
                                >
                                    Reactivate
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'registrations', label: 'Event Registrations' },
                        { id: 'attendance', label: 'Attendance History' },
                        { id: 'certificates', label: 'Certificates' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-250 ease-out ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Participant Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Participant ID</label>
                            <div className="text-sm text-slate-900 font-mono">{participant.participant_id || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
                                {statusIcon} {participant.status || 'active'}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                            <div className="text-sm text-slate-900">{participant.name}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                            <div className="text-sm text-slate-900">{participant.email}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                            <div className="text-sm text-slate-900">{participant.phone || '—'}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registered At</label>
                            <div className="text-sm text-slate-900">
                                {formatDateTime(participant.registered_at || participant.created_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'registrations' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Registrations</h3>
                    {participant.event_registrations && participant.event_registrations.length > 0 ? (
                        <div className="space-y-3">
                            {participant.event_registrations.map((reg) => {
                                const regStatusColor = reg.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                    reg.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                        'bg-red-100 text-red-800';
                                return (
                                    <div key={reg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 mb-1">
                                                    {reg.simulation_event?.title || 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    Registered: {formatDateTime(reg.registered_at)}
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${regStatusColor}`}>
                                                {reg.status === 'approved' ? '✅' : reg.status === 'pending' ? '⏳' : '❌'} {reg.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No event registrations yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance History</h3>
                    {participant.attendances && participant.attendances.length > 0 ? (
                        <div className="space-y-4">
                            {participant.attendances.map((attendance, idx) => {
                                const attStatusColor = attendance.status === 'present' ? 'text-emerald-600' :
                                    attendance.status === 'late' ? 'text-amber-600' :
                                        attendance.status === 'absent' ? 'text-red-600' :
                                            'text-slate-600';
                                const attStatusIcon = attendance.status === 'present' ? '🟢' :
                                    attendance.status === 'late' ? '🟡' :
                                        attendance.status === 'absent' ? '🔴' :
                                            '⚪';
                                return (
                                    <div key={attendance.id} className="flex gap-4 items-start">
                                        {/* Timeline Line */}
                                        {idx < participant.attendances.length - 1 && (
                                            <div className="w-0.5 h-full bg-slate-200 mt-2 -mb-4"></div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className={`text-xl shrink-0 ${attStatusColor}`}>{attStatusIcon}</div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-slate-900 mb-1">
                                                        {attendance.simulation_event?.title || 'N/A'}
                                                    </div>
                                                    <div className={`text-sm font-medium ${attStatusColor} mb-1`}>
                                                        {attendance.status ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : 'Not Marked'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {attendance.checked_in_at
                                                            ? `${new Date(attendance.checked_in_at).toLocaleDateString()} | ${new Date(attendance.checked_in_at).toLocaleTimeString()}`
                                                            : 'No check-in time'}
                                                        {attendance.check_in_method && ` • ${attendance.check_in_method}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No attendance records yet.</p>
                    )}
                </div>
            )}

            {activeTab === 'certificates' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Certificates</h3>
                    <p className="text-slate-500 text-sm">Certificate management coming soon.</p>
                </div>
            )}
        </div>
    );
}

function EventRegistrationsTable({ event, registrations = [] }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    // Calculate registration statistics
    const pendingCount = registrations.filter(r => r.status === 'pending').length;
    const approvedCount = registrations.filter(r => r.status === 'approved').length;
    const rejectedCount = registrations.filter(r => r.status === 'rejected').length;
    const totalSlots = event.max_participants || 'Unlimited';
    const slotsUsed = approvedCount;

    return (
        <div>
            <div className="mb-4">
                <a href="/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Participants
                </a>
            </div>

            {/* Event Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{event.title}</h3>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${event.status === 'published' ? 'bg-blue-50 text-blue-700' :
                                event.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700' :
                                    event.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                                        event.status === 'draft' ? 'bg-slate-50 text-slate-700' :
                                            event.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                                'bg-slate-100 text-slate-600'
                                }`}>
                                {event.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-600">Date:</span>
                                <span className="ml-2 font-medium text-slate-800">{formatDate(event.event_date)}</span>
                            </div>
                            <div>
                                <span className="text-slate-600">Time:</span>
                                <span className="ml-2 font-medium text-slate-800">{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                            </div>
                            <div>
                                <span className="text-slate-600">Location:</span>
                                <span className="ml-2 font-medium text-slate-800">{event.location || 'TBD'}</span>
                            </div>
                            <div>
                                <span className="text-slate-600">Slots:</span>
                                <span className="ml-2 font-medium text-slate-800">{slotsUsed} / {totalSlots}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase mb-1">Registration Status</div>
                        <div className="space-y-1">
                            <div className="text-sm">
                                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                                    {pendingCount} Pending
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                                    {approvedCount} Approved
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-semibold">
                                    {rejectedCount} Rejected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Participant</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Registered At</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">No registrations yet.</td>
                            </tr>
                        ) : (
                            registrations.map((reg) => (
                                <tr key={reg.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium text-slate-800">{reg.user?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 text-slate-600">{reg.user?.email || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getRegistrationStatusColor(reg.status)}`}>
                                            {reg.status === 'approved' ? '✅' : reg.status === 'pending' ? '⏳' : reg.status === 'rejected' ? '❌' : ''} {reg.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-xs">{formatDateTime(reg.registered_at)}</td>
                                    <td className="px-4 py-2">
                                        {reg.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <form method="POST" action={`/event-registrations/${reg.id}/approve`} onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const result = await Swal.fire({
                                                        title: 'Warning!', text: 'Approve this registration?', icon: 'warning',
                                                        showCancelButton: true, confirmButtonText: 'Yes, approve', cancelButtonText: 'Cancel',
                                                        confirmButtonColor: '#16a34a', cancelButtonColor: '#64748b',
                                                    });
                                                    if (result.isConfirmed) e.target.submit();
                                                }}>
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <button type="submit" className="inline-flex items-center rounded-lg border border-blue-500 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 hover:shadow-sm transition-all duration-200">✅ Approve</button>
                                                </form>
                                                <form method="POST" action={`/event-registrations/${reg.id}/reject`} onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const { value: reason } = await Swal.fire({
                                                        title: 'Reject Registration', input: 'textarea', inputLabel: 'Rejection Reason',
                                                        inputPlaceholder: 'Enter reason...', showCancelButton: true, confirmButtonText: 'Reject',
                                                        confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
                                                        inputValidator: (value) => !value ? 'You need to provide a reason!' : null
                                                    });
                                                    if (reason) {
                                                        const form = document.createElement('form');
                                                        form.method = 'POST'; form.action = `/event-registrations/${reg.id}/reject`;
                                                        const csrfInput = document.createElement('input');
                                                        csrfInput.type = 'hidden'; csrfInput.name = '_token'; csrfInput.value = csrf;
                                                        const reasonInput = document.createElement('input');
                                                        reasonInput.type = 'hidden'; reasonInput.name = 'rejection_reason'; reasonInput.value = reason;
                                                        form.appendChild(csrfInput); form.appendChild(reasonInput);
                                                        document.body.appendChild(form); form.submit();
                                                    }
                                                }}>
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <button type="submit" className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 hover:shadow-sm transition-all duration-200">❌ Reject</button>
                                                </form>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EventAttendanceTable({ event, registrations = [] }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    // Calculate attendance statistics
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
    const totalRegistered = approvedRegistrations.length;
    const presentCount = approvedRegistrations.filter(reg => reg.attendance?.status === 'present').length;
    const lateCount = approvedRegistrations.filter(reg => reg.attendance?.status === 'late').length;
    const absentCount = approvedRegistrations.filter(reg => reg.attendance?.status === 'absent').length;
    const excusedCount = approvedRegistrations.filter(reg => reg.attendance?.status === 'excused').length;
    const notMarkedCount = approvedRegistrations.filter(reg => !reg.attendance || !reg.attendance.status).length;
    const attendanceRate = totalRegistered > 0 ? Math.round(((presentCount + lateCount) / totalRegistered) * 100) : 0;

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <a href="/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">← Back to Participants</a>
                <div className="flex gap-2">
                    <a href={`/simulation-events/${event.id}/attendance/export`} className="inline-flex items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5">📥 Export CSV</a>
                    <form method="POST" action={`/simulation-events/${event.id}/attendance/lock`} onSubmit={async (e) => {
                        e.preventDefault();
                        const result = await Swal.fire({
                            title: 'Warning!', text: 'Lock attendance records? This cannot be undone.', icon: 'warning',
                            showCancelButton: true, confirmButtonText: 'Yes, lock', cancelButtonText: 'Cancel',
                            confirmButtonColor: '#f97316', cancelButtonColor: '#64748b',
                        });
                        if (result.isConfirmed) e.target.submit();
                    }}>
                        <input type="hidden" name="_token" value={csrf} />
                        <button type="submit" className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1.5">🔒 Lock Attendance</button>
                    </form>
                </div>
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">Event: {event.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${event.status === 'published' ? 'bg-blue-50 text-blue-700' :
                        event.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700' :
                            event.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                                event.status === 'draft' ? 'bg-slate-50 text-slate-700' :
                                    event.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                        'bg-slate-100 text-slate-600'
                        }`}>
                        {event.status}
                    </span>
                </div>
                <div className="text-xs text-slate-600">{formatDate(event.event_date)} • {event.location || 'Location TBD'}</div>
            </div>

            {/* Attendance Dashboard - Visual Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl shadow-sm border border-emerald-200 p-6 mb-4">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">📊 Attendance Dashboard</h3>
                    {!event.attendance_locked && (
                        <div className="flex gap-2">
                            <form method="POST" action={`/simulation-events/${event.id}/attendance/bulk`} onSubmit={async (e) => {
                                e.preventDefault();
                                const result = await Swal.fire({
                                    title: 'Mark All Present?',
                                    text: `Mark all ${totalRegistered} participants as present?`,
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, mark all present',
                                    cancelButtonText: 'Cancel',
                                    confirmButtonColor: '#16a34a',
                                    cancelButtonColor: '#64748b',
                                });
                                if (result.isConfirmed) {
                                    const form = e.target;
                                    const statusInput = document.createElement('input');
                                    statusInput.type = 'hidden';
                                    statusInput.name = 'status';
                                    statusInput.value = 'present';
                                    form.appendChild(statusInput);
                                    form.submit();
                                }
                            }}>
                                <input type="hidden" name="_token" value={csrf} />
                                <button type="submit" className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                                    Mark All Present
                                </button>
                            </form>
                            <form method="POST" action={`/simulation-events/${event.id}/attendance/bulk`} onSubmit={async (e) => {
                                e.preventDefault();
                                const result = await Swal.fire({
                                    title: 'Mark All Absent?',
                                    text: `Mark all ${totalRegistered} participants as absent?`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, mark all absent',
                                    cancelButtonText: 'Cancel',
                                    confirmButtonColor: '#dc2626',
                                    cancelButtonColor: '#64748b',
                                });
                                if (result.isConfirmed) {
                                    const form = e.target;
                                    const statusInput = document.createElement('input');
                                    statusInput.type = 'hidden';
                                    statusInput.name = 'status';
                                    statusInput.value = 'absent';
                                    form.appendChild(statusInput);
                                    form.submit();
                                }
                            }}>
                                <input type="hidden" name="_token" value={csrf} />
                                <button type="submit" className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                                    Mark All Absent
                                </button>
                            </form>
                        </div>
                    )}
                </div>
                
                {/* Large Circular Progress Chart */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-base font-semibold text-slate-900">Attendance Rate</span>
                            <span className="text-3xl font-bold text-emerald-600">{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${attendanceRate}%` }}
                            >
                                {attendanceRate > 10 && (
                                    <span className="text-xs font-semibold text-white">{attendanceRate}%</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                            {presentCount + lateCount} of {totalRegistered} participants attended
                        </div>
                    </div>
                    
                    {/* Status Counters */}
                    <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">🟢 Present</span>
                                <span className="text-xl font-bold text-emerald-600">{presentCount}</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-amber-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">🟡 Late</span>
                                <span className="text-xl font-bold text-amber-600">{lateCount}</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">🔴 Absent</span>
                                <span className="text-xl font-bold text-red-600">{absentCount}</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">⚪ Not Marked</span>
                                <span className="text-xl font-bold text-slate-600">{notMarkedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Participant</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Check-in Method</th>
                            <th className="px-4 py-2 text-left">Checked In At</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.filter(reg => reg.status === 'approved').length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">No approved registrations for this event.</td></tr>
                        ) : (
                            registrations.filter(reg => reg.status === 'approved').map((reg) => {
                                const attendance = reg.attendance;
                                const isMarked = attendance && attendance.status;
                                return (
                                    <tr key={reg.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-800">{reg.user?.name || 'N/A'}</td>
                                        <td className="px-4 py-2">
                                            {isMarked ? (
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    attendance.status === 'present' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                        attendance.status === 'late' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                            attendance.status === 'absent' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                                attendance.status === 'excused' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {attendance.status === 'present' ? '🟢' : attendance.status === 'late' ? '🟡' : attendance.status === 'absent' ? '🔴' : ''} {attendance.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600">Not marked</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{attendance?.check_in_method || 'Manual'}</td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{attendance?.checked_in_at ? formatDateTime(attendance.checked_in_at) : '—'}</td>
                                        <td className="px-4 py-2">
                                            {!attendance?.is_locked && !isMarked ? (
                                                <div className="flex gap-2">
                                                    <form
                                                        method="POST"
                                                        action={`/attendances/${attendance?.id || 'new'}`}
                                                        onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const result = await Swal.fire({
                                                                title: 'Mark as Present?',
                                                                text: `Mark ${reg.user?.name || 'this participant'} as present for this event?`,
                                                                icon: 'question',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Yes, mark present',
                                                                cancelButtonText: 'Cancel',
                                                                confirmButtonColor: '#16a34a',
                                                                cancelButtonColor: '#64748b',
                                                            });
                                                            if (!result.isConfirmed) {
                                                                return;
                                                            }
                                                            if (!attendance?.id) {
                                                                const form = document.createElement('form');
                                                                form.method = 'POST';
                                                                form.action = `/event-registrations/${reg.id}/attendance`;
                                                                const csrfInput = document.createElement('input');
                                                                csrfInput.type = 'hidden';
                                                                csrfInput.name = '_token';
                                                                csrfInput.value = csrf;
                                                                const statusInput = document.createElement('input');
                                                                statusInput.type = 'hidden';
                                                                statusInput.name = 'status';
                                                                statusInput.value = 'present';
                                                                const methodInput = document.createElement('input');
                                                                methodInput.type = 'hidden';
                                                                methodInput.name = 'check_in_method';
                                                                methodInput.value = 'manual';
                                                                form.appendChild(csrfInput);
                                                                form.appendChild(statusInput);
                                                                form.appendChild(methodInput);
                                                                document.body.appendChild(form);
                                                                form.submit();
                                                            } else {
                                                                e.target.submit();
                                                            }
                                                        }}
                                                    >
                                                        <input type="hidden" name="_token" value={csrf} />
                                                        <input type="hidden" name="_method" value={attendance?.id ? 'PUT' : 'POST'} />
                                                        <input type="hidden" name="status" value="present" />
                                                        <input type="hidden" name="check_in_method" value="manual" />
                                                        <button
                                                            type="submit"
                                                            className="inline-flex items-center rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 hover:shadow-sm transition-all duration-200"
                                                        >
                                                            🟢 Present
                                                        </button>
                                                    </form>
                                                    <form
                                                        method="POST"
                                                        action={`/attendances/${attendance?.id || 'new'}`}
                                                        onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const result = await Swal.fire({
                                                                title: 'Mark as Absent?',
                                                                text: `Mark ${reg.user?.name || 'this participant'} as absent for this event?`,
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Yes, mark absent',
                                                                cancelButtonText: 'Cancel',
                                                                confirmButtonColor: '#dc2626',
                                                                cancelButtonColor: '#64748b',
                                                            });
                                                            if (!result.isConfirmed) {
                                                                return;
                                                            }
                                                            if (!attendance?.id) {
                                                                const form = document.createElement('form');
                                                                form.method = 'POST';
                                                                form.action = `/event-registrations/${reg.id}/attendance`;
                                                                const csrfInput = document.createElement('input');
                                                                csrfInput.type = 'hidden';
                                                                csrfInput.name = '_token';
                                                                csrfInput.value = csrf;
                                                                const statusInput = document.createElement('input');
                                                                statusInput.type = 'hidden';
                                                                statusInput.name = 'status';
                                                                statusInput.value = 'absent';
                                                                const methodInput = document.createElement('input');
                                                                methodInput.type = 'hidden';
                                                                methodInput.name = 'check_in_method';
                                                                methodInput.value = 'manual';
                                                                form.appendChild(csrfInput);
                                                                form.appendChild(statusInput);
                                                                form.appendChild(methodInput);
                                                                document.body.appendChild(form);
                                                                form.submit();
                                                            } else {
                                                                e.target.submit();
                                                            }
                                                        }}
                                                    >
                                                        <input type="hidden" name="_token" value={csrf} />
                                                        <input type="hidden" name="_method" value={attendance?.id ? 'PUT' : 'POST'} />
                                                        <input type="hidden" name="status" value="absent" />
                                                        <input type="hidden" name="check_in_method" value="manual" />
                                                        <button
                                                            type="submit"
                                                            className="inline-flex items-center rounded-lg border border-red-500 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 hover:shadow-sm transition-all duration-200"
                                                        >
                                                            🔴 Absent
                                                        </button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Evaluation Dashboard Component
function EvaluationDashboard({ events }) {
    const [search, setSearch] = React.useState(new URLSearchParams(window.location.search).get('search') || '');
    const [statusFilter, setStatusFilter] = React.useState(new URLSearchParams(window.location.search).get('status') || '');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const getStatusColor = (status) => {
        switch (status) {
            case 'not_started': return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'locked': return 'bg-amber-100 text-amber-800 border border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'not_started':
                return 'Not Started';
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'locked':
                return 'Locked';
            default:
                return 'Not Started';
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');
        if (statusFilter) url.searchParams.set('status', statusFilter);
        else url.searchParams.delete('status');
        url.searchParams.delete('page'); // Reset page on new search
        window.location.href = url.toString();
    };

    const evList = events || [];
    const totalEvents = evList.length;
    const inProgressCount = evList.filter(e => e.evaluation_status === 'in_progress').length;
    const completedCount = evList.filter(e => e.evaluation_status === 'completed').length;
    const notStartedCount = evList.filter(e => e.evaluation_status === 'not_started' || !e.evaluation_status).length;

    const totalPages = Math.ceil(totalEvents / itemsPerPage);
    const paginatedEvents = evList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getEvalStatusIcon = (status) => {
        switch (status) {
            case 'in_progress': return '🔵';
            case 'completed': return '🟢';
            case 'locked': return '🟡';
            default: return '⚪';
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <ClipboardList className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Evaluation &amp; Scoring System</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Evaluate participants, track scores, and view evaluation summaries by event.
                        </p>
                    </div>
                </div>
            </div>

            {/* Evaluation Overview Stats - Certification-style premium KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Events</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{totalEvents}</p>
                    <p className="text-xs text-slate-500 mt-1">All events</p>
                </div>
                <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">In Progress</p>
                    <p className="text-[32px] font-bold text-blue-800 mt-1">{inProgressCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Evaluation in progress</p>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Completed</p>
                    <p className="text-[32px] font-bold text-emerald-800 mt-1">{completedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Evaluations completed</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Not Started</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{notStartedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Not yet started</p>
                </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 drop-shadow-sm" />
                        <input
                            type="text"
                            placeholder="Search by event title..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="locked">Locked</option>
                        </select>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </form>
            </div>

            {/* Event Cards (Smart Cards instead of table) */}
            <div className="space-y-4">
                {paginatedEvents.length > 0 ? (
                    <>
                        {paginatedEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 p-5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">📘 {event.title}</h3>
                                        <p className="text-sm text-slate-600">
                                            Scenario: {event.scenario_name || 'N/A'} | Date: {formatDate(event.event_date)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(event.evaluation_status)}`}>
                                            {getEvalStatusIcon(event.evaluation_status)} {getStatusLabel(event.evaluation_status)}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                            event.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                            event.status === 'ongoing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            {event.status?.charAt(0).toUpperCase()}{event.status?.slice(1)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{event.participant_count ?? 0}</span> Participants
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <a
                                            href={`/simulation-events/${event.id}/evaluation`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg font-medium text-sm transition-all duration-200"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            Evaluate
                                        </a>
                                        <a
                                            href={`/simulation-events/${event.id}/evaluation/summary`}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg font-medium text-sm transition-all duration-200"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Summary
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalEvents}
                            />
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-12 text-center text-slate-500">
                        No events matching your search or filters.
                    </div>
                )}
            </div>
        </div>
    );
}

// Evaluation Participants List Component
function EvaluationParticipantsList({ event, evaluation, criteria, attendances, participantEvaluations }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    // Debug: Log participantEvaluations to see the structure (remove in production)
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Participant Evaluations:', participantEvaluations);
            console.log('Is Array:', Array.isArray(participantEvaluations));
            console.log('Type:', typeof participantEvaluations);
        }
    }, [participantEvaluations]);

    const getEvaluationStatus = (userId) => {
        // Handle both object and array formats
        const pe = Array.isArray(participantEvaluations)
            ? participantEvaluations.find(p => String(p.user_id) === String(userId))
            : participantEvaluations?.[userId] || participantEvaluations?.[String(userId)];

        // No record or anything other than "submitted" = Not Evaluated
        if (!pe || pe.status !== 'submitted') {
            return { label: 'Not Evaluated', color: 'text-slate-500' };
        }

        // Submitted = Evaluated
        return { label: 'Evaluated', color: 'text-emerald-600' };
    };

    const participants = React.useMemo(() => {
        const rows = Array.isArray(attendances) ? attendances : [];
        const seen = new Set();
        const out = [];

        for (const a of rows) {
            const userId = a?.user_id ?? a?.user?.id;
            if (!userId) continue;
            const key = String(userId);
            if (seen.has(key)) continue;
            seen.add(key);

            out.push({
                user_id: userId,
                user: a?.user || null,
                attendance_status: a?.status || 'not_marked',
            });
        }

        return out;
    }, [attendances]);

    const handleLockEvaluation = async () => {
        if (!confirm('Are you sure you want to lock this evaluation? Once locked, scores cannot be modified.')) {
            return;
        }

        try {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/evaluations/${evaluation.id}/lock`;

            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = csrf;
            form.appendChild(tokenInput);

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            alert('Failed to lock evaluation');
        }
    };

    // Open Evaluation page intentionally does not include
    // "overall performance" and export actions (those live in Summary).

    // Get current date for footer
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="space-y-4 print-container">
            <style>{`
                /* Print-only elements: hidden on screen */
                .print-only {
                    display: none !important;
                }
                @media print {
                    @page {
                        size: A4;
                        margin: 2cm 1.5cm;
                    }
                    
                    /* Hide all UI elements - sidebar, topbar, buttons, etc. */
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Reset layout for print - full width, no sidebar margin */
                    html, body {
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    
                    #app,
                    #app > div,
                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: none !important;
                        background: #ffffff !important;
                    }
                    
                    /* Show print container and make it full width */
                    .print-container {
                        display: block !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Print-only: hidden on screen, visible when printing */
                    .print-only {
                        display: block !important;
                    }
                    
                    .print-only.print-body table {
                        display: table !important;
                    }
                    
                    .print-container {
                        max-width: 100% !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    
                    /* Remove all colors and styling */
                    * {
                        color: #000000 !important;
                        background: #ffffff !important;
                        border-color: #000000 !important;
                    }
                    
                    .print-container [class*="bg-"],
                    .print-container [class*="from-"],
                    .print-container [class*="to-"] {
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                    }
                    
                    .print-container [class*="text-"] {
                        color: #000000 !important;
                    }
                    
                    .print-container [class*="border-"] {
                        border-color: #000000 !important;
                    }
                    
                    .print-container [class*="rounded"],
                    .print-container [class*="shadow"] {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    
                    /* Header Section */
                    .print-header {
                        text-align: center;
                        margin-bottom: 24px;
                        padding-bottom: 16px;
                        border-bottom: 2px solid #000000 !important;
                        page-break-after: avoid;
                    }
                    
                    .print-header .system-name {
                        font-size: 14pt;
                        font-weight: bold;
                        margin-bottom: 4px;
                        color: #000000 !important;
                    }
                    
                    .print-header .report-title {
                        font-size: 16pt;
                        font-weight: bold;
                        margin: 8px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #000000 !important;
                    }
                    
                    .print-header .report-info {
                        font-size: 10pt;
                        margin-top: 8px;
                        line-height: 1.6;
                        color: #000000 !important;
                    }
                    
                    .print-header .report-info div {
                        margin: 4px 0;
                    }
                    
                    /* Body Section */
                    .print-body {
                        margin: 20px 0;
                        page-break-inside: avoid;
                    }
                    
                    .print-section-title {
                        font-size: 12pt;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        text-transform: uppercase;
                        border-bottom: 1px solid #000000 !important;
                        padding-bottom: 4px;
                        color: #000000 !important;
                        page-break-after: avoid;
                    }
                    
                    .print-criteria {
                        margin: 12px 0 20px 0;
                        font-size: 10pt;
                        color: #000000 !important;
                    }
                    
                    .print-criteria ul {
                        list-style: none;
                        padding-left: 0;
                        margin: 8px 0;
                    }
                    
                    .print-criteria li {
                        margin: 6px 0;
                        padding-left: 20px;
                        position: relative;
                        color: #000000 !important;
                    }
                    
                    .print-criteria li:before {
                        content: "•";
                        position: absolute;
                        left: 0;
                        color: #000000 !important;
                    }
                    
                    /* Table Styling */
                    .print-container table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 16px 0;
                        border: 2px solid #000000 !important;
                    }
                    
                    .print-container table thead {
                        background: #ffffff !important;
                    }
                    
                    .print-container table th {
                        border: 1px solid #000000 !important;
                        padding: 10px 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 10pt;
                        background: #ffffff !important;
                        border-bottom: 2px solid #000000 !important;
                    }
                    
                    .print-container table td {
                        border: 1px solid #000000 !important;
                        padding: 8px;
                        font-size: 10pt;
                        background: #ffffff !important;
                    }
                    
                    .print-container table tbody tr {
                        border-bottom: 1px solid #000000 !important;
                    }
                    
                    .print-container table tbody tr:last-child {
                        border-bottom: none !important;
                    }
                    
                    .print-container table tbody td {
                        vertical-align: top;
                    }
                    
                    /* Summary Section */
                    .print-summary {
                        margin: 24px 0;
                        padding: 12px;
                        border: 2px solid #000000 !important;
                        page-break-inside: avoid;
                    }
                    
                    .print-summary-title {
                        font-size: 12pt;
                        font-weight: bold;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        color: #000000 !important;
                    }
                    
                    .print-summary-content {
                        display: block !important;
                        font-size: 11pt;
                        color: #000000 !important;
                    }
                    
                    .print-summary-content > div {
                        margin: 8px 0;
                    }
                    
                    /* Footer Section */
                    .print-footer {
                        margin-top: 40px;
                        padding-top: 12px;
                        border-top: 1px solid #000000 !important;
                        font-size: 9pt;
                        text-align: center;
                        color: #000000 !important;
                        page-break-inside: avoid;
                    }
                    
                    .print-footer div {
                        margin: 4px 0;
                    }
                    
                    /* Hide all interactive elements */
                    .print-container button,
                    .print-container a[href]:not(.print-link),
                    .print-container [class*="hover"],
                    .print-container [onclick] {
                        display: none !important;
                    }
                    
                    /* Remove flex displays */
                    .print-container .flex,
                    .print-container .inline-flex {
                        display: block !important;
                    }
                    
                    .print-container .space-y-4 > * + * {
                        margin-top: 20px !important;
                    }
                }
            `}</style>
            
            {/* Print Header - Hidden on screen, shown when printing */}
            <div className="print-only print-header">
                <div className="system-name">Disaster Preparedness Training & Simulation</div>
                <div className="report-title">Participants Evaluation Report</div>
                <div className="report-info">
                    <div><strong>Scenario:</strong> {event.scenario?.title || 'N/A'}</div>
                    <div><strong>Location:</strong> {event.location || 'N/A'}</div>
                    <div><strong>Date:</strong> {formatDate(event.event_date)}</div>
                </div>
            </div>
            {/* Screen View - Upgraded Event Header */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-6 no-print hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{event.title}</h2>
                        <p className="text-sm text-slate-600">
                            Scenario: {event.scenario?.title || 'N/A'} | Date: {formatDate(event.event_date)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold border ${
                                evaluation.status === 'locked' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                evaluation.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                evaluation.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                                {evaluation.status === 'locked' ? '🔒 Locked' :
                                    evaluation.status === 'completed' ? '🟢 Completed' :
                                    evaluation.status === 'in_progress' ? '🔵 In Progress' : '⚪ Not Started'}
                            </span>
                            {(() => {
                                const evalsArr = Array.isArray(participantEvaluations) ? participantEvaluations : Object.values(participantEvaluations || {});
                                const submitted = evalsArr.filter(pe => (pe?.status || pe?.Status) === 'submitted');
                                const total = participants.length || 1;
                                const evaluated = submitted.length;
                            return (
                                <span className="text-sm text-slate-600 font-medium">
                                    Participants: <span className="text-slate-900">{evaluated}</span> / {total} Evaluated
                                </span>
                            );})()}
                            {evaluation.status !== 'locked' && !evaluation.locked_at && (
                                <button
                                    onClick={handleLockEvaluation}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-all text-sm font-medium"
                                    title="Lock Evaluation"
                                >
                                    <Lock className="w-4 h-4" />
                                    Lock
                                </button>
                            )}
                        </div>
                        {/* Progress bar */}
                        {(() => {
                            const evalsArr = Array.isArray(participantEvaluations) ? participantEvaluations : Object.values(participantEvaluations || {});
                            const submitted = evalsArr.filter(pe => (pe?.status || pe?.Status) === 'submitted');
                            const total = participants.length || 1;
                            const pct = total > 0 ? Math.round((submitted.length / total) * 100) : 0;
                            return (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Evaluation progress</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Screen View Content */}
            {!criteria || criteria.length === 0 ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4 no-print">
                    <p className="text-sm text-rose-700">
                        <strong>Warning:</strong> This scenario does not have evaluation criteria defined.
                        Please add criteria to the scenario before evaluating participants.
                    </p>
                </div>
            ) : (
                <>
                    {/* Screen View - Criteria as Weighted Score Cards (aggregate from evaluated) */}
                    <div className="mb-6 no-print">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Evaluation Criteria</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {criteria.map((criterion, index) => {
                                const evalsArr = Array.isArray(participantEvaluations) ? participantEvaluations : Object.values(participantEvaluations || {});
                                const submitted = evalsArr.filter(pe => (pe?.status || pe?.Status) === 'submitted');
                                let avgScore = null, maxScore = 10, passed = false;
                                if (submitted.length > 0) {
                                    const criterionName = typeof criterion === 'string' ? criterion : criterion?.name || criterion;
                                    let sum = 0, count = 0;
                                    submitted.forEach(pe => {
                                        const sc = (pe.scores || []).find(s => (s.criterion_name || s.criterion) === criterionName);
                                        if (sc) { sum += parseFloat(sc.score) || 0; count++; }
                                    });
                                    if (count > 0) {
                                        avgScore = (sum / count).toFixed(1);
                                        passed = parseFloat(avgScore) >= 7;
                                    }
                                }
                                return (
                                    <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
                                        <p className="text-sm font-medium text-slate-800 mb-2">{typeof criterion === 'string' ? criterion : criterion?.name || criterion}</p>
                                        {avgScore != null ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mr-3">
                                                    <div className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(parseFloat(avgScore) / maxScore) * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{avgScore} / {maxScore}</span>
                                                <span className={passed ? 'text-emerald-600' : 'text-rose-600'}>{passed ? '✅' : '❌'}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500">No scores yet</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Participant Evaluated Section - Screen View */}
                    {(() => {
                            // Convert participantEvaluations to array if it's an object
                            let evaluationsArray = [];
                            if (Array.isArray(participantEvaluations)) {
                                evaluationsArray = participantEvaluations;
                            } else if (participantEvaluations && typeof participantEvaluations === 'object') {
                                // Handle object keyed by user_id
                                evaluationsArray = Object.values(participantEvaluations);
                            }
                            
                            const submittedEvaluations = evaluationsArray.filter(pe => {
                                const status = pe?.status || pe?.Status;
                                return status === 'submitted';
                            });
                            
                            // (dev logs removed)
                            
                            return (
                                <>
                                    {/* Screen View - Participant Evaluated (Profile-style rows) */}
                                    <div className="border-t border-slate-200 pt-4 mb-4 no-print">
                                        <h4 className="text-sm font-semibold text-slate-800 mb-3">
                                            Participants Evaluated ({submittedEvaluations.length})
                                        </h4>
                                        {submittedEvaluations.length > 0 ? (
                                            <div className="space-y-3">
                                                {submittedEvaluations.map((pe) => {
                                                    const name = pe.user?.name || attendances?.find(a => String(a.user_id) === String(pe.user_id))?.user?.name || 'Unknown';
                                                    const attendance = attendances?.find(a => String(a.user_id) === String(pe.user_id));
                                                    const isPresent = attendance?.status === 'present' || attendance?.status === 'completed';
                                                    const totalScore = parseFloat(pe.total_score) || 0;
                                                    const maxScore = criteria ? criteria.length * 10 : 0;
                                                    const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(0) : 0;
                                                    const passed = maxScore > 0 && (totalScore / maxScore) >= 0.7;
                                                    const initials = getInitials(name);
                                                    const avatarColor = getAvatarColor(name);
                                                    return (
                                                        <div key={pe.id || `pe-${pe.user_id}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${avatarColor}`}>
                                                                {initials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-slate-900">{name}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isPresent ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                        {isPresent ? '✓ Present' : 'Not Marked'}
                                                                    </span>
                                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                        ✓ Evaluated
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 shrink-0">
                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                            <div className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-slate-900">{totalScore.toFixed(1)} / {maxScore}</span>
                                                                    </div>
                                                                    <span className="text-xs text-slate-500">{percentage}%</span>
                                                                </div>
                                                                <a
                                                                    href={`/simulation-events/${event.id}/evaluation/${pe.user_id}`}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                                                                >
                                                                    View Details
                                                                </a>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                                                <p className="text-sm text-slate-500">No participants have been evaluated yet.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                </>
                            );
                    })()}

                    {/* Participant Evaluation List (Open Evaluation page) */}
                    {(() => {
                        let evaluationsArray = [];
                        if (Array.isArray(participantEvaluations)) {
                            evaluationsArray = participantEvaluations;
                        } else if (participantEvaluations && typeof participantEvaluations === 'object') {
                            evaluationsArray = Object.values(participantEvaluations);
                        }

                        const submittedIds = new Set(
                            evaluationsArray
                                .filter((pe) => (pe?.status || pe?.Status) === 'submitted')
                                .map((pe) => String(pe.user_id))
                        );

                        const pending = participants.filter((p) => !submittedIds.has(String(p.user_id)));
                        const isLocked = evaluation?.status === 'locked' || Boolean(evaluation?.locked_at);

                        return (
                            <div className="border-t border-slate-200 pt-4 mb-4 no-print">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                                    Participants Pending Evaluation ({pending.length})
                                </h4>

                                {pending.length > 0 ? (
                                    <div className="space-y-3">
                                        {pending.map((p) => {
                                            const status = getEvaluationStatus(p.user_id);
                                            const isPresent = p.attendance_status === 'present' || p.attendance_status === 'completed';
                                            const name = p.user?.name || 'Unknown';
                                            const initials = getInitials(name);
                                            const avatarColor = getAvatarColor(name);
                                            return (
                                                <div key={`pending-${p.user_id}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${avatarColor}`}>
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900">{name}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isPresent ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                {isPresent ? '✓ Present' : 'Not Marked'}
                                                            </span>
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.label === 'Evaluated' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0">
                                                        {isLocked ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">🔒 Locked</span>
                                                        ) : (
                                                            <a
                                                                href={isPresent ? `/simulation-events/${event.id}/evaluation/${p.user_id}` : '#'}
                                                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isPresent ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)]' : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'}`}
                                                                title={isPresent ? 'Evaluate participant' : 'Participant must be marked present first'}
                                                            >
                                                                <ClipboardCheck className="w-4 h-4" />
                                                                Evaluate
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                                        <p className="text-sm text-slate-500">No participants pending evaluation.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Overall Performance Score Section - Screen View */}
                    {/* Overall Performance Score removed from Open Evaluation (use Summary instead). */}
                </>
            )}

            {/* Print Body Content - Hidden on screen, shown only when printing */}
            <div className="print-only print-body">
                {criteria && criteria.length > 0 && (
                    <>
                        {/* Print: Evaluation Criteria Section */}
                        <div className="print-section-title">
                            Evaluation Criteria
                        </div>
                        <div className="print-criteria">
                            <ul>
                                {criteria.map((criterion, index) => (
                                    <li key={index}>{criterion}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Print: Participants Table */}
                        {(() => {
                            let evaluationsArray = [];
                            if (Array.isArray(participantEvaluations)) {
                                evaluationsArray = participantEvaluations;
                            } else if (participantEvaluations && typeof participantEvaluations === 'object') {
                                evaluationsArray = Object.values(participantEvaluations);
                            }
                            
                            const submittedEvaluations = evaluationsArray.filter(pe => {
                                const status = pe?.status || pe?.Status;
                                return status === 'submitted';
                            });
                            
                            return (
                                <>
                                    <div className="print-section-title">Participants Evaluation</div>
                                    {submittedEvaluations.length > 0 && (
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Participant Name</th>
                                                    <th>Attendance</th>
                                                    <th>Evaluation Status</th>
                                                    <th>Score</th>
                                                    <th>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submittedEvaluations.map((pe) => {
                                                    const attendance = attendances?.find(a => String(a.user_id) === String(pe.user_id));
                                                    const isPresent = attendance?.status === 'present' || attendance?.status === 'completed';
                                                    const totalScore = parseFloat(pe.total_score) || 0;
                                                    const maxScore = criteria ? criteria.length * 10 : 0;
                                                    const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : '0.00';
                                                    
                                                    return (
                                                        <tr key={pe.id || `pe-print-${pe.user_id}`}>
                                                            <td>{pe.user?.name || attendance?.user?.name || 'Unknown'}</td>
                                                            <td>{isPresent ? 'Present' : 'Not Marked'}</td>
                                                            <td>Evaluated</td>
                                                            <td>{totalScore.toFixed(2)} / {maxScore}</td>
                                                            <td>{percentage}%</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                    
                                    {/* Print: Summary */}
                                    {submittedEvaluations.length > 0 && (
                                        <div className="print-summary">
                                            <div className="print-summary-title">Summary</div>
                                            <div className="print-summary-content">
                                                {(() => {
                                                    const maxScore = criteria ? criteria.length * 10 : 0;
                                                    const totalScoreSum = submittedEvaluations.reduce((sum, pe) => sum + (parseFloat(pe.total_score) || 0), 0);
                                                    const averageScore = submittedEvaluations.length > 0 ? (totalScoreSum / submittedEvaluations.length) : 0;
                                                    const averagePercentage = maxScore > 0 ? ((averageScore / maxScore) * 100) : 0;

                                                    return (
                                                        <>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <strong>Average Score:</strong> {averageScore.toFixed(2)} / {maxScore}
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <strong>Average Percentage:</strong> {averagePercentage.toFixed(2)}%
                                                            </div>
                                                            <div>
                                                                <strong>Total Participants Evaluated:</strong> {submittedEvaluations.length}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </>
                )}
            </div>
            
            {/* Print Footer - Hidden on screen, shown when printing */}
            <div className="print-only print-footer">
                <div>Generated by: Disaster Preparedness Training & Simulation</div>
                <div>Date Generated: {currentDate}</div>
            </div>
        </div>
    );
}

// Evaluation Form Component
function EvaluationForm({ event, evaluation, user, attendance, participantEvaluation, criteria, scores }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [formScores, setFormScores] = React.useState(() => {
        const initial = {};
        // Convert scores array to object if needed
        const scoresObj = scores?.reduce ? scores.reduce((acc, score) => {
            acc[score.criterion_name] = score;
            return acc;
        }, {}) : scores || {};

        criteria?.forEach((criterion) => {
            const criterionName = criterion;
            const existingScore = scoresObj?.[criterionName] || scoresObj?.[String(criterionName)];
            initial[criterionName] = {
                score: existingScore?.score || '',
                comment: existingScore?.comment || '',
            };
        });
        return initial;
    });
    const [overallFeedback, setOverallFeedback] = React.useState(participantEvaluation?.overall_feedback || '');

    const handleScoreChange = (criterion, field, value) => {
        setFormScores(prev => ({
            ...prev,
            [criterion]: {
                ...prev[criterion],
                [field]: value,
            },
        }));
    };

    // Calculate total score and percentage
    const calculateTotalScore = () => {
        const scores = Object.values(formScores).map(s => parseFloat(s.score) || 0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const maxScore = criteria ? criteria.length * 10 : 0;
        const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : 0;
        return { totalScore, maxScore, percentage };
    };

    const { totalScore, maxScore, percentage } = calculateTotalScore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: Check if all criteria have scores
        const missingScores = criteria?.filter(criterion => {
            const scoreData = formScores[criterion] || {};
            return !scoreData.score || scoreData.score === '';
        });

        if (missingScores && missingScores.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Evaluation',
                text: 'Please provide a score for all evaluation criteria before submitting.',
                confirmButtonColor: '#16a34a',
            });
            return;
        }

        // Confirmation dialog
        const result = await Swal.fire({
            title: 'Submit Final Score?',
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to submit this evaluation?</p>
                    <p class="text-sm text-slate-600 mb-2"><strong>Total Score:</strong> ${totalScore.toFixed(2)} / ${maxScore}</p>
                    <p class="text-sm text-slate-600"><strong>Final Percentage:</strong> ${percentage}%</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
        });

        if (!result.isConfirmed) {
            return;
        }

        // After confirmation, submit the form normally so Laravel handles redirect & persistence
        e.target.submit();
    };

    const isLocked = evaluation?.status === 'locked' || evaluation?.locked_at;

    const allScored = criteria?.every(c => {
        const d = formScores[c] || {};
        return d.score !== '' && d.score != null;
    }) ?? false;
    const canSubmit = !isLocked && allScored;

    const passed = maxScore > 0 && (totalScore / maxScore) >= 0.7;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-slate-900">Evaluate Participant</h2>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {user?.name}
                    </span>
                    {isLocked && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Lock className="w-4 h-4" /> Locked
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span><strong>Event:</strong> {event?.title}</span>
                    <span><strong>Scenario:</strong> {event?.scenario?.title || 'N/A'}</span>
                    <span><strong>Date:</strong> {formatDate(event?.event_date)}</span>
                </div>
            </div>

            {isLocked && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">
                        <strong>Locked:</strong> This evaluation is locked and cannot be modified.
                    </p>
                </div>
            )}

            <form
                method="POST"
                action={`/simulation-events/${event.id}/evaluation/${user.id}`}
                onSubmit={handleSubmit}
                className="flex flex-col lg:flex-row gap-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="status" value="submitted" />

                {/* Left Column - Criteria (70%) */}
                <div className="flex-1 lg:w-[70%] space-y-4">
                    {criteria && criteria.length > 0 ? (
                        <>
                            {criteria.map((criterion, index) => {
                                const criterionName = criterion;
                                const scoreData = formScores[criterionName] || { score: '', comment: '' };
                                return (
                                    <div key={index} className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
                                        <label className="block text-sm font-semibold text-slate-800 mb-3">
                                            {criterionName} <span className="text-rose-500">*</span>
                                        </label>
                                        {/* Segmented bar score selection (0-10) */}
                                        <div className="mb-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                                    <label
                                                        key={score}
                                                        className={`flex-1 min-w-[2rem] h-9 rounded-md flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-200 ${
                                                            String(scoreData.score) === String(score)
                                                                ? 'bg-emerald-600 text-white shadow-md'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`score-${criterionName}`}
                                                            value={score}
                                                            checked={String(scoreData.score) === String(score)}
                                                            onChange={(e) => handleScoreChange(criterionName, 'score', e.target.value)}
                                                            disabled={isLocked}
                                                            required
                                                            className="sr-only"
                                                        />
                                                        {score}
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">0 = Poor, 10 = Excellent</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">Comment (Optional)</label>
                                            <textarea
                                                rows={2}
                                                value={scoreData.comment}
                                                onChange={(e) => handleScoreChange(criterionName, 'comment', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-slate-50"
                                                placeholder="Add comments..."
                                            />
                                        </div>
                                        <input type="hidden" name={`scores[${criterionName}][score]`} value={scoreData.score ?? ''} />
                                        <input type="hidden" name={`scores[${criterionName}][comment]`} value={scoreData.comment ?? ''} />
                                    </div>
                                );
                            })}
                            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
                                <label className="block text-sm font-semibold text-slate-800 mb-2">Overall Feedback</label>
                                <textarea
                                    name="overall_feedback"
                                    rows={4}
                                    value={overallFeedback}
                                    onChange={(e) => setOverallFeedback(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-slate-50"
                                    placeholder="Provide overall feedback for this participant..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
                            <p className="text-sm text-rose-700">No evaluation criteria defined for this scenario.</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Sticky Live Score Summary (30%) */}
                <div className="lg:w-[30%] lg:min-w-[280px]">
                    <div className="lg:sticky lg:top-6 rounded-xl bg-white border border-slate-200 shadow-md p-6 space-y-5">
                        <h4 className="text-sm font-semibold text-slate-800">Live Score Summary</h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Score</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{totalScore.toFixed(1)} / {maxScore}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Percentage</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{percentage}%</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                    <span>Progress</span>
                                    <span>{percentage}%</span>
                                </div>
                                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : parseFloat(percentage) > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
                                        style={{ width: `${Math.min(parseFloat(percentage) || 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                                    maxScore === 0 ? 'bg-slate-100 text-slate-600' :
                                    passed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                    {maxScore === 0 ? '—' : passed ? '✓ Pass' : '✗ Fail'}
                                </span>
                            </div>
                        </div>
                        {!isLocked && (
                            <div className="pt-4 border-t border-slate-200 space-y-2">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] disabled:hover:shadow-none"
                                >
                                    <ClipboardCheck className="w-4 h-4" />
                                    Submit Final Score
                                </button>
                                {!allScored && (
                                    <p className="text-xs text-amber-600 text-center">Score all criteria to enable submit</p>
                                )}
                                <a
                                    href={`/simulation-events/${event.id}/evaluation`}
                                    className="block text-center text-sm text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

// Evaluation Summary Component
function EvaluationSummary({ event, evaluation, participantEvaluations, criteria, criterionAverages, totalParticipants, passedCount, failedCount, overallAverage }) {
    const handleExport = (format) => {
        window.location.href = `/simulation-events/${event.id}/evaluation/export/${format}`;
    };

    const handlePrint = () => window.print();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const avgPct = (parseFloat(overallAverage ?? 0) || 0).toFixed(2);

    return (
        <div className="space-y-4 summary-print">
            <style>{`
                /* Print-only elements: hidden on screen */
                .summary-print .print-only { display: none !important; }
                @media print {
                    @page { size: A4; margin: 2cm 1.5cm; }
                    html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    .summary-print .print-only { display: block !important; }
                    .summary-print .print-report { max-width: 100% !important; margin: 0 auto !important; color: #000 !important; }
                    .summary-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
                    .summary-print table { width: 100% !important; border-collapse: collapse !important; }
                    .summary-print th, .summary-print td { border: 1px solid #000 !important; padding: 6px 8px !important; font-size: 10pt !important; }
                    .summary-print thead th { font-weight: 700 !important; border-bottom: 2px solid #000 !important; }
                }
            `}</style>

            {/* Print-only professional report */}
            <div className="print-only print-report">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Disaster Preparedness Training &amp; Simulation</div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6, letterSpacing: 1 }}>Participants Evaluation Report</div>
                    <div style={{ fontSize: 10, marginTop: 10, lineHeight: 1.6 }}>
                        <div><strong>Scenario:</strong> {event?.scenario?.title || 'N/A'}</div>
                        <div><strong>Location:</strong> {event?.location || 'N/A'}</div>
                        <div><strong>Date:</strong> {formatDate(event?.event_date)}</div>
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>
                        Summary
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                        <div><strong>Total Participants:</strong> {totalParticipants || 0}</div>
                        <div><strong>Passed:</strong> {passedCount || 0}</div>
                        <div><strong>Failed:</strong> {failedCount || 0}</div>
                        <div style={{ marginTop: 10 }}><strong>Average Score:</strong> {avgPct}%</div>
                    </div>
                </div>

                {criteria && criteria.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>
                            Criterion
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10, lineHeight: 1.6 }}>
                            {criteria.map((c, idx) => (<li key={`crit-print-${idx}`}>{c}</li>))}
                        </ul>
                    </div>
                )}

                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 10, textTransform: 'uppercase' }}>
                        Participants Table
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Participant Name</th>
                                <th>Total Score</th>
                                <th>Result</th>
                                <th>Average Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participantEvaluations && participantEvaluations.length > 0 ? (
                                participantEvaluations.map((pe) => {
                                    const totalScore = parseFloat(pe.total_score ?? 0) || 0;
                                    const averageScore = parseFloat(pe.average_score ?? 0) || 0;
                                    return (
                                        <tr key={`pe-print-${pe.id}`}>
                                            <td>{pe.user?.name || 'Unknown'}</td>
                                            <td>{totalScore.toFixed(2)}</td>
                                            <td>{pe.result === 'passed' ? 'Passed' : 'Failed'}</td>
                                            <td>{averageScore.toFixed(2)}%</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={4}>No evaluations submitted yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 24, borderTop: '1px solid #000', paddingTop: 10, textAlign: 'center', fontSize: 9 }}>
                    <div>Generated by: Disaster Preparedness Training &amp; Simulation</div>
                    <div>Date Generated: {currentDate}</div>
                </div>
            </div>

            {/* Screen view - Performance Analytics Dashboard */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-md p-6 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Evaluation Summary: {event?.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Scenario: {event?.scenario?.title || 'N/A'} | Date: {formatDate(event?.event_date)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 hover:shadow-md transition-all duration-200"
                        >
                            <Printer className="w-4 h-4" />
                            Print Summary
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 hover:shadow-md transition-all duration-200"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Dashboard-style cards with hierarchy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Average Score - Largest / Primary */}
                    <div className="md:col-span-2 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Average Score</p>
                        <p className="text-4xl font-bold text-emerald-800">{avgPct}%</p>
                        <p className="text-sm text-slate-600 mt-1">Overall performance across all participants</p>
                    </div>
                    {/* Passed / Failed side by side */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-3">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Passed</p>
                            <p className="text-3xl font-bold text-emerald-700">{passedCount || 0}</p>
                        </div>
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">Failed</p>
                            <p className="text-3xl font-bold text-rose-700">{failedCount || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="mb-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-slate-400">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Participants</p>
                        <p className="text-2xl font-bold text-slate-800">{totalParticipants || 0}</p>
                    </div>
                </div>

                {/* Simple charts */}
                {(() => {
                    const maxScore = criteria ? criteria.length * 10 : 0;
                    const buckets = { '0-49%': 0, '50-69%': 0, '70-84%': 0, '85-100%': 0 };
                    (participantEvaluations || []).forEach((pe) => {
                        const totalScore = parseFloat(pe.total_score ?? 0) || 0;
                        const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
                        if (pct < 50) buckets['0-49%']++;
                        else if (pct < 70) buckets['50-69%']++;
                        else if (pct < 85) buckets['70-84%']++;
                        else buckets['85-100%']++;
                    });
                    const maxBucket = Math.max(1, ...Object.values(buckets));
                    return (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {/* Pass vs Fail chart */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-4">Pass vs Fail</h4>
                        <div className="flex items-end gap-2 h-24">
                            <div className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                                    style={{ height: `${(totalParticipants || 0) > 0 ? ((passedCount || 0) / (totalParticipants || 1)) * 100 : 0}%`, minHeight: (passedCount || 0) > 0 ? 8 : 0 }}
                                />
                                <span className="text-xs font-medium text-slate-600">Passed</span>
                                <span className="text-xs text-slate-500">{passedCount || 0}</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-rose-500 rounded-t transition-all duration-500"
                                    style={{ height: `${(totalParticipants || 0) > 0 ? ((failedCount || 0) / (totalParticipants || 1)) * 100 : 0}%`, minHeight: (failedCount || 0) > 0 ? 8 : 0 }}
                                />
                                <span className="text-xs font-medium text-slate-600">Failed</span>
                                <span className="text-xs text-slate-500">{failedCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Score Distribution chart */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-4">Score Distribution</h4>
                        <div className="flex items-end gap-2 h-24">
                            {Object.entries(buckets).map(([label, count]) => (
                                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className={`w-full rounded-t transition-all duration-500 ${
                                            label === '85-100%' ? 'bg-emerald-500' :
                                            label === '70-84%' ? 'bg-emerald-400' :
                                            label === '50-69%' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ height: `${(count / maxBucket) * 100}%`, minHeight: count > 0 ? 8 : 0 }}
                                    />
                                    <span className="text-xs font-medium text-slate-600">{label}</span>
                                    <span className="text-xs text-slate-500">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Criteria Performance chart */}
                    {criteria && criteria.length > 0 && criterionAverages && Object.keys(criterionAverages).length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <h4 className="text-sm font-semibold text-slate-800 mb-4">Criteria Performance</h4>
                            <div className="space-y-3">
                                {criteria.map((criterion, index) => {
                                    const criterionName = typeof criterion === 'string' ? criterion : criterion?.name || criterion;
                                    const avg = parseFloat(criterionAverages[criterionName] ?? 0) || 0;
                                    const pct = Math.min(100, (avg / 10) * 100);
                                    const passed = avg >= 7;
                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-700 w-32 truncate" title={criterionName}>{criterionName}</span>
                                            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 w-10">{avg.toFixed(1)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                    );
                })()}

                {/* Participant Results - improved table */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Participant Results</h4>
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Participant</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Result</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Certification</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {participantEvaluations && participantEvaluations.length > 0 ? (
                                    participantEvaluations.map((pe) => {
                                        const totalScore = parseFloat(pe.total_score ?? 0) || 0;
                                        const averageScore = parseFloat(pe.average_score ?? 0) || 0;
                                        const maxScore = criteria ? criteria.length * 10 : 0;
                                        const pct = maxScore > 0 ? Math.min(100, (totalScore / maxScore) * 100) : 0;
                                        const passed = pe.result === 'passed';

                                        return (
                                            <tr key={pe.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="font-medium text-slate-900">{pe.user?.name || 'Unknown'}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-800">{totalScore.toFixed(1)} / {maxScore}</span>
                                                        <span className="text-xs text-slate-500">({averageScore.toFixed(1)}%)</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border ${
                                                        passed ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                                                    }`}>
                                                        {passed ? '✓ Passed' : '✗ Failed'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {pe.is_eligible_for_certification ? (
                                                        <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200">
                                                            <Award className="w-4 h-4" />
                                                            Eligible
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-12 text-center text-slate-500">
                                            No evaluations submitted yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Barangay Profile List (redesigned table)
function BarangayProfileList({ profiles = [] }) {
    const [search, setSearch] = React.useState('');
    const filtered = React.useMemo(() => {
        if (!search.trim()) return profiles;
        const q = search.toLowerCase().trim();
        return profiles.filter(
            (p) =>
                (p.barangay_name || '').toLowerCase().includes(q) ||
                (p.municipality_city || '').toLowerCase().includes(q) ||
                (p.province || '').toLowerCase().includes(q)
        );
    }, [profiles, search]);

    const handleDelete = (p) => {
        if (!window.confirm(`Delete "${p.barangay_name}"? This cannot be undone.`)) return;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/barangay-profile/${p.id}`;
        const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content;
        if (csrf) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_token';
            input.value = csrf;
            form.appendChild(input);
        }
        const method = document.createElement('input');
        method.type = 'hidden';
        method.name = '_method';
        method.value = 'DELETE';
        form.appendChild(method);
        document.body.appendChild(form);
        form.submit();
    };

    const hazardDisplay = (hazards) => {
        if (!hazards || !Array.isArray(hazards) || hazards.length === 0) return '—';
        return hazards.join(', ');
    };

    return (
        <div className="space-y-6 w-full">
            {/* Page header */}
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Settings className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Barangay Profile</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage barangay information and disaster hazards for your area.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <a
                            href="/barangay-profile/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Create profile
                        </a>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name, municipality, or province..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Barangay Name
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Municipality
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Province
                                </th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Disaster Hazards
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <p className="text-slate-500 font-medium">
                                            {profiles.length === 0
                                                ? 'No barangay profiles yet.'
                                                : 'No profiles match your search.'}
                                        </p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            {profiles.length === 0 ? 'Click "Create profile" to add one.' : 'Try a different search term.'}
                                        </p>
                                        {profiles.length === 0 && (
                                            <a
                                                href="/barangay-profile/create"
                                                className="inline-flex items-center gap-2 mt-4 rounded-xl px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create profile
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="bg-white hover:bg-slate-50/80 transition-colors duration-150"
                                    >
                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {p.barangay_name || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {p.municipality_city || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {p.province || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 max-w-[200px]">
                                            <span className="line-clamp-2" title={hazardDisplay(p.hazards)}>
                                                {hazardDisplay(p.hazards)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`/barangay-profile/${p.id}`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <a
                                                    href={`/barangay-profile/${p.id}/edit`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(p)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Barangay Profile View (all details including address)
function BarangayProfileDetail({ profile }) {
    const hazards = profile?.hazards || [];
    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Barangay Profile</h2>
                    <p className="text-sm text-slate-600 mt-1">{profile?.barangay_name}</p>
                </div>
                <a
                    href="/barangay-profile"
                    className="text-sm text-slate-600 hover:text-slate-900"
                >
                    ← Back to list
                </a>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-1">Barangay Name</h3>
                    <p className="text-slate-900">{profile?.barangay_name || '—'}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-1">Municipality / City</h3>
                    <p className="text-slate-900">{profile?.municipality_city || '—'}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-1">Province</h3>
                    <p className="text-slate-900">{profile?.province || '—'}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-1">Barangay Address</h3>
                    <p className="text-slate-900 whitespace-pre-wrap">{profile?.barangay_address || '—'}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-1">Disaster Hazards</h3>
                    <p className="text-slate-900">
                        {hazards.length > 0 ? hazards.join(', ') : '—'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Barangay Profile Form Component (create & edit)
function BarangayProfileForm({ profile }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const isEditing = !!profile;

    const [formData, setFormData] = React.useState({
        barangay_name: profile?.barangay_name || '',
        municipality_city: profile?.municipality_city || '',
        province: profile?.province || '',
        barangay_address: profile?.barangay_address || '',
        hazards: profile?.hazards || [],
    });

    const [errors, setErrors] = React.useState({});

    const hazardOptions = [
        'Earthquake',
        'Fire',
        'Flood',
        'Typhoon',
        'Landslide',
        'Storm Surge',
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleHazardToggle = (hazard) => {
        setFormData(prev => {
            const hazards = prev.hazards.includes(hazard)
                ? prev.hazards.filter(h => h !== hazard)
                : [...prev.hazards, hazard];
            return { ...prev, hazards };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.barangay_name.trim()) newErrors.barangay_name = 'Barangay name is required';
        if (!formData.municipality_city.trim()) newErrors.municipality_city = 'Municipality/City is required';
        if (!formData.province.trim()) newErrors.province = 'Province is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const form = e.target;
        const formDataToSubmit = new FormData(form);
        formDataToSubmit.delete('hazards[]');
        formData.hazards.forEach(hazard => formDataToSubmit.append('hazards[]', hazard));
        try {
            const result = await Swal.fire({
                title: isEditing ? 'Update Profile' : 'Create Profile',
                text: isEditing ? 'Update this barangay profile?' : 'Create this barangay profile?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: isEditing ? 'Yes, update' : 'Yes, create',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#64748b',
            });
            if (result.isConfirmed) form.submit();
        } catch (err) {
            console.error('Error submitting form:', err);
        }
    };

    const labelClass = 'block text-xs font-semibold text-slate-600 mb-1';
    const inputClass = (name) =>
        `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow ${errors[name] ? 'border-rose-500' : 'border-slate-300'}`;

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/barangay-profile"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Barangay Profile
            </a>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm">
                    <Settings className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Edit Barangay Profile' : 'Create Barangay Profile'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isEditing ? 'Update barangay information and hazards' : 'Add a new barangay and its disaster hazards'}
                    </p>
                </div>
            </div>

            <form
                method="POST"
                action={isEditing ? `/barangay-profile/${profile.id}` : '/barangay-profile'}
                onSubmit={handleSubmit}
                className="training-module-card-enter bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg space-y-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                {isEditing && <input type="hidden" name="_method" value="PUT" />}

                {/* Barangay Information */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Barangay Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                Barangay Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="barangay_name"
                                value={formData.barangay_name}
                                onChange={handleInputChange}
                                className={inputClass('barangay_name')}
                                placeholder="e.g., Barangay San Jose"
                            />
                            {errors.barangay_name && (
                                <p className="text-xs text-rose-600 mt-1">{errors.barangay_name}</p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                Municipality / City <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="municipality_city"
                                value={formData.municipality_city}
                                onChange={handleInputChange}
                                className={inputClass('municipality_city')}
                                placeholder="e.g., Quezon City"
                            />
                            {errors.municipality_city && (
                                <p className="text-xs text-rose-600 mt-1">{errors.municipality_city}</p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                Province <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="province"
                                value={formData.province}
                                onChange={handleInputChange}
                                className={inputClass('province')}
                                placeholder="e.g., Metro Manila"
                            />
                            {errors.province && (
                                <p className="text-xs text-rose-600 mt-1">{errors.province}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Barangay Address</label>
                            <textarea
                                name="barangay_address"
                                value={formData.barangay_address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                                placeholder="Complete barangay address"
                            />
                        </div>
                    </div>
                </div>

                {/* Disaster Hazards */}
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Disaster Hazards</h3>
                    {formData.hazards.map((hazard, index) => (
                        <input key={index} type="hidden" name="hazards[]" value={hazard} />
                    ))}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {hazardOptions.map(hazard => {
                            const checked = formData.hazards.includes(hazard);
                            return (
                                <label
                                    key={hazard}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleHazardToggle(hazard)}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{hazard}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <a
                        href="/barangay-profile"
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </a>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        {isEditing ? 'Update Profile' : 'Create Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}


