import React from 'react';
import { BookOpen, Clock, Users, TrendingUp, MoreHorizontal, Lock, CheckCircle2 } from 'lucide-react';

const CATEGORY_GRADIENTS = {
    flood: 'from-sky-600 via-blue-700 to-indigo-800',
    fire: 'from-orange-600 via-red-600 to-rose-800',
    earthquake: 'from-amber-700 via-orange-800 to-stone-900',
    typhoon: 'from-slate-600 via-sky-800 to-blue-900',
    landslide: 'from-emerald-800 via-teal-900 to-slate-900',
    default: 'from-emerald-700 via-teal-800 to-slate-900',
};

const LESSON_CARD_GRADIENTS = [
    'from-violet-700 via-purple-800 to-indigo-900',
    'from-emerald-700 via-teal-800 to-cyan-900',
    'from-orange-600 via-amber-700 to-rose-800',
    'from-slate-700 via-slate-800 to-slate-900',
    'from-blue-700 via-indigo-800 to-violet-900',
];

function resolveCategoryGradient(category) {
    const key = String(category || '').trim().toLowerCase();
    if (key.includes('flood')) return CATEGORY_GRADIENTS.flood;
    if (key.includes('fire')) return CATEGORY_GRADIENTS.fire;
    if (key.includes('earth')) return CATEGORY_GRADIENTS.earthquake;
    if (key.includes('typhoon') || key.includes('storm')) return CATEGORY_GRADIENTS.typhoon;
    if (key.includes('landslide')) return CATEGORY_GRADIENTS.landslide;
    return CATEGORY_GRADIENTS.default;
}

export function formatTrainingDuration(minutes) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value <= 0) return null;
    if (value < 60) return `${value} min`;
    const hours = Math.floor(value / 60);
    const remainder = value % 60;
    if (remainder === 0) return `${hours} hr`;
    return `${hours} hr ${remainder} min`;
}

export function formatTrainingModuleDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function statusBadgeClass(status) {
    if (status === 'published') return 'bg-emerald-500/90 text-white';
    if (status === 'draft') return 'bg-sky-500/90 text-white';
    if (status === 'archived') return 'bg-slate-500/90 text-white';
    if (status === 'unpublished') return 'bg-amber-500/90 text-white';
    return 'bg-slate-500/90 text-white';
}

