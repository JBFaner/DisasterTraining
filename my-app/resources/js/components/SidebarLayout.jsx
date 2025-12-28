import React from 'react';
import Swal from 'sweetalert2';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {
    LayoutDashboard,
    BookOpen,
    Activity,
    CalendarClock,
    Users,
    Box,
    ClipboardList,
    Award,
    ShieldCheck,
    ClipboardCheck,
    LogOut,
    UserCircle,
} from 'lucide-react';

export function SidebarLayout({ role, currentSection = 'dashboard', children }) {
    const isAdmin = role === 'LGU_ADMIN';
    const isTrainer = role === 'LGU_TRAINER';
    const isParticipant = role === 'PARTICIPANT';

    const handleLogoutClick = (event) => {
        event.preventDefault();

        const form = event.currentTarget.form;
        if (!form) return;

        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to log out?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-xl',
                confirmButton: 'rounded-md text-sm font-medium',
                cancelButton: 'rounded-md text-sm font-medium',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                form.submit();
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex">
            {/* Sidebar - desktop-first */}
            <aside className="hidden md:flex md:w-80 md:h-screen md:fixed md:left-0 md:top-0 bg-slate-900 text-slate-50 flex-col z-10">
                {/* Brand */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 shrink-0">
                    <img src="/logo.svg" alt="LGU Logo" className="h-10 w-auto" />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold tracking-wide">
                            Disaster Preparedness
                        </div>
                        <div className="text-[0.7rem] text-slate-400">
                            Training &amp; Simulation
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <ScrollArea.Root className="flex-1 overflow-hidden min-h-0">
                    <ScrollArea.Viewport className="h-full px-3 py-4">
                        <nav className="space-y-5 text-sm">
                            {/* PARTICIPANT NAVIGATION */}
                            {isParticipant ? (
                                <>
                                    {/* 1. Participant Dashboard */}
                                    <div>
                                        <NavSectionTitle>Overview</NavSectionTitle>
                                        <NavItem
                                            icon={LayoutDashboard}
                                            label="Dashboard"
                                            href="/dashboard"
                                            active={currentSection === 'dashboard'}
                                        />
                                    </div>

                                    {/* 2. Training Modules (VIEW ONLY) */}
                                    <div>
                                        <NavSectionTitle>Training</NavSectionTitle>
                                        <NavItem
                                            icon={BookOpen}
                                            label="Training Modules"
                                            href="/training-modules"
                                            active={currentSection === 'training'}
                                        />
                                    </div>

                                    {/* 3. Simulation Events (REGISTRATION & VIEW ONLY) */}
                                    <div>
                                        <NavSectionTitle>Events</NavSectionTitle>
                                        <NavItem
                                            icon={CalendarClock}
                                            label="Simulation Events"
                                            href="/simulation-events"
                                            active={currentSection === 'simulation'}
                                        />
                                    </div>

                                    {/* 4. Attendance (VIEW ONLY) */}
                                    <div>
                                        <NavSectionTitle>Participation</NavSectionTitle>
                                        <NavItem
                                            icon={ClipboardCheck}
                                            label="My Attendance"
                                            href="/my-attendance"
                                            active={currentSection === 'participants'}
                                        />
                                    </div>

                                    {/* 5. Evaluation Results (VIEW ONLY) */}
                                    <div>
                                        <NavSectionTitle>Performance</NavSectionTitle>
                                        <NavItem
                                            icon={ClipboardList}
                                            label="Evaluation Results"
                                            href="/evaluation"
                                            active={currentSection === 'evaluation'}
                                        />
                                    </div>

                                    {/* 6. Certificates (VIEW / DOWNLOAD ONLY) */}
                                    <div>
                                        <NavSectionTitle>Certification</NavSectionTitle>
                                        <NavItem
                                            icon={Award}
                                            label="My Certificates"
                                            href="/certification"
                                            active={currentSection === 'certification'}
                                        />
                                    </div>

                                    {/* 7. Profile Management (LIMITED) */}
                                    <div>
                                        <NavSectionTitle>Account</NavSectionTitle>
                                        <NavItem
                                            icon={UserCircle}
                                            label="My Profile"
                                            href="/profile"
                                            active={currentSection === 'profile'}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* ADMIN/TRAINER NAVIGATION */}
                                    {/* Overview */}
                                    <div>
                                        <NavSectionTitle>Overview</NavSectionTitle>
                                        <NavItem
                                            icon={LayoutDashboard}
                                            label="Dashboard"
                                            href="/dashboard"
                                            active={currentSection === 'dashboard'}
                                        />
                                    </div>

                                    {/* Training Modules (Management for admin/trainer) */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Training</NavSectionTitle>
                                            <NavItem
                                                icon={BookOpen}
                                                label="Training Module Management"
                                                href="/training-modules"
                                                active={currentSection === 'training'}
                                            />
                                        </div>
                                    )}

                                    {/* Scenario-based Exercise Design */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Scenarios</NavSectionTitle>
                                            <NavItem
                                                icon={Activity}
                                                label="Scenario-based Exercise Design"
                                                href="/scenarios"
                                                active={currentSection === 'scenario'}
                                            />
                                        </div>
                                    )}

                                    {/* Simulation Event Planning */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Simulation</NavSectionTitle>
                                            <NavItem
                                                icon={CalendarClock}
                                                label="Simulation Event Planning"
                                                href="/simulation-events"
                                                active={currentSection === 'simulation'}
                                            />
                                        </div>
                                    )}

                                    {/* Resource & Equipment Inventory */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Resources</NavSectionTitle>
                                            <NavItem
                                                icon={Box}
                                                label="Resource & Equipment Inventory"
                                                href="/resources"
                                                active={currentSection === 'resources'}
                                            />
                                        </div>
                                    )}

                                    {/* Participant Registration & Attendance */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Participants</NavSectionTitle>
                                            <NavItem
                                                icon={Users}
                                                label="Participant Registration & Attendance"
                                                href="/participants"
                                                active={currentSection === 'participants'}
                                            />
                                        </div>
                                    )}

                                    {/* Evaluation & Scoring System */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Evaluation</NavSectionTitle>
                                            <NavItem
                                                icon={ClipboardList}
                                                label="Evaluation & Scoring System"
                                                href="/evaluation"
                                                active={currentSection === 'evaluation'}
                                            />
                                        </div>
                                    )}

                                    {/* Certification Issuance */}
                                    {(isAdmin || isTrainer) && (
                                        <div>
                                            <NavSectionTitle>Certification</NavSectionTitle>
                                            <NavItem
                                                icon={Award}
                                                label="Certification Issuance"
                                                href="/certification"
                                                active={currentSection === 'certification'}
                                            />
                                        </div>
                                    )}

                                    {/* Administration - LGU-admin only */}
                                    {isAdmin && (
                                        <div>
                                            <NavSectionTitle>Administration</NavSectionTitle>
                                            <NavItem
                                                icon={ShieldCheck}
                                                label="Users & Roles"
                                                href="#"
                                                active={false}
                                            />
                                            <NavItem
                                                icon={ClipboardCheck}
                                                label="Audit Logs"
                                                href="#"
                                                active={false}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </nav>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                        orientation="vertical"
                        className="flex select-none touch-none p-0.5 bg-slate-900/80"
                    >
                        <ScrollArea.Thumb className="flex-1 rounded-full bg-slate-700" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>

                {/* User footer */}
                <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <img src="/logo.svg" alt="LGU Logo" className="h-5 w-auto opacity-80 shrink-0" />
                        <div className="truncate">
                            <span className="text-slate-400">
                                {role === 'LGU_ADMIN' && 'LGU Admin'}
                                {role === 'LGU_TRAINER' && 'Trainer'}
                                {role === 'PARTICIPANT' && 'Participant'}
                            </span>
                        </div>
                    </div>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={document.head.querySelector('meta[name="csrf-token"]')?.content || ''} />
                        <button
                            type="submit"
                            onClick={handleLogoutClick}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden xl:inline">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 md:ml-80 p-6">
                {children}
            </main>
        </div>
    );
}

function NavItem({ icon: Icon, label, href, active }) {
    return (
        <a
            href={href}
            className={[
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                active
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-100 hover:bg-slate-800/80 hover:text-emerald-200',
            ].join(' ')}
        >
            <Icon className="w-4 h-4 text-emerald-400" />
            <span className="text-[0.86rem] font-medium">{label}</span>
        </a>
    );
}

function NavSectionTitle({ children }) {
    return (
        <div className="px-3 pb-1 text-[0.7rem] font-semibold tracking-[0.12em] text-slate-500 uppercase">
            {children}
        </div>
    );
}


