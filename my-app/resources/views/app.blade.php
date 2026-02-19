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

        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body class="bg-slate-100 text-slate-900">
        <div
            id="app"
            data-role="{{ auth()->check() ? (auth()->user()->role ?? 'PARTICIPANT') : 'PARTICIPANT' }}"
            data-section="{{ $section ?? 'dashboard' }}"
            data-session-timeout-minutes="{{ config('security.session_timeout_minutes', 10) }}"
            data-warning-before-logout-seconds="{{ config('security.warning_before_logout_seconds', 60) }}"
            @isset($modules)
                data-modules='@json($modules)'
            @endisset
            @isset($module)
                data-module='@json($module)'
            @endisset
            @isset($scenarios)
                data-scenarios='@json($scenarios)'
            @endisset
            @isset($scenario)
                data-scenario='@json($scenario)'
            @endisset
            @isset($events)
                data-events='@json($events)'
            @endisset
            @isset($event)
                data-event='@json($event)'
            @endisset
            @isset($participants)
                data-participants='@json($participants)'
            @endisset
            @isset($participant)
                data-participant='@json($participant)'
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
            @if(auth()->check())
                data-user='@json(auth()->user())'
            @elseif(isset($user) && !isset($currentUser))
                data-user='@json($user)'
            @endif
            @if(isset($section) && $section === 'evaluation_form' && isset($user))
                data-evaluatee-user='@json($user)'
            @endif
            @isset($user)
                @if(isset($currentUser))
                    data-viewing-user='@json($user)'
                    data-can-view-security="{{ $canViewSecurity ? 'true' : 'false' }}"
                    data-masked-usb-key-hash="{{ $maskedUsbKeyHash ?? '' }}"
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
            @isset($barangay_profile)
                data-barangay-profile='@json($barangay_profile)'
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
            @if (session('status'))
                data-status="{{ session('status') }}"
            @endif
        ></div>
    </body>
</html>