function statusLabel(status) {
    if (!status) return '—';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function ModuleCover({ module, children }) {
    const gradient = resolveCategoryGradient(module.category);
    const hasThumbnail = Boolean(module.thumbnail_url);

    return (
        <div className="relative h-36 shrink-0 overflow-hidden">
            {hasThumbnail ? (
                <img
                    src={module.thumbnail_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white/35" />
                    </div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
            {children}
        </div>
    );
}

function ModuleMetaRow({ module, showParticipants = true }) {
    const duration = formatTrainingDuration(module.estimated_duration_minutes);
    const lessonCount = module.lesson_count ?? module.contents_count ?? 0;

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {duration && (
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {duration}
                </span>
            )}
            <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
            </span>
            {showParticipants && (
                <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {module.participant_count ?? 0} Participants
                </span>
            )}
        </div>
    );
}

function ModuleProgressBar({ percentage = 0, label = 'Completion' }) {
    const value = Math.max(0, Math.min(100, Number(percentage) || 0));

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    {label}
                </span>
                <span className="font-semibold text-slate-800">{value}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

export function AdminTrainingModuleCard({
    module,
    onManageClick,
    manageButtonRef,
    isManageOpen = false,
    className = '',
    style,
}) {
    const created = formatTrainingModuleDate(module.created_at);
    const updated = formatTrainingModuleDate(module.updated_at);
    const showUpdated = updated && updated !== created;

    return (
        <article
            className={`training-module-card-enter bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col ${isManageOpen ? 'z-[100] relative' : ''} ${className}`.trim()}
            style={style}
        >
            <ModuleCover module={module}>
                <div className="absolute top-3 right-3 z-10" ref={manageButtonRef}>
                    <button
                        type="button"
                        data-manage-button
                        onClick={onManageClick}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                        aria-label="Manage module"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-base font-semibold text-white line-clamp-2" title={module.title}>
                        {module.title || 'Untitled Module'}
                    </h3>
                    {module.category && (
                        <p className="text-sm text-white/85 mt-0.5 line-clamp-1">{module.category}</p>
                    )}
                </div>
            </ModuleCover>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <ModuleMetaRow module={module} />

                <ModuleProgressBar
                    percentage={module.completion_percentage}
                    label="Avg. completion"
                />

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold ${statusBadgeClass(module.status)}`}>
                        {statusLabel(module.status)}
                    </span>
                    <p className="text-[0.65rem] text-slate-400 text-right">
                        {created && <>Created {created}</>}
                        {showUpdated && <><br />Updated {updated}</>}
                    </p>
                </div>
            </div>
        </article>
    );
}

export function AdminTrainingModuleListRow({
    module,
    onManageClick,
    manageButtonRef,
}) {
    const created = formatTrainingModuleDate(module.created_at);
    const updated = formatTrainingModuleDate(module.updated_at);
    const showUpdated = updated && updated !== created;

    return (
        <li className="flex items-stretch gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border border-slate-200">
                {module.thumbnail_url ? (
                    <img src={module.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${resolveCategoryGradient(module.category)} flex items-center justify-center`}>
                        <BookOpen className="w-6 h-6 text-white/50" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{module.title || 'Untitled Module'}</h3>
                        {module.category && (
                            <p className="text-sm text-slate-500 mt-0.5">{module.category}</p>
                        )}
                    </div>
                    <div className="relative shrink-0" ref={manageButtonRef}>
                        <button
                            type="button"
                            data-manage-button
                            onClick={onManageClick}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                            aria-label="Manage module"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <ModuleMetaRow module={module} />

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <ModuleProgressBar percentage={module.completion_percentage} label="Avg. completion" />
                    <div className="flex flex-col items-start md:items-end gap-1">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold ${statusBadgeClass(module.status)}`}>
                            {statusLabel(module.status)}
                        </span>
                        <p className="text-[0.65rem] text-slate-400">
                            {created && <>Created {created}</>}
                            {showUpdated && ` • Updated ${updated}`}
                        </p>
                    </div>
                </div>
            </div>
        </li>
    );
}

export function ParticipantTrainingModuleCard({ module, href }) {
    const duration = formatTrainingDuration(module.estimated_duration_minutes);
    const lessonCount = module.lesson_count ?? module.contents_count ?? 0;
    const progress = Math.max(0, Math.min(100, Number(module.completion_percentage) || 0));
    const gradient = resolveCategoryGradient(module.category);

    const content = (
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl">
            {module.thumbnail_url ? (
                <img
                    src={module.thumbnail_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
                            backgroundSize: '30px 30px',
                        }}
                    />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/70" />

            <div className="relative z-10 flex h-full flex-col justify-between p-5">
                <div className="space-y-1.5">
                    <h3 className="text-4xl font-semibold leading-tight text-white drop-shadow-sm line-clamp-3 group-hover:text-emerald-100 transition-colors">
                        {module.title}
                    </h3>
                    {module.category && (
                        <p className="text-lg text-white/90 line-clamp-2">{module.category}</p>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                        {duration && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-white/90" />
                                {duration}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-white/90" />
                            {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-white/90">
                            <span className="inline-flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-white/90" />
                                Your progress
                            </span>
                            <span className="font-semibold text-white">{progress}% complete</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-black/30 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-white/95 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <a
                href={href}
                className="group rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-emerald-400 hover:shadow-md transition-all"
            >
                {content}
            </a>
        );
    }

    return (
        <article className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {content}
        </article>
    );
}

function resolveLessonGradient(index, moduleCategory) {
    if (index === 0) {
        return resolveCategoryGradient(moduleCategory);
    }

    return LESSON_CARD_GRADIENTS[index % LESSON_CARD_GRADIENTS.length];
}

export function ParticipantModuleHero({ module, progressPercent = 0, completedCount = 0, totalLessons = 0 }) {
    const gradient = resolveCategoryGradient(module?.category);

    return (
        <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-slate-200 shadow-md">
            {module?.thumbnail_url ? (
                <img
                    src={module.thumbnail_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 65%, white 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/75" />

            <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Training Module</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-bold leading-tight drop-shadow-sm">
                    {module?.title}
                </h2>
                {module?.category && (
                    <p className="mt-1 text-sm text-white/90">{module.category}</p>
                )}
                {module?.description && (
                    <p className="mt-3 text-sm text-white/85 line-clamp-2 max-w-3xl">
                        {module.description}
                    </p>
                )}
                {totalLessons > 0 && (
                    <div className="mt-5 max-w-md">
                        <div className="flex items-center justify-between text-xs text-white/90 mb-1.5">
                            <span>Module progress</span>
                            <span>{completedCount} / {totalLessons} lessons ({progressPercent}%)</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-black/35 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ParticipantLessonCard({
    lesson,
    index,
    moduleCategory,
    isSelected = false,
    onSelect,
}) {
    const isLocked = lesson.is_locked;
    const isCompleted = lesson.is_completed;
    const gradient = resolveLessonGradient(index, moduleCategory);
    const hasQuiz = lesson.lesson_quiz?.has_published_quiz;

    return (
        <button
            type="button"
            disabled={isLocked}
            onClick={onSelect}
            className={`group relative min-h-[140px] w-full overflow-hidden rounded-xl text-left transition-all ${
                isLocked
                    ? 'cursor-not-allowed opacity-70'
                    : 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
            } ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 15% 20%, white 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/70" />

            <div className="relative z-10 flex h-full flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-white/80">
                        Lesson {index + 1}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                    {isLocked && <Lock className="w-4 h-4 text-white/70 shrink-0" />}
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                        {lesson.title}
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {isCompleted && (
                            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[0.6rem] font-semibold text-white">
                                Completed
                            </span>
                        )}
                        {!isCompleted && !isLocked && (
                            <span className="rounded-full bg-sky-500/90 px-2 py-0.5 text-[0.6rem] font-semibold text-white">
                                Available
                            </span>
                        )}
                        {isLocked && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.6rem] font-semibold text-white">
                                Locked
                            </span>
                        )}
                        {hasQuiz && (
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-semibold text-white/90">
                                Quiz
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}
