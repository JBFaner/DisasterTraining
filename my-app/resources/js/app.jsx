import React from 'react';
import ReactDOM from 'react-dom/client';
import './bootstrap';
import '../css/app.css';
import { SidebarLayout } from './components/SidebarLayout';
import { ParticipantSimulationEventsList, ParticipantSimulationEventDetail } from './components/ParticipantSimulationEvents';
import { ResourceInventory } from './pages/ResourceInventory';
import * as Toast from '@radix-ui/react-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, X, Pencil, Send, Undo2, XCircle, Archive, Trash2, Search, Filter, ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
    const getItemsPerPage = () => {
        // Responsive items per page based on screen size
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width >= 1920) return 20; // Large monitors
            if (width >= 1440) return 15; // Desktop
            if (width >= 1024) return 10; // Laptop
            return 5; // Tablet/Mobile
        }
        return 10; // Default
    };

    const maxVisiblePages = typeof window !== 'undefined' && window.innerWidth >= 768 ? 7 : 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Always show pagination when there are items, even if only one page
    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center px-2 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="text-slate-400">...</span>}
                        </>
                    )}
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                page === currentPage
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center px-2 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    const flashStatus = rootElement.getAttribute('data-status');

    let modules = [];
    let scenarios = [];
    let currentModule = null;
    let currentScenario = null;
    let events = [];
    let currentEvent = null;
    let participants = [];
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
    };

    const navSection =
        sectionAttr.startsWith('training') ? 'training' :
        sectionAttr.startsWith('scenario') ? 'scenario' :
        sectionAttr.startsWith('simulation') ? 'simulation' :
        sectionAttr.startsWith('participant') ? 'participants' :
        sectionAttr.startsWith('event_registration') ? 'participants' :
        sectionAttr.startsWith('event_attendance') ? 'participants' :
        sectionAttr.startsWith('resources') ? 'resources' :
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
        
        if (sectionAttr === 'evaluation') {
            return [{ label: 'Evaluation & Scoring System', href: '/evaluation' }];
        }
        
        if (sectionAttr === 'certification') {
            return [{ label: 'Certification Issuance', href: '/certification' }];
        }
        
        return [{ label: 'Dashboard', href: '/dashboard' }];
    };

    const breadcrumbs = getBreadcrumbs();
    
    // Generate page title from breadcrumbs
    const getPageTitle = () => {
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
                <SidebarLayout role={role} currentSection={navSection}>
                    <div className="max-w-6xl mx-auto">
                        {/* Breadcrumb Navigation */}
                        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                    {crumb.href ? (
                                        <a
                                            href={crumb.href}
                                            className="hover:text-slate-900 hover:underline underline-offset-2 transition-colors"
                                        >
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span className="text-slate-900 font-medium">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                        
                        {/* Page Title */}
                        <h1 className="text-2xl font-semibold text-slate-800 mb-4">
                            {pageTitle}
                        </h1>

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
                            <TrainingModuleCreateForm />
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
                            <ParticipantSimulationEventDetail event={currentEvent} />
                        )}

                        {sectionAttr === 'participants' && (
                            <ParticipantRegistrationAttendanceModule events={events} participants={participants} role={role} />
                        )}

                        {sectionAttr === 'participant_detail' && currentParticipant && (
                            <ParticipantDetail participant={currentParticipant} />
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
                        <div className="text-4xl text-blue-200">📚</div>
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
                        <div className="text-4xl text-purple-200">🎯</div>
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
                        <div className="text-4xl text-green-200">👥</div>
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
                        <div className="text-4xl text-amber-200">✅</div>
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
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                module.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
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
                                    <span>➕</span> Create Module
                                </a>
                                <a href="/scenarios/create" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium transition-colors">
                                    <span>🎯</span> Create Scenario
                                </a>
                                <a href="/simulation-events/create" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors">
                                    <span>📅</span> Schedule Event
                                </a>
                            </>
                        )}
                        <a href="/participants" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors">
                            <span>👥</span> View Participants
                        </a>
                        <a href="/evaluation" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-colors">
                            <span>📊</span> View Results
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
                                            <span className={`text-xs font-medium ${
                                                event.status === 'published' ? 'text-emerald-600' :
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
                        <p className="text-xs font-medium text-slate-700 mb-2">📱 Mobile App Integration</p>
                        <p className="text-xs text-slate-500">Real-time check-in and notifications on mobile devices</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">🤖 AI-Powered Analytics</p>
                        <p className="text-xs text-slate-500">Advanced performance insights and recommendations</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">📹 Video Integration</p>
                        <p className="text-xs text-slate-500">Record and review simulation sessions</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">🌐 API Access</p>
                        <p className="text-xs text-slate-500">Third-party integrations and data sync</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">📊 Advanced Reporting</p>
                        <p className="text-xs text-slate-500">Custom reports and data exports</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">🔐 Role-Based Dashboard</p>
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

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Training Modules</h2>
                <a
                    href="/training-modules/create"
                    className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5"
                >
                    + Create Training Module
                </a>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-10">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="unpublished">Unpublished</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Difficulty
                                    </label>
                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Difficulties</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                {disasterTypes.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Disaster Type
                                        </label>
                                        <select
                                            value={filterDisasterType}
                                            onChange={(e) => setFilterDisasterType(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">All Types</option>
                                            {disasterTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setFilterStatus('');
                                        setFilterDifficulty('');
                                        setFilterDisasterType('');
                                    }}
                                    className="w-full text-xs text-slate-600 hover:text-slate-800 underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-left">Disaster type</th>
                            <th className="px-4 py-2 text-left">Difficulty</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Owner</th>
                            <th className="px-4 py-2 text-left">Updated</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredModules.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-slate-500 text-sm"
                                >
                                    {(modules || []).length === 0 
                                        ? 'No training modules yet. Click "Create Training Module" to add one.'
                                        : 'No modules match your search or filter criteria.'}
                                </td>
                            </tr>
                        ) : (
                            paginatedModules.map((module) => (
                                <tr
                                    key={module.id}
                                    className="border-t border-slate-100 hover:bg-slate-50"
                                >
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                        <a
                                            href={`/training-modules/${module.id}`}
                                            className="text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                        >
                                            {module.title}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {module.category ?? '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {module.difficulty}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ' +
                                                (module.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : module.status === 'draft'
                                                    ? 'bg-slate-100 text-slate-600'
                                                    : 'bg-amber-50 text-amber-700')
                                            }
                                        >
                                            {module.status
                                                ? module.status.charAt(0).toUpperCase() +
                                                  module.status.slice(1)
                                                : '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {module.owner?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">
                                        {module.updated_at ? formatDateTime(module.updated_at) : '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        <div className="flex gap-2 justify-start">
                                            <a
                                                href={`/training-modules/${module.id}/edit`}
                                                className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </a>
                                            <form
                                                method="POST"
                                                action={`/training-modules/${module.id}/archive`}
                                                onSubmit={async (e) => {
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
                                                    if (result.isConfirmed) {
                                                        e.target.submit();
                                                    }
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center justify-center rounded-md border border-amber-500/60 bg-amber-50 p-2 text-amber-800 hover:bg-amber-100 transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </form>
                                            <form
                                                method="POST"
                                                action={`/training-modules/${module.id}`}
                                                onSubmit={async (e) => {
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
                                                    if (result.isConfirmed) {
                                                        e.target.submit();
                                                    }
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <input type="hidden" name="_method" value="DELETE" />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center justify-center rounded-md border border-rose-500/60 bg-rose-50 p-2 text-rose-800 hover:bg-rose-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {filteredModules.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredModules.length}
                    />
                )}
            </div>
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
                                            className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                                                isSelected
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
                                                {lesson.is_required && (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                                                        Required
                                                    </span>
                                                )}
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

function TrainingModuleCreateForm() {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    return (
        <div className="max-w-5xl py-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Create Training Module
            </h2>
            <form
                method="POST"
                action="/training-modules"
                className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="title"
                    >
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
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
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
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
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
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
                        Save Module
                    </button>
                </div>
            </form>
        </div>
    );
}

function TrainingModuleEditForm({ module }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';

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
        is_required: false,
    });

    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setIsEditMode(false);
        setEditFormData({
            title: lesson.title || '',
            description: lesson.description || '',
            is_required: lesson.is_required || false,
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
            is_required: false,
        });
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

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
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
                                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                    >
                                        {isDescriptionExpanded ? (
                                            <>
                                                See less
                                                <ChevronUp className="w-3 h-3" />
                                            </>
                                        ) : (
                                            <>
                                                See more
                                                <ChevronDown className="w-3 h-3" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <a
                        href={`/training-modules/${module.id}/edit`}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                        title="Edit module settings"
                    >
                        <Pencil className="w-4 h-4" />
                    </a>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                        Difficulty: {module.difficulty}
                    </span>
                    {module.category && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                            Disaster type: {module.category}
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5">
                        Status: {module.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Lessons
                        </h3>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
                        {lessons.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                No lessons yet. Use the form on the right to add the
                                first lesson.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {lessons.map((lesson, index) => (
                                    <li
                                        key={lesson.id}
                                        className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50"
                                    >
                                        <div 
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleLessonClick(lesson)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm font-medium text-slate-800 hover:text-emerald-700 hover:underline">
                                                    {lesson.title}
                                                </span>
                                                {lesson.is_required && (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            {lesson.description && (
                                                <p className="mt-1 text-xs text-slate-600 whitespace-pre-line line-clamp-4">
                                                    {lesson.description}
                                                </p>
                                            )}

                                            <div className="mt-2 space-y-1">
                                                <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                                    Materials
                                                </div>
                                                {(!lesson.materials || lesson.materials.length === 0) ? (
                                                    <p className="text-[0.7rem] text-slate-400">
                                                        No materials linked yet.
                                                    </p>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {lesson.materials.map((mat) => (
                                                            <li
                                                                key={mat.id}
                                                                className="flex items-center justify-between gap-2 text-[0.75rem]"
                                                            >
                                                                <a
                                                                    href={mat.path}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                                                >
                                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-600">
                                                                        {mat.type}
                                                                    </span>
                                                                    <span>
                                                                        {mat.label || mat.path}
                                                                    </span>
                                                                </a>
                                                                <form
                                                                    method="POST"
                                                                    action={`/training-modules/${module.id}/lessons/${lesson.id}/materials/${mat.id}`}
                                                                    onSubmit={async (e) => {
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
                                                                        if (result.isConfirmed) {
                                                                            e.target.submit();
                                                                        }
                                                                    }}
                                                                >
                                                                    <input type="hidden" name="_token" value={csrf} />
                                                                    <input
                                                                        type="hidden"
                                                                        name="_method"
                                                                        value="DELETE"
                                                                    />
                                                                    <button
                                                                        type="submit"
                                                                        className="text-[0.7rem] font-medium text-rose-700 hover:text-rose-900"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </form>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <form
                                                method="POST"
                                                action={`/training-modules/${module.id}/lessons/${lesson.id}`}
                                                onSubmit={async (e) => {
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
                                                    if (result.isConfirmed) {
                                                        e.target.submit();
                                                    }
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <input
                                                    type="hidden"
                                                    name="_method"
                                                    value="DELETE"
                                                />
                                                <button
                                                    type="submit"
                                                    className="text-[0.7rem] font-medium text-rose-700 hover:text-rose-900"
                                                >
                                                    Remove lesson
                                                </button>
                                            </form>
                                            <form
                                                method="POST"
                                                action={`/training-modules/${module.id}/lessons/${lesson.id}/materials`}
                                                className="space-y-1 text-[0.7rem] w-48"
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <select
                                                    name="type"
                                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-[0.7rem] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mb-1"
                                                >
                                                    <option value="PDF">PDF</option>
                                                    <option value="Video">Video</option>
                                                    <option value="Image">Image</option>
                                                    <option value="PPT">PPT</option>
                                                    <option value="Link">Link</option>
                                                </select>
                                                <input
                                                    name="label"
                                                    type="text"
                                                    placeholder="Short label (optional)"
                                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-[0.7rem] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mb-1"
                                                />
                                                <input
                                                    name="url"
                                                    type="url"
                                                    required
                                                    placeholder="https://example.com/resource"
                                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-[0.7rem] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mb-1"
                                                />
                                                <div className="flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[0.7rem] font-medium px-2.5 py-1"
                                                    >
                                                        Add material
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Add Lesson
                    </h3>
                    <form
                        method="POST"
                        action={`/training-modules/${module.id}/lessons`}
                        className="space-y-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4"
                    >
                        <input type="hidden" name="_token" value={csrf} />
                        <div>
                            <label
                                htmlFor="lesson_title"
                                className="block text-[0.7rem] font-semibold text-slate-600 mb-1"
                            >
                                Lesson title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="lesson_title"
                                name="title"
                                type="text"
                                required
                                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="lesson_description"
                                className="block text-[0.7rem] font-semibold text-slate-600 mb-1"
                            >
                                Description / key points
                            </label>
                            <textarea
                                id="lesson_description"
                                name="description"
                                rows={3}
                                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                                type="checkbox"
                                name="is_required"
                                defaultChecked
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Required lesson for module completion</span>
                        </label>
                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5"
                            >
                                Add lesson
                            </button>
                        </div>
                    </form>
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
                                                <Pencil className="w-4 h-4" />
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
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="edit_lesson_required"
                                                    name="is_required"
                                                    type="checkbox"
                                                    checked={editFormData.is_required}
                                                    onChange={(e) => setEditFormData({ ...editFormData, is_required: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <label htmlFor="edit_lesson_required" className="text-sm text-slate-700">
                                                    Required lesson for module completion
                                                </label>
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
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-600">Status:</span>
                                                        <div className="mt-1">
                                                            {selectedLesson.is_required ? (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                                                    Required
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                                                    Optional
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
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

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Scenarios</h2>
                <a
                    href="/scenarios/create"
                    className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5"
                >
                    + Create Scenario
                </a>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search scenarios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-10">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Difficulty
                                    </label>
                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Difficulties</option>
                                        <option value="Basic">Basic</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                {disasterTypes.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Disaster Type
                                        </label>
                                        <select
                                            value={filterDisasterType}
                                            onChange={(e) => setFilterDisasterType(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">All Types</option>
                                            {disasterTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setFilterStatus('');
                                        setFilterDifficulty('');
                                        setFilterDisasterType('');
                                    }}
                                    className="w-full text-xs text-slate-600 hover:text-slate-800 underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-left">Training Module</th>
                            <th className="px-4 py-2 text-left">Disaster Type</th>
                            <th className="px-4 py-2 text-left">Difficulty</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Updated</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredScenarios.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-slate-500 text-sm"
                                >
                                    {(scenarios || []).length === 0 
                                        ? 'No scenarios yet. Click "Create Scenario" to add one.'
                                        : 'No scenarios match your search or filter criteria.'}
                                </td>
                            </tr>
                        ) : (
                            paginatedScenarios.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-t border-slate-100 hover:bg-slate-50"
                                >
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                        <a
                                            href={`/scenarios/${s.id}`}
                                            className="text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                        >
                                            {s.title}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {s.training_module?.title ?? '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {s.disaster_type}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {s.difficulty}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        <span
                                            className={
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ' +
                                                (s.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : s.status === 'draft'
                                                    ? 'bg-slate-100 text-slate-600'
                                                    : 'bg-amber-50 text-amber-700')
                                            }
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">
                                        {s.updated_at ? formatDateTime(s.updated_at) : '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                        <div className="flex gap-2 items-center">
                                            <a
                                                href={`/scenarios/${s.id}/edit`}
                                                className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </a>

                                            <form
                                                method="POST"
                                                action={`/scenarios/${s.id}/publish`}
                                                onSubmit={async (e) => {
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
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button
                                                    type="submit"
                                                    disabled={s.status === 'published'}
                                                    className={[
                                                        'inline-flex items-center justify-center rounded-md border p-2 transition-colors',
                                                        s.status === 'published'
                                                            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                                            : 'border-sky-500/60 bg-sky-50 text-sky-800 hover:bg-sky-100',
                                                    ].join(' ')}
                                                    title="Publish"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                            </form>

                                            <form
                                                method="POST"
                                                action={`/scenarios/${s.id}/archive`}
                                                onSubmit={async (e) => {
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
                                                }}
                                            >
                                                <input type="hidden" name="_token" value={csrf} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center justify-center rounded-md border border-amber-500/60 bg-amber-50 p-2 text-amber-800 hover:bg-amber-100 transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </form>

                                            {canDelete && (
                                                <form
                                                    method="POST"
                                                    action={`/scenarios/${s.id}`}
                                                    onSubmit={async (e) => {
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
                                                    }}
                                                >
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <input type="hidden" name="_method" value="DELETE" />
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center justify-center rounded-md border border-rose-500/60 bg-rose-50 p-2 text-rose-800 hover:bg-rose-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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
                {filteredScenarios.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredScenarios.length}
                    />
                )}
            </div>
        </div>
    );
}

function ScenarioCreateForm({ modules }) {
    const csrf =
        document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const [selectedModuleId, setSelectedModuleId] = React.useState('');
    const [showAiChat, setShowAiChat] = React.useState(false);
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [aiGenerating, setAiGenerating] = React.useState(false);
    const [aiError, setAiError] = React.useState(null);
    const publishedModules = (modules || []).filter((m) => m.status === 'published');
    const selectedModule =
        publishedModules.find((m) => String(m.id) === String(selectedModuleId)) || null;
    const derivedDisasterType = selectedModule?.disaster_type || '';

    const formRef = React.useRef(null);

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
        <div className="py-2">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    Create Scenario
                </h2>
                <button
                    type="button"
                    onClick={() => setShowAiChat(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                </button>
            </div>

            {/* AI Chat Popup */}
            {showAiChat && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800">
                                AI Scenario Generator
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAiChat(false);
                                    setAiPrompt('');
                                    setAiError(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-600 mb-2">
                                    Describe the scenario you want to generate:
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g., A magnitude 7.2 earthquake strikes downtown at 2:30 PM during business hours. Multiple buildings collapse, roads are damaged, power is out, and there are reports of trapped people. The scenario should focus on emergency response coordination."
                                    rows={6}
                                    disabled={aiGenerating}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Be as detailed as possible. The AI will generate a complete scenario with all relevant fields populated.
                                </p>
                            </div>

                            {aiError && (
                                <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                                    {aiError}
                                </div>
                            )}

                            {selectedModule && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                                    <strong>Note:</strong> Disaster type from selected module ({selectedModule.title}): {derivedDisasterType || 'N/A'}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAiChat(false);
                                    setAiPrompt('');
                                    setAiError(null);
                                }}
                                disabled={aiGenerating}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateWithAi}
                                disabled={aiGenerating || !aiPrompt.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium"
                            >
                                {aiGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
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
                className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="disaster_type" value={derivedDisasterType} />
                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="scenario_title"
                    >
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="scenario_title"
                        name="title"
                        type="text"
                        required
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label
                        className="block text-xs font-semibold text-slate-600 mb-1"
                        htmlFor="scenario_short_description"
                    >
                        Short description
                    </label>
                    <textarea
                        id="scenario_short_description"
                        name="short_description"
                        rows={3}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="training_module_id"
                        >
                            Training Module <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="training_module_id"
                            name="training_module_id"
                            required
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        <label
                            className="block text-xs font-semibold text-slate-600 mb-1"
                            htmlFor="scenario_difficulty"
                        >
                            Difficulty <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="scenario_difficulty"
                            name="difficulty"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div>
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
    const derivedDisasterType = selectedModule?.disaster_type || scenario.disaster_type || '';

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

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="training_module_id_edit">
                        Training Module (required)
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
                        <Pencil className="w-4 h-4" />
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
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSeverityColor(scenario.severity_level)}`}>
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
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getCommunicationStatusColor(scenario.communication_status)}`}>
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

            {/* Injects and Expected Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Injects Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Injects</h3>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
                        {(() => {
                            // Handle both camelCase and snake_case from Laravel
                            const injects = scenario.injects || [];
                            return injects.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {injects.map((inject) => (
                                    <li
                                        key={inject.id}
                                        className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-slate-800">
                                                    {inject.title}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-700">
                                                    {inject.trigger_time_text}
                                                </span>
                                            </div>
                                            {inject.description && (
                                                <p className="text-xs text-slate-600 whitespace-pre-line">
                                                    {inject.description}
                                                </p>
                                            )}
                                        </div>
                                        <form
                                            method="POST"
                                            action={`/scenarios/${scenario.id}/injects/${inject.id}`}
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const result = await Swal.fire({
                                                    title: 'Warning!',
                                                    text: 'Remove this inject from the scenario?',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, remove it',
                                                    cancelButtonText: 'Cancel',
                                                    confirmButtonColor: '#dc2626',
                                                    cancelButtonColor: '#64748b',
                                                });
                                                if (result.isConfirmed) {
                                                    e.target.submit();
                                                }
                                            }}
                                        >
                                            <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button
                                                type="submit"
                                                className="text-[0.7rem] font-medium text-rose-700 hover:text-rose-900"
                                            >
                                                Remove
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                            ) : (
                                <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                    No injects yet. Use the form below to add one.
                                </div>
                            );
                        })()}
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                        <h4 className="text-xs font-semibold text-slate-700 mb-3">Add Inject</h4>
                        <form
                            method="POST"
                            action={`/scenarios/${scenario.id}/injects`}
                            className="space-y-3"
                        >
                            <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="inject_title">
                                    Title
                                </label>
                                <input
                                    id="inject_title"
                                    name="title"
                                    type="text"
                                    required
                                    placeholder="e.g. Aftershock occurs"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="inject_trigger_time">
                                    Trigger time
                                </label>
                                <input
                                    id="inject_trigger_time"
                                    name="trigger_time_text"
                                    type="text"
                                    required
                                    placeholder="e.g. after 20 minutes"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="inject_description">
                                    Description (optional)
                                </label>
                                <textarea
                                    id="inject_description"
                                    name="description"
                                    rows={2}
                                    placeholder="Additional details about this inject"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2"
                            >
                                Add Inject
                            </button>
                        </form>
                    </div>
                </div>

                {/* Expected Actions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Expected Actions</h3>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
                        {(() => {
                            const expectedActions = scenario.expectedActions || scenario.expected_actions || [];
                            return expectedActions.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {expectedActions.map((action, index) => (
                                    <li
                                        key={action.id}
                                        className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-slate-400">#{index + 1}</span>
                                                <span className="text-sm font-medium text-slate-800">
                                                    {action.description}
                                                </span>
                                                {action.category && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-600 capitalize">
                                                        {action.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <form
                                            method="POST"
                                            action={`/scenarios/${scenario.id}/expected-actions/${action.id}`}
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const result = await Swal.fire({
                                                    title: 'Warning!',
                                                    text: 'Remove this expected action from the scenario?',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, remove it',
                                                    cancelButtonText: 'Cancel',
                                                    confirmButtonColor: '#dc2626',
                                                    cancelButtonColor: '#64748b',
                                                });
                                                if (result.isConfirmed) {
                                                    e.target.submit();
                                                }
                                            }}
                                        >
                                            <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                                            <input type="hidden" name="_method" value="DELETE" />
                                            <button
                                                type="submit"
                                                className="text-[0.7rem] font-medium text-rose-700 hover:text-rose-900"
                                            >
                                                Remove
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                            ) : (
                                <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                    No expected actions yet. Use the form below to add one.
                                </div>
                            );
                        })()}
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                        <h4 className="text-xs font-semibold text-slate-700 mb-3">Add Expected Action</h4>
                        <form
                            method="POST"
                            action={`/scenarios/${scenario.id}/expected-actions`}
                            className="space-y-3"
                        >
                            <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="expected_action_description">
                                    Description
                                </label>
                                <input
                                    id="expected_action_description"
                                    name="description"
                                    type="text"
                                    required
                                    placeholder="e.g. Perform Duck–Cover–Hold"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="expected_action_category">
                                    Category (optional)
                                </label>
                                <select
                                    id="expected_action_category"
                                    name="category"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select category…</option>
                                    <option value="evacuation">Evacuation</option>
                                    <option value="triage">Triage</option>
                                    <option value="communication">Communication</option>
                                    <option value="coordination">Coordination</option>
                                    <option value="rescue">Rescue</option>
                                    <option value="first_aid">First Aid</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2"
                            >
                                Add Expected Action
                            </button>
                        </form>
                    </div>
                </div>
            </div>
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

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Simulation Events</h2>
                <div className="flex items-center gap-3">
                    {/* Auto-Approval Toggle */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-sm font-medium text-slate-700">Auto-Approve Registrations</span>
                        <button
                            type="button"
                            onClick={handleToggleAutoApproval}
                            disabled={isLoadingToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                autoApprovalEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            } ${isLoadingToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            role="switch"
                            aria-checked={autoApprovalEnabled}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    autoApprovalEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className="text-xs text-slate-500">
                            {autoApprovalEnabled ? '(All events)' : '(Manual approval)'}
                        </span>
                    </div>
                    
                    <a
                        href="/simulation-events/create"
                        className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5"
                    >
                        + Create Event
                    </a>
                </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-10">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                </div>
                                {disasterTypes.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Disaster Type
                                        </label>
                                        <select
                                            value={filterDisasterType}
                                            onChange={(e) => setFilterDisasterType(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">All Types</option>
                                            {disasterTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {categories.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setFilterStatus('');
                                        setFilterDisasterType('');
                                        setFilterCategory('');
                                    }}
                                    className="w-full text-xs text-slate-600 hover:text-slate-800 underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-left">Disaster Type</th>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-left">Date & Time</th>
                            <th className="px-4 py-2 text-left">Location</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-slate-500 text-sm">
                                    {events.length === 0 
                                        ? 'No simulation events yet. Click "Create Event" to add one.'
                                        : 'No events match your search or filter criteria.'}
                                </td>
                            </tr>
                        ) : (
                            paginatedEvents.map((event) => (
                                <tr key={event.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                        <a
                                            href={`/simulation-events/${event.id}/edit`}
                                            className="text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2"
                                        >
                                            {event.title}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">{event.disaster_type}</td>
                                    <td className="px-4 py-2 text-slate-600">{event.event_category}</td>
                                    <td className="px-4 py-2 text-slate-600">
                                        <div>{formatDate(event.event_date)}</div>
                                        <div className="text-xs text-slate-500">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">{event.location || '—'}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ' +
                                                (event.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : event.status === 'draft'
                                                    ? 'bg-slate-100 text-slate-600'
                                                    : event.status === 'archived'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : event.status === 'cancelled'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-slate-100 text-slate-600')
                                            }
                                        >
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2 items-center">
                                            {/* Edit - Only for draft events */}
                                            {event.status === 'draft' && (
                                                <a
                                                    href={`/simulation-events/${event.id}/edit`}
                                                    className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            {/* Publish - Only for draft events */}
                                            {event.status === 'draft' && (
                                                <form
                                                    method="POST"
                                                    action={`/simulation-events/${event.id}/publish`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Publish this simulation event? It will become visible to participants.',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, publish',
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
                                                        className="inline-flex items-center justify-center rounded-md border border-sky-500/60 bg-sky-50 p-2 text-sky-800 hover:bg-sky-100 transition-colors"
                                                        title="Publish"
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                </form>
                                            )}
                                            {/* Unpublish - Only for published events */}
                                            {event.status === 'published' && (
                                                <form
                                                    method="POST"
                                                    action={`/simulation-events/${event.id}/unpublish`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Unpublish this event? It will be hidden from participants and changed to draft. You can edit and republish later.',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, unpublish',
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
                                                        className="inline-flex items-center justify-center rounded-md border border-amber-500/60 bg-amber-50 p-2 text-amber-800 hover:bg-amber-100 transition-colors"
                                                        title="Unpublish"
                                                    >
                                                        <Undo2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </form>
                                            )}
                                            {/* Cancel - For published and draft events (not archived/cancelled) */}
                                            {(event.status === 'published' || event.status === 'draft') && (
                                                <form
                                                    method="POST"
                                                    action={`/simulation-events/${event.id}/cancel`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Cancel this simulation event? It will be marked as cancelled, hidden from registration, and participants will be notified. Event data will be preserved.',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, cancel event',
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
                                                        className="inline-flex items-center justify-center rounded-md border border-rose-500/60 bg-rose-50 p-2 text-rose-800 hover:bg-rose-100 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </form>
                                            )}
                                            {/* Archive - For published, draft, and cancelled events (not already archived) */}
                                            {event.status !== 'archived' && event.status !== 'cancelled' && (
                                                <form
                                                    method="POST"
                                                    action={`/simulation-events/${event.id}/archive`}
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const result = await Swal.fire({
                                                            title: 'Warning!',
                                                            text: 'Archive this simulation event? It will be marked as archived and become read-only. Used for completed events and records.',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, archive',
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
                                                        className="inline-flex items-center justify-center rounded-md border border-amber-500/60 bg-amber-50 p-2 text-amber-800 hover:bg-amber-100 transition-colors"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
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
                {filteredEvents.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredEvents.length}
                    />
                )}
            </div>
        </div>
    );
}

// Resource Selection Component
function ResourceSelectionSection({ eventResources = [] }) {
    const [selectedResources, setSelectedResources] = React.useState(() => {
        // Initialize with existing event resources if editing
        if (eventResources && eventResources.length > 0) {
            return eventResources.map(r => {
                // Handle both direct resource objects and pivot relationships
                const resource = r.resource || r;
                return {
                    id: resource.id || r.resource_id || r.id,
                    name: resource.name || r.name,
                    category: resource.category || r.category,
                    quantity: r.pivot?.quantity_needed || resource.pivot?.quantity_needed || 1,
                    available: resource.available || r.available || 1,
                };
            });
        }
        return [];
    });
    const [showModal, setShowModal] = React.useState(false);
    const [resources, setResources] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [loading, setLoading] = React.useState(false);
    const [tempSelections, setTempSelections] = React.useState({});

    // Fetch available resources
    React.useEffect(() => {
        if (showModal) {
            fetchAvailableResources();
        }
    }, [showModal]);

    const fetchAvailableResources = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/resources?status=Available');
            const data = await response.json();
            // Only show resources with available quantity > 0
            const available = (data.resources || data).filter(r => 
                (r.status === 'Available' || r.status === 'Partially Assigned') && 
                (r.available || r.quantity) > 0
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

    const handleSaveResources = () => {
        const newResources = Object.keys(tempSelections).map(id => {
            const resource = resources.find(r => r.id === parseInt(id));
            return {
                id: parseInt(id),
                name: resource.name,
                category: resource.category,
                quantity: tempSelections[id],
                available: resource.available || resource.quantity,
            };
        });

        setSelectedResources(newResources);
        setShowModal(false);
        setTempSelections({});
    };

    const handleRemoveResource = (resourceId) => {
        setSelectedResources(selectedResources.filter(r => r.id !== resourceId));
    };

    // Store selected resources in hidden input for form submission
    React.useEffect(() => {
        const updateHiddenInput = () => {
            let hiddenInput = document.getElementById('selected_resources_input');
            if (!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'resources';
                hiddenInput.id = 'selected_resources_input';
                const form = document.querySelector('form[method="POST"]');
                if (form) {
                    form.appendChild(hiddenInput);
                }
            }
            if (hiddenInput) {
                hiddenInput.value = JSON.stringify(selectedResources.map(r => ({
                    id: r.id,
                    quantity: r.quantity,
                })));
            }
        };
        
        // Try immediately and also after a short delay to ensure form exists
        updateHiddenInput();
        const timeout = setTimeout(updateHiddenInput, 100);
        return () => clearTimeout(timeout);
    }, [selectedResources]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">10. Resources</h3>
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={handleAddResources}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    +Resources
                </button>

                {selectedResources.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600">Selected Resources:</p>
                        {selectedResources.map((resource) => (
                            <div key={resource.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{resource.name}</p>
                                    <p className="text-xs text-slate-600">{resource.category} • Quantity: {resource.quantity}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveResource(resource.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resource Selection Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900">Select Resources</h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setTempSelections({});
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 flex-1 overflow-y-auto">
                                {/* Search and Filter */}
                                <div className="mb-4 space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search resources..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Resources List */}
                                {loading ? (
                                    <div className="text-center py-8 text-slate-500">Loading resources...</div>
                                ) : filteredResources.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No available resources found</div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredResources.map((resource) => {
                                            const availableQty = resource.available || resource.quantity || 0;
                                            const isSelected = !!tempSelections[resource.id];
                                            const selectedQty = tempSelections[resource.id] || 0;

                                            return (
                                                <div
                                                    key={resource.id}
                                                    className={`p-4 rounded-md border-2 transition-colors ${
                                                        isSelected
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleResource(resource)}
                                                            className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900">{resource.name}</p>
                                                                    <p className="text-xs text-slate-600">{resource.category}</p>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        Available: <span className="font-medium">{availableQty}</span> units
                                                                        {resource.quantity && resource.quantity !== availableQty && (
                                                                            <span className="ml-2">(Total: {resource.quantity})</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="mt-3">
                                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                                        Quantity Needed
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={availableQty}
                                                                        value={selectedQty}
                                                                        onChange={(e) => handleQuantityChange(resource.id, e.target.value)}
                                                                        className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                    />
                                                                    <p className="text-xs text-slate-500 mt-1">Max: {availableQty}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setTempSelections({});
                                    }}
                                    className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveResources}
                                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                                >
                                    Add Selected Resources
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

    return (
        <div className="py-2">
            <form
                method="POST"
                action="/simulation-events"
                className="space-y-6"
            >
                <input type="hidden" name="_token" value={csrf} />
                <input type="hidden" name="status" value="draft" />

                {/* Section 1: Basic Event Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">1. Basic Event Information</h3>
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
                                placeholder="e.g. Earthquake Evacuation Drill"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="disaster_type">
                                    Disaster Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="disaster_type"
                                    name="disaster_type"
                                    required
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
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_category">
                                    Event Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="event_category"
                                    name="event_category"
                                    required
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
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_description">
                                Event Description
                            </label>
                            <textarea
                                id="event_description"
                                name="description"
                                rows={4}
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
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="event_date">
                                Event Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="event_date"
                                name="event_date"
                                type="date"
                                required
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            id="is_recurring"
                            name="is_recurring"
                            type="checkbox"
                            value="1"
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="is_recurring" className="text-sm text-slate-700">
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
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="location">
                                    Location / Building / Area
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    placeholder="e.g. Barangay Hall"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="is_high_risk_location"
                                name="is_high_risk_location"
                                type="checkbox"
                                value="1"
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="is_high_risk_location" className="text-sm text-slate-700">
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
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="scenario_id">
                                Select Scenario
                            </label>
                            <select
                                id="scenario_id"
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
                                id="scenario_is_required"
                                name="scenario_is_required"
                                type="checkbox"
                                value="1"
                                defaultChecked
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="scenario_is_required" className="text-sm text-slate-700">
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
                            <div className="space-y-2">
                                {['Staff', 'Volunteers', 'Students', 'Responders'].map((type) => (
                                    <label key={type} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="allowed_participant_types[]"
                                            value={type.toLowerCase()}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-slate-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="max_participants">
                                    Max Participant Limit
                                </label>
                                <input
                                    id="max_participants"
                                    name="max_participants"
                                    type="number"
                                    min="1"
                                    placeholder="No limit if empty"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="self_registration_enabled"
                                    value="1"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Enable self-registration</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="qr_code_enabled"
                                    value="1"
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">Enable QR code or attendance code</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 8: Safety & Compliance */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">8. Safety & Compliance</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="safety_guidelines">
                                Safety Guidelines
                            </label>
                            <textarea
                                id="safety_guidelines"
                                name="safety_guidelines"
                                rows={3}
                                placeholder="Safety rules and guidelines"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="hazard_warnings">
                                Hazard Warnings
                            </label>
                            <textarea
                                id="hazard_warnings"
                                name="hazard_warnings"
                                rows={2}
                                placeholder="Known hazards and warnings"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 10: Resources */}
                <ResourceSelectionSection />

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
                            Save as Draft
                        </button>
                    </div>
                </div>
            </form>
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
                method="POST"
                action={`/simulation-events/${event.id}`}
                className="space-y-6"
            >
                <input type="hidden" name="_token" value={csrf} />
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

// Participant Components
// Participant Registration & Attendance Module
function ParticipantRegistrationAttendanceModule({ events = [], participants = [], role }) {
    const [activeTab, setActiveTab] = React.useState('participants');

    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Participant Registration & Management</h2>
            
            {/* Tabs */}
            <div className="mb-4 border-b border-slate-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('participants')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'participants'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        👥 Participant List
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'registrations'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        📋 Event Registrations
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'attendance'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        ✓ Event Attendance
                    </button>
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
        <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or ID..."
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
                    <div className="flex items-end">
                        <a
                            href="/participants/export/csv"
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 w-full justify-center"
                        >
                            📥 Export CSV
                        </a>
                    </div>
                </div>
            </div>

            {/* Participants Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-2 text-left">Participant ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Phone</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Events</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-slate-500 text-sm">
                                    {participants.length === 0 
                                        ? 'No participants registered yet. Participants will appear here after self-registration.'
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
                                    <td className="px-4 py-2 text-slate-600 text-xs">{participant.email}</td>
                                    <td className="px-4 py-2 text-slate-600 text-xs">{participant.phone || '—'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                                            participant.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {participant.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-center">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                                            {participant.event_registrations_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2 items-center">
                                            <a
                                                href={`/participants/${participant.id}`}
                                                className="inline-flex items-center rounded-md border border-blue-500/60 bg-blue-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
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
                                                            confirmButtonColor: '#f97316',
                                                            cancelButtonColor: '#64748b',
                                                        });
                                                        if (result.isConfirmed) e.target.submit();
                                                    }}
                                                >
                                                    <input type="hidden" name="_token" value={csrf} />
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center rounded-md border border-amber-500/60 bg-amber-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
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
                                                        className="inline-flex items-center rounded-md border border-emerald-500/60 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
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

// Registrations Tab - Shows events with registration management
function RegistrationEventsTable({ events = [] }) {
    const publishedEvents = events.filter(e => e.status === 'published' || e.status === 'archived');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                        <th className="px-4 py-2 text-left">Event Title</th>
                        <th className="px-4 py-2 text-left">Date & Time</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Registrations</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {publishedEvents.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">
                                No published events yet.
                            </td>
                        </tr>
                    ) : (
                        publishedEvents.map((event) => (
                            <tr key={event.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-800">{event.title}</td>
                                <td className="px-4 py-2 text-slate-600">
                                    <div>{formatDate(event.event_date)}</div>
                                    <div className="text-xs text-slate-500">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                                </td>
                                <td className="px-4 py-2 text-slate-600">{event.location || '—'}</td>
                                <td className="px-4 py-2 text-slate-600 text-center">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                                        {event.registrations_count || 0} registered
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <a
                                        href={`/simulation-events/${event.id}/registrations`}
                                        className="inline-flex items-center rounded-md border border-emerald-500/60 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                                    >
                                        Manage Registrations
                                    </a>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Attendance Tab - Shows events with attendance tracking
function AttendanceEventsTable({ events = [] }) {
    const publishedEvents = events.filter(e => e.status === 'published' || e.status === 'archived');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                        <th className="px-4 py-2 text-left">Event Title</th>
                        <th className="px-4 py-2 text-left">Date & Time</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Approved Participants</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {publishedEvents.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">
                                No published events yet.
                            </td>
                        </tr>
                    ) : (
                        publishedEvents.map((event) => (
                            <tr key={event.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-800">{event.title}</td>
                                <td className="px-4 py-2 text-slate-600">
                                    <div>{formatDate(event.event_date)}</div>
                                    <div className="text-xs text-slate-500">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                                </td>
                                <td className="px-4 py-2 text-slate-600">{event.location || '—'}</td>
                                <td className="px-4 py-2 text-slate-600 text-center">
                                    <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-semibold">
                                        {event.approved_registrations_count || 0} approved
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <a
                                        href={`/simulation-events/${event.id}/attendance`}
                                        className="inline-flex items-center rounded-md border border-purple-500/60 bg-purple-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-purple-800 hover:bg-purple-100 transition-colors"
                                    >
                                        Track Attendance
                                    </a>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700';
            case 'inactive': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Participants</h2>
                <div className="flex gap-2">
                    <a
                        href="/participants/export/csv"
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5"
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
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${getStatusColor(participant.status)}`}>
                                            {participant.status || 'active'}
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
                                                        className="inline-flex items-center rounded-md border border-amber-500/60 bg-amber-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
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
                                                        className="inline-flex items-center rounded-md border border-emerald-500/60 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
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
    return (
        <div>
            <div className="mb-4">
                <a href="/participants" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
                    ← Back to Participants
                </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Participant Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Participant ID</label>
                        <div className="text-sm text-slate-800 font-mono">{participant.participant_id || 'N/A'}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                        <div className="text-sm text-slate-800">{participant.status || 'active'}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                        <div className="text-sm text-slate-800">{participant.name}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                        <div className="text-sm text-slate-800">{participant.email}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                        <div className="text-sm text-slate-800">{participant.phone || '—'}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Registered At</label>
                        <div className="text-sm text-slate-800">
                            {formatDateTime(participant.registered_at)}
                        </div>
                    </div>
                </div>
            </div>
            {participant.event_registrations && participant.event_registrations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Event Registrations</h3>
                    <div className="space-y-2">
                        {participant.event_registrations.map((reg) => (
                            <div key={reg.id} className="p-3 bg-slate-50 rounded-md">
                                <div className="font-medium text-sm text-slate-800">
                                    {reg.simulation_event?.title || 'N/A'}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                    Status: {reg.status} • Registered: {formatDate(reg.registered_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {participant.attendances && participant.attendances.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Attendance History</h3>
                    <div className="space-y-2">
                        {participant.attendances.map((attendance) => (
                            <div key={attendance.id} className="p-3 bg-slate-50 rounded-md">
                                <div className="font-medium text-sm text-slate-800">
                                    {attendance.simulation_event?.title || 'N/A'}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                    Status: {attendance.status} • Check-in: {attendance.check_in_method || 'N/A'}
                                    {attendance.checked_in_at && ` • ${new Date(attendance.checked_in_at).toLocaleString()}`}
                                </div>
                            </div>
                        ))}
                    </div>
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
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{event.title}</h3>
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
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                                            reg.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                            reg.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                            reg.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {reg.status}
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
                                                    <button type="submit" className="inline-flex items-center rounded-md border border-emerald-500/60 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-800 hover:bg-emerald-100">Approve</button>
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
                                                    <button type="submit" className="inline-flex items-center rounded-md border border-rose-500/60 bg-rose-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-rose-800 hover:bg-rose-100">Reject</button>
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
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Event: {event.title}</h3>
                <div className="text-xs text-slate-600">{formatDate(event.event_date)} • {event.location || 'Location TBD'}</div>
            </div>
            
            {/* Attendance Summary Statistics */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl shadow-sm border border-emerald-200 p-6 mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">📊 Attendance Summary</h3>
                <div className="grid grid-cols-5 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                        <div className="text-2xl font-bold text-blue-600">{totalRegistered}</div>
                        <div className="text-xs text-slate-600 mt-1">Total Registered</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-emerald-200">
                        <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
                        <div className="text-xs text-slate-600 mt-1">Present</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-amber-200">
                        <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
                        <div className="text-xs text-slate-600 mt-1">Late</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-rose-200">
                        <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
                        <div className="text-xs text-slate-600 mt-1">Absent</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                        <div className="text-2xl font-bold text-slate-600">{notMarkedCount}</div>
                        <div className="text-xs text-slate-600 mt-1">Not Marked</div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Attendance Rate:</span>
                        <span className="text-xl font-bold text-emerald-600">{attendanceRate}%</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${attendanceRate}%` }}
                        ></div>
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
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                                                    attendance.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                                    attendance.status === 'late' ? 'bg-amber-50 text-amber-700' :
                                                    attendance.status === 'absent' ? 'bg-rose-50 text-rose-700' :
                                                    attendance.status === 'excused' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {attendance.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold bg-slate-100 text-slate-600">Not marked</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{attendance?.check_in_method || 'Manual'}</td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{attendance?.checked_in_at ? formatDateTime(attendance.checked_in_at) : '—'}</td>
                                        <td className="px-4 py-2">
                                            {!attendance?.is_locked ? (
                                                <div className="flex gap-2">
                                                    <form method="POST" action={`/attendances/${attendance?.id || 'new'}`} onSubmit={(e) => {
                                                        if (!attendance?.id) {
                                                            e.preventDefault();
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
                                                        }
                                                    }}>
                                                        <input type="hidden" name="_token" value={csrf} />
                                                        <input type="hidden" name="_method" value={attendance?.id ? 'PUT' : 'POST'} />
                                                        <input type="hidden" name="status" value="present" />
                                                        <input type="hidden" name="check_in_method" value="manual" />
                                                        <button
                                                            type="submit"
                                                            className="inline-flex items-center rounded-md border border-emerald-500/60 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                        >
                                                            Present
                                                        </button>
                                                    </form>
                                                    <form method="POST" action={`/attendances/${attendance?.id || 'new'}`} onSubmit={(e) => {
                                                        if (!attendance?.id) {
                                                            e.preventDefault();
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
                                                        }
                                                    }}>
                                                        <input type="hidden" name="_token" value={csrf} />
                                                        <input type="hidden" name="_method" value={attendance?.id ? 'PUT' : 'POST'} />
                                                        <input type="hidden" name="status" value="absent" />
                                                        <input type="hidden" name="check_in_method" value="manual" />
                                                        <button
                                                            type="submit"
                                                            className="inline-flex items-center rounded-md border border-rose-500/60 bg-rose-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
                                                        >
                                                            Absent
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


