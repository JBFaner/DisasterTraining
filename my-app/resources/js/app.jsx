import React from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';
import './bootstrap';
import '../css/app.css';
import { SidebarLayout } from './components/SidebarLayout';
import { SessionTimeout } from './components/SessionTimeout';
import { ParticipantSimulationEventsList, ParticipantSimulationEventDetail } from './components/ParticipantSimulationEvents';
import { SimulationEventLifecyclePage } from './components/SimulationEventLifecyclePage';
import { SimulationEventPlanningModule } from './components/SimulationEventPlanningModule';
import { SimulationEventCreateForm } from './components/SimulationEventCreateForm';
import { ResourceInventory } from './pages/ResourceInventory';
import { AuditLogs } from './pages/AuditLogs';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { UserDetailsPage } from './pages/UserDetailsPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { RoleEditPage } from './pages/RoleEditPage';
import { PermissionEditPage } from './pages/PermissionEditPage';
import { TrainingModuleDetail } from './pages/TrainingModuleDetail';
import { AiScenarioConfigPage } from './pages/AiScenarioConfigPage';
import { AiScenarioTrainingPage, AiScenarioTrainingUnlock } from './pages/AiScenarioTrainingPage';
import { EvaluationResultsIndex } from './pages/EvaluationResultsIndex';
import { EvaluationResultDetail } from './pages/EvaluationResultDetail';
import AttendanceQrScanner from './components/AttendanceQrScanner';
import {
    ParticipantRegistrationAttendanceModule,
    QualifiedTrainerDetail,
} from './components/ParticipantAttendanceModule';
import { ParticipantRegistryProfile } from './components/ParticipantRegistryProfile';
import {
    HazardAssessmentList,
    HazardAssessmentDetail,
    HazardAssessmentForm,
    HazardAssessmentIntelligencePanel,
} from './components/HazardAssessmentModule';
import {
    trainingModulesIndex,
    trainingModuleShow,
    trainingModuleCreate,
    trainingModuleEdit,
    trainingModuleStore,
    trainingModuleGenerateAi,
    trainingModulePublish,
    trainingModuleArchive,
    trainingModuleDestroy,
    participantLessonCompletion,
    adminAiScenarioConfig,
} from './utils/trainingModuleRoutes';
import {
    simulationEventsIndex,
    evaluationsIndex,
    certificationIndex,
    participantsIndex,
    scenariosIndex,
    barangayProfileIndex,
    hazardAssessmentProfileIndex,
    settingsAutoApproval,
    adminCertificationApi,
} from './utils/portalRoutes';
import {
    AdminPageShell,
    AdminPageHeader,
    AdminCollapsibleFilterBar,
    AdminFilterSelect,
    AdminFilterInput,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminSearchInput,
    AdminViewToggle,
    AdminContentCard,
    adminSelectClass,
} from './components/admin/AdminLayout';
import {
    AdminDataTable,
    AdminStatusBadge,
    AdminTableActionButton,
} from './components/admin/AdminDataTable';
import * as Toast from '@radix-ui/react-toast';
import * as Dialog from '@radix-ui/react-dialog';
import {
    CheckCircle2,
    X,
    Pencil,
    Send,
    Undo2,
    XCircle,
    Archive,
    Trash2,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Plus,
    ChevronDown,
    ChevronUp,
    Play,
    Lock,
    ClipboardCheck,
    Eye,
    Users,
    Settings,
    BookOpen,
    Activity,
    CalendarClock,
    LayoutDashboard,
    ClipboardList,
    Download,
    Printer,
    Award,
    Copy,
    RotateCcw,
    FileText,
    Zap,
    GraduationCap,
    TrendingUp,
    AlertTriangle,
    MapPin,
    BarChart3,
    Calendar,
    Target,
    LayoutGrid,
    List,
    UserCircle,
    Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom';
import { deriveSimulationEventStatus, getEventDateTime } from './utils/simulationEventStatus';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    ChartTooltip,
    ChartLegend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement
);

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

