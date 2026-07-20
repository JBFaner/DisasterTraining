import React from 'react';
import { BookOpen, Lock, Users } from 'lucide-react';
import { ParticipantEmptyState } from './ParticipantEmptyState';

export function ParticipantTrainingModuleLock({ lock = {} }) {
    const moduleTitle = lock.module?.title || 'This training module';
    const openCampaign = lock.open_campaign;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 shrink-0">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            {lock.reason === 'campaign_enrollment' ? 'Campaign enrollment' : 'Campaign registration required'}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{lock.title || 'Module locked'}</h1>
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{lock.body}</p>
                        {moduleTitle && (
                            <p className="mt-3 text-sm text-slate-700">
                                <span className="font-medium text-slate-900">Module:</span> {moduleTitle}
                            </p>
                        )}
                    </div>
                </div>

                {openCampaign && (
                    <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                        <p className="font-medium">{openCampaign.training_title || openCampaign.module_title}</p>
                        {openCampaign.batch_label && <p className="mt-1 text-sky-800">{openCampaign.batch_label}</p>}
                        {openCampaign.seats_remaining != null && (
                            <p className="mt-1 text-xs text-sky-700">{openCampaign.seats_remaining} seat(s) remaining</p>
                        )}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                    {lock.action_href && (
                        <a
                            href={lock.action_href}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            {lock.action_label || 'Continue'}
                        </a>
                    )}
                    {lock.secondary_action_href && (
                        <a
                            href={lock.secondary_action_href}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {lock.secondary_action_label}
                        </a>
                    )}
                </div>
            </div>

            {lock.reason === 'campaign_required' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">Are you a walk-in participant?</p>
                    <p className="mt-2">
                        Some modules are reserved for scheduled campaign batches. If you did not receive a registration link,
                        browse self-paced modules or ask your coordinator which campaign batch you should join.
                    </p>
                </div>
            )}
        </div>
    );
}

export function ParticipantTrainingAccessBanner({ context = null }) {
    if (!context) return null;

    if (context.list_banner) {
        const banner = context.list_banner;
        return (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-lg bg-sky-100 p-2 text-sky-700 shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-sky-950">{banner.title}</p>
                        <p className="mt-1 text-sm text-sky-900/90">{banner.body}</p>
                    </div>
                </div>
                {banner.action_href && (
                    <a
                        href={banner.action_href}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100/60 transition-colors"
                    >
                        {banner.action_label}
                    </a>
                )}
            </div>
        );
    }

    if (context.self_paced_hint) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>{context.self_paced_hint}</p>
            </div>
        );
    }

    return null;
}

export function ParticipantTrainingModulesEmpty({ context = null }) {
    if (context?.has_campaign_enrollment) {
        return (
            <ParticipantEmptyState
                icon={Users}
                title="No campaign modules published yet"
                description="You are enrolled in a campaign, but no training modules are published for your batch yet. Check My Trainings for your registration details."
                steps={[
                    'Wait for your LGU to publish the assigned module',
                    'Return here once the module appears',
                    'Use My Trainings to confirm your campaign enrollment',
                ]}
                primaryAction={{ href: '/participant/my-trainings', label: 'View My Trainings' }}
                secondaryActions={[{ href: '/participant/dashboard', label: 'Back to Dashboard' }]}
            />
        );
    }

    return null;
}
