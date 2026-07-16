<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>LGU Disaster Preparedness Training & Simulation</title>
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body class="bg-slate-100 text-slate-900">
        <div
            id="app"
            data-role="{{ portal_check() ? (portal_user()->role ?? 'PARTICIPANT') : (($section ?? 'dashboard') === 'campaign_public' ? 'GUEST' : 'PARTICIPANT') }}"
            data-auth-guard="{{ portal_check() ? (\App\Support\PortalAuth::activeGuard() ?? '') : '' }}"
            data-portal-session="{{ \App\Support\PortalSession::currentPortal() }}"
            data-section="{{ $section ?? 'dashboard' }}"
            data-session-timeout-minutes="{{ config('security.session_timeout_minutes', 10) }}"
            data-warning-before-logout-seconds="{{ config('security.warning_before_logout_seconds', 60) }}"
            @isset($modules)
                data-modules='@json($modules)'
            @endisset
            @isset($modulesPagination)
                data-modules-pagination='@json($modulesPagination)'
            @endisset
            @isset($modulesPagination)
                data-modules-pagination='@json($modulesPagination)'
            @endisset
            @isset($module)
                data-module='@json($module)'
            @endisset
            @isset($scenarios)
                data-scenarios='@json($scenarios)'
            @endisset
            @isset($trainingModules)
                data-training-modules='@json($trainingModules)'
            @endisset
            @isset($trainers)
                data-trainers='@json($trainers)'
            @endisset
            @isset($scenario)
                data-scenario='@json($scenario)'
            @endisset
            @isset($events)
                data-events='@json($events)'
            @endisset
            @isset($approved_schedules)
                data-approved-schedules='@json($approved_schedules)'
            @endisset
            @isset($exercise_templates)
                data-exercise-templates='@json($exercise_templates)'
            @endisset
            @isset($exercise_template_summary)
                data-exercise-template-summary='@json($exercise_template_summary)'
            @endisset
            @isset($exercise_template_form)
                data-exercise-template-form='@json($exercise_template_form)'
            @endisset
            @isset($simulation_planning)
                data-simulation-planning='@json($simulation_planning)'
            @endisset
            @isset($event)
                data-event='@json($event)'
            @endisset
            @isset($event_lifecycle)
                data-event-lifecycle='@json($event_lifecycle)'
            @endisset
            @isset($participants)
                data-participants='@json($participants)'
            @endisset
            @isset($participantsPagination)
                data-participants-pagination='@json($participantsPagination)'
            @endisset
            @isset($participantsSummary)
                data-participants-summary='@json($participantsSummary)'
            @endisset
            @isset($participantFilterOptions)
                data-participant-filter-options='@json($participantFilterOptions)'
            @endisset
            @isset($qualifiedTrainers)
                data-qualified-trainers='@json($qualifiedTrainers)'
            @endisset
            @isset($qualifiedTrainersPagination)
                data-qualified-trainers-pagination='@json($qualifiedTrainersPagination)'
            @endisset
            @isset($qualifiedTrainersSummary)
                data-qualified-trainers-summary='@json($qualifiedTrainersSummary)'
            @endisset
            @isset($qualifiedTrainer)
                data-qualified-trainer='@json($qualifiedTrainer)'
            @endisset
            @isset($participant)
                data-participant='@json($participant)'
            @endisset
            @isset($trainings)
                data-trainings='@json($trainings)'
            @endisset
            @isset($users)
                data-users='@json($users)'
            @endisset
            @isset($roles)
                data-roles='@json($roles)'
            @endisset
            @isset($permissions)
                data-permissions='@json($permissions)'
            @endisset
            @isset($role)
                data-editing-role='@json($role)'
            @endisset
            @isset($groupedPermissions)
                data-grouped-permissions='@json($groupedPermissions)'
            @endisset
            @isset($assignedPermissionIds)
                data-assigned-permission-ids='@json($assignedPermissionIds)'
            @endisset
            @isset($permission)
                data-editing-permission='@json($permission)'
            @endisset
            @isset($assignedRoleIds)
                data-assigned-role-ids='@json($assignedRoleIds)'
            @endisset
            @isset($registrations)
                data-registrations='@json($registrations)'
            @endisset
            @isset($resources)
                data-resources='@json($resources)'
            @endisset
            @isset($resource)
                data-resource='@json($resource)'
            @endisset
            @isset($evaluation)
                data-evaluation='@json($evaluation)'
            @endisset
            @isset($criteria)
                data-criteria='@json($criteria)'
            @endisset
            @isset($attendances)
                data-attendances='@json($attendances)'
            @endisset
            @isset($participantEvaluations)
                data-participant-evaluations='@json($participantEvaluations)'
            @endisset
            @if(portal_check())
                data-user='@json(portal_user())'
            @elseif(isset($user) && !isset($currentUser))
                data-user='@json($user)'
            @endif
            @if(isset($section) && $section === 'evaluation_form' && isset($user))
                data-evaluatee-user='@json($user)'
            @endif
            @isset($user)
                @if(isset($currentUser))
                    data-viewing-user='@json($user)'
                @endif
            @endisset
            @isset($recent_logins)
                data-recent-logins='@json($recent_logins)'
            @endisset
            @isset($recent_actions)
                data-recent-actions='@json($recent_actions)'
            @endisset
            @isset($attendance)
                data-attendance='@json($attendance)'
            @endisset
            @isset($participant_evaluation)
                data-participant-evaluation='@json($participant_evaluation)'
            @endisset
            @isset($barangay_profiles)
                data-barangay-profiles='@json($barangay_profiles)'
            @endisset
            @isset($disaster_types)
                data-disaster-types='@json($disaster_types)'
            @endisset
            @isset($barangay_profile)
                data-barangay-profile='@json($barangay_profile)'
            @endisset
            @isset($hazard_assessment_summary)
                data-hazard-assessment-summary='@json($hazard_assessment_summary)'
            @endisset
            @isset($hazard_assessment_options)
                data-hazard-assessment-options='@json($hazard_assessment_options)'
            @endisset
            @isset($hazard_intelligence)
                data-hazard-intelligence='@json($hazard_intelligence)'
            @endisset
            @isset($budget_proposals)
                data-budget-proposals='@json($budget_proposals)'
            @endisset
            @isset($budget_proposal)
                data-budget-proposal='@json($budget_proposal)'
            @endisset
            @isset($budget_proposal_summary)
                data-budget-proposal-summary='@json($budget_proposal_summary)'
            @endisset
            @isset($budget_proposal_options)
                data-budget-proposal-options='@json($budget_proposal_options)'
            @endisset
            @isset($scores)
                data-scores='@json($scores)'
            @endisset
            @isset($criterion_averages)
                data-criterion-averages='@json($criterion_averages)'
            @endisset
            @isset($total_participants)
                data-total-participants="{{ $total_participants }}"
            @endisset
            @isset($passed_count)
                data-passed-count="{{ $passed_count }}"
            @endisset
            @isset($failed_count)
                data-failed-count="{{ $failed_count }}"
            @endisset
            @isset($overall_average)
                data-overall-average="{{ $overall_average }}"
            @endisset
            @isset($summaryStats)
                data-summary-stats='@json($summaryStats)'
            @endisset
            @isset($evaluationSummaryStats)
                data-evaluation-summary-stats='@json($evaluationSummaryStats)'
            @endisset
            @isset($eligibleParticipants)
                data-eligible-participants='@json($eligibleParticipants)'
            @endisset
            @isset($templates)
                data-templates='@json($templates)'
            @endisset
            @isset($issuedCertificates)
                data-issued-certificates='@json($issuedCertificates)'
            @endisset
            @isset($eventsForFilter)
                data-events-for-filter='@json($eventsForFilter)'
            @endisset
            @isset($filters)
                data-filters='@json($filters)'
            @endisset
            @isset($automationSettings)
                data-automation-settings='@json($automationSettings)'
            @endisset
            @isset($dashboard_stats)
                data-dashboard-stats='@json($dashboard_stats)'
            @endisset
            @isset($dashboard_charts)
                data-dashboard-charts='@json($dashboard_charts)'
            @endisset
            @isset($hazard_analytics)
                data-hazard-analytics='@json($hazard_analytics)'
            @endisset
            @isset($ai_scenario_modules)
                data-ai-scenario-modules='@json($ai_scenario_modules)'
            @endisset
            @isset($ai_scenario_configs)
                data-ai-scenario-configs='@json($ai_scenario_configs)'
            @endisset
            @isset($lesson_quiz_modules)
                data-lesson-quiz-modules='@json($lesson_quiz_modules)'
            @endisset
            @isset($lesson_quiz_configs)
                data-lesson-quiz-configs='@json($lesson_quiz_configs)'
            @endisset
            @isset($lesson_quiz_attempt)
                data-lesson-quiz-attempt='@json($lesson_quiz_attempt)'
            @endisset
            @isset($ai_scenario_attempt)
                data-ai-scenario-attempt='@json($ai_scenario_attempt)'
            @endisset
            @isset($evaluation_tab)
                data-evaluation-tab="{{ $evaluation_tab }}"
            @endisset
            @isset($evaluation_event_filters)
                data-evaluation-event-filters='@json($evaluation_event_filters)'
            @endisset
            @isset($lesson_quiz_attempts)
                data-lesson-quiz-attempts='@json($lesson_quiz_attempts)'
            @endisset
            @isset($lesson_quiz_pagination)
                data-lesson-quiz-pagination='@json($lesson_quiz_pagination)'
            @endisset
            @isset($lesson_quiz_analytics)
                data-lesson-quiz-analytics='@json($lesson_quiz_analytics)'
            @endisset
            @isset($lesson_quiz_modules)
                data-lesson-quiz-monitoring-modules='@json($lesson_quiz_modules)'
            @endisset
            @isset($lesson_quiz_filters)
                data-lesson-quiz-filters='@json($lesson_quiz_filters)'
            @endisset
            @isset($evaluation_results)
                data-evaluation-results='@json($evaluation_results)'
            @endisset
            @isset($evaluation_results_pagination)
                data-evaluation-results-pagination='@json($evaluation_results_pagination)'
            @endisset
            @isset($evaluation_analytics)
                data-evaluation-analytics='@json($evaluation_analytics)'
            @endisset
            @isset($evaluation_modules)
                data-evaluation-modules='@json($evaluation_modules)'
            @endisset
            @isset($evaluation_filters)
                data-evaluation-filters='@json($evaluation_filters)'
            @endisset
            @isset($evaluation_attempt_numbers)
                data-evaluation-attempt-numbers='@json($evaluation_attempt_numbers)'
            @endisset
            @isset($evaluation_passing_score)
                data-evaluation-passing-score="{{ $evaluation_passing_score }}"
            @endisset
            @isset($evaluation_result)
                data-evaluation-result='@json($evaluation_result)'
            @endisset
            @isset($campaign_request)
                data-campaign-request='@json($campaign_request)'
            @endisset
            @if (session('status'))
                data-status="{{ session('status') }}"
            @endif
            @if ($errors->any())
                data-errors='@json($errors->all())'
            @endif
        ></div>
        
        {{-- Hide token from URL after page load (for centralized login) --}}
        <script>
            if (window.location.search.includes('token=')) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        </script>
    </body>
</html>