// Floating UI dropdown: auto placement, flip, shift, position:fixed for scrollable containers
function useFloatingDropdown(isOpen, placement = 'bottom-start') {
    const referenceRef = React.useRef(null);
    const floatingRef = React.useRef(null);
    const [floatingStyles, setFloatingStyles] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
        if (!isOpen || !referenceRef.current || !floatingRef.current) return;
        const reference = referenceRef.current;
        const floating = floatingRef.current;
        const update = () => {
            computePosition(reference, floating, {
                placement,
                strategy: 'fixed',
                middleware: [offset(6), flip(), shift({ padding: 8 })],
            }).then(({ x, y }) => setFloatingStyles({ top: y, left: x }));
        };
        const cleanup = autoUpdate(reference, floating, update);
        update();
        return () => cleanup();
    }, [isOpen, placement]);

    return { referenceRef, floatingRef, floatingStyles };
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
    const modulesPaginationJson = rootElement.getAttribute('data-modules-pagination');
    const scenariosJson = rootElement.getAttribute('data-scenarios');
    const trainingModulesJson = rootElement.getAttribute('data-training-modules');
    const trainersJson = rootElement.getAttribute('data-trainers');
    const disasterTypesJson = rootElement.getAttribute('data-disaster-types');
    const moduleJson = rootElement.getAttribute('data-module');
    const scenarioJson = rootElement.getAttribute('data-scenario');
    const eventsJson = rootElement.getAttribute('data-events');
    const eventJson = rootElement.getAttribute('data-event');
    const eventLifecycleJson = rootElement.getAttribute('data-event-lifecycle');
    const participantsJson = rootElement.getAttribute('data-participants');
    const participantsPaginationJson = rootElement.getAttribute('data-participants-pagination');
    const participantsSummaryJson = rootElement.getAttribute('data-participants-summary');
    const participantFilterOptionsJson = rootElement.getAttribute('data-participant-filter-options');
    const qualifiedTrainersJson = rootElement.getAttribute('data-qualified-trainers');
    const qualifiedTrainersPaginationJson = rootElement.getAttribute('data-qualified-trainers-pagination');
    const qualifiedTrainersSummaryJson = rootElement.getAttribute('data-qualified-trainers-summary');
    const qualifiedTrainerJson = rootElement.getAttribute('data-qualified-trainer');
    const participantJson = rootElement.getAttribute('data-participant');
    const registrationsJson = rootElement.getAttribute('data-registrations');
    const usersJson = rootElement.getAttribute('data-users');
    const rolesJson = rootElement.getAttribute('data-roles');
    const permissionsJson = rootElement.getAttribute('data-permissions');
    const flashStatus = rootElement.getAttribute('data-status');
    const errorsJson = rootElement.getAttribute('data-errors');

    let modules = [];
    let modulesPagination = null;
    let scenarios = [];
    let trainingModules = [];
    let trainers = [];
    let disasterTypes = [];
    let currentModule = null;
    let currentScenario = null;
    let events = [];
    let currentEvent = null;
    let currentEventLifecycle = null;
    let participants = [];
    let participantsPagination = null;
    let participantsSummary = null;
    let participantFilterOptions = null;
    let qualifiedTrainers = [];
    let qualifiedTrainersPagination = null;
    let qualifiedTrainersSummary = null;
    let currentQualifiedTrainer = null;
    let users = [];
    let currentParticipant = null;
    let registrations = [];
    let flashErrors = [];
    if (modulesJson) {
        try {
            modules = JSON.parse(modulesJson);
        } catch (e) {
            console.error('Failed to parse modules JSON', e);
        }
    }
    if (modulesPaginationJson) {
        try {
            modulesPagination = JSON.parse(modulesPaginationJson);
        } catch (e) {
            console.error('Failed to parse modules pagination JSON', e);
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
    if (trainingModulesJson) {
        try {
            trainingModules = JSON.parse(trainingModulesJson);
        } catch (e) {
            console.error('Failed to parse training modules JSON', e);
        }
    }
    if (trainersJson) {
        try {
            trainers = JSON.parse(trainersJson);
        } catch (e) {
            console.error('Failed to parse trainers JSON', e);
        }
    }
    if (disasterTypesJson) {
        try {
            disasterTypes = JSON.parse(disasterTypesJson);
        } catch (e) {
            console.error('Failed to parse disaster types JSON', e);
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
    if (eventLifecycleJson) {
        try {
            currentEventLifecycle = JSON.parse(eventLifecycleJson);
        } catch (e) {
            console.error('Failed to parse event lifecycle JSON', e);
        }
    }
    if (participantsJson) {
        try {
            participants = JSON.parse(participantsJson);
        } catch (e) {
            console.error('Failed to parse participants JSON', e);
        }
    }
    if (participantsPaginationJson) {
        try {
            participantsPagination = JSON.parse(participantsPaginationJson);
        } catch (e) {
            console.error('Failed to parse participants pagination JSON', e);
        }
    }
    if (participantsSummaryJson) {
        try {
            participantsSummary = JSON.parse(participantsSummaryJson);
        } catch (e) {
            console.error('Failed to parse participants summary JSON', e);
        }
    }
    if (participantFilterOptionsJson) {
        try {
            participantFilterOptions = JSON.parse(participantFilterOptionsJson);
        } catch (e) {
            console.error('Failed to parse participant filter options JSON', e);
        }
    }
    if (qualifiedTrainersJson) {
        try {
            qualifiedTrainers = JSON.parse(qualifiedTrainersJson);
        } catch (e) {
            console.error('Failed to parse qualified trainers JSON', e);
        }
    }
    if (qualifiedTrainersPaginationJson) {
        try {
            qualifiedTrainersPagination = JSON.parse(qualifiedTrainersPaginationJson);
        } catch (e) {
            console.error('Failed to parse qualified trainers pagination JSON', e);
        }
    }
    if (qualifiedTrainersSummaryJson) {
        try {
            qualifiedTrainersSummary = JSON.parse(qualifiedTrainersSummaryJson);
        } catch (e) {
            console.error('Failed to parse qualified trainers summary JSON', e);
        }
    }
    if (qualifiedTrainerJson) {
        try {
            currentQualifiedTrainer = JSON.parse(qualifiedTrainerJson);
        } catch (e) {
            console.error('Failed to parse qualified trainer JSON', e);
        }
    }
    let dashboardStats = null;
    const dashboardStatsJson = rootElement.getAttribute('data-dashboard-stats');
    if (dashboardStatsJson) {
        try {
            dashboardStats = JSON.parse(dashboardStatsJson);
        } catch (e) {
            console.error('Failed to parse dashboard stats JSON', e);
        }
    }
    let dashboardCharts = null;
    const dashboardChartsJson = rootElement.getAttribute('data-dashboard-charts');
    if (dashboardChartsJson) {
        try {
            dashboardCharts = JSON.parse(dashboardChartsJson);
        } catch (e) {
            console.error('Failed to parse dashboard charts JSON', e);
        }
    }
    let hazardAnalytics = null;
    const hazardAnalyticsJson = rootElement.getAttribute('data-hazard-analytics');
    if (hazardAnalyticsJson) {
        try {
            hazardAnalytics = JSON.parse(hazardAnalyticsJson);
        } catch (e) {
            console.error('Failed to parse hazard analytics JSON', e);
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
    if (errorsJson) {
        try {
            const parsed = JSON.parse(errorsJson);
            if (Array.isArray(parsed)) {
                flashErrors = parsed;
            }
        } catch (e) {
            console.error('Failed to parse errors JSON', e);
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
    let recentLogins = [];
    let recentActions = [];
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
    const hazardAssessmentSummaryJson = rootElement.getAttribute('data-hazard-assessment-summary');
    const hazardAssessmentOptionsJson = rootElement.getAttribute('data-hazard-assessment-options');
    const hazardIntelligenceJson = rootElement.getAttribute('data-hazard-intelligence');
    const aiScenarioModulesJson = rootElement.getAttribute('data-ai-scenario-modules');
    const aiScenarioConfigsJson = rootElement.getAttribute('data-ai-scenario-configs');
    const aiScenarioAttemptJson = rootElement.getAttribute('data-ai-scenario-attempt');
    const evaluationResultsJson = rootElement.getAttribute('data-evaluation-results');
    const evaluationResultsPaginationJson = rootElement.getAttribute('data-evaluation-results-pagination');
    const evaluationAnalyticsJson = rootElement.getAttribute('data-evaluation-analytics');
    const evaluationModulesJson = rootElement.getAttribute('data-evaluation-modules');
    const evaluationFiltersJson = rootElement.getAttribute('data-evaluation-filters');
    const evaluationAttemptNumbersJson = rootElement.getAttribute('data-evaluation-attempt-numbers');
    const evaluationPassingScoreAttr = rootElement.getAttribute('data-evaluation-passing-score');
    const evaluationResultJson = rootElement.getAttribute('data-evaluation-result');
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
    let hazardAssessmentSummary = null;
    let hazardAssessmentOptions = {};
    let hazardIntelligence = null;
    let aiScenarioModules = [];
    let aiScenarioConfigs = [];
    let aiScenarioAttempt = null;
    let evaluationResults = [];
    let evaluationResultsPagination = null;
    let evaluationAnalytics = null;
    let evaluationModules = [];
    let evaluationFilters = {};
    let evaluationAttemptNumbers = [];
    let evaluationPassingScore = 75;
    let evaluationResult = null;
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
    if (hazardAssessmentSummaryJson) {
        try {
            hazardAssessmentSummary = JSON.parse(hazardAssessmentSummaryJson);
        } catch (e) {
            console.error('Failed to parse hazard assessment summary JSON', e);
        }
    }
    if (hazardAssessmentOptionsJson) {
        try {
            hazardAssessmentOptions = JSON.parse(hazardAssessmentOptionsJson);
        } catch (e) {
            console.error('Failed to parse hazard assessment options JSON', e);
        }
    }
    if (hazardIntelligenceJson) {
        try {
            hazardIntelligence = JSON.parse(hazardIntelligenceJson);
        } catch (e) {
            console.error('Failed to parse hazard intelligence JSON', e);
        }
    }
    if (aiScenarioModulesJson) {
        try {
            aiScenarioModules = JSON.parse(aiScenarioModulesJson);
        } catch (e) {
            console.error('Failed to parse AI scenario modules JSON', e);
        }
    }
    if (aiScenarioConfigsJson) {
        try {
            aiScenarioConfigs = JSON.parse(aiScenarioConfigsJson);
        } catch (e) {
            console.error('Failed to parse AI scenario configs JSON', e);
        }
    }
    if (aiScenarioAttemptJson) {
        try {
            aiScenarioAttempt = JSON.parse(aiScenarioAttemptJson);
        } catch (e) {
            console.error('Failed to parse AI scenario attempt JSON', e);
        }
    }
    if (evaluationResultsJson) {
        try {
            evaluationResults = JSON.parse(evaluationResultsJson);
        } catch (e) {
            console.error('Failed to parse evaluation results JSON', e);
        }
    }
    if (evaluationResultsPaginationJson) {
        try {
            evaluationResultsPagination = JSON.parse(evaluationResultsPaginationJson);
        } catch (e) {
            console.error('Failed to parse evaluation results pagination JSON', e);
        }
    }
    if (evaluationAnalyticsJson) {
        try {
            evaluationAnalytics = JSON.parse(evaluationAnalyticsJson);
        } catch (e) {
            console.error('Failed to parse evaluation analytics JSON', e);
        }
    }
    if (evaluationModulesJson) {
        try {
            evaluationModules = JSON.parse(evaluationModulesJson);
        } catch (e) {
            console.error('Failed to parse evaluation modules JSON', e);
        }
    }
    if (evaluationFiltersJson) {
        try {
            evaluationFilters = JSON.parse(evaluationFiltersJson);
        } catch (e) {
            console.error('Failed to parse evaluation filters JSON', e);
        }
    }
    if (evaluationAttemptNumbersJson) {
        try {
            evaluationAttemptNumbers = JSON.parse(evaluationAttemptNumbersJson);
        } catch (e) {
            console.error('Failed to parse evaluation attempt numbers JSON', e);
        }
    }
    if (evaluationPassingScoreAttr) {
        evaluationPassingScore = parseFloat(evaluationPassingScoreAttr) || 75;
    }
    if (evaluationResultJson) {
        try {
            evaluationResult = JSON.parse(evaluationResultJson);
        } catch (e) {
            console.error('Failed to parse evaluation result JSON', e);
        }
    }

    // Parse user details page data
    const viewingUserJson = rootElement.getAttribute('data-viewing-user');
    const recentLoginsJson = rootElement.getAttribute('data-recent-logins');
    const recentActionsJson = rootElement.getAttribute('data-recent-actions');

    if (viewingUserJson) {
        try {
            currentUserData = JSON.parse(viewingUserJson);
        } catch (e) {
            console.error('Failed to parse viewing user JSON', e);
        }
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
            description: 'Plan, prepare, monitor, and complete disaster simulation events end to end.',
        },
        participants: {
            title: 'Participant Registration & Attendance',
            description: 'Synchronized participant registry, trainer directory, event registrations, and attendance.',
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
        hazard_assessment_profile: {
            title: 'Hazard Assessment Profile',
            description: 'Official hazard assessment data powering training recommendations, AI scenarios, and simulation planning.',
        },
        barangay_profile: {
            title: 'Hazard Assessment Profile',
            description: 'Official hazard assessment data powering training recommendations, AI scenarios, and simulation planning.',
        },
    };

    const navSection =
        sectionAttr.startsWith('training') ? 'training' :
            sectionAttr === 'ai_scenario_config' ? 'ai_scenario_config' :
                sectionAttr.startsWith('ai_scenario') ? 'training' :
            sectionAttr.startsWith('scenario') ? 'scenario' :
                sectionAttr.startsWith('simulation') ? 'simulation' :
                    sectionAttr.startsWith('participant') ? 'participants' :
                        sectionAttr.startsWith('event_registration') ? 'participants' :
                            sectionAttr.startsWith('event_attendance') ? 'participants' :
                                sectionAttr.startsWith('my_attendance') ? 'participants' :
                                    sectionAttr.startsWith('evaluation_results_participant') ? 'evaluation' :
                                        sectionAttr === 'evaluation_result_detail' ? 'evaluation' :
                                        sectionAttr.startsWith('certification_participant') ? 'certification' :
                                            sectionAttr.startsWith('resources') ? 'resources' :
                                                sectionAttr.startsWith('evaluation') ? 'evaluation' :
                                                    sectionAttr.startsWith('hazard_assessment_profile') ? 'hazard_assessment_profile' :
                                                    sectionAttr.startsWith('barangay_profile') ? 'hazard_assessment_profile' :
                                                                sectionAttr === 'audit_logs' ? 'audit_logs' :
                                                                    sectionAttr;

    // Breadcrumb configuration
    const getBreadcrumbs = () => {
        if (sectionAttr === 'dashboard') {
            return [{ label: 'Dashboard', href: '/dashboard' }];
        }

        if (sectionAttr === 'audit_logs') {
            return [];
        }

        if (sectionAttr === 'profile') {
            return [{ label: 'Profile', href: '/profile' }];
        }

        if (sectionAttr === 'training') {
            return [];
        }
        if (sectionAttr === 'ai_scenario_config') {
            return [];
        }
        if (sectionAttr === 'ai_scenario_attempt') {
            return [
                { label: 'Training Modules', href: trainingModulesIndex(role) },
                { label: currentModule?.title || 'Module', href: currentModule ? trainingModuleShow(role, currentModule.id) : null },
                { label: 'AI Scenario Training', href: null },
            ];
        }
        if (sectionAttr === 'training_create') {
            return [
                { label: 'Training Modules', href: trainingModulesIndex(role) },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'training_edit') {
            return [
                { label: 'Training Modules', href: trainingModulesIndex(role) },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'training_detail') {
            return [
                { label: 'Training Modules', href: trainingModulesIndex(role) },
                { label: currentModule?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'scenario') {
            return [];
        }
        if (sectionAttr === 'scenario_create') {
            return [
                { label: 'Scenarios', href: '/admin/scenarios' },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'scenario_edit') {
            return [
                { label: 'Scenarios', href: '/admin/scenarios' },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'scenario_detail') {
            return [
                { label: 'Scenarios', href: '/admin/scenarios' },
                { label: currentScenario?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'simulation') {
            return [];
        }
        if (sectionAttr === 'simulation_create') {
            return [
                { label: 'Simulation Event Planning', href: '/admin/simulation-events' },
                { label: 'Create', href: null }
            ];
        }
        if (sectionAttr === 'simulation_edit') {
            return [
                { label: 'Simulation Event Planning', href: '/admin/simulation-events' },
                { label: 'Edit', href: null }
            ];
        }
        if (sectionAttr === 'simulation_detail') {
            return [
                { label: 'Simulation Event Planning', href: '/admin/simulation-events' },
                { label: currentEvent?.title || 'Details', href: null }
            ];
        }

        if (sectionAttr === 'participants') {
            return [];
        }
        if (sectionAttr === 'participant_detail') {
            return [
                { label: 'Participant Registry', href: '/admin/participants' },
                { label: currentParticipant?.name || 'Profile', href: null }
            ];
        }
        if (sectionAttr === 'qualified_trainer_detail') {
            return [
                { label: 'Trainer List', href: '/admin/participants?tab=trainers' },
                { label: currentQualifiedTrainer?.name || 'Details', href: null }
            ];
        }
        if (sectionAttr === 'my_attendance') {
            return [
                { label: 'My Attendance', href: '/participant/my-attendance' },
            ];
        }
        if (sectionAttr === 'event_registrations') {
            return [
                { label: 'Simulation Event Planning', href: '/admin/simulation-events' },
                { label: currentEvent?.title || 'Event', href: null },
                { label: 'Registrations', href: null }
            ];
        }
        if (sectionAttr === 'event_attendance') {
            return [
                { label: 'Simulation Event Planning', href: '/admin/simulation-events' },
                { label: currentEvent?.title || 'Event', href: null },
                { label: 'Attendance', href: null }
            ];
        }

        if (sectionAttr === 'resources') {
            return [];
        }

        if (sectionAttr === 'evaluation_dashboard') {
            return [];
        }

        if (sectionAttr === 'evaluation_results_participant') {
            return [];
        }

        if (sectionAttr === 'evaluation_result_detail') {
            return [
                { label: 'Evaluations', href: '/admin/evaluations' },
                { label: 'Evaluation Report', href: null },
            ];
        }

        if (sectionAttr === 'certification_participant') {
            return [{ label: 'My Certificates', href: '/participant/certification' }];
        }

        if (sectionAttr === 'evaluation_participants') {
            return [
                { label: 'Evaluations', href: '/admin/evaluations' },
                { label: 'Participants', href: null }
            ];
        }

        if (sectionAttr === 'evaluation_form') {
            return [
                { label: 'Evaluations', href: '/admin/evaluations' },
                { label: 'Evaluate Participant', href: null }
            ];
        }

        if (sectionAttr === 'evaluation_summary') {
            return [
                { label: 'Evaluations', href: '/admin/evaluations' },
                { label: 'Summary', href: null }
            ];
        }

        if (sectionAttr === 'certification') {
            return [];
        }

        if (sectionAttr === 'hazard_assessment_profile' || sectionAttr === 'barangay_profile') {
            return [];
        }
        if (sectionAttr === 'hazard_assessment_profile_create' || sectionAttr === 'barangay_profile_create') {
            return [
                { label: 'Hazard Assessment Profile', href: '/admin/hazard-assessment-profiles' },
                { label: 'Create', href: null },
            ];
        }
        if (sectionAttr === 'hazard_assessment_profile_show' || sectionAttr === 'barangay_profile_show') {
            return [
                { label: 'Hazard Assessment Profile', href: '/admin/hazard-assessment-profiles' },
                { label: barangayProfile?.barangay_name || 'View', href: null },
            ];
        }
        if (sectionAttr === 'hazard_assessment_profile_edit' || sectionAttr === 'barangay_profile_edit') {
            return [
                { label: 'Hazard Assessment Profile', href: '/admin/hazard-assessment-profiles' },
                { label: 'Edit', href: null },
            ];
        }

        // Users administration (Users, Permissions, Roles)
        if (sectionAttr === 'admin_users_index') {
            return [];
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

        return [{ label: 'Dashboard', href: '/dashboard' }];
    };

    const breadcrumbs = getBreadcrumbs();

    // Generate page title from breadcrumbs
    const getPageTitle = () => {
        const indexSections = new Set([
            'training',
            'scenario',
            'simulation',
            'participants',
            'resources',
            'evaluation_dashboard',
            'evaluation_results_participant',
            'certification',
            'hazard_assessment_profile',
            'barangay_profile',
            'admin_users_index',
            'audit_logs',
            'ai_scenario_config',
        ]);
        if (indexSections.has(sectionAttr)) {
            return '';
        }

        if (
            sectionAttr === 'admin_users_create' ||
            sectionAttr === 'admin_users_edit' ||
            sectionAttr === 'admin_users_show' ||
            sectionAttr === 'admin_permissions' ||
            sectionAttr === 'admin_permissions_edit' ||
            sectionAttr === 'admin_roles' ||
            sectionAttr === 'admin_roles_edit'
        ) {
            if (sectionAttr === 'admin_permissions') return 'Permissions';
            if (sectionAttr === 'admin_permissions_edit') return 'Edit Permission';
            if (sectionAttr === 'admin_roles') return 'Roles';
            if (sectionAttr === 'admin_roles_edit') return 'Edit Role';
            if (sectionAttr === 'admin_users_create') return 'Create User';
            if (sectionAttr === 'admin_users_show') return 'User Details';
            if (sectionAttr === 'admin_users_edit') return 'Edit User';
        }

        if (
            sectionAttr === 'hazard_assessment_profile_create' ||
            sectionAttr === 'hazard_assessment_profile_show' ||
            sectionAttr === 'hazard_assessment_profile_edit' ||
            sectionAttr === 'barangay_profile_create' ||
            sectionAttr === 'barangay_profile_show' ||
            sectionAttr === 'barangay_profile_edit'
        ) {
            if (sectionAttr.endsWith('_create')) return 'Create Hazard Assessment Profile';
            if (sectionAttr.endsWith('_edit')) return 'Edit Hazard Assessment Profile';
            return barangayProfile?.barangay_name || 'Hazard Assessment Profile';
        }

        if (sectionAttr === 'profile') {
            return 'My Profile';
        }

        if (sectionAttr === 'training_create') {
            return 'Create Training Module';
        }
        if (sectionAttr === 'training_edit') {
            return 'Edit Training Module';
        }
        if (sectionAttr === 'training_detail') {
            return currentModule?.title || 'Training Module';
        }

        if (sectionAttr === 'ai_scenario_attempt') {
            return 'AI Scenario Training';
        }

        if (sectionAttr === 'evaluation_result_detail') {
            return 'Evaluation Report';
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
                            <DashboardOverview
                                modules={modules}
                                events={events}
                                participants={participants}
                                role={role}
                                dashboardStats={dashboardStats}
                                dashboardCharts={dashboardCharts}
                                hazardAnalytics={hazardAnalytics}
                            />
                        )}

                        {sectionAttr === 'training' && (
                            role === 'PARTICIPANT' ? (
                                <ParticipantTrainingModulesList modules={modules || []} modulesPagination={modulesPagination} />
                            ) : (
                                <div className="-mt-1">
                                    <TrainingModulesTable modules={modules || []} modulesPagination={modulesPagination} />
                                </div>
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

                        {sectionAttr === 'ai_scenario_config' && (
                            <AiScenarioConfigPage modules={aiScenarioModules} configs={aiScenarioConfigs} />
                        )}

                        {sectionAttr === 'ai_scenario_attempt' && aiScenarioAttempt && (
                            <AiScenarioTrainingPage attempt={aiScenarioAttempt} module={currentModule} />
                        )}

                        {sectionAttr === 'scenario' && (
                            <ScenariosTable scenarios={scenarios || []} role={role} />
                        )}

                        {sectionAttr === 'scenario_create' && (
                            <ScenarioCreateForm modules={modules} barangayProfiles={barangayProfiles} />
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
                                <SimulationEventPlanningModule
                                    events={events}
                                    role={role}
                                    SimulationEventsTable={SimulationEventsTable}
                                />
                            )
                        )}

                        {sectionAttr === 'simulation_create' && (
                            <SimulationEventCreateForm
                                scenarios={scenarios}
                                trainers={trainers}
                                barangayProfiles={barangayProfiles}
                                disasterTypes={disasterTypes}
                                resourcePanel={<ResourceSelectionSection inline={true} />}
                            />
                        )}

                        {sectionAttr === 'simulation_edit' && currentEvent && (
                            <SimulationEventEditForm event={currentEvent} scenarios={scenarios} trainingModules={trainingModules} trainers={trainers} barangayProfiles={barangayProfiles} />
                        )}

                        {sectionAttr === 'simulation_detail' && currentEvent && (
                            role === 'PARTICIPANT' ? (
                                <ParticipantSimulationEventDetail event={currentEvent} role={role} />
                            ) : (
                                <SimulationEventLifecyclePage
                                    event={currentEvent}
                                    lifecycle={currentEventLifecycle}
                                    role={role}
                                />
                            )
                        )}

                        {sectionAttr === 'participants' && (
                            <ParticipantRegistrationAttendanceModule
                                events={events}
                                participants={participants}
                                participantsPagination={participantsPagination}
                                participantsSummary={participantsSummary}
                                participantFilterOptions={participantFilterOptions}
                                qualifiedTrainers={qualifiedTrainers}
                                qualifiedTrainersPagination={qualifiedTrainersPagination}
                                qualifiedTrainersSummary={qualifiedTrainersSummary}
                                RegistrationEventsTable={RegistrationEventsTable}
                                AttendanceEventsTable={AttendanceEventsTable}
                            />
                        )}

                        {sectionAttr === 'qualified_trainer_detail' && currentQualifiedTrainer && (
                            <QualifiedTrainerDetail trainer={currentQualifiedTrainer} />
                        )}

                        {sectionAttr === 'my_attendance' && currentParticipant && (
                            <ParticipantSelfAttendance participant={currentParticipant} />
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

                        {sectionAttr === 'certification_participant' && (
                            <ParticipantCertificatesList certificates={certificationIssuedCertificates || []} />
                        )}

                        {sectionAttr === 'participant_detail' && currentParticipant && (
                            <ParticipantRegistryProfile participant={currentParticipant} />
                        )}

                        {sectionAttr === 'profile' && (
                            <ProfilePage user={currentUser} />
                        )}

                        {sectionAttr === 'admin_users_index' && (
                            <AdminUsersPage users={users} currentUser={currentUser} />
                        )}

                        {sectionAttr === 'admin_users_show' && (
                            <UserDetailsPage
                                user={currentUserData}
                                currentUser={currentUser}
                                recentLogins={recentLogins}
                                recentActions={recentActions}
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
                                        <p className="text-sm text-slate-500 mt-0.5">Create a new Admin, Trainer, Staff, or Viewer account</p>
                                    </div>
                                </div>
                                {flashStatus && (
                                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                                        {flashStatus}
                                    </div>
                                )}
                                {flashErrors && flashErrors.length > 0 && (
                                    <div className="mb-4 rounded-xl bg-red-600 text-white px-4 py-3 text-sm font-medium shadow-lg animate-validation-shake" style={{ boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' }}>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {flashErrors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="training-module-card-enter bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg">
                                    <form id="admin-registration-form" method="POST" action="/admin/users" className="space-y-6">
                                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Account Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="account_type">Account Role</label>
                                                    <select
                                                        id="account_type"
                                                        name="account_type"
                                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                        defaultValue={(roles && roles.length > 0) ? (roles[0].name || 'LGU_ADMIN') : 'LGU_ADMIN'}
                                                    >
                                                        {(roles && roles.length > 0
                                                            ? roles.filter((r) => r.name !== 'PARTICIPANT')
                                                            : [
                                                                { name: 'LGU_ADMIN', display_name: 'LGU Admin' },
                                                                { name: 'LGU_TRAINER', display_name: 'LGU Trainer' },
                                                                { name: 'STAFF', display_name: 'Staff' },
                                                                { name: 'VIEWER', display_name: 'Viewer' },
                                                            ]
                                                        ).map((roleOption) => (
                                                            <option key={roleOption.id ?? roleOption.name} value={roleOption.name}>
                                                                {roleOption.display_name ?? roleOption.name}
                                                            </option>
                                                        ))}
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
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="edit_account_type">Account Role</label>
                                                    <select
                                                        id="edit_account_type"
                                                        name="account_type"
                                                        defaultValue={currentUserData.role}
                                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                    >
                                                        {(roles && roles.length > 0
                                                            ? roles.filter((r) => r.name !== 'PARTICIPANT')
                                                            : [
                                                                { name: 'LGU_ADMIN', display_name: 'LGU Admin' },
                                                                { name: 'LGU_TRAINER', display_name: 'LGU Trainer' },
                                                                { name: 'STAFF', display_name: 'Staff' },
                                                                { name: 'VIEWER', display_name: 'Viewer' },
                                                            ]
                                                        ).map((roleOption) => (
                                                            <option key={roleOption.id ?? roleOption.name} value={roleOption.name}>
                                                                {roleOption.display_name ?? roleOption.name}
                                                            </option>
                                                        ))}
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
                            <EvaluationResultsIndex
                                results={evaluationResults}
                                pagination={evaluationResultsPagination}
                                analytics={evaluationAnalytics}
                                modules={evaluationModules}
                                attemptNumbers={evaluationAttemptNumbers}
                                filters={evaluationFilters}
                                passingScore={evaluationPassingScore}
                                role={role}
                            />
                        )}

                        {sectionAttr === 'evaluation_result_detail' && evaluationResult && (
                            <EvaluationResultDetail
                                result={evaluationResult}
                                passingScore={evaluationPassingScore}
                            />
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

                        {sectionAttr === 'evaluation_results_participant' && (
                            <EvaluationResultsIndex
                                results={evaluationResults}
                                pagination={evaluationResultsPagination}
                                modules={evaluationModules}
                                filters={evaluationFilters}
                                passingScore={evaluationPassingScore}
                                role="PARTICIPANT"
                            />
                        )}

                        {(sectionAttr === 'hazard_assessment_profile' || sectionAttr === 'barangay_profile') && (
                            <HazardAssessmentList
                                profiles={barangayProfiles}
                                summary={hazardAssessmentSummary}
                                options={hazardAssessmentOptions}
                            />
                        )}
                        {(sectionAttr === 'hazard_assessment_profile_create' || sectionAttr === 'barangay_profile_create') && (
                            <HazardAssessmentForm profile={null} options={hazardAssessmentOptions} />
                        )}
                        {(sectionAttr === 'hazard_assessment_profile_show' || sectionAttr === 'barangay_profile_show') && barangayProfile && (
                            <HazardAssessmentDetail profile={barangayProfile} intelligence={hazardIntelligence} />
                        )}
                        {(sectionAttr === 'hazard_assessment_profile_edit' || sectionAttr === 'barangay_profile_edit') && barangayProfile && (
                            <HazardAssessmentForm profile={barangayProfile} options={hazardAssessmentOptions} />
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

function DashboardOverview({ modules, events, participants, role, dashboardStats, dashboardCharts, hazardAnalytics = null }) {
    const stats = dashboardStats || {};
    const charts = dashboardCharts || {};
    const hazard = hazardAnalytics || {};
    const activeEvents = stats.active_events ?? 0;
    const upcomingEvents = stats.upcoming_events ?? 0;
    const totalParticipants = stats.total_participants ?? (participants?.length || 0);
    const certificatesCount = stats.certificates_count ?? 0;
    const eventsStartingToday = stats.events_starting_today ?? 0;
    const pendingEvaluations = stats.pending_evaluations_count ?? 0;
    const pendingCertificates = stats.pending_certificates_count ?? 0;

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
    const upcomingEventList = (events || []).filter((e) => {
        const d = eventDate(e);
        return d && d >= today && ['published', 'ongoing'].includes(e.status);
    }).slice(0, 10);
    const completedRecent = (events || []).filter((e) => e.status === 'completed').slice(0, 5);
    const recentModules = (modules || []).slice(0, 5);

    // Build recent activity items (dynamic feed)
    const activityItems = [];
    completedRecent.forEach((e) => {
        activityItems.push({ type: 'event_completed', label: `${e.title} completed`, time: e.completed_at || e.updated_at, link: `/admin/simulation-events/${e.id}` });
    });
    recentModules.forEach((m) => {
        activityItems.push({ type: 'module', label: `Module: ${m.title}`, time: m.updated_at, link: trainingModuleShow(role, m.id) });
    });
    activityItems.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    const recentActivity = activityItems.slice(0, 8);

    // Calendar: get current month and dates that have events
    const calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const eventDatesSet = new Set();
    (events || []).forEach((e) => {
        const d = eventDate(e);
        if (d && d >= today && d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()) {
            eventDatesSet.add(d.getDate());
        }
    });
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    // Insights: most active module (first published by title), improvement placeholder
    const publishedModules = (modules || []).filter((m) => m.status === 'published');
    const mostActiveModule = publishedModules.length ? publishedModules[0]?.title : '—';
    const topScenario = (events || []).filter((e) => e.status === 'completed' && e.scenario).length
        ? (events.find((e) => e.status === 'completed' && e.scenario)?.scenario?.title || '—')
        : '—';

    const KpiCard = ({ title, value, href, Icon, trend }) => {
        const content = (
            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5">
                <div className="absolute right-4 top-4 text-slate-300">
                    <Icon className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
                <p className="mt-1 text-[38px] font-bold tracking-tight text-slate-900">{value}</p>
                {trend != null && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <TrendingUp className="w-3.5 h-3.5" /> {trend}
                    </p>
                )}
            </div>
        );
        if (href) return <a href={href} className="block">{content}</a>;
        return content;
    };

    const monthLabels = charts.drills_per_month?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const primaryGreen = '#059669';
    const secondaryGreen = '#10B981';
    const softGreen = '#A7F3D0';
    const slate = '#0F172A';

    const disasterDistributionChartData = charts.disaster_distribution && charts.disaster_distribution.labels?.length
        ? {
            labels: charts.disaster_distribution.labels,
            datasets: [
                {
                    data: charts.disaster_distribution.data,
                    backgroundColor: [
                        primaryGreen,
                        secondaryGreen,
                        softGreen,
                        '#D1FAE5',
                        '#E5E7EB',
                    ],
                    borderWidth: 0,
                },
            ],
        }
        : null;

    const evaluationStatusChartData = charts.evaluation_status && charts.evaluation_status.labels?.length
        ? {
            labels: charts.evaluation_status.labels,
            datasets: [
                {
                    data: charts.evaluation_status.data,
                    backgroundColor: [
                        primaryGreen,
                        '#FBBF24',
                        '#EF4444',
                    ],
                    borderWidth: 0,
                },
            ],
        }
        : null;

    const drillsPerMonthChartData = charts.drills_per_month
        ? {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Drills',
                    data: charts.drills_per_month.data,
                    backgroundColor: primaryGreen,
                    borderRadius: 8,
                    maxBarThickness: 32,
                },
            ],
        }
        : null;

    const performanceTrendChartData = charts.performance_trend
        ? {
            labels: charts.performance_trend.labels || monthLabels,
            datasets: [
                {
                    label: 'Average Score (%)',
                    data: charts.performance_trend.data,
                    borderColor: primaryGreen,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    pointBackgroundColor: primaryGreen,
                },
            ],
        }
        : null;

    const baseChartOptions = {
        plugins: {
            legend: {
                display: true,
                labels: {
                    font: { size: 11 },
                    color: '#64748B',
                    usePointStyle: true,
                },
            },
            tooltip: {
                borderWidth: 0,
                backgroundColor: '#020617',
                titleFont: { size: 11 },
                bodyFont: { size: 11 },
            },
        },
    };

    const buildDoughnutOptions = (chartData) => ({
        ...baseChartOptions,
        cutout: '70%',
        plugins: {
            ...baseChartOptions.plugins,
            legend: {
                ...baseChartOptions.plugins.legend,
                labels: {
                    ...baseChartOptions.plugins.legend.labels,
                    generateLabels: (chart) => {
                        const data = chartData || chart.data;
                        const dataset = data.datasets?.[0] || { data: [] };
                        const total = (dataset.data || []).reduce((sum, value) => sum + (Number(value) || 0), 0) || 0;

                        return (data.labels || []).map((label, index) => {
                            const rawValue = dataset.data?.[index] ?? 0;
                            const value = Number(rawValue) || 0;
                            const percent = total > 0 ? Math.round((value / total) * 100) : 0;

                            return {
                                text: `${label} — ${value} (${percent}%)`,
                                fillStyle: Array.isArray(dataset.backgroundColor)
                                    ? dataset.backgroundColor[index] || primaryGreen
                                    : dataset.backgroundColor || primaryGreen,
                                strokeStyle: '#ffffff',
                                lineWidth: 0,
                                hidden: chart.getDatasetMeta(0).data[index]?.hidden || value === 0,
                                index,
                            };
                        });
                    },
                },
            },
        },
    });

    const barOptions = {
        ...baseChartOptions,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#6B7280',
                    font: { size: 11 },
                },
            },
            y: {
                grid: {
                    color: '#E5E7EB',
                    drawBorder: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: { size: 11 },
                    precision: 0,
                },
            },
        },
    };

    const lineOptions = {
        ...baseChartOptions,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#6B7280',
                    font: { size: 11 },
                },
            },
            y: {
                grid: {
                    color: '#E5E7EB',
                    drawBorder: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: { size: 11 },
                    callback: (value) => `${value}%`,
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header — larger, more spacing */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-2xl shadow-md">
                    <LayoutDashboard className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-600 mt-0.5">Operations command center for disaster training</p>
                </div>
            </div>

            {/* Row 1 — Operational KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title="Active Events" value={activeEvents} href={simulationEventsIndex(role)} Icon={Play} trend={activeEvents > 0 ? 'Live' : null} />
                <KpiCard title="Upcoming" value={upcomingEvents} href={simulationEventsIndex(role)} Icon={CalendarClock} />
                <KpiCard title="Participants" value={totalParticipants} href={role !== 'PARTICIPANT' ? participantsIndex() : null} Icon={Users} />
                <KpiCard title="Certificates" value={certificatesCount} href={role !== 'PARTICIPANT' ? certificationIndex(role) : null} Icon={Award} />
            </div>

            {role !== 'PARTICIPANT' && hazard.total_barangays != null && (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Hazard Assessment Analytics</h2>
                        <a href="/admin/hazard-assessment-profiles" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">View profiles →</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KpiCard title="Total Barangays" value={hazard.total_barangays ?? 0} href="/admin/hazard-assessment-profiles" Icon={MapPin} />
                        <KpiCard title="Flood Prone" value={hazard.flood_prone ?? 0} Icon={AlertTriangle} />
                        <KpiCard title="Fire Prone" value={hazard.fire_prone ?? 0} Icon={AlertTriangle} />
                        <KpiCard title="Earthquake Prone" value={hazard.earthquake_prone ?? 0} Icon={AlertTriangle} />
                        <KpiCard title="High Risk" value={hazard.high_risk_barangays ?? 0} Icon={AlertTriangle} />
                        <KpiCard title="Avg Risk Score" value={hazard.average_risk_score != null ? `${hazard.average_risk_score}%` : '—'} Icon={BarChart3} />
                    </div>
                    {(hazard.hazard_distribution && Object.keys(hazard.hazard_distribution).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                                <h3 className="text-sm font-bold text-slate-900 mb-3">Hazard Distribution</h3>
                                <ul className="space-y-2 text-sm">
                                    {Object.entries(hazard.hazard_distribution).map(([type, count]) => (
                                        <li key={type} className="flex justify-between">
                                            <span className="text-slate-700">{type}</span>
                                            <span className="font-semibold text-slate-900">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {hazard.agency_distribution && Object.keys(hazard.agency_distribution).length > 0 && (
                                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                                    <h3 className="text-sm font-bold text-slate-900 mb-3">Source Agency Distribution</h3>
                                    <ul className="space-y-2 text-sm">
                                        {Object.entries(hazard.agency_distribution).map(([agency, count]) => (
                                            <li key={agency} className="flex justify-between">
                                                <span className="text-slate-700">{agency}</span>
                                                <span className="font-semibold text-slate-900">{count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {role !== 'PARTICIPANT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                Disaster Distribution
                            </h2>
                            <span className="text-xs text-slate-500">By drill type</span>
                        </div>
                        {disasterDistributionChartData ? (
                            <div className="h-64">
                                <Doughnut data={disasterDistributionChartData} options={buildDoughnutOptions(disasterDistributionChartData)} />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No drills yet with a recorded disaster type.</p>
                        )}
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                                Evaluation Status
                            </h2>
                            <span className="text-xs text-slate-500">Across completed drills</span>
                        </div>
                        {evaluationStatusChartData ? (
                            <div className="h-64">
                                <Doughnut data={evaluationStatusChartData} options={buildDoughnutOptions(evaluationStatusChartData)} />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No evaluation data available yet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Row 3 — Requires Attention */}
            {(eventsStartingToday > 0 || pendingEvaluations > 0 || pendingCertificates > 0 || (role !== 'PARTICIPANT')) && (
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-6 shadow-md">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Requires Attention
                    </h2>
                    <ul className="space-y-2">
                        {eventsStartingToday > 0 && (
                            <li>
                                <a href="/admin/simulation-events" className="text-sm text-slate-700 hover:text-emerald-600 font-medium">
                                    {eventsStartingToday} event{eventsStartingToday !== 1 ? 's' : ''} starting today
                                </a>
                            </li>
                        )}
                        {pendingEvaluations > 0 && (
                            <li>
                                <a href="/admin/evaluations" className="text-sm text-slate-700 hover:text-emerald-600 font-medium">
                                    {pendingEvaluations} participant{pendingEvaluations !== 1 ? 's' : ''} not evaluated
                                </a>
                            </li>
                        )}
                        {pendingCertificates > 0 && (
                            <li>
                                <a href="/admin/certification" className="text-sm text-slate-700 hover:text-emerald-600 font-medium">
                                    {pendingCertificates} pending certificate{pendingCertificates !== 1 ? 's' : ''}
                                </a>
                            </li>
                        )}
                        {eventsStartingToday === 0 && pendingEvaluations === 0 && pendingCertificates === 0 && role !== 'PARTICIPANT' && (
                            <li className="text-sm text-slate-500">No pending items. You’re all set.</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Row 4 — Drills per month (bar chart) */}
            {role !== 'PARTICIPANT' && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                            Drills Per Month
                        </h2>
                        <span className="text-xs text-slate-500">Current year</span>
                    </div>
                    {drillsPerMonthChartData ? (
                        <div className="h-72">
                            <Bar data={drillsPerMonthChartData} options={barOptions} />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No drills recorded for the current year.</p>
                    )}
                </div>
            )}

            {/* Row 5 — Performance trend (line chart) + numeric overview (LGU admin only) */}
            {role !== 'PARTICIPANT' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Performance Trend
                            </h2>
                            <span className="text-xs text-slate-500">Average score over time</span>
                        </div>
                        {performanceTrendChartData ? (
                            <div className="h-72">
                                <Line data={performanceTrendChartData} options={lineOptions} />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No submitted evaluation scores yet.</p>
                        )}
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                            <BarChart3 className="w-5 h-5 text-slate-500" />
                            Performance Overview
                        </h2>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between">
                                <span className="text-slate-600">Average Score</span>
                                <span className="font-semibold text-slate-900">{stats.average_score != null ? `${stats.average_score}%` : '—'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-600">Pass Rate</span>
                                <span className="font-semibold text-slate-900">{stats.pass_rate != null ? `${stats.pass_rate}%` : '—'}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-600">Attendance Rate</span>
                                <span className="font-semibold text-slate-900">{stats.attendance_rate != null ? `${stats.attendance_rate}%` : '—'}</span>
                            </li>
                        </ul>
                        <p className="text-xs text-slate-400 mt-3">View details on Evaluations page</p>
                    </div>
                </div>
            )}

            {/* Row 6 — Activity + Upcoming events (visual overview) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                            <Activity className="w-5 h-5 text-slate-500" />
                            Recent Activity
                        </h2>
                        <ul className="space-y-3">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, i) => (
                                    <li key={i}>
                                        <a href={item.link || '#'} className="text-sm text-slate-700 hover:text-emerald-600 flex items-center gap-2">
                                            <span className="text-slate-400">•</span>
                                            {item.label}
                                        </a>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-slate-500">No recent activity yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            Upcoming Events
                        </h2>
                        <div className="space-y-2">
                            {upcomingEventList.length > 0 ? (
                                upcomingEventList.slice(0, 5).map((e) => (
                                    <a key={e.id} href={`/admin/simulation-events/${e.id}`} className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50 hover:border-emerald-200">
                                        <span className="font-medium text-slate-900">{e.title}</span>
                                        <span className="ml-2 text-slate-500">{formatDate(eventDateStr(e))}</span>
                                    </a>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No upcoming events this month.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 7 — Quick Actions 2x3 icon grid */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {role !== 'PARTICIPANT' && (
                        <>
                            <a href="/admin/training-modules/create" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                                <BookOpen className="w-10 h-10 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">+ Module</span>
                            </a>
                            <a href="/admin/ai-scenario-config" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                                <Sparkles className="w-10 h-10 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">AI Scenario</span>
                            </a>
                            <a href="/admin/simulation-events/create" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                                <CalendarClock className="w-10 h-10 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">+ Event</span>
                            </a>
                        </>
                    )}
                    <a href="/admin/participants" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                        <Users className="w-10 h-10 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Participants</span>
                    </a>
                    <a href="/admin/evaluations" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                        <ClipboardList className="w-10 h-10 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Evaluate</span>
                    </a>
                    <a href="#" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 py-8 transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50">
                        <FileText className="w-10 h-10 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Reports</span>
                    </a>
                </div>
            </div>

            {/* Row 5 — Upcoming Events Calendar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    Upcoming Events — {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                        {calendarDays.map((d, i) => (
                            <span
                                key={i}
                                className={`inline-flex h-8 items-center justify-center rounded-lg ${d == null ? 'invisible' : eventDatesSet.has(d) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'}`}
                            >
                                {d ?? ''}
                            </span>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {upcomingEventList.length > 0 ? (
                            upcomingEventList.slice(0, 5).map((e) => (
                                <a key={e.id} href={`/admin/simulation-events/${e.id}`} className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50 hover:border-emerald-200">
                                    <span className="font-medium text-slate-900">{e.title}</span>
                                    <span className="ml-2 text-slate-500">{formatDate(eventDateStr(e))}</span>
                                </a>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No upcoming events this month.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 6 — System Insights */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Insights
                </h2>
                <ul className="space-y-2 text-sm text-slate-700">
                    <li>Most active module: <span className="font-semibold text-slate-900">{mostActiveModule}</span></li>
                    <li>Top scenario (recent): <span className="font-semibold text-slate-900">{topScenario}</span></li>
                    <li>Trend: Aggregate metrics available on Evaluations and Certification pages.</li>
                </ul>
            </div>
        </div>
    );
}

function TrainingModulesTable({ modules = [], modulesPagination = null }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDifficulty, setFilterDifficulty] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(modulesPagination?.current_page || 1);
    const [modulesData, setModulesData] = React.useState(modules || []);
    const [pagination, setPagination] = React.useState(modulesPagination);
    const [isPageLoading, setIsPageLoading] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('grid'); // 'grid' | 'list'
    const [openManageId, setOpenManageId] = React.useState(null);
    const itemsPerPage = viewMode === 'list' ? 5 : 10; // List: 5 per page, Grid: 10
    const { referenceRef: manageMenuRef, floatingRef: managePortalRef, floatingStyles: manageFloatingStyles } = useFloatingDropdown(openManageId != null, viewMode === 'list' ? 'bottom-start' : 'bottom');

    // Get unique disaster types for filter
    const disasterTypes = [...new Set((modulesData || []).map(m => m.category).filter(Boolean))];

    // Close Manage menu when clicking outside (button or portal dropdown)
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            const inRef = manageMenuRef.current?.contains(event.target);
            const inPortal = managePortalRef.current?.contains(event.target);
            if (!inRef && !inPortal) setOpenManageId(null);
        };
        if (openManageId != null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openManageId]);

    // Server-side filter sync
    const buildModulesUrl = (page = modulesPagination?.current_page || 1) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        return url;
    };

    const fetchModulesWithFilters = async (page = 1, overrides = {}) => {
        const url = buildModulesUrl(page);
        const search = overrides.search ?? searchQuery;
        const status = overrides.status ?? filterStatus;
        const difficulty = overrides.difficulty ?? filterDifficulty;
        const category = overrides.category ?? filterDisasterType;

        url.searchParams.delete('search');
        url.searchParams.delete('status');
        url.searchParams.delete('difficulty');
        url.searchParams.delete('category');

        if (search.trim()) url.searchParams.set('search', search.trim());
        if (status) url.searchParams.set('status', status);
        if (difficulty) url.searchParams.set('difficulty', difficulty);
        if (category) url.searchParams.set('category', category);

        setIsPageLoading(true);
        try {
            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`Failed to load page ${page}`);
            const data = await res.json();
            setModulesData(data.modules || []);
            setPagination(data.pagination || null);
            setCurrentPage(page);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Error loading training modules page', error);
        } finally {
            setIsPageLoading(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchModulesWithFilters(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterStatus, filterDifficulty, filterDisasterType]);

    // Filter modules (client-side refinement on current page data)
    const filteredModules = (modulesData || []).filter((module) => {
        const matchesSearch = !searchQuery ||
            module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !filterStatus || module.status === filterStatus;
        const matchesDifficulty = !filterDifficulty || module.difficulty === filterDifficulty;
        const matchesDisasterType = !filterDisasterType || module.category === filterDisasterType;

        return matchesSearch && matchesStatus && matchesDifficulty && matchesDisasterType;
    });

    // Pagination (backend-aware)
    const effectivePagination = pagination;
    const effectiveItemsPerPage = effectivePagination?.per_page ?? itemsPerPage;
    const totalPages = effectivePagination?.last_page ?? Math.ceil(filteredModules.length / effectiveItemsPerPage);
    const effectiveCurrentPage = effectivePagination?.current_page ?? currentPage;
    const startIndex = (effectiveCurrentPage - 1) * effectiveItemsPerPage;
    const endIndex = startIndex + effectiveItemsPerPage;
    const paginatedModules = effectivePagination ? filteredModules : filteredModules.slice(startIndex, endIndex);

    // Reset to page 1 when filters change (client-side only)
    React.useEffect(() => {
        if (!effectivePagination) {
            setCurrentPage(1);
        }
    }, [searchQuery, filterStatus, filterDifficulty, filterDisasterType, effectivePagination]);

    const handlePageChange = async (page) => {
        if (effectivePagination) {
            await fetchModulesWithFilters(page);
            return;
        }
        setCurrentPage(page);
    };

    const formatCreatedDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const formatUpdatedDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const statusStyle = (status) => {
        if (status === 'published') return 'text-emerald-600';
        if (status === 'draft') return 'text-blue-600';
        if (status === 'archived') return 'text-slate-500';
        return 'text-slate-600';
    };
    const statusDotStyle = (status) => {
        if (status === 'published') return 'bg-emerald-500';
        if (status === 'draft') return 'bg-blue-500';
        if (status === 'archived') return 'bg-slate-400';
        return 'bg-slate-400';
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={BookOpen}
                title="Training Modules"
                description="Create and manage disaster training modules."
                actions={
                    <AdminPrimaryButton href="/admin/training-modules/create">
                        <Plus className="w-4 h-4" />
                        Create Training Module
                    </AdminPrimaryButton>
                }
            />

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search modules..."
                hasActiveFilters={Boolean(filterStatus || filterDifficulty || filterDisasterType)}
                onClearFilters={() => {
                    setFilterStatus('');
                    setFilterDifficulty('');
                    setFilterDisasterType('');
                }}
                trailing={<AdminViewToggle viewMode={viewMode} onChange={setViewMode} />}
            >
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="archived">Archived</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Difficulty" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                    <option value="">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </AdminFilterSelect>
                {disasterTypes.length > 0 && (
                    <AdminFilterSelect label="Disaster Type" value={filterDisasterType} onChange={(e) => setFilterDisasterType(e.target.value)}>
                        <option value="">All Types</option>
                        {disasterTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </AdminFilterSelect>
                )}
            </AdminCollapsibleFilterBar>

            {/* Card grid or empty state */}
            {filteredModules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        {(modules || []).length === 0 ? (
                            <>
                                <div className="text-7xl mb-4 opacity-90" aria-hidden="true">📦</div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">No training modules yet.</h3>
                                <p className="text-slate-600 max-w-sm mb-6">
                                    Create your first disaster simulation module to begin.
                                </p>
                                <a
                                    href="/admin/training-modules/create"
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
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <ul className="divide-y divide-slate-200">
                        {paginatedModules.map((module) => (
                            <li key={module.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100">
                                    {module.thumbnail_url ? (
                                        <img src={module.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-600" /></div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-slate-900 truncate">{module.title || 'Untitled Module'}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{module.category ?? '—'} • {module.difficulty ?? '—'}</p>
                                    <p className="text-xs text-slate-400 mt-1">Created: {formatCreatedDate(module.created_at)}{formatUpdatedDate(module.updated_at) ? ` • Updated: ${formatUpdatedDate(module.updated_at)}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusStyle(module.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotStyle(module.status)}`} />
                                        {module.status ? module.status.charAt(0).toUpperCase() + module.status.slice(1) : '—'}
                                    </span>
                                    <div className="relative" ref={openManageId === module.id ? manageMenuRef : null}>
                                        <button
                                            type="button"
                                            data-manage-button
                                            onClick={() => setOpenManageId(openManageId === module.id ? null : module.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                        >
                                            Manage <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedModules.map((module, index) => (
                        <div
                            key={module.id}
                            className={`training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 relative ${openManageId === module.id ? 'z-[100]' : ''}`}
                            style={{ animationDelay: `${index * 0.06}s` }}
                        >
                            <div className="p-4">
                                {module.thumbnail_url && (
                                    <img src={module.thumbnail_url} alt="" className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-200" />
                                )}
                                <div className="flex items-start gap-3 mb-2">
                                    {!module.thumbnail_url && (
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-slate-600" />
                                    </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 truncate" title={module.title}>
                                            {module.title || 'Untitled Module'}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-0.5">{module.category ?? '—'} • {module.difficulty ?? '—'}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">
                                    Created: {formatCreatedDate(module.created_at)}
                                    {formatUpdatedDate(module.updated_at) && ` • Updated: ${formatUpdatedDate(module.updated_at)}`}
                                </p>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusStyle(module.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotStyle(module.status)}`} />
                                        Status: {module.status ? module.status.charAt(0).toUpperCase() + module.status.slice(1) : '—'}
                                    </span>
                                </div>
                                <div className="relative" ref={openManageId === module.id ? manageMenuRef : null}>
                                    <button
                                        type="button"
                                        data-manage-button
                                        onClick={() => setOpenManageId(openManageId === module.id ? null : module.id)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-medium hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                                    >
                                        Manage <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {openManageId && (() => {
                const openModule = paginatedModules.find((m) => m.id === openManageId);
                if (!openModule) return null;
                const close = () => setOpenManageId(null);
                return createPortal(
                    <div
                        ref={managePortalRef}
                        className="py-1 w-44 min-w-[11rem] rounded-xl border border-slate-200 bg-white shadow-xl z-[300] transition-opacity duration-150 ease-out"
                        style={{ position: 'fixed', top: manageFloatingStyles.top, left: manageFloatingStyles.left }}
                    >
                        <a href={`/admin/training-modules/${openModule.id}`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Eye className="w-4 h-4" /> View</a>
                        <a href={`/admin/training-modules/${openModule.id}/edit`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Pencil className="w-4 h-4" /> Edit</a>
                        {openModule.status === 'draft' && (
                            <form
                                method="POST"
                                action={`/admin/training-modules/${openModule.id}/publish`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const ok = await Swal.fire({
                                        title: 'Publish?',
                                        text: 'Publish this training module?',
                                        icon: 'question',
                                        showCancelButton: true,
                                    });
                                    if (!ok.isConfirmed) return;
                                    try {
                                        const res = await fetch(form.action, {
                                            method: 'POST',
                                            body: new FormData(form),
                                            headers: {
                                                'Accept': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                            },
                                        });

                                        if (!res.ok) {
                                            let message = 'Failed to publish module. Please try again.';
                                            try {
                                                const data = await res.json();
                                                if (data?.errors?.length) {
                                                    message = data.errors.join(', ');
                                                } else if (data?.message) {
                                                    message = data.message;
                                                }
                                            } catch {
                                                // ignore JSON parse errors
                                            }
                                            await Swal.fire({
                                                icon: 'error',
                                                title: 'Cannot publish',
                                                text: message,
                                            });
                                            return;
                                        }

                                        await Swal.fire({
                                            icon: 'success',
                                            title: 'Module published',
                                            text: 'This training module is now available for use.',
                                        });
                                        window.location.href = '/admin/training-modules';
                                    } catch (_) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Failed to publish module. Please try again.',
                                        });
                                    } finally {
                                        close();
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <Send className="w-4 h-4" /> Publish
                                </button>
                            </form>
                        )}
                        <form
                            method="POST"
                            action={`/admin/training-modules/${openModule.id}/archive`}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const ok = await Swal.fire({
                                    title: 'Archive?',
                                    text: 'Archive this module?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                });
                                if (!ok.isConfirmed) return;
                                try {
                                    const res = await fetch(form.action, {
                                        method: 'POST',
                                        body: new FormData(form),
                                    });
                                    if (!res.ok) throw new Error('Request failed');
                                    window.location.href = '/admin/training-modules';
                                } catch (_) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Failed to archive module. Please try again.',
                                    });
                                } finally {
                                    close();
                                }
                            }}
                        >
                            <input type="hidden" name="_token" value={csrf} />
                            <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Archive className="w-4 h-4" /> Archive
                            </button>
                        </form>
                        <form
                            method="POST"
                            action={`/admin/training-modules/${openModule.id}`}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const ok = await Swal.fire({
                                    title: 'Delete?',
                                    text: 'Permanently delete this module?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#dc2626',
                                });
                                if (!ok.isConfirmed) return;
                                try {
                                    const res = await fetch(form.action, {
                                        method: 'POST',
                                        body: new FormData(form),
                                    });
                                    if (!res.ok) throw new Error('Request failed');
                                    window.location.href = '/admin/training-modules';
                                } catch (_) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Failed to delete module. Please try again.',
                                    });
                                } finally {
                                    close();
                                }
                            }}
                        >
                            <input type="hidden" name="_token" value={csrf} />
                            <input type="hidden" name="_method" value="DELETE" />
                            <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </form>
                    </div>,
                    document.body
                );
            })()}

            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={effectiveCurrentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={effectiveItemsPerPage}
                        totalItems={effectivePagination?.total ?? filteredModules.length}
                    />
                    {isPageLoading && (
                        <p className="mt-2 text-xs text-slate-500">Loading modules…</p>
                    )}
                </div>
            )}
        </AdminPageShell>
    );
}

function ParticipantTrainingModulesList({ modules, modulesPagination = null }) {
    const [modulesData, setModulesData] = React.useState(modules || []);
    const [pagination, setPagination] = React.useState(modulesPagination);
    const [isPageLoading, setIsPageLoading] = React.useState(false);

    const publishedModules = (modulesData || []).filter((m) => m.status === 'published');

    const effectivePagination = pagination;
    const currentPage = effectivePagination?.current_page ?? 1;
    const totalPages = effectivePagination?.last_page ?? 1;

    const handlePageChange = async (page) => {
        if (!effectivePagination) return;

        const clamped = Math.max(1, Math.min(page, effectivePagination.last_page || 1));
        if (clamped === effectivePagination.current_page) return;

        setIsPageLoading(true);
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('page', clamped);

            const res = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error(`Failed to load page ${clamped}`);
            }

            const data = await res.json();
            setModulesData(data.modules || []);
            setPagination(data.pagination || null);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Error loading participant training modules page', error);
        } finally {
            setIsPageLoading(false);
        }
    };

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
                            href={`/participant/training-modules/${module.id}`}
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
            {effectivePagination && totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={effectivePagination.per_page ?? publishedModules.length}
                        totalItems={effectivePagination.total ?? publishedModules.length}
                    />
                    {isPageLoading && (
                        <p className="mt-2 text-xs text-slate-500">Loading modules…</p>
                    )}
                </div>
            )}
        </div>
    );
}

function ParticipantTrainingLessonView({ module }) {
    const items = module.contents || module.lessons || [];
    const sortedItems = React.useMemo(
        () =>
            [...items].sort(
                (a, b) => (a.sort_order || a.order || 0) - (b.sort_order || b.order || 0),
            ),
        [items],
    );

    const buildProgressState = React.useCallback((lessons, completedIds) => {
        const completedSet = new Set(completedIds);

        return lessons.map((lesson, index) => {
            const isCompleted = completedSet.has(lesson.id)
                || lesson.is_completed === true;
            const previousLesson = index > 0 ? lessons[index - 1] : null;
            const isUnlocked = lesson.is_unlocked === true
                || index === 0
                || isCompleted
                || (previousLesson && completedSet.has(previousLesson.id));

            return {
                ...lesson,
                is_completed: isCompleted,
                is_unlocked: isUnlocked,
                is_locked: !isUnlocked,
            };
        });
    }, []);

    const initialProgress = React.useMemo(
        () => buildProgressState(
            sortedItems,
            sortedItems.filter((l) => l.is_completed).map((l) => l.id),
        ),
        [buildProgressState, sortedItems],
    );

    const initialSelectedId = React.useMemo(() => {
        const firstUnlocked = initialProgress.find((lesson) => lesson.is_unlocked);

        return firstUnlocked?.id || sortedItems[0]?.id || null;
    }, [initialProgress, sortedItems]);

    const initialCompleted = React.useMemo(
        () => initialProgress.filter((l) => l.is_completed).map((l) => l.id),
        [initialProgress],
    );

    const initialUnlocked = React.useMemo(
        () => initialProgress.filter((l) => l.is_unlocked).map((l) => l.id),
        [initialProgress],
    );

    const [selectedLessonId, setSelectedLessonId] =
        React.useState(initialSelectedId);
    const [completedLessonIds, setCompletedLessonIds] =
        React.useState(initialCompleted);
    const [unlockedLessonIds, setUnlockedLessonIds] =
        React.useState(initialUnlocked);
    const [aiTraining, setAiTraining] = React.useState(module?.ai_training || null);
    const [completionError, setCompletionError] = React.useState('');

    const lessonProgress = React.useMemo(
        () => buildProgressState(sortedItems, completedLessonIds).map((lesson) => ({
            ...lesson,
            is_unlocked: unlockedLessonIds.includes(lesson.id),
            is_locked: !unlockedLessonIds.includes(lesson.id),
        })),
        [buildProgressState, sortedItems, completedLessonIds, unlockedLessonIds],
    );

    React.useEffect(() => {
        if (!selectedLessonId && lessonProgress[0]) {
            const firstUnlocked = lessonProgress.find((lesson) => lesson.is_unlocked);
            setSelectedLessonId(firstUnlocked?.id || lessonProgress[0].id);
        }
    }, [selectedLessonId, lessonProgress]);

    const selectedLesson =
        lessonProgress.find((l) => l.id === selectedLessonId)
        || lessonProgress.find((l) => l.is_unlocked)
        || lessonProgress[0]
        || null;

    const handleLessonSelect = (lessonId) => {
        const lesson = lessonProgress.find((item) => item.id === lessonId);
        if (!lesson?.is_unlocked) {
            return;
        }

        setSelectedLessonId(lessonId);
    };

    const toggleCompleted = async (lessonId) => {
        const lesson = lessonProgress.find((item) => item.id === lessonId);
        if (!lesson) {
            return;
        }

        const isCompleted = completedLessonIds.includes(lessonId);
        const next = !isCompleted;

        if (next && lesson.is_locked) {
            setCompletionError('Complete the previous lesson to unlock this lesson.');
            return;
        }

        setCompletionError('');

        const previousCompleted = completedLessonIds;
        const previousUnlocked = unlockedLessonIds;

        // Optimistic update
        setCompletedLessonIds((prev) =>
            next ? [...prev, lessonId] : prev.filter((id) => id !== lessonId),
        );

        if (next) {
            const lessonIndex = lessonProgress.findIndex((item) => item.id === lessonId);
            const nextLesson = lessonProgress[lessonIndex + 1];
            if (nextLesson) {
                setUnlockedLessonIds((prev) =>
                    prev.includes(nextLesson.id) ? prev : [...prev, nextLesson.id],
                );
            }
        }

        try {
            const csrf =
                document.head.querySelector('meta[name="csrf-token"]')
                    ?.content || '';

            const response = await fetch(
                participantLessonCompletion(module.id, lessonId),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ completed: next }),
                },
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update lesson completion');
            }

            if (Array.isArray(data.completed_content_ids)) {
                setCompletedLessonIds(data.completed_content_ids);
            }

            if (Array.isArray(data.content_progress)) {
                setUnlockedLessonIds(
                    data.content_progress
                        .filter((item) => item.is_unlocked)
                        .map((item) => item.id),
                );
            }

            if (data.ai_training) {
                setAiTraining(data.ai_training);
                if (Array.isArray(data.ai_training.lesson_progress)) {
                    setCompletedLessonIds(
                        data.ai_training.lesson_progress
                            .filter((lesson) => lesson.is_completed)
                            .map((lesson) => lesson.id),
                    );
                    setUnlockedLessonIds(
                        data.ai_training.lesson_progress
                            .filter((lesson) => lesson.is_unlocked)
                            .map((lesson) => lesson.id),
                    );
                }
            }
        } catch (e) {
            console.error('Failed to update completion', e);
            setCompletionError(e.message || 'Could not save lesson completion. Please try again.');
            setCompletedLessonIds(previousCompleted);
            setUnlockedLessonIds(previousUnlocked);
        }
    };

    const totalLessons = sortedItems.length;
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
                    href="/participant/training-modules"
                    className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    ← Back to Training Modules
                </a>
                <div className="text-[0.7rem] text-slate-500">
                    <a
                        href="/participant/training-modules"
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

            {aiTraining ? (
                <AiScenarioTrainingUnlock module={module} aiTraining={aiTraining} />
            ) : null}

            {completionError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    {completionError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Lesson list */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Lessons
                    </h3>
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
                        {sortedItems.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                No learning content is available yet for this module.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {lessonProgress.map((lesson, index) => {
                                    const isSelected =
                                        lesson.id === selectedLessonId;
                                    const isCompleted = lesson.is_completed;
                                    const isLocked = lesson.is_locked;
                                    const isAvailable = lesson.is_unlocked && !isCompleted;

                                    return (
                                        <li
                                            key={lesson.id}
                                            className={`px-4 py-3 text-sm transition-colors ${
                                                isLocked
                                                    ? 'opacity-60 cursor-not-allowed bg-slate-50'
                                                    : isSelected
                                                      ? 'bg-emerald-50 border-l-2 border-emerald-500 cursor-pointer'
                                                      : 'hover:bg-slate-50 cursor-pointer'
                                            }`}
                                            onClick={() =>
                                                handleLessonSelect(lesson.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400 shrink-0">
                                                            #{index + 1}
                                                        </span>
                                                        {isCompleted && (
                                                            <CheckCircle2
                                                                className="w-4 h-4 shrink-0 text-emerald-600"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        {isLocked && (
                                                            <Lock
                                                                className="w-4 h-4 shrink-0 text-slate-400"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <span className={`font-medium truncate ${
                                                            isLocked ? 'text-slate-500' : 'text-slate-800'
                                                        }`}>
                                                            {lesson.title}
                                                        </span>
                                                        {isCompleted && (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800 shrink-0">
                                                                Completed
                                                            </span>
                                                        )}
                                                        {isAvailable && (
                                                            <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-800 shrink-0">
                                                                Available
                                                            </span>
                                                        )}
                                                        {isLocked && (
                                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600 shrink-0">
                                                                Locked
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(lesson.body || lesson.description) && (
                                                        <p className={`mt-1 text-xs line-clamp-2 ${
                                                            isLocked ? 'text-slate-400' : 'text-slate-600'
                                                        }`}>
                                                            {lesson.body || lesson.description}
                                                        </p>
                                                    )}
                                                    {isLocked && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Complete the previous lesson to unlock this lesson.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[0.7rem] text-slate-500">
                                                <label
                                                    className={`inline-flex items-center gap-1 ${
                                                        isLocked && !isCompleted
                                                            ? 'cursor-not-allowed opacity-60'
                                                            : 'cursor-pointer'
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isCompleted}
                                                        disabled={isLocked && !isCompleted}
                                                        onChange={() => {
                                                            toggleCompleted(lesson.id);
                                                        }}
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
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

                {/* Content viewer */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedLesson && selectedLesson.is_unlocked ? (
                        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                            <div className="mb-3">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                    Learning content
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {selectedLesson.title}
                                </h3>
                                {(selectedLesson.body || selectedLesson.description) && (
                                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                                        {selectedLesson.body || selectedLesson.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {selectedLesson.content_type === 'text' && !selectedLesson.body && !selectedLesson.description && (
                                    <p className="text-sm text-slate-500">No text content available.</p>
                                )}
                                {selectedLesson.content_type && selectedLesson.content_type !== 'text' && (
                                    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                            {selectedLesson.content_type}
                                        </div>
                                        {renderMaterial({
                                            type: selectedLesson.content_type,
                                            path: selectedLesson.display_url || selectedLesson.file_path || selectedLesson.external_url,
                                            label: selectedLesson.title,
                                        })}
                                    </div>
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
                    ) : selectedLesson && selectedLesson.is_locked ? (
                        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm text-sm text-slate-500 space-y-2">
                            <div className="inline-flex items-center gap-2 text-slate-600">
                                <Lock className="w-4 h-4" />
                                <span className="font-medium">This lesson is locked</span>
                            </div>
                            <p>Complete the previous lesson to unlock this lesson.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm text-sm text-slate-500">
                            Select content from the list to view.
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
    const [isAiGenerating, setIsAiGenerating] = React.useState(false);
    const [aiError, setAiError] = React.useState(null);

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

    const handleGenerateWithAi = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle || trimmedTitle.length < 5) {
            setAiError('Please enter a more descriptive title (at least 5 characters).');
            return;
        }

        setIsAiGenerating(true);
        setAiError(null);

        try {
            const formData = new FormData();
            formData.append('title', trimmedTitle);
            formData.append('difficulty', difficulty || '');
            formData.append('category', category || '');
            formData.append('_token', csrf);

            const response = await fetch('/admin/training-modules/generate-ai', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                let message = 'Failed to generate module content.';
                try {
                    const data = await response.json();
                    if (data.errors) {
                        const allErrors = Object.values(data.errors).flat();
                        if (allErrors.length > 0) {
                            message = allErrors[0];
                        }
                    } else if (data.error) {
                        message = data.error;
                    }
                } catch (_) {
                    // ignore parse errors
                }
                throw new Error(message);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to generate module content.');
            }

            const data = result.data || {};
            if (typeof data.description === 'string' && data.description.trim() !== '') {
                setDescription(data.description.trim());
            }

            let aiObjectives = Array.isArray(data.learning_objectives)
                ? data.learning_objectives.filter((obj) => typeof obj === 'string')
                : [];

            aiObjectives = aiObjectives.map((obj) => obj.trim()).filter((obj) => obj !== '');

            while (aiObjectives.length < 3) {
                aiObjectives.push('');
            }

            if (aiObjectives.length > 0) {
                setObjectives(aiObjectives);
                setShowObjectives(true);
            }
        } catch (error) {
            console.error('Error generating module with AI', error);
            setAiError(error.message || 'An unexpected error occurred while generating content.');
        } finally {
            setIsAiGenerating(false);
        }
    };

    const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200';
    const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';

    const hazards = (barangayProfile?.hazard_records || barangayProfile?.hazardRecords || [])
        .map((h) => h.hazard_type)
        .filter(Boolean);
    const legacyHazards = barangayProfile?.hazards && Array.isArray(barangayProfile.hazards) ? barangayProfile.hazards : [];
    const hazardTypes = hazards.length > 0 ? hazards : legacyHazards;
    const templateCategories = ['Earthquake', 'Fire', 'Flood'];
    const categoryOptions = hazardTypes.length > 0
        ? [...new Set([...hazardTypes, ...templateCategories])].sort()
        : [];
    const useCategorySelect = categoryOptions.length > 0;

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/admin/training-modules"
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
                        action="/admin/training-modules"
                        encType="multipart/form-data"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="status" value="draft" />

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className={labelClass} htmlFor="title">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateWithAi}
                                    disabled={isAiGenerating || !title.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isAiGenerating ? 'Generating…' : 'Generate with AI'}
                                </button>
                            </div>
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
                            {aiError && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {aiError}
                                </p>
                            )}
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
                                    Disaster category <span className="text-red-500">*</span>
                                </label>
                                {useCategorySelect ? (
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select disaster category</option>
                                        {categoryOptions.map((hazard, index) => (
                                            <option key={index} value={hazard}>{hazard}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id="category"
                                        name="category"
                                        type="text"
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Earthquake, Fire"
                                        className={inputClass}
                                    />
                                )}
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="estimated_duration_minutes">
                                    Estimated duration (minutes)
                                </label>
                                <input
                                    id="estimated_duration_minutes"
                                    name="estimated_duration_minutes"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 60"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="thumbnail">
                                Thumbnail / cover image
                            </label>
                            <input
                                id="thumbnail"
                                name="thumbnail"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white"
                            />
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
                                href="/participant/training-modules"
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

    // Base field state (pre-filled from existing module)
    const [title, setTitle] = React.useState(module.title || '');
    const [description, setDescription] = React.useState(
        module.description || '',
    );
    const [difficulty, setDifficulty] = React.useState(
        module.difficulty || 'Beginner',
    );
    const [category, setCategory] = React.useState(module.category || '');
    const [visibility, setVisibility] = React.useState(
        module.visibility || 'all',
    );
    const [estimatedDuration, setEstimatedDuration] = React.useState(
        module.estimated_duration_minutes || '',
    );

    // Parse existing learning_objectives from module (already cast to array by model)
    const initialObjectives =
        module.learning_objectives && Array.isArray(module.learning_objectives)
            ? module.learning_objectives.filter(
                  (obj) => obj && obj.trim() !== '',
              )
            : [];

    const [showObjectives, setShowObjectives] = React.useState(
        initialObjectives.length > 0,
    );
    const [objectives, setObjectives] = React.useState(
        initialObjectives.length > 0 ? initialObjectives : [''],
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

    // Reuse same styling helpers as create form
    const inputClass =
        'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200';
    const labelClass =
        'block text-xs font-semibold text-slate-600 mb-1.5';

    const applyTemplate = (t) => {
        setTitle(t.title);
        setDescription(t.description);
        setDifficulty(t.difficulty);
        setCategory(t.category);
        setObjectives(
            t.objectives && t.objectives.length > 0
                ? [...t.objectives]
                : [''],
        );
        setShowObjectives(true);
    };

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/admin/training-modules"
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
                        Edit Training Module
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Update this disaster preparedness training module
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: main edit form */}
                <div className="lg:col-span-8">
                    <form
                        method="POST"
                        action={`/admin/training-modules/${module.id}`}
                        encType="multipart/form-data"
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="_method" value="PUT" />
                        {/* Keep status but hidden so validation passes; status is controlled via Manage menu */}
                        <input
                            type="hidden"
                            name="status"
                            value={module.status}
                        />

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
                            <label
                                className={labelClass}
                                htmlFor="description"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
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
                                    onClick={() =>
                                        setShowObjectives(!showObjectives)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow transition-all duration-200"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {showObjectives ? 'Hide' : 'Show'}{' '}
                                    Objectives
                                </button>
                            </div>
                            {showObjectives && (
                                <div className="space-y-3">
                                    {objectives.map((objective, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2"
                                        >
                                            <input
                                                type="text"
                                                name={`learning_objectives[${index}]`}
                                                value={objective}
                                                onChange={(e) =>
                                                    updateObjective(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={`Objective ${
                                                    index + 1
                                                }`}
                                                className={inputClass}
                                            />
                                            {objectives.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeObjective(index)
                                                    }
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
                                <label
                                    className={labelClass}
                                    htmlFor="difficulty"
                                >
                                    Difficulty
                                </label>
                                <select
                                    id="difficulty"
                                    name="difficulty"
                                    value={difficulty}
                                    onChange={(e) =>
                                        setDifficulty(e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">
                                        Intermediate
                                    </option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    className={labelClass}
                                    htmlFor="category"
                                >
                                    Disaster category <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="category"
                                    name="category"
                                    type="text"
                                    required
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                    placeholder="e.g. Earthquake, Fire"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="estimated_duration_minutes">
                                    Estimated duration (minutes)
                                </label>
                                <input
                                    id="estimated_duration_minutes"
                                    name="estimated_duration_minutes"
                                    type="number"
                                    min="1"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {module.thumbnail_url && (
                            <div>
                                <label className={labelClass}>Current thumbnail</label>
                                <img src={module.thumbnail_url} alt="" className="h-24 rounded-xl border border-slate-200 object-cover" />
                                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" name="remove_thumbnail" value="1" /> Remove thumbnail
                                </label>
                            </div>
                        )}

                        <div>
                            <label className={labelClass} htmlFor="thumbnail">
                                {module.thumbnail_url ? 'Replace thumbnail' : 'Thumbnail / cover image'}
                            </label>
                            <input
                                id="thumbnail"
                                name="thumbnail"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label
                                className={labelClass}
                                htmlFor="visibility"
                            >
                                Visibility
                            </label>
                            <select
                                id="visibility"
                                name="visibility"
                                value={visibility}
                                onChange={(e) =>
                                    setVisibility(e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="all">All participants</option>
                                <option value="group">
                                    Specific groups (later)
                                </option>
                                <option value="staff_only">Staff only</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
                            <a
                                href="/participant/training-modules"
                                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all duration-200"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: tips + quick templates (same design as create) */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-slate-100">
                                <ClipboardList className="w-5 h-5 text-slate-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">
                                Module Writing Tips
                            </h3>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                <span>
                                    Keep title clear and scenario-based
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                <span>
                                    Limit description to 3–5 sentences
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                <span>Objectives should be measurable</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">
                                    •
                                </span>
                                <span>
                                    Match difficulty to target participants
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-amber-100">
                                <Zap className="w-5 h-5 text-amber-700" />
                            </div>
                            <h3 className="font-semibold text-slate-800">
                                Quick Templates
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                            Click one to auto-fill this module with a template.
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


function ScenariosTable({ scenarios = [], role }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const canDelete = role === 'LGU_ADMIN';
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDifficulty, setFilterDifficulty] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [viewMode, setViewMode] = React.useState('grid');
    const [openManageId, setOpenManageId] = React.useState(null);
    const itemsPerPage = viewMode === 'list' ? 5 : 10; // List: 5 per page, Grid: 10
    const { referenceRef: manageMenuRef, floatingRef: managePortalRef, floatingStyles } = useFloatingDropdown(openManageId != null, viewMode === 'list' ? 'bottom-start' : 'bottom');

    // Get unique values for filters
    const disasterTypes = [...new Set((scenarios || []).map(s => s.disaster_type).filter(Boolean))];

    // Close Manage menu when clicking outside (button or portal dropdown)
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('[data-manage-button]')) return;
            const inPortal = managePortalRef.current && managePortalRef.current.contains(event.target);
            if (!inPortal) setOpenManageId(null);
        };
        if (openManageId != null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openManageId]);

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
    const formatUpdatedDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const scenarioStatusStyle = (status) => {
        if (status === 'published') return 'text-emerald-600';
        if (status === 'draft') return 'text-blue-600';
        if (status === 'archived') return 'text-slate-500';
        return 'text-slate-600';
    };
    const scenarioStatusDotStyle = (status) => {
        if (status === 'published') return 'bg-emerald-500';
        if (status === 'draft') return 'bg-blue-500';
        if (status === 'archived') return 'bg-slate-400';
        return 'bg-slate-400';
    };

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={Activity}
                title="Scenarios"
                description="Design scenario-based exercises and disaster response simulations."
                actions={
                    <AdminPrimaryButton href="/admin/scenarios/create">
                        <Plus className="w-4 h-4" />
                        Create Scenario
                    </AdminPrimaryButton>
                }
            />

            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search scenarios..."
                hasActiveFilters={Boolean(filterStatus || filterDifficulty || filterDisasterType)}
                onClearFilters={() => {
                    setFilterStatus('');
                    setFilterDifficulty('');
                    setFilterDisasterType('');
                }}
                trailing={<AdminViewToggle viewMode={viewMode} onChange={setViewMode} />}
            >
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </AdminFilterSelect>
                <AdminFilterSelect label="Difficulty" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                    <option value="">All Difficulties</option>
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </AdminFilterSelect>
                {disasterTypes.length > 0 && (
                    <AdminFilterSelect label="Disaster Type" value={filterDisasterType} onChange={(e) => setFilterDisasterType(e.target.value)}>
                        <option value="">All Types</option>
                        {disasterTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </AdminFilterSelect>
                )}
            </AdminCollapsibleFilterBar>

            {/* Card grid or empty state */}
            {filteredScenarios.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        {(scenarios || []).length === 0 ? (
                            <>
                                <div className="text-7xl mb-4 opacity-90" aria-hidden="true">🎯</div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">No scenarios yet.</h3>
                                <p className="text-slate-600 max-w-sm mb-6">
                                    Create your first scenario-based exercise to run simulations.
                                </p>
                                <a
                                    href="/admin/scenarios/create"
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
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
                    <ul className="divide-y divide-slate-200">
                        {paginatedScenarios.map((s) => (
                            <li key={s.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors relative ${openManageId === s.id ? 'z-[100]' : ''}`}>
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-slate-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-slate-900 truncate">{s.title || 'Untitled Scenario'}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{s.disaster_type ?? '—'} • {s.difficulty ?? '—'}</p>
                                    <p className="text-xs text-slate-400 mt-1">Created: {formatCreatedDate(s.created_at)}{formatUpdatedDate(s.updated_at) ? ` • Updated: ${formatUpdatedDate(s.updated_at)}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${scenarioStatusStyle(s.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${scenarioStatusDotStyle(s.status)}`} />
                                        {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '—'}
                                    </span>
                                    <div className="relative" ref={openManageId === s.id ? manageMenuRef : null}>
                                        <button
                                            type="button"
                                            data-manage-button
                                            onClick={() => setOpenManageId(openManageId === s.id ? null : s.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                        >Manage <ChevronDown className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedScenarios.map((s, index) => (
                        <div key={s.id} className={`training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 relative ${openManageId === s.id ? 'z-[100]' : ''}`} style={{ animationDelay: `${index * 0.06}s` }}>
                            <div className="p-4">
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 truncate" title={s.title}>{s.title || 'Untitled Scenario'}</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">{s.disaster_type ?? '—'} • {s.difficulty ?? '—'}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">Created: {formatCreatedDate(s.created_at)}{formatUpdatedDate(s.updated_at) && ` • Updated: ${formatUpdatedDate(s.updated_at)}`}</p>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${scenarioStatusStyle(s.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${scenarioStatusDotStyle(s.status)}`} />
                                        Status: {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '—'}
                                    </span>
                                </div>
                                <div className="relative" ref={openManageId === s.id ? manageMenuRef : null}>
                                    <button
                                        type="button"
                                        data-manage-button
                                        onClick={() => setOpenManageId(openManageId === s.id ? null : s.id)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-medium hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                                    >Manage <ChevronDown className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {openManageId && (() => {
                const openScenario = paginatedScenarios.find((sc) => sc.id === openManageId);
                if (!openScenario) return null;
                const close = () => setOpenManageId(null);
                return createPortal(
                    <div
                        ref={managePortalRef}
                        className="py-1 rounded-xl border border-slate-200 bg-white shadow-xl z-[300] min-w-40 transition-opacity duration-150 ease-out"
                        style={{ position: 'fixed', top: floatingStyles.top, left: floatingStyles.left }}
                    >
                        <a href={`/admin/scenarios/${openScenario.id}`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Eye className="w-4 h-4" /> View</a>
                        {openScenario.status !== 'published' && (
                            <a href={`/admin/scenarios/${openScenario.id}/edit`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Pencil className="w-4 h-4" /> Edit</a>
                        )}
                        {openScenario.status !== 'published' && (
                            <form
                                method="POST"
                                action={`/admin/scenarios/${openScenario.id}/publish`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const ok = await Swal.fire({
                                        title: 'Publish?',
                                        text: 'Publish this scenario?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                    });
                                    if (!ok.isConfirmed) return;
                                    try {
                                        const res = await fetch(form.action, {
                                            method: 'POST',
                                            body: new FormData(form),
                                        });
                                        if (!res.ok) throw new Error('Request failed');
                                        window.location.href = '/admin/scenarios';
                                    } catch (_) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Failed to publish scenario. Please try again.',
                                        });
                                    } finally {
                                        close();
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <Send className="w-4 h-4" /> Publish
                                </button>
                            </form>
                        )}
                        <form
                            method="POST"
                            action={`/admin/scenarios/${openScenario.id}/archive`}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const ok = await Swal.fire({
                                    title: 'Archive?',
                                    text: 'Archive this scenario?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                });
                                if (!ok.isConfirmed) return;
                                try {
                                    const res = await fetch(form.action, {
                                        method: 'POST',
                                        body: new FormData(form),
                                    });
                                    if (!res.ok) throw new Error('Request failed');
                                    window.location.href = '/admin/scenarios';
                                } catch (_) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Failed to archive scenario. Please try again.',
                                    });
                                } finally {
                                    close();
                                }
                            }}
                        >
                            <input type="hidden" name="_token" value={csrf} />
                            <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Archive className="w-4 h-4" /> Archive
                            </button>
                        </form>
                        {canDelete && (
                            <form
                                method="POST"
                                action={`/admin/scenarios/${openScenario.id}`}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const ok = await Swal.fire({
                                        title: 'Delete?',
                                        text: 'Permanently delete this scenario?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                    });
                                    if (!ok.isConfirmed) return;
                                    try {
                                        const res = await fetch(form.action, {
                                            method: 'POST',
                                            body: new FormData(form),
                                        });
                                        if (!res.ok) throw new Error('Request failed');
                                        window.location.href = '/admin/scenarios';
                                    } catch (_) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Failed to delete scenario. Please try again.',
                                        });
                                    } finally {
                                        close();
                                    }
                                }}
                            >
                                <input type="hidden" name="_token" value={csrf} />
                                <input type="hidden" name="_method" value="DELETE" />
                                <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </form>
                        )}
                    </div>,
                    document.body
                );
            })()}

            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredScenarios.length}
                    />
                </div>
            )}
        </AdminPageShell>
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

function ScenarioCreateForm({ modules, barangayProfiles = [] }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedModuleId, setSelectedModuleId] = React.useState('');
    const [selectedBarangayProfileId, setSelectedBarangayProfileId] = React.useState('');
    const [showAiChat, setShowAiChat] = React.useState(false);
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [aiGenerating, setAiGenerating] = React.useState(false);
    const [aiError, setAiError] = React.useState(null);
    const [showCriteria, setShowCriteria] = React.useState(true);
    const [criteria, setCriteria] = React.useState(['']);
    const [scenarioTitle, setScenarioTitle] = React.useState('');
    const [difficulty, setDifficulty] = React.useState('Basic');
    const [severityLevel, setSeverityLevel] = React.useState('');
    const [injuredCount, setInjuredCount] = React.useState(0);
    const [trappedCount, setTrappedCount] = React.useState(0);
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
        setScenarioTitle(t.title ?? '');
        setDifficulty(t.difficulty ?? 'Basic');
        setSeverityLevel(t.severity_level ?? '');
        setInjuredCount(t.injured_victims_count ?? 0);
        setTrappedCount(t.trapped_persons_count ?? 0);
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
            if (selectedBarangayProfileId) {
                formData.append('barangay_profile_id', selectedBarangayProfileId);
            }
            formData.append('_token', csrf);

            const response = await fetch('/admin/scenarios/generate-ai', {
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
                if (data.title) { formRef.current.querySelector('[name="title"]').value = data.title; setScenarioTitle(data.title); }
                if (data.short_description) formRef.current.querySelector('[name="short_description"]').value = data.short_description;
                if (data.affected_area) formRef.current.querySelector('[name="affected_area"]').value = data.affected_area;
                if (data.incident_time_text) formRef.current.querySelector('[name="incident_time_text"]').value = data.incident_time_text;
                if (data.general_situation) formRef.current.querySelector('[name="general_situation"]').value = data.general_situation;
                if (data.severity_level) { formRef.current.querySelector('[name="severity_level"]').value = data.severity_level; setSeverityLevel(data.severity_level); }
                if (data.difficulty) { formRef.current.querySelector('[name="difficulty"]').value = data.difficulty; setDifficulty(data.difficulty); }
                if (data.intended_participants) formRef.current.querySelector('[name="intended_participants"]').value = data.intended_participants;
                if (data.injured_victims_count !== undefined) { formRef.current.querySelector('[name="injured_victims_count"]').value = data.injured_victims_count; setInjuredCount(data.injured_victims_count); }
                if (data.trapped_persons_count !== undefined) { formRef.current.querySelector('[name="trapped_persons_count"]').value = data.trapped_persons_count; setTrappedCount(data.trapped_persons_count); }
                if (data.infrastructure_damage) formRef.current.querySelector('[name="infrastructure_damage"]').value = data.infrastructure_damage;
                if (data.communication_status) formRef.current.querySelector('[name="communication_status"]').value = data.communication_status;
            }
            setScenarioTitle(data.title ?? '');
            setDifficulty(data.difficulty ?? 'Basic');
            setSeverityLevel(data.severity_level ?? '');
            setInjuredCount(data.injured_victims_count ?? 0);
            setTrappedCount(data.trapped_persons_count ?? 0);
            setScenarioTitle(data.title ?? '');
            setDifficulty(data.difficulty ?? '');
            setSeverityLevel(data.severity_level ?? '');
            setInjuredCount(data.injured_victims_count ?? 0);
            setTrappedCount(data.trapped_persons_count ?? 0);

            // Close chat popup
            setShowAiChat(false);
            setAiPrompt('');

            // Show success message with styled modal
            await Swal.fire({
                icon: 'success',
                title: 'Scenario generated',
                html: 'Please review and adjust the fields below before saving.',
                confirmButtonText: 'Review scenario',
                confirmButtonColor: '#16a34a',
                customClass: { popup: 'rounded-xl shadow-xl' },
            });
        } catch (error) {
            setAiError(error.message || 'Failed to generate scenario. Please try again.');
        } finally {
            setAiGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-full py-2">
            <a
                href="/admin/scenarios"
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
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="ai_barangay_profile_id">
                                    Barangay Hazard Context (optional)
                                </label>
                                <select
                                    id="ai_barangay_profile_id"
                                    value={selectedBarangayProfileId}
                                    onChange={(e) => setSelectedBarangayProfileId(e.target.value)}
                                    disabled={aiGenerating}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                                >
                                    <option value="">No barangay context</option>
                                    {(barangayProfiles || []).map((bp) => (
                                        <option key={bp.id} value={bp.id}>
                                            {bp.barangay_name} — {bp.municipality_city}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    When selected, AI uses hazard assessment data to tailor the scenario.
                                </p>
                            </div>
                            {selectedBarangayProfileId && (
                                <div className="mb-4">
                                    <HazardAssessmentIntelligencePanel barangayProfileId={selectedBarangayProfileId} />
                                </div>
                            )}
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
                        action="/admin/scenarios"
                        className="training-module-card-enter"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="disaster_type" value={derivedDisasterType} />

                        <div className="flex gap-8">
                            {/* LEFT COLUMN - 70% - Main scenario content */}
                            <div className="flex-[7] min-w-0 space-y-6">
                                {/* 1. Scenario Overview Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Scenario Overview</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass} htmlFor="scenario_title">Title <span className="text-red-500">*</span></label>
                                            <input id="scenario_title" name="title" type="text" required value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="scenario_short_description">Short description</label>
                                            <textarea id="scenario_short_description" name="short_description" rows={3} className={inputClass} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass} htmlFor="affected_area">Affected area</label>
                                                <input id="affected_area" name="affected_area" type="text" placeholder="e.g. Barangay Central" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass} htmlFor="incident_time_text">Time of incident</label>
                                                <input id="incident_time_text" name="incident_time_text" type="text" placeholder="e.g. 10:17 AM" className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="general_situation">General situation</label>
                                            <textarea id="general_situation" name="general_situation" rows={3} placeholder="e.g. Buildings damaged, power outage" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="severity_level">Severity level</label>
                                            <select id="severity_level" name="severity_level" value={severityLevel} onChange={(e) => setSeverityLevel(e.target.value)} className={inputClass}>
                                                <option value="">Select severity…</option>
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Impact & Damage Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Impact & Damage</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass} htmlFor="injured_victims_count">Number of injured victims</label>
                                                <input id="injured_victims_count" name="injured_victims_count" type="number" min="0" value={injuredCount} onChange={(e) => setInjuredCount(Number(e.target.value) || 0)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass} htmlFor="trapped_persons_count">Number of trapped persons</label>
                                                <input id="trapped_persons_count" name="trapped_persons_count" type="number" min="0" value={trappedCount} onChange={(e) => setTrappedCount(Number(e.target.value) || 0)} className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="infrastructure_damage">Infrastructure damage</label>
                                            <textarea id="infrastructure_damage" name="infrastructure_damage" rows={2} placeholder="e.g. Roads blocked, building collapse" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="communication_status">Communication status</label>
                                            <select id="communication_status" name="communication_status" className={inputClass}>
                                                <option value="">Select status…</option>
                                                <option value="working">Working</option>
                                                <option value="unstable">Unstable</option>
                                                <option value="down">Down</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Participants & Communication Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Participants & Communication</h2>
                                    <div>
                                        <label className={labelClass} htmlFor="intended_participants">Intended participants</label>
                                        <input id="intended_participants" name="intended_participants" type="text" placeholder="e.g. students, staff, volunteers" className={inputClass} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                                    <a href="/admin/scenarios" className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</a>
                                    <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5">Save Scenario</button>
                                </div>
                            </div>

                            {/* RIGHT COLUMN - 30% - Sticky control panel */}
                            <div className="flex-[3] shrink-0 w-full max-w-md">
                                <div className="sticky top-6 space-y-6">
                                    {/* 1. AI Assistant Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-lg font-semibold text-slate-800 mb-3">AI Assistant</h2>
                                        <button
                                            type="button"
                                            onClick={() => setShowAiChat(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg transition-all duration-200"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Generate with AI
                                        </button>
                                    </div>

                                    {/* 2. Training Module Assignment Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Training Module Assignment</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClass} htmlFor="training_module_id">Training Module <span className="text-red-500">*</span></label>
                                                <select id="training_module_id" name="training_module_id" required value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} className={inputClass}>
                                                    <option value="">Select a training module…</option>
                                                    {publishedModules.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass} htmlFor="scenario_difficulty">Difficulty <span className="text-red-500">*</span></label>
                                                <select id="scenario_difficulty" name="difficulty" required value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                                                    <option value="Basic">Basic</option>
                                                    <option value="Intermediate">Intermediate</option>
                                                    <option value="Advanced">Advanced</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Disaster type</label>
                                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{derivedDisasterType || '—'}</div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Learning objectives</label>
                                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                                    {selectedModule && learningObjectives && learningObjectives.length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {learningObjectives.map((obj, i) => (
                                                                <li key={i}>• {obj}</li>
                                                            ))}
                                                        </ul>
                                                    ) : selectedModule && (!learningObjectives || learningObjectives.length === 0) ? (
                                                        <p className="text-rose-600">No learning objectives in this module.</p>
                                                    ) : (
                                                        <p>Select a module to see objectives.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Criteria Manager Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Evaluation Criteria</h2>
                                        {showCriteria && (
                                            <div className="space-y-2">
                                                {criteria.map((criterion, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <input type="text" name={`criteria[${index}]`} value={criterion} onChange={(e) => updateCriterion(index, e.target.value)} placeholder={`Criterion ${index + 1}`} required className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                        {criteria.length > 1 && (
                                                            <button type="button" onClick={() => removeCriterion(index)} className="shrink-0 p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" aria-label="Remove criterion"><X className="w-4 h-4" /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={addCriterion} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                                                    <Plus className="w-4 h-4" /> Add criterion
                                                </button>
                                            </div>
                                        )}
                                        {!showCriteria && (
                                            <p className="text-sm text-slate-500 mb-2">Criteria required.</p>
                                        )}
                                        <button type="button" onClick={() => setShowCriteria(!showCriteria)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                            {showCriteria ? 'Hide criteria' : 'Show criteria'}
                                        </button>
                                    </div>

                                    {/* 4. Scenario Summary */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Scenario Snapshot</h2>
                                        <dl className="space-y-2 text-sm">
                                            <div><dt className="text-slate-500">Title</dt><dd className="font-medium text-slate-800">{scenarioTitle || '—'}</dd></div>
                                            <div><dt className="text-slate-500">Module</dt><dd className="font-medium text-slate-800">{selectedModule?.title || '—'}</dd></div>
                                            <div><dt className="text-slate-500">Difficulty</dt><dd className="font-medium text-slate-800">{difficulty || '—'}</dd></div>
                                            <div><dt className="text-slate-500">Severity</dt><dd className="font-medium text-slate-800">{severityLevel || '—'}</dd></div>
                                            <div><dt className="text-slate-500">Victims</dt><dd className="font-medium text-slate-800">{injuredCount}</dd></div>
                                            <div><dt className="text-slate-500">Trapped</dt><dd className="font-medium text-slate-800">{trappedCount}</dd></div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
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
                action={`/admin/scenarios/${scenario.id}`}
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
                        href="/admin/scenarios"
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

    const injured = scenario.injured_victims_count ?? null;
    const trapped = scenario.trapped_persons_count ?? null;
    const severity = scenario.severity_level || '—';
    const communication = scenario.communication_status || null;

    return (
        <div className="py-2 space-y-6">
            {/* Back + breadcrumb */}
            <div className="flex items-center justify-between mb-1">
                <a
                    href="/admin/scenarios"
                    className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                    ← Back to Scenarios
                </a>
                <div className="text-[0.7rem] text-slate-500">
                    <a
                        href="/admin/scenarios"
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
            <div className="rounded-2xl bg-white border border-slate-200 shadow-md p-6 md:p-7">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {scenario.title}
                        </h1>
                        {scenario.short_description && (
                            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                {scenario.short_description}
                            </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                            {scenario.status && (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700">
                                    {scenario.status.charAt(0).toUpperCase() + scenario.status.slice(1)}
                                </span>
                            )}
                            {scenario.disaster_type && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    {scenario.disaster_type}
                                </span>
                            )}
                            {scenario.difficulty && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Difficulty: {scenario.difficulty}
                                </span>
                            )}
                            {scenario.training_module && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Linked Module: {scenario.training_module.title}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 text-[0.7rem] text-slate-500">
                            <span className="font-semibold text-slate-600">Created by</span>{' '}
                            {scenario.creator?.name ?? '—'}
                            {scenario.created_at && (
                                <>
                                    <span className="mx-1">•</span>
                                    <span>{formatDateTime(scenario.created_at)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {scenario.status !== 'published' && (
                        <a
                            href={`/admin/scenarios/${scenario.id}/edit`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all"
                            title="Edit scenario"
                        >
                            <Pencil className="w-4 h-4 mr-1.5" />
                            Edit
                        </a>
                    )}
                </div>

                {/* Metrics strip */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                            Severity
                        </div>
                        <div className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                            <span className={getSeverityColor(severity).replace('bg-', 'bg-').replace('text-', 'text-')}>
                                {severity}
                            </span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                            Injured
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                            {injured != null ? injured : '—'}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                            Trapped
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                            {trapped != null ? trapped : '—'}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                            Communication
                        </div>
                        <div className="mt-1">
                            {communication ? (
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm capitalize ${getCommunicationStatusColor(
                                        communication,
                                    )}`}
                                >
                                    {communication}
                                </span>
                            ) : (
                                <span className="text-sm font-semibold text-slate-900">—</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
                {/* LEFT: Narrative */}
                <div className="lg:col-span-7 space-y-6">
                    {scenario.general_situation && (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-slate-900 mb-3">
                                General Situation
                            </h2>
                            <div className="border-l-4 border-emerald-500/70 pl-4 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                                {scenario.general_situation}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Intelligence panel */}
                <div className="lg:col-span-3 space-y-4">
                    {(scenario.affected_area || scenario.incident_time_text) && (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">
                                Location &amp; Timing
                            </h3>
                            <div className="space-y-2 text-sm">
                                {scenario.affected_area && (
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                            Area
                                        </div>
                                        <div className="text-slate-900">
                                            {scenario.affected_area}
                                        </div>
                                    </div>
                                )}
                                {scenario.incident_time_text && (
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                            Time of incident
                                        </div>
                                        <div className="text-slate-900">
                                            {scenario.incident_time_text}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(injured != null ||
                        trapped != null ||
                        communication ||
                        scenario.infrastructure_damage) && (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">
                                Impact Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                {injured != null && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">
                                            Injured
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {injured}
                                        </span>
                                    </div>
                                )}
                                {trapped != null && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">
                                            Trapped
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {trapped}
                                        </span>
                                    </div>
                                )}
                                {communication && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">
                                            Communication
                                        </span>
                                        <span className="font-semibold text-slate-900 capitalize">
                                            {communication}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {scenario.infrastructure_damage && (
                                <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700 whitespace-pre-line">
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                        Infrastructure
                                    </div>
                                    {scenario.infrastructure_damage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simulation Events Components
function SimulationEventsTable({ events, role, embedded = false, activeOnly = false }) {
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');
    const [filterDisasterType, setFilterDisasterType] = React.useState('');
    const [filterCategory, setFilterCategory] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [viewMode, setViewMode] = React.useState('grid');
    const [openManageId, setOpenManageId] = React.useState(null);
    const itemsPerPage = viewMode === 'list' ? 5 : 10; // List: 5 per page, Grid: 10
    const { referenceRef: manageMenuRef, floatingRef: managePortalRef, floatingStyles } = useFloatingDropdown(openManageId != null, viewMode === 'list' ? 'bottom-start' : 'bottom');

    const scopedEvents = React.useMemo(() => {
        const source = events || [];
        if (!activeOnly) return source;
        return source.filter((event) => !['completed', 'ended', 'archived'].includes(event.status));
    }, [events, activeOnly]);

    // Get unique values for filters
    const disasterTypes = [...new Set(scopedEvents.map(e => e.disaster_type).filter(Boolean))];
    const categories = [...new Set(scopedEvents.map(e => e.event_category).filter(Boolean))];

    // Close Manage menu when clicking outside (button or portal dropdown)
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('[data-manage-button]')) return;
            const inPortal = managePortalRef.current && managePortalRef.current.contains(event.target);
            if (!inPortal) setOpenManageId(null);
        };
        if (openManageId != null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openManageId]);

    // Filter events
    const filteredEvents = scopedEvents.filter((event) => {
        const matchesSearch = !searchQuery ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const derivedStatus = deriveSimulationEventStatus(event);
        const matchesStatus = !filterStatus
            || (filterStatus === 'ready'
                ? event.monitoring_status === 'Ready'
                : derivedStatus === filterStatus);
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

    // Status/time helpers are centralized in `resources/js/utils/simulationEventStatus.js`.

    const getStatusClass = (status) => {
        const map = {
            published: 'bg-emerald-100 text-emerald-700',
            ongoing: 'bg-blue-100 text-blue-700',
            completed: 'bg-indigo-100 text-indigo-700',
            draft: 'bg-slate-100 text-slate-600',
            archived: 'bg-amber-100 text-amber-700',
            cancelled: 'bg-rose-100 text-rose-700',
            ended: 'bg-rose-100 text-rose-700',
        };
        return map[status] || 'bg-slate-100 text-slate-600';
    };

    const eventStatusStyle = (status) => {
        if (status === 'published' || status === 'ongoing') return 'text-emerald-600';
        if (status === 'completed') return 'text-blue-600';
        if (status === 'ended') return 'text-rose-600';
        if (status === 'draft') return 'text-blue-600';
        if (status === 'archived') return 'text-slate-500';
        if (status === 'cancelled') return 'text-rose-600';
        return 'text-slate-600';
    };
    const eventStatusDotStyle = (status) => {
        if (status === 'published' || status === 'ongoing') return 'bg-emerald-500';
        if (status === 'completed') return 'bg-blue-500';
        if (status === 'ended') return 'bg-rose-500';
        if (status === 'draft') return 'bg-blue-500';
        if (status === 'archived') return 'bg-slate-400';
        if (status === 'cancelled') return 'bg-rose-500';
        return 'bg-slate-400';
    };
    const formatEventDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStartEligibility = (event) => {
        const effectiveStatus = deriveSimulationEventStatus(event);
        const now = new Date();
        const start = getEventDateTime(event?.event_date, event?.start_time);
        const end = getEventDateTime(event?.event_date, event?.end_time);

        if (effectiveStatus === 'ended' || effectiveStatus === 'completed') {
            return { canStart: false, reason: `This event is already ${effectiveStatus}.`, effectiveStatus };
        }
        if (effectiveStatus !== 'published') {
            return { canStart: false, reason: 'Only published events can be started.', effectiveStatus };
        }
        if (!start || !end) {
            return { canStart: false, reason: 'Start/end time is missing or invalid.', effectiveStatus };
        }
        if (end.getTime() < start.getTime()) {
            return { canStart: false, reason: 'End time is before start time.', effectiveStatus };
        }
        if (now.getTime() < start.getTime()) {
            return { canStart: false, reason: 'Event cannot be started before the scheduled start time.', effectiveStatus };
        }
        if (now.getTime() > end.getTime()) {
            return { canStart: false, reason: 'Event already passed its end time.', effectiveStatus: 'ended' };
        }
        return { canStart: true, reason: '', effectiveStatus };
    };

    const eventsContent = (
        <>
            <AdminCollapsibleFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search events..."
                hasActiveFilters={Boolean(filterStatus || filterDisasterType || filterCategory)}
                onClearFilters={() => {
                    setFilterStatus('');
                    setFilterDisasterType('');
                    setFilterCategory('');
                }}
                trailing={<AdminViewToggle viewMode={viewMode} onChange={setViewMode} />}
            >
                <AdminFilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ready">Ready</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="cancelled">Cancelled</option>
                </AdminFilterSelect>
                {disasterTypes.length > 0 && (
                    <AdminFilterSelect label="Disaster Type" value={filterDisasterType} onChange={(e) => setFilterDisasterType(e.target.value)}>
                        <option value="">All Types</option>
                        {disasterTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </AdminFilterSelect>
                )}
                {categories.length > 0 && (
                    <AdminFilterSelect label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </AdminFilterSelect>
                )}
            </AdminCollapsibleFilterBar>

            {/* Content: empty state or list/grid */}
            {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                    {scopedEvents.length === 0 ? (
                        <>
                            <div className="text-5xl mb-4 opacity-80">📅</div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">No simulation events yet</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Create your first event to schedule drills and exercises for your team.</p>
                            <a
                                href="/admin/simulation-events/create"
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
                    {viewMode === 'list' ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
                            <ul className="divide-y divide-slate-200">
                                {paginatedEvents.map((event) => {
                                    const derivedStatus = deriveSimulationEventStatus(event);
                                    return (
                                    <li key={event.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors relative ${openManageId === event.id ? 'z-[100]' : ''}`}>
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <CalendarClock className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-900 truncate">{event.title}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {(event.disaster_type || '—')}{event.event_category ? ` • ${event.event_category}` : ''}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatEventDate(event.event_date)} · {formatTime(event.start_time)} – {formatTime(event.end_time)}
                                                {event.location ? ` • ${event.location}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${eventStatusStyle(derivedStatus)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${eventStatusDotStyle(derivedStatus)}`} />
                                                {derivedStatus}
                                            </span>
                                            <div className="relative" ref={openManageId === event.id ? manageMenuRef : null}>
                                                <button
                                                    type="button"
                                                    data-manage-button
                                                    onClick={() => setOpenManageId(openManageId === event.id ? null : event.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                >
                                                    Manage <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paginatedEvents.map((event, index) => {
                                const derivedStatus = deriveSimulationEventStatus(event);
                                return (
                                <div
                                    key={event.id}
                                    className={`training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 relative ${openManageId === event.id ? 'z-[100]' : ''}`}
                                    style={{ animationDelay: `${index * 0.06}s` }}
                                >
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                                                <CalendarClock className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <a
                                                    href={event.status === 'draft' ? `/admin/simulation-events/${event.id}/edit` : `/admin/simulation-events/${event.id}`}
                                                    className="font-semibold text-slate-800 hover:text-emerald-700 line-clamp-2 transition-colors"
                                                >
                                                    {event.title}
                                                </a>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {(event.disaster_type || '—')}{event.event_category ? ` • ${event.event_category}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">
                                            {formatEventDate(event.event_date)} · {formatTime(event.start_time)} – {formatTime(event.end_time)}
                                            {event.location ? ` • ${event.location}` : ''}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${eventStatusStyle(derivedStatus)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${eventStatusDotStyle(derivedStatus)}`} />
                                                Status: {derivedStatus}
                                            </span>
                                        </div>
                                        <div className="relative" ref={openManageId === event.id ? manageMenuRef : null}>
                                            <button
                                                type="button"
                                                data-manage-button
                                                onClick={() => setOpenManageId(openManageId === event.id ? null : event.id)}
                                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-medium hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                                            >
                                                Manage <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                    {openManageId && (() => {
                        const openEvent = paginatedEvents.find((ev) => ev.id === openManageId);
                        if (!openEvent) return null;
                        const close = () => setOpenManageId(null);
                        return createPortal(
                            <div
                                ref={managePortalRef}
                                className="py-1 rounded-xl border border-slate-200 bg-white shadow-xl z-[300] min-w-40 transition-opacity duration-150 ease-out"
                                style={{ position: 'fixed', top: floatingStyles.top, left: floatingStyles.left }}
                            >
                                <a href={`/admin/simulation-events/${openEvent.id}`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Eye className="w-4 h-4" /> View</a>
                                {openEvent.status === 'draft' && (
                                    <a href={`/admin/simulation-events/${openEvent.id}/edit`} onClick={close} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Pencil className="w-4 h-4" /> Edit</a>
                                )}
                                {openEvent.status === 'draft' && (
                                    <form
                                        method="POST"
                                        action={`/admin/simulation-events/${openEvent.id}/publish`}
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            const missingFields = [];
                                            if (!openEvent.title) missingFields.push('Event Title');
                                            if (!openEvent.disaster_type) missingFields.push('Disaster Type');
                                            if (!openEvent.event_category) missingFields.push('Event Category');
                                            if (!openEvent.event_date) missingFields.push('Event Date');
                                            if (!openEvent.start_time) missingFields.push('Start Time');
                                            if (!openEvent.end_time) missingFields.push('End Time');
                                            if (missingFields.length > 0) {
                                                await Swal.fire({
                                                    title: 'Validation Error!',
                                                    html: `Please fill in:<br><br>${missingFields.map((f) => `• ${f}`).join('<br>')}`,
                                                    icon: 'error',
                                                    confirmButtonColor: '#64748b',
                                                });
                                                return;
                                            }
                                            const result = await Swal.fire({
                                                title: 'Publish event?',
                                                text: 'This event will become visible to participants.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, publish',
                                                cancelButtonText: 'Cancel',
                                                confirmButtonColor: '#16a34a',
                                                cancelButtonColor: '#64748b',
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                const response = await fetch(form.action, {
                                                    method: 'POST',
                                                    body: new FormData(form),
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Request failed');
                                                }
                                                window.location.href = '/admin/simulation-events';
                                            } catch (err) {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: 'Failed to publish event. Please try again.',
                                                });
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button
                                            type="submit"
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Send className="w-4 h-4" /> Publish
                                        </button>
                                    </form>
                                )}
                                {(() => {
                                    const derivedStatus = deriveSimulationEventStatus(openEvent);
                                    if (!['published', 'ended', 'completed'].includes(derivedStatus)) return null;

                                    const now = new Date();
                                    const start = getEventDateTime(openEvent?.event_date, openEvent?.start_time);
                                    const end = getEventDateTime(openEvent?.event_date, openEvent?.end_time);

                                    let disabledReason = '';
                                    if (derivedStatus === 'ended' || derivedStatus === 'completed') {
                                        disabledReason = `This event is already ${derivedStatus}.`;
                                    } else if (!start || !end) {
                                        disabledReason = 'Start/end time is missing or invalid.';
                                    } else if (end.getTime() < start.getTime()) {
                                        disabledReason = 'End time is before start time.';
                                    } else if (now.getTime() < start.getTime()) {
                                        disabledReason = 'Event cannot be started before the scheduled start time.';
                                    } else if (now.getTime() > end.getTime()) {
                                        disabledReason = 'Event has already passed its end time.';
                                    }

                                    const eligibility = getStartEligibility(openEvent);
                                    if (!eligibility.canStart) {
                                        return (
                                            <button
                                                type="button"
                                                disabled
                                                title={disabledReason || eligibility.reason || 'Event cannot be started right now.'}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                            >
                                                <Play className="w-4 h-4" /> Start
                                            </button>
                                        );
                                    }

                                    return (
                                        <form
                                            method="POST"
                                            action={`/admin/simulation-events/${openEvent.id}/start`}
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.currentTarget;
                                                const result = await Swal.fire({
                                                    title: 'Start event?',
                                                    text: 'Start this simulation event now?',
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, start',
                                                    cancelButtonText: 'Cancel',
                                                    confirmButtonColor: '#16a34a',
                                                    cancelButtonColor: '#64748b',
                                                });
                                                if (!result.isConfirmed) return;
                                                try {
                                                    const response = await fetch(form.action, {
                                                        method: 'POST',
                                                        body: new FormData(form),
                                                    });
                                                    if (!response.ok) {
                                                        throw new Error('Request failed');
                                                    }
                                                    window.location.href = '/admin/simulation-events';
                                                } catch (err) {
                                                    Swal.fire({
                                                        icon: 'error',
                                                        title: 'Error',
                                                        text: 'Failed to start event. Please try again.',
                                                    });
                                                }
                                            }}
                                        >
                                            <input type="hidden" name="_token" value={csrf} />
                                            <button
                                                type="submit"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                <Play className="w-4 h-4" /> Start
                                            </button>
                                        </form>
                                    );
                                })()}
                                {(openEvent.status === 'published' || openEvent.status === 'draft') && (
                                    <form
                                        method="POST"
                                        action={`/admin/simulation-events/${openEvent.id}/cancel`}
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            const result = await Swal.fire({
                                                title: 'Cancel event?',
                                                text: 'Cancel this event? It will be hidden from registration.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, cancel',
                                                cancelButtonText: 'Keep',
                                                confirmButtonColor: '#dc2626',
                                                cancelButtonColor: '#64748b',
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                const response = await fetch(form.action, {
                                                    method: 'POST',
                                                    body: new FormData(form),
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Request failed');
                                                }
                                                window.location.href = '/admin/simulation-events';
                                            } catch (err) {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: 'Failed to cancel event. Please try again.',
                                                });
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button
                                            type="submit"
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <XCircle className="w-4 h-4" /> Cancel
                                        </button>
                                    </form>
                                )}
                                {openEvent.status !== 'archived' && openEvent.status !== 'cancelled' && (
                                    <form
                                        method="POST"
                                        action={`/admin/simulation-events/${openEvent.id}/archive`}
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            const result = await Swal.fire({
                                                title: 'Archive event?',
                                                text: 'Archive this event? It will become read-only.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, archive',
                                                cancelButtonText: 'Cancel',
                                                confirmButtonColor: '#f97316',
                                                cancelButtonColor: '#64748b',
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                const response = await fetch(form.action, {
                                                    method: 'POST',
                                                    body: new FormData(form),
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Request failed');
                                                }
                                                window.location.href = '/admin/simulation-events';
                                            } catch (err) {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'Error',
                                                    text: 'Failed to archive event. Please try again.',
                                                });
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="_token" value={csrf} />
                                        <button
                                            type="submit"
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Archive className="w-4 h-4" /> Archive
                                        </button>
                                    </form>
                                )}
                            </div>,
                            document.body
                        );
                    })()}
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
        </>
    );

    if (embedded) {
        return eventsContent;
    }

    return (
        <AdminPageShell>
            <AdminPageHeader
                icon={CalendarClock}
                title="Simulation Event Planning"
                description="Plan, prepare, and manage upcoming and ongoing disaster simulation events."
                actions={
                    <AdminPrimaryButton href="/admin/simulation-events/create">
                        <Plus className="w-4 h-4" />
                        Create Event
                    </AdminPrimaryButton>
                }
            />
            {eventsContent}
        </AdminPageShell>
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

function SimulationEventCampaignFields({ trainingModules = [], trainers = [], barangayProfiles = [], event = null }) {
    const deadlineValue = event?.registration_deadline
        ? String(event.registration_deadline).replace(' ', 'T').slice(0, 16)
        : '';
    const [selectedBarangayId, setSelectedBarangayId] = React.useState(
        event?.barangay_profile_id ? String(event.barangay_profile_id) : '',
    );

    return (
        <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Campaign & Registration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="barangay_profile_id">
                        Barangay (Hazard Assessment Profile)
                    </label>
                    <select
                        id="barangay_profile_id"
                        name="barangay_profile_id"
                        value={selectedBarangayId}
                        onChange={(e) => setSelectedBarangayId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="">Select barangay...</option>
                        {(barangayProfiles || []).map((bp) => (
                            <option key={bp.id} value={bp.id}>
                                {bp.barangay_name} — {bp.municipality_city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {selectedBarangayId && (
                <HazardAssessmentIntelligencePanel barangayProfileId={selectedBarangayId} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="venue">
                        Venue
                    </label>
                    <input
                        id="venue"
                        name="venue"
                        type="text"
                        defaultValue={event?.venue || ''}
                        placeholder="e.g. Barangay Covered Court"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="target_audience">
                        Target Audience
                    </label>
                    <input
                        id="target_audience"
                        name="target_audience"
                        type="text"
                        defaultValue={event?.target_audience || ''}
                        placeholder="e.g. Barangay officials, youth volunteers"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="max_participants">
                        Max Participants
                    </label>
                    <input
                        id="max_participants"
                        name="max_participants"
                        type="number"
                        min="1"
                        defaultValue={event?.max_participants || ''}
                        placeholder="Leave blank for unlimited"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="registration_deadline">
                        Registration Deadline
                    </label>
                    <input
                        id="registration_deadline"
                        name="registration_deadline"
                        type="datetime-local"
                        defaultValue={deadlineValue}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="training_module_id">
                        Linked Training Module
                    </label>
                    <select
                        id="training_module_id"
                        name="training_module_id"
                        defaultValue={event?.training_module_id || ''}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="">None</option>
                        {(trainingModules || []).map((m) => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="assigned_trainer_id">
                        Assigned Trainer
                    </label>
                    <select
                        id="assigned_trainer_id"
                        name="assigned_trainer_id"
                        defaultValue={event?.assigned_trainer_id || ''}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="">None</option>
                        {(trainers || []).map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}{t.specialization ? ` — ${t.specialization}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

function SimulationEventEditForm({ event, scenarios, trainingModules = [], trainers = [], barangayProfiles = [] }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const [selectedScenarioId, setSelectedScenarioId] = React.useState(
        String(event.scenario_id || ''),
    );
    const selectedScenario =
        (scenarios || []).find(
            (s) => String(s.id) === String(selectedScenarioId),
        ) || null;

    // Format helpers
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };
    const formatTimeForInput = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    const formRef = React.useRef(null);

    // Pre-launch checklist state (initialised from existing event)
    const [checklistTitle, setChecklistTitle] = React.useState(
        event.title || '',
    );
    const [checklistEventDate, setChecklistEventDate] = React.useState(
        formatDateForInput(event.event_date) || '',
    );
    const [startTimeValue, setStartTimeValue] = React.useState(
        formatTimeForInput(event.start_time) || '',
    );
    const [endTimeValue, setEndTimeValue] = React.useState(
        formatTimeForInput(event.end_time) || '',
    );
    const [checklistLocation, setChecklistLocation] = React.useState(
        event.location || '',
    );

    const minDate = new Date().toISOString().split('T')[0];

    const eventTitleAdded = checklistTitle.trim() !== '';
    const disasterTypeSelected = !!(selectedScenario?.disaster_type || event.disaster_type);
    const scenarioAssigned = !!(selectedScenarioId || event.scenario_id);
    const dateTimeSet =
        !!(checklistEventDate && startTimeValue && endTimeValue) ||
        !!(event.event_date && event.start_time && event.end_time);
    const locationFilled = checklistLocation.trim() !== '';
    const allReady =
        eventTitleAdded &&
        disasterTypeSelected &&
        scenarioAssigned &&
        dateTimeSet &&
        locationFilled;

    const handleStartTimeChange = (e) => {
        const start = e.target.value;
        setStartTimeValue(start);
        if (start && endTimeValue && endTimeValue < start) setEndTimeValue('');
        if (formRef.current && start) {
            const endInput = formRef.current.querySelector('#end_time_edit');
            if (endInput && endInput.value && endInput.value < start)
                endInput.value = '';
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;

        const eventDateInput = form.querySelector('#event_date_edit');
        const startTimeInput = form.querySelector('#start_time_edit');
        const endTimeInput = form.querySelector('#end_time_edit');

        if (
            eventDateInput &&
            eventDateInput.value &&
            eventDateInput.value < minDate
        ) {
            Swal.fire({
                title: 'Invalid date',
                text: 'Event date cannot be in the past. Please select today or a future date.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        if (
            startTimeInput?.value &&
            endTimeInput?.value &&
            endTimeInput.value < startTimeInput.value
        ) {
            Swal.fire({
                title: 'Invalid time',
                text: 'End time must be the same as or later than start time.',
                icon: 'warning',
                confirmButtonColor: '#10b981',
            });
            return;
        }

        Swal.fire({
            title: 'Save changes?',
            text: 'Update this simulation event with your changes?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save',
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
                    <h2 className="text-xl font-semibold text-slate-800">
                        Edit Simulation Event
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Update schedule, location, and linked scenario for this
                        drill or exercise
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: main edit form */}
                <div className="lg:col-span-8">
                    <form
                        id="simulation-event-edit-form"
                        ref={formRef}
                        method="POST"
                        action={`/admin/simulation-events/${event.id}`}
                        className="training-module-card-enter space-y-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 transition-shadow duration-300 hover:shadow-lg"
                        onSubmit={handleFormSubmit}
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <input type="hidden" name="_method" value="PUT" />

                        {/* Section 1: Basic Event Information */}
                        <div className="space-y-4">
                            <div>
                                <label
                                    className="block text-xs font-semibold text-slate-600 mb-1"
                                    htmlFor="event_title_edit"
                                >
                                    Event Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="event_title_edit"
                                    name="title"
                                    type="text"
                                    required
                                    value={checklistTitle}
                                    onChange={(e) =>
                                        setChecklistTitle(e.target.value)
                                    }
                                    placeholder="e.g. Earthquake Evacuation Drill"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="disaster_type_edit"
                                    >
                                        Disaster Type{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="disaster_type_edit"
                                        type="text"
                                        value={
                                            selectedScenario
                                                ? selectedScenario.disaster_type
                                                : event.disaster_type || ''
                                        }
                                        readOnly
                                        disabled
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                        placeholder="Select a scenario first"
                                    />
                                    <input
                                        type="hidden"
                                        name="disaster_type"
                                        value={
                                            selectedScenario
                                                ? selectedScenario.disaster_type
                                                : event.disaster_type || ''
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="event_category_edit"
                                    >
                                        Event Category{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="event_category_edit"
                                        name="event_category"
                                        required
                                        defaultValue={event.event_category}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select category…</option>
                                        <option value="Drill">Drill</option>
                                        <option value="Full-scale Exercise">
                                            Full-scale Exercise
                                        </option>
                                        <option value="Tabletop">Tabletop</option>
                                        <option value="Training Session">
                                            Training Session
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label
                                    className="block text-xs font-semibold text-slate-600 mb-1"
                                    htmlFor="event_description_edit"
                                >
                                    Event Description
                                </label>
                                <textarea
                                    id="event_description_edit"
                                    name="description"
                                    rows={4}
                                    defaultValue={event.description || ''}
                                    placeholder="What the drill is about and the main learning objectives"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Scenario Assignment */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Scenario Assignment
                            </h3>
                            <div>
                                <label
                                    className="block text-xs font-semibold text-slate-600 mb-1"
                                    htmlFor="scenario_id_edit"
                                >
                                    Select Scenario{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="scenario_id_edit"
                                    name="scenario_id"
                                    value={selectedScenarioId}
                                    onChange={(e) =>
                                        setSelectedScenarioId(e.target.value)
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select a scenario…</option>
                                    {(scenarios || []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title} ({s.disaster_type} -{' '}
                                            {s.difficulty})
                                        </option>
                                    ))}
                                </select>
                                {selectedScenario && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                                        <div className="font-semibold mb-1">
                                            Scenario Preview
                                        </div>
                                        <div>
                                            Hazard:{' '}
                                            {selectedScenario.disaster_type}
                                        </div>
                                        <div>
                                            Difficulty:{' '}
                                            {selectedScenario.difficulty}
                                        </div>
                                        {selectedScenario.short_description && (
                                            <div className="mt-1">
                                                {
                                                    selectedScenario.short_description
                                                }
                                            </div>
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
                                <label
                                    htmlFor="scenario_is_required_edit"
                                    className="text-sm text-slate-700"
                                >
                                    Required scenario
                                </label>
                            </div>
                        </div>

                        {/* Section 2: Event Schedule */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">
                                2. Event Schedule
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="event_date_edit"
                                    >
                                        Event Date{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="event_date_edit"
                                        name="event_date"
                                        type="date"
                                        required
                                        value={checklistEventDate}
                                        min={minDate}
                                        onChange={(e) =>
                                            setChecklistEventDate(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="start_time_edit"
                                    >
                                        Start Time{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="start_time_edit"
                                        name="start_time"
                                        type="time"
                                        required
                                        value={startTimeValue}
                                        onChange={handleStartTimeChange}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="end_time_edit"
                                    >
                                        End Time{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="end_time_edit"
                                        name="end_time"
                                        type="time"
                                        required
                                        value={endTimeValue}
                                        onChange={(e) =>
                                            setEndTimeValue(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                <label
                                    htmlFor="is_recurring_edit"
                                    className="text-sm text-slate-700"
                                >
                                    Repeat event
                                </label>
                            </div>
                        </div>

                        {/* Section 3: Event Location */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">
                                3. Event Location
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="block text-xs font-semibold text-slate-600 mb-1"
                                            htmlFor="location_edit"
                                        >
                                            Location / Building / Area
                                        </label>
                                        <input
                                            id="location_edit"
                                            name="location"
                                            type="text"
                                            value={checklistLocation}
                                            onChange={(e) =>
                                                setChecklistLocation(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. Barangay Hall"
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-xs font-semibold text-slate-600 mb-1"
                                            htmlFor="room_zone_edit"
                                        >
                                            Room / Zone
                                        </label>
                                        <input
                                            id="room_zone_edit"
                                            name="room_zone"
                                            type="text"
                                            defaultValue={event.room_zone || ''}
                                            placeholder="e.g. Main Hall, Zone A"
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold text-slate-600 mb-1"
                                        htmlFor="location_notes_edit"
                                    >
                                        Location Notes
                                    </label>
                                    <textarea
                                        id="location_notes_edit"
                                        name="location_notes"
                                        rows={3}
                                        defaultValue={event.location_notes || ''}
                                        placeholder="Accessibility notes, exits, hazard zones, assembly points"
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                    <label
                                        htmlFor="is_high_risk_location_edit"
                                        className="text-sm text-slate-700"
                                    >
                                        Mark location as &quot;high risk&quot;
                                    </label>
                                </div>
                            </div>
                        </div>

                        <SimulationEventCampaignFields
                            trainingModules={trainingModules}
                            trainers={trainers}
                            barangayProfiles={barangayProfiles}
                            event={event}
                        />

                        {/* Section 6 & 8 omitted: participant settings and safety managed elsewhere */}

                        {/* Publishing controls */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-end gap-3">
                                <a
                                    href="/admin/simulation-events"
                                    className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all duration-200"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold px-5 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right column: readiness + resources (same style as create) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">
                            ✅ Simulation Readiness
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={
                                        eventTitleAdded
                                            ? 'text-emerald-600'
                                            : 'text-slate-300'
                                    }
                                >
                                    {eventTitleAdded ? '✅' : '⬜'}
                                </span>
                                <span
                                    className={
                                        eventTitleAdded
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }
                                >
                                    Event title added
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={
                                        disasterTypeSelected
                                            ? 'text-emerald-600'
                                            : 'text-slate-300'
                                    }
                                >
                                    {disasterTypeSelected ? '✅' : '⬜'}
                                </span>
                                <span
                                    className={
                                        disasterTypeSelected
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }
                                >
                                    Disaster type selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={
                                        scenarioAssigned
                                            ? 'text-emerald-600'
                                            : 'text-slate-300'
                                    }
                                >
                                    {scenarioAssigned ? '✅' : '⬜'}
                                </span>
                                <span
                                    className={
                                        scenarioAssigned
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }
                                >
                                    Scenario assigned
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={
                                        dateTimeSet
                                            ? 'text-emerald-600'
                                            : 'text-slate-300'
                                    }
                                >
                                    {dateTimeSet ? '✅' : '⬜'}
                                </span>
                                <span
                                    className={
                                        dateTimeSet
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }
                                >
                                    Date & time set
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span
                                    className={
                                        locationFilled
                                            ? 'text-emerald-600'
                                            : 'text-slate-300'
                                    }
                                >
                                    {locationFilled ? '✅' : '⬜'}
                                </span>
                                <span
                                    className={
                                        locationFilled
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }
                                >
                                    Location filled
                                </span>
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

                    <div className="training-module-card-enter rounded-2xl bg-white border border-slate-200 shadow-md p-5 transition-shadow duration-300 hover:shadow-lg">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">
                            Resources for Simulation
                        </h3>
                        <ResourceSelectionSection
                            eventResources={
                                event.resources && Array.isArray(event.resources)
                                    ? event.resources
                                    : []
                            }
                            inline={true}
                        />
                    </div>
                </div>
            </div>
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
            ? `/admin/certification/templates/${template.id}/update`
            : isEdit ? `/admin/certification/templates/${template.id}` : '/admin/certification/templates';

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
        return q ? `/admin/certification?${q}` : '/admin/certification';
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
            const res = await fetch('/admin/certification/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Certificate Issued', text: data.message });
                setIssueModalOpen(false);
                setIssueRow(null);
                window.location.href = '/admin/certification';
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
            if (data.success) { Swal.fire({ icon: 'success', text: data.message }); window.location.href = '/admin/certification'; }
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed to revoke.' }); }
    };

    const handleSaveAutomation = async () => {
        const formData = new FormData();
        formData.append('_token', csrf);
        formData.append('auto_issue_when_passed', autoIssue ? '1' : '0');
        formData.append('require_attendance', requireAttendance ? '1' : '0');
        formData.append('require_supervisor_approval', requireApproval ? '1' : '0');
        try {
            await fetch('/admin/certification/settings', { method: 'POST', body: formData });
            Swal.fire({ icon: 'success', text: 'Settings saved.' });
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed to save.' }); }
    };

    const handleDuplicateTemplate = async (template) => {
        const formData = new FormData();
        formData.append('_token', csrf);
        try {
            const res = await fetch(`/admin/certification/templates/${template.id}/duplicate`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) { Swal.fire({ icon: 'success', text: 'Template duplicated.' }); window.location.href = '/admin/certification'; }
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
            await fetch(`/admin/certification/templates/${template.id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf } });
            Swal.fire({ icon: 'success', text: 'Deleted.' });
            window.location.href = '/admin/certification';
        } catch (_) { Swal.fire({ icon: 'error', text: 'Failed.' }); }
    };

    return (
        <AdminPageShell className="space-y-4">
            <AdminPageHeader
                icon={GraduationCap}
                title="Certification"
                description="Manage templates, issue certificates, and track issuance history."
                actions={
                    <>
                        <AdminPrimaryButton
                            type="button"
                            onClick={() => {
                                if (filteredEligible.length === 0) {
                                    Swal.fire({
                                        icon: 'info',
                                        title: 'No eligible participants',
                                        text: 'There are currently no participants eligible for certification based on your filters.',
                                    });
                                    return;
                                }
                                setIssueRow(filteredEligible[0]);
                                setIssueModalOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Issue Certificate
                        </AdminPrimaryButton>
                        <AdminSecondaryButton type="button" onClick={() => { setEditingTemplate(null); setTemplateEditorOpen(true); }}>
                            <Plus className="w-4 h-4" />
                            Add Template
                        </AdminSecondaryButton>
                    </>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder={
                    activeTab === 'history'
                        ? 'Name, event, or certificate ID...'
                        : activeTab === 'templates'
                            ? 'Search template name...'
                            : 'Search by name or event...'
                }
                hasActiveFilters={
                    activeTab === 'eligible'
                        ? Boolean(eventFilter || statusFilter)
                        : activeTab === 'history'
                            ? Boolean(eventFilter || certIdSearch || dateFrom || dateTo || issuedStatusFilter !== 'active')
                            : false
                }
                onClearFilters={() => {
                    setEventFilter('');
                    setStatusFilter('');
                    setCertIdSearch('');
                    setDateFrom('');
                    setDateTo('');
                    setIssuedStatusFilter('active');
                }}
                showFilterToggle={activeTab === 'eligible' || activeTab === 'history'}
                trailing={(
                    <>
                        {activeTab === 'history' && (
                            <AdminPrimaryButton type="button" onClick={handleApplyHistoryFilters}>
                                <Search className="w-4 h-4" />
                                Apply
                            </AdminPrimaryButton>
                        )}
                        <a href={`/admin/certification/export/csv?${eventFilter ? 'event_id=' + eventFilter : ''}`} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors">
                            <Download className="w-4 h-4" /> Export CSV
                        </a>
                        <a href="/admin/certification/export/pdf" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors">
                            <Download className="w-4 h-4" /> Export PDF
                        </a>
                    </>
                )}
            >
                {(activeTab === 'eligible' || activeTab === 'history') && (
                    <AdminFilterSelect label="Event" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                        <option value="">All Events</option>
                        {eventsForFilter?.map((ev) => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                    </AdminFilterSelect>
                )}
                {activeTab === 'eligible' && (
                    <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="eligible">Eligible</option>
                        <option value="not_eligible">Not Eligible</option>
                        <option value="pending">Pending</option>
                    </AdminFilterSelect>
                )}
                {activeTab === 'history' && (
                    <>
                        <AdminFilterInput label="Certificate ID" value={certIdSearch} onChange={(e) => setCertIdSearch(e.target.value)} placeholder="Search by cert number..." />
                        <AdminFilterInput label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <AdminFilterInput label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        <AdminFilterSelect label="Status" value={issuedStatusFilter} onChange={(e) => setIssuedStatusFilter(e.target.value)}>
                            <option value="active">Active</option>
                            <option value="revoked">Revoked</option>
                            <option value="all">All</option>
                        </AdminFilterSelect>
                    </>
                )}
            </AdminCollapsibleFilterBar>

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
                                                <a href={`/admin/simulation-events/${row.event_id}/evaluation/summary`} className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-md transition-all duration-250" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                {row.cert_status === 'eligible' && (
                                                    <button type="button" onClick={() => handleIssueCertificate(row)} className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all duration-250" title="Issue Certificate">
                                                        <Award className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <a href={`/admin/certification/preview-participant?user_id=${row.user_id}&event_id=${row.event_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-md transition-all duration-250" title="Preview Template">
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
                                            <a href={`/admin/certification/templates/${t.id}/preview`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-md transition-all duration-250" title="Preview"> <Eye className="w-4 h-4" /> </a>
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
                                                    <a href="/admin/certification" className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all" title="Reissue">
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
                    onSaved={() => { setTemplateEditorOpen(false); setEditingTemplate(null); window.location.href = '/admin/certification'; }}
                />
            )}
        </AdminPageShell>
    );
}

// Participant Components — module lives in ParticipantAttendanceModule.jsx

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
            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder="Search by event title, scenario, or location..."
                hasActiveFilters={statusFilter !== 'all'}
                onClearFilters={() => setStatusFilter('all')}
                trailing={(
                    <AdminPrimaryButton type="button" onClick={handleExportCsv}>
                        <Download className="w-4 h-4" />
                        Export CSV
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

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
                                                        <span>📖</span>
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
                                                href={`/admin/simulation-events/${event.id}/registrations`}
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
            <AdminCollapsibleFilterBar
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchPlaceholder="Search by event title, scenario, or location..."
                hasActiveFilters={statusFilter !== 'all'}
                onClearFilters={() => setStatusFilter('all')}
                trailing={(
                    <AdminPrimaryButton type="button" onClick={handleExportCsv}>
                        <Download className="w-4 h-4" />
                        Export CSV
                    </AdminPrimaryButton>
                )}
            >
                <AdminFilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </AdminFilterSelect>
            </AdminCollapsibleFilterBar>

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
                                                        <span>📖</span>
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
                                                href={`/admin/simulation-events/${event.id}/attendance`}
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
                        href="/admin/participants/export/csv"
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
                                            href={`/admin/participants/${participant.id}`}
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
                                                    action={`/admin/participants/${participant.id}/deactivate`}
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
                                                    action={`/admin/participants/${participant.id}/reactivate`}
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
                <a href="/admin/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors">
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
                                action={`/admin/participants/${participant.id}/deactivate`}
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
                                action={`/admin/participants/${participant.id}/reactivate`}
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
            {pagination && pagination.last_page > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={pagination.current_page || 1}
                        totalPages={pagination.last_page || 1}
                        onPageChange={handlePageChange}
                        itemsPerPage={pagination.per_page || filteredParticipants.length}
                        totalItems={pagination.total || filteredParticipants.length}
                    />
                    {isPageLoading && (
                        <p className="mt-2 text-xs text-slate-500">Loading participants…</p>
                    )}
                </div>
            )}
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

function ParticipantSelfAttendance({ participant }) {
    const records = Array.isArray(participant.attendances) ? participant.attendances : [];

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">My Attendance</h1>
                <p className="text-sm text-slate-600">
                    View your participation in simulation events where your attendance was recorded.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {records.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No attendance records found yet. Once you participate in scheduled simulation events, they will appear here.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Event</th>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((att) => {
                                    const event = att.simulation_event || att.simulationEvent;
                                    const date = event?.event_date || event?.eventDate;
                                    const status = att.status || 'present';

                                    return (
                                        <tr key={att.id} className="border-b border-slate-100 last:border-0">
                                            <td className="py-2 pr-4 text-slate-900">
                                                {event?.title || 'Simulation Event'}
                                            </td>
                                            <td className="py-2 pr-4 text-slate-600">
                                                {date ? formatDate(date) : '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function getRegistrationStatusColor(status) {
    if (status === 'approved') {
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (status === 'pending') {
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    if (status === 'rejected') {
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    return 'bg-slate-100 text-slate-600 border border-slate-200';
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
                <a href="/admin/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
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
                                                <form method="POST" action={`/admin/event-registrations/${reg.id}/approve`} onSubmit={async (e) => {
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
                                                <form method="POST" action={`/admin/event-registrations/${reg.id}/reject`} onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const { value: reason } = await Swal.fire({
                                                        title: 'Reject Registration', input: 'textarea', inputLabel: 'Rejection Reason',
                                                        inputPlaceholder: 'Enter reason...', showCancelButton: true, confirmButtonText: 'Reject',
                                                        confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
                                                        inputValidator: (value) => !value ? 'You need to provide a reason!' : null
                                                    });
                                                    if (reason) {
                                                        const form = document.createElement('form');
                                                        form.method = 'POST'; form.action = `/admin/event-registrations/${reg.id}/reject`;
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
                <a href="/admin/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">← Back to Participants</a>
                <div className="flex gap-2 items-center">
                    <AttendanceQrScanner eventId={event.id} csrfToken={csrf} onSuccess={() => window.location.reload()} />
                    <a href={`/admin/simulation-events/${event.id}/attendance/export`} className="inline-flex items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5">📥 Export CSV</a>
                    <form method="POST" action={`/admin/simulation-events/${event.id}/attendance/lock`} onSubmit={async (e) => {
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
                            <form method="POST" action={`/admin/simulation-events/${event.id}/attendance/bulk`} onSubmit={async (e) => {
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
                            <form method="POST" action={`/admin/simulation-events/${event.id}/attendance/bulk`} onSubmit={async (e) => {
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
                                                        action={`/admin/attendances/${attendance?.id || 'new'}`}
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
                                                                form.action = `/admin/event-registrations/${reg.id}/attendance`;
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
                                                        action={`/admin/attendances/${attendance?.id || 'new'}`}
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
                                                                form.action = `/admin/event-registrations/${reg.id}/attendance`;
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
        <AdminPageShell>
            <AdminPageHeader
                icon={ClipboardList}
                title="Evaluations"
                description="Evaluate participants, track scores, and view summaries by event."
            />

            {/* Evaluation overview stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                            href={`/admin/simulation-events/${event.id}/evaluation`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg font-medium text-sm transition-all duration-200"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            Evaluate
                                        </a>
                                        <a
                                            href={`/admin/simulation-events/${event.id}/evaluation/summary`}
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
        </AdminPageShell>
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
            form.action = `/admin/evaluations/${evaluation.id}/lock`;

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
                                                                    href={`/admin/simulation-events/${event.id}/evaluation/${pe.user_id}`}
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
                                                                href={isPresent ? `/admin/simulation-events/${event.id}/evaluation/${p.user_id}` : '#'}
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
                action={`/admin/simulation-events/${event.id}/evaluation/${user.id}`}
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
                                    href={`/admin/simulation-events/${event.id}/evaluation`}
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
        window.location.href = `/admin/simulation-events/${event.id}/evaluation/export/${format}`;
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

function ParticipantEvaluationResults({ participantEvaluations }) {
    const evaluationsArray = Array.isArray(participantEvaluations)
        ? participantEvaluations
        : Object.values(participantEvaluations || {});

    const hasResults = evaluationsArray.length > 0;

    const formatResultDate = (dateString) => {
        if (!dateString) return '—';
        return formatDate(dateString);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">My Evaluation Results</h1>
                <p className="text-sm text-slate-600">
                    View your scores and pass/fail status from completed simulation events.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {!hasResults ? (
                    <p className="text-sm text-slate-500">
                        You don&apos;t have any evaluation results yet. Once an event you attended has been evaluated, your scores will appear here.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Event</th>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Average Score</th>
                                    <th className="py-2 pr-4">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evaluationsArray.map((pe) => (
                                    <tr key={pe.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 pr-4 text-slate-900">
                                            {pe.event_title || 'Simulation Event'}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-600">
                                            {formatResultDate(pe.event_date)}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-900">
                                            {pe.average_score != null ? `${Number(pe.average_score).toFixed(1)}%` : '—'}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span
                                                className={[
                                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                                                    pe.result === 'passed'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200',
                                                ].join(' ')}
                                            >
                                                {pe.result ? pe.result.charAt(0).toUpperCase() + pe.result.slice(1) : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function ParticipantCertificatesList({ certificates }) {
    const rows = Array.isArray(certificates)
        ? certificates
        : Object.values(certificates || {});

    const hasCertificates = rows.length > 0;

    const formatIssuedDate = (dateString) => {
        if (!dateString) return '—';
        return formatDate(dateString);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">My Certificates</h1>
                <p className="text-sm text-slate-600">
                    View certificates issued for completed training modules and simulation events.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {!hasCertificates ? (
                    <p className="text-sm text-slate-500">
                        You don&apos;t have any certificates yet. Once you pass an evaluated event and a certificate is issued,
                        it will appear here.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="py-2 pr-4">Certificate #</th>
                                    <th className="py-2 pr-4">Event</th>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Score</th>
                                    <th className="py-2 pr-4">Type</th>
                                    <th className="py-2 pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((cert) => (
                                    <tr key={cert.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 pr-4 text-slate-900">
                                            {cert.certificate_number || '—'}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-900">
                                            {cert.training_module?.title
                                                || cert.simulation_event?.title
                                                || cert.training_type
                                                || cert.event_title
                                                || 'Training Program'}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-600">
                                            {formatIssuedDate(cert.issued_at || cert.completion_date)}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-900">
                                            {cert.final_score != null
                                                ? `${Number(cert.final_score).toFixed(1)}%`
                                                : cert.average_score != null
                                                    ? `${Number(cert.average_score).toFixed(1)}%`
                                                    : '—'}
                                        </td>
                                        <td className="py-2 pr-4 text-slate-900">
                                            {cert.type ? cert.type.charAt(0).toUpperCase() + cert.type.slice(1) : '—'}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {cert.id && (
                                                <a
                                                    href={`/certificates/${cert.id}/view`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    View / Download
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}


