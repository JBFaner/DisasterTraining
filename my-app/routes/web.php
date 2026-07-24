<?php

use Illuminate\Support\Facades\Route;
use App\Support\PortalAuth;
use App\Support\PortalSession;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\TrainingModuleController as AdminTrainingModuleController;
use App\Http\Controllers\Participant\TrainingModuleController as ParticipantTrainingModuleController;
use App\Http\Controllers\LegacyTrainingModuleRedirectController;
use App\Http\Controllers\LegacyPortalRedirectController;
use App\Http\Controllers\ScenarioController;
use App\Http\Controllers\SimulationEventController;
use App\Http\Controllers\SimulationEventLifecycleController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\QualifiedTrainerController;
use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\LessonCompletionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ResourceBudgetProposalController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\EvaluationResultController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\CentralizedLoginController;
use App\Http\Controllers\AiScenarioConfigController;
use App\Http\Controllers\AiScenarioWorkflowController;
use App\Http\Controllers\AiScenarioAttemptController;
use App\Http\Controllers\LessonQuizGeneratorController;
use App\Http\Controllers\PortalNotificationController;
use App\Http\Controllers\LessonQuizWorkflowController;
use App\Http\Controllers\LessonQuizAttemptController;
use App\Http\Controllers\Admin\Group6IntegrationController;
use App\Http\Controllers\Admin\CampaignRequestController;
use App\Http\Controllers\Admin\SimulationEventPlanningController;
use App\Http\Controllers\Admin\SimulationExerciseTemplateController;
use App\Http\Controllers\CampaignRegistrationController;
use App\Http\Middleware\CheckSessionInactivity;
use App\Http\Middleware\SyncPortalGuard;

Route::get('/', function () {
    return view('welcome');
});

// Public legal pages
Route::view('/privacy', 'privacy')->name('privacy');
Route::view('/terms', 'terms')->name('terms');
Route::view('/data-protection', 'data-protection')->name('data.protection');
Route::view('/accessibility', 'accessibility')->name('accessibility');

// Campaign registration (must be registered before the generic /campaigns/{simulationEvent} route)
Route::get('/campaigns/{campaignRequest}/register/success', [CampaignRegistrationController::class, 'showSuccess'])
    ->name('campaigns.register.success');
Route::get('/campaigns/{campaignRequest}/register', [CampaignRegistrationController::class, 'showRegister'])
    ->name('campaigns.register');

// Public campaign landing pages (live campaigns are published Simulation Events)
Route::get('/campaigns/{simulationEvent}', [SimulationEventController::class, 'publicCampaignShow'])
    ->name('campaigns.show');

// Public certificate verification (QR code links here)
Route::get('/certificates/verify/{token}', [\App\Http\Controllers\CertificateVerificationController::class, 'show'])->name('certificates.verify');
Route::get('/api/certificates/verify/{token}', [\App\Http\Controllers\CertificateVerificationController::class, 'verifyApi'])->name('api.certificates.verify');

// Centralized Login Integration (AlerTara)
// This route handles incoming requests from login.alertaraqc.com with JWT tokens
// Entry point for centralized login - accepts token parameter
Route::get('/auth/centralized', [CentralizedLoginController::class, 'handle'])
    ->name('centralized.login.handle');

// Admin auth routes
Route::get('/admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
// Legacy route redirects to admin login
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

// Public LGU admin registration is disabled; `/register` is repurposed for participant self-registration.
Route::get('/register', [AuthController::class, 'showParticipantRegister'])->name('register');
Route::post('/register', [AuthController::class, 'participantRegisterStart'])->name('register.post');

// Participant auth routes
Route::get('/participant/login', [AuthController::class, 'showParticipantLogin'])->name('participant.login');
Route::post('/participant/login', [AuthController::class, 'participantLogin'])->name('participant.login.post');
Route::post('/participant/login/resend-verification', [AuthController::class, 'participantResendVerificationFromLogin'])->name('participant.login.resend-verification');

Route::get('/participant/register', [AuthController::class, 'showParticipantRegister'])->name('participant.register');
Route::post('/participant/register/start', [AuthController::class, 'participantRegisterStart'])->name('participant.register.start');

Route::get('/participant/register/verify', [AuthController::class, 'showParticipantRegisterVerify'])->name('participant.register.verify');
Route::post('/participant/register/verify', [AuthController::class, 'participantRegisterVerify'])->name('participant.register.verify.post');
Route::post('/participant/register/resend', [AuthController::class, 'participantRegisterResend'])->name('participant.register.resend');
Route::get('/participant/register/verify-email/{token}', [AuthController::class, 'participantRegisterVerifyEmail'])->name('participant.register.verify.email');

// Legacy method-selection route (removed UI; kept for cached pages and old sessions)
Route::match(['get', 'post'], '/admin/login/method', [AuthController::class, 'legacyAdminLoginMethod'])->name('admin.login.method');

// Admin login OTP verification routes
Route::get('/admin/login/verify', [AuthController::class, 'showAdminLoginVerify'])->name('admin.login.verify');
Route::post('/admin/login/verify', [AuthController::class, 'verifyAdminLoginOtp'])->name('admin.login.verify.post');
Route::post('/admin/login/resend-otp', [AuthController::class, 'resendAdminLoginOtp'])->name('admin.login.resend-otp');

// Admin email verification (for newly registered LGU admins)
Route::get('/admin/verify-email/{user}', [AdminUserController::class, 'verifyEmail'])
    ->name('admin.verify-email')
    ->middleware('signed');

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/admin/logout', [AuthController::class, 'adminLogout'])->name('admin.logout');
Route::post('/participant/logout', [AuthController::class, 'participantLogout'])->name('participant.logout');

// Password Reset Routes
Route::get('/password/reset', [App\Http\Controllers\PasswordResetController::class, 'showRequestForm'])->name('password.request');
Route::post('/password/email', [App\Http\Controllers\PasswordResetController::class, 'sendResetLink'])->name('password.email');
Route::get('/password/reset/{token}', [App\Http\Controllers\PasswordResetController::class, 'showResetForm'])->name('password.reset');
Route::post('/password/reset', [App\Http\Controllers\PasswordResetController::class, 'reset'])->name('password.update');

// Centralized login logout (redirects to centralized login system)
Route::get('/auth/centralized/logout', [CentralizedLoginController::class, 'logout'])
    ->name('centralized.login.logout');

// Dashboard routes — portal-specific URLs so admin and participant sessions stay isolated in separate tabs.
$renderDashboard = function (Request $request) {
    if ($request->has('token') && ! portal_check()) {
        return app(CentralizedLoginController::class)->handle($request);
    }

    if (! portal_check()) {
        $loginRoute = PortalSession::currentPortal() === PortalSession::PARTICIPANT
            ? 'participant.login'
            : 'admin.login';

        return redirect()->route($loginRoute);
    }

    PortalAuth::syncDefaultGuard();

    return app(\App\Http\Controllers\DashboardController::class)->index($request);
};

Route::get('/admin/dashboard', $renderDashboard)->name('admin.dashboard');
Route::get('/participant/dashboard', $renderDashboard)->name('participant.dashboard');

// Legacy /dashboard URL → redirect to the portal resolved for this request (token auth, referer, or header).
Route::get('/dashboard', function (Request $request) {
    if ($request->has('token') && ! portal_check()) {
        return app(CentralizedLoginController::class)->handle($request);
    }

    $portal = PortalSession::resolvePortal($request);
    $target = $portal === PortalSession::PARTICIPANT
        ? 'participant.dashboard'
        : 'admin.dashboard';

    return redirect()->route($target, $request->query());
})->name('dashboard');

// Protected app routes (session inactivity checked on every request)
Route::middleware(['auth.portal', SyncPortalGuard::class, CheckSessionInactivity::class])->group(function () {
    Route::post('/session/activity', [SessionController::class, 'activity'])->name('session.activity');
    Route::get('/session/config', [SessionController::class, 'config'])->name('session.config');

    // Admin portal routes
    Route::middleware('portal.admin')->prefix('admin')->group(function () {
        Route::get('/training-modules', [AdminTrainingModuleController::class, 'index'])
            ->name('admin.training-modules.index');
        Route::get('/training-modules/create', [AdminTrainingModuleController::class, 'create'])
            ->name('admin.training-modules.create');
        Route::post('/training-modules/generate-ai', [AdminTrainingModuleController::class, 'generateAiModule'])
            ->name('admin.training-modules.generate-ai');
        Route::post('/training-modules', [AdminTrainingModuleController::class, 'store'])
            ->name('admin.training-modules.store');
        Route::get('/training-modules/{trainingModule}', [AdminTrainingModuleController::class, 'show'])
            ->name('admin.training-modules.show');
        Route::get('/training-modules/{trainingModule}/campaign-requests', [CampaignRequestController::class, 'index'])
            ->name('admin.campaign-requests.index');
        Route::post('/training-modules/{trainingModule}/campaign-requests', [CampaignRequestController::class, 'store'])
            ->name('admin.campaign-requests.store');
        Route::get('/campaign-requests/{campaignRequest}', [CampaignRequestController::class, 'show'])
            ->name('admin.campaign-requests.show');
        Route::get('/training-modules/{trainingModule}/edit', [AdminTrainingModuleController::class, 'edit'])
            ->name('admin.training-modules.edit');
        Route::put('/training-modules/{trainingModule}', [AdminTrainingModuleController::class, 'update'])
            ->name('admin.training-modules.update');
        Route::post('/training-modules/{trainingModule}/archive', [AdminTrainingModuleController::class, 'archive'])
            ->name('admin.training-modules.archive');
        Route::post('/training-modules/{trainingModule}/publish', [AdminTrainingModuleController::class, 'publish'])
            ->name('admin.training-modules.publish');
        Route::delete('/training-modules/{trainingModule}', [AdminTrainingModuleController::class, 'destroy'])
            ->name('admin.training-modules.destroy');
        Route::post('/training-modules/{trainingModule}/contents', [AdminTrainingModuleController::class, 'storeContent'])
            ->name('admin.training-modules.contents.store');
        Route::put('/training-modules/{trainingModule}/contents/{content}', [AdminTrainingModuleController::class, 'updateContent'])
            ->name('admin.training-modules.contents.update');
        Route::post('/training-modules/{trainingModule}/contents/{content}/update', [AdminTrainingModuleController::class, 'updateContent'])
            ->name('admin.training-modules.contents.update.post');
        Route::delete('/training-modules/{trainingModule}/contents/{content}', [AdminTrainingModuleController::class, 'destroyContent'])
            ->name('admin.training-modules.contents.destroy');
        Route::post('/training-modules/{trainingModule}/contents/{content}/delete', [AdminTrainingModuleController::class, 'destroyContent'])
            ->name('admin.training-modules.contents.destroy.post');
        Route::post('/training-modules/{trainingModule}/contents/reorder', [AdminTrainingModuleController::class, 'reorderContents'])
            ->name('admin.training-modules.contents.reorder');
        Route::post('/training-modules/{trainingModule}/contents/{content}/resources', [AdminTrainingModuleController::class, 'storeResource'])
            ->name('admin.training-modules.resources.store');
        Route::put('/training-modules/{trainingModule}/contents/{content}/resources/{resource}', [AdminTrainingModuleController::class, 'updateResource'])
            ->name('admin.training-modules.resources.update');
        Route::delete('/training-modules/{trainingModule}/contents/{content}/resources/{resource}', [AdminTrainingModuleController::class, 'destroyResource'])
            ->name('admin.training-modules.resources.destroy');
        Route::post('/training-modules/{trainingModule}/contents/{content}/resources/{resource}/delete', [AdminTrainingModuleController::class, 'destroyResource'])
            ->name('admin.training-modules.resources.destroy.post');
        Route::post('/training-modules/{trainingModule}/contents/{content}/resources/reorder', [AdminTrainingModuleController::class, 'reorderResources'])
            ->name('admin.training-modules.resources.reorder');
        Route::post('/training-modules/{trainingModule}/contents/{content}/resources/{resource}/reprocess', [AdminTrainingModuleController::class, 'reprocessResource'])
            ->name('admin.training-modules.resources.reprocess');

        Route::get('/ai-scenario-training/final-assessment', [AiScenarioConfigController::class, 'index'])
            ->name('admin.ai-scenario-training.final-assessment');
        Route::get('/ai-scenario-training/lesson-quiz-generator', [LessonQuizGeneratorController::class, 'index'])
            ->name('admin.ai-scenario-training.lesson-quiz-generator');
        Route::get('/ai-scenario-training/lesson-quiz-generator/modules/{trainingModule}/lessons/{content}/resources', [LessonQuizGeneratorController::class, 'lessonResources'])
            ->name('admin.lesson-quiz-generator.lesson-resources');
        Route::get('/ai-scenario-training', fn () => redirect()->route('admin.ai-scenario-training.final-assessment'))
            ->name('admin.ai-scenario-training.index');
        Route::get('/lesson-quiz-generator', fn () => redirect()->route('admin.ai-scenario-training.lesson-quiz-generator'))
            ->name('admin.lesson-quiz-generator.index');
        Route::post('/lesson-quiz-config', [LessonQuizGeneratorController::class, 'store'])
            ->name('admin.lesson-quiz-config.store');
        Route::post('/lesson-quiz-config/{config}/generate', [LessonQuizGeneratorController::class, 'generate'])
            ->name('admin.lesson-quiz-config.generate');
        Route::get('/lesson-quiz-generation-jobs/{generationJob}', [LessonQuizGeneratorController::class, 'generationStatus'])
            ->name('admin.lesson-quiz-generation-jobs.show');

        Route::get('/notifications', [PortalNotificationController::class, 'index'])
            ->name('admin.notifications.index');
        Route::get('/notifications/unread-count', [PortalNotificationController::class, 'unreadCount'])
            ->name('admin.notifications.unread-count');
        Route::post('/notifications/{notification}/read', [PortalNotificationController::class, 'markRead'])
            ->name('admin.notifications.read');
        Route::post('/notifications/read-all', [PortalNotificationController::class, 'markAllRead'])
            ->name('admin.notifications.read-all');

        Route::prefix('lesson-quiz-config/{config}/versions/{version}')->group(function () {
            Route::get('/', [LessonQuizWorkflowController::class, 'show'])
                ->name('admin.lesson-quiz-workflow.show');
            Route::post('/questions', [LessonQuizWorkflowController::class, 'storeQuestion'])
                ->name('admin.lesson-quiz-workflow.questions.store');
            Route::post('/questions/generate', [LessonQuizWorkflowController::class, 'generateQuestion'])
                ->name('admin.lesson-quiz-workflow.questions.generate');
            Route::patch('/questions/{questionNumber}', [LessonQuizWorkflowController::class, 'updateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.lesson-quiz-workflow.questions.update');
            Route::delete('/questions/{questionNumber}', [LessonQuizWorkflowController::class, 'destroyQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.lesson-quiz-workflow.questions.destroy');
            Route::post('/questions/bulk-save', [LessonQuizWorkflowController::class, 'bulkSaveQuestions'])
                ->name('admin.lesson-quiz-workflow.questions.bulk-save');
            Route::post('/questions/{questionNumber}/duplicate', [LessonQuizWorkflowController::class, 'duplicateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.lesson-quiz-workflow.questions.duplicate');
            Route::post('/questions/{questionNumber}/regenerate', [LessonQuizWorkflowController::class, 'regenerateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.lesson-quiz-workflow.questions.regenerate');
            Route::post('/save-draft', [LessonQuizWorkflowController::class, 'saveDraft'])
                ->name('admin.lesson-quiz-workflow.save-draft');
            Route::post('/approve', [LessonQuizWorkflowController::class, 'approve'])
                ->name('admin.lesson-quiz-workflow.approve');
            Route::post('/publish', [LessonQuizWorkflowController::class, 'publish'])
                ->name('admin.lesson-quiz-workflow.publish');
            Route::post('/translate', [LessonQuizWorkflowController::class, 'translate'])
                ->name('admin.lesson-quiz-workflow.translate');
            Route::post('/publish-translation', [LessonQuizWorkflowController::class, 'publishTranslation'])
                ->name('admin.lesson-quiz-workflow.publish-translation');
            Route::delete('/translation', [LessonQuizWorkflowController::class, 'deleteTranslation'])
                ->name('admin.lesson-quiz-workflow.delete-translation');
        });

        Route::get('/ai-scenario-config', fn () => redirect()->route('admin.ai-scenario-training.final-assessment'))
            ->name('admin.ai-scenario-config.index');
        Route::post('/ai-scenario-config', [AiScenarioConfigController::class, 'store'])
            ->name('admin.ai-scenario-config.store');
        Route::post('/ai-scenario-config/{config}/generate', [AiScenarioConfigController::class, 'generate'])
            ->name('admin.ai-scenario-config.generate');
        Route::get('/ai-scenario-generation-jobs/{generationJob}', [AiScenarioConfigController::class, 'generationStatus'])
            ->name('admin.ai-scenario-generation-jobs.show');

        Route::prefix('ai-scenario-config/{config}/versions/{version}')->group(function () {
            Route::get('/', [AiScenarioWorkflowController::class, 'show'])
                ->name('admin.ai-scenario-workflow.show');
            Route::patch('/scenario', [AiScenarioWorkflowController::class, 'updateScenario'])
                ->name('admin.ai-scenario-workflow.scenario.update');
            Route::post('/questions', [AiScenarioWorkflowController::class, 'storeQuestion'])
                ->name('admin.ai-scenario-workflow.questions.store');
            Route::post('/questions/generate', [AiScenarioWorkflowController::class, 'generateQuestion'])
                ->name('admin.ai-scenario-workflow.questions.generate');
            Route::patch('/questions/{questionNumber}', [AiScenarioWorkflowController::class, 'updateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.ai-scenario-workflow.questions.update');
            Route::delete('/questions/{questionNumber}', [AiScenarioWorkflowController::class, 'destroyQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.ai-scenario-workflow.questions.destroy');
            Route::post('/questions/bulk-save', [AiScenarioWorkflowController::class, 'bulkSaveQuestions'])
                ->name('admin.ai-scenario-workflow.questions.bulk-save');
            Route::post('/questions/{questionNumber}/duplicate', [AiScenarioWorkflowController::class, 'duplicateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.ai-scenario-workflow.questions.duplicate');
            Route::post('/questions/{questionNumber}/regenerate', [AiScenarioWorkflowController::class, 'regenerateQuestion'])
                ->whereNumber('questionNumber')
                ->name('admin.ai-scenario-workflow.questions.regenerate');
            Route::post('/save-draft', [AiScenarioWorkflowController::class, 'saveDraft'])
                ->name('admin.ai-scenario-workflow.save-draft');
            Route::post('/approve', [AiScenarioWorkflowController::class, 'approve'])
                ->name('admin.ai-scenario-workflow.approve');
            Route::post('/publish', [AiScenarioWorkflowController::class, 'publish'])
                ->name('admin.ai-scenario-workflow.publish');
            Route::post('/restore', [AiScenarioWorkflowController::class, 'restore'])
                ->name('admin.ai-scenario-workflow.restore');
            Route::post('/duplicate', [AiScenarioWorkflowController::class, 'duplicate'])
                ->name('admin.ai-scenario-workflow.duplicate');
            Route::delete('/', [AiScenarioWorkflowController::class, 'destroy'])
                ->name('admin.ai-scenario-workflow.destroy');
        });

        // Scenarios
        Route::get('/scenarios', [ScenarioController::class, 'index'])->name('admin.scenarios.index');
        Route::get('/scenarios/create', [ScenarioController::class, 'create'])->name('admin.scenarios.create');
        Route::post('/scenarios', [ScenarioController::class, 'store'])->name('admin.scenarios.store');
        Route::post('/scenarios/generate-ai', [ScenarioController::class, 'generateAiScenario'])->name('admin.scenarios.generate-ai');
        Route::get('/scenarios/{scenario}', [ScenarioController::class, 'show'])->name('admin.scenarios.show');
        Route::get('/scenarios/{scenario}/edit', [ScenarioController::class, 'edit'])->name('admin.scenarios.edit');
        Route::put('/scenarios/{scenario}', [ScenarioController::class, 'update'])->name('admin.scenarios.update');
        Route::post('/scenarios/{scenario}/publish', [ScenarioController::class, 'publish'])->name('admin.scenarios.publish');
        Route::post('/scenarios/{scenario}/archive', [ScenarioController::class, 'archive'])->name('admin.scenarios.archive');
        Route::delete('/scenarios/{scenario}', [ScenarioController::class, 'destroy'])->name('admin.scenarios.destroy');
        Route::post('/scenarios/{scenario}/injects', [ScenarioController::class, 'storeInject'])->name('admin.scenarios.injects.store');
        Route::delete('/scenarios/{scenario}/injects/{inject}', [ScenarioController::class, 'destroyInject'])->name('admin.scenarios.injects.destroy');
        Route::post('/scenarios/{scenario}/expected-actions', [ScenarioController::class, 'storeExpectedAction'])->name('admin.scenarios.expected-actions.store');
        Route::delete('/scenarios/{scenario}/expected-actions/{expectedAction}', [ScenarioController::class, 'destroyExpectedAction'])->name('admin.scenarios.expected-actions.destroy');

        // Simulation Events (admin management)
        Route::get('/simulation-events', [SimulationEventController::class, 'index'])->name('admin.simulation-events.index');
        Route::get('/simulation-planning/{campaignRequest}', [SimulationEventPlanningController::class, 'show'])->name('admin.simulation-planning.show');
        Route::post('/simulation-planning/{campaignRequest}/plan', [SimulationEventPlanningController::class, 'savePlan'])->name('admin.simulation-planning.plan');
        Route::post('/simulation-planning/{campaignRequest}/ai-draft', [SimulationEventPlanningController::class, 'generateAiDraft'])->name('admin.simulation-planning.ai-draft');
        Route::post('/simulation-planning/{campaignRequest}/generate', [SimulationEventPlanningController::class, 'generateEvent'])->name('admin.simulation-planning.generate');
        Route::get('/simulation-planning/{campaignRequest}/training-summary', [SimulationEventPlanningController::class, 'trainingSummary'])->name('admin.simulation-planning.training-summary');

        // Simulation Exercise Templates (reusable exercise blueprints)
        Route::post('/simulation-exercise-templates/generate-plan', [SimulationExerciseTemplateController::class, 'generatePlan'])->name('admin.simulation-exercise-templates.generate-plan');
        Route::post('/simulation-exercise-templates/regenerate-section', [SimulationExerciseTemplateController::class, 'regenerateSection'])->name('admin.simulation-exercise-templates.regenerate-section');
        Route::get('/simulation-exercise-templates', [SimulationExerciseTemplateController::class, 'index'])->name('admin.simulation-exercise-templates.index');
        Route::get('/simulation-exercise-templates/create', [SimulationExerciseTemplateController::class, 'create'])->name('admin.simulation-exercise-templates.create');
        Route::post('/simulation-exercise-templates', [SimulationExerciseTemplateController::class, 'store'])->name('admin.simulation-exercise-templates.store');
        Route::get('/simulation-exercise-templates/{simulationExerciseTemplate}', [SimulationExerciseTemplateController::class, 'show'])->name('admin.simulation-exercise-templates.show');
        Route::get('/simulation-exercise-templates/{simulationExerciseTemplate}/edit', [SimulationExerciseTemplateController::class, 'edit'])->name('admin.simulation-exercise-templates.edit');
        Route::put('/simulation-exercise-templates/{simulationExerciseTemplate}', [SimulationExerciseTemplateController::class, 'update'])->name('admin.simulation-exercise-templates.update');
        Route::post('/simulation-exercise-templates/{simulationExerciseTemplate}/publish', [SimulationExerciseTemplateController::class, 'publish'])->name('admin.simulation-exercise-templates.publish');
        Route::post('/simulation-exercise-templates/{simulationExerciseTemplate}/archive', [SimulationExerciseTemplateController::class, 'archive'])->name('admin.simulation-exercise-templates.archive');
        Route::post('/simulation-exercise-templates/{simulationExerciseTemplate}/reuse', [SimulationExerciseTemplateController::class, 'reuse'])->name('admin.simulation-exercise-templates.reuse');
        Route::delete('/simulation-exercise-templates/{simulationExerciseTemplate}', [SimulationExerciseTemplateController::class, 'destroy'])->name('admin.simulation-exercise-templates.destroy');

        Route::get('/simulation-events/create', [SimulationEventController::class, 'create'])->name('admin.simulation-events.create');
        Route::post('/simulation-events', [SimulationEventController::class, 'store'])->name('admin.simulation-events.store');
        Route::get('/simulation-events/{simulationEvent}', [SimulationEventController::class, 'show'])->name('admin.simulation-events.show');
        Route::get('/simulation-events/{simulationEvent}/edit', [SimulationEventController::class, 'edit'])->name('admin.simulation-events.edit');
        Route::put('/simulation-events/{simulationEvent}', [SimulationEventController::class, 'update'])->name('admin.simulation-events.update');
        Route::post('/simulation-events/{simulationEvent}/publish', [SimulationEventController::class, 'publish'])->name('admin.simulation-events.publish');
        Route::post('/simulation-events/{simulationEvent}/unpublish', [SimulationEventController::class, 'unpublish'])->name('admin.simulation-events.unpublish');
        Route::post('/simulation-events/{simulationEvent}/cancel', [SimulationEventController::class, 'cancel'])->name('admin.simulation-events.cancel');
        Route::post('/simulation-events/{simulationEvent}/archive', [SimulationEventController::class, 'archive'])->name('admin.simulation-events.archive');
        Route::post('/simulation-events/{simulationEvent}/start', [SimulationEventController::class, 'start'])->name('admin.simulation-events.start');
        Route::post('/simulation-events/{simulationEvent}/complete', [SimulationEventController::class, 'complete'])->name('admin.simulation-events.complete');
        Route::get('/simulation-events/{simulationEvent}/lifecycle', [SimulationEventLifecycleController::class, 'show'])->name('admin.simulation-events.lifecycle');
        Route::patch('/simulation-events/{simulationEvent}/readiness', [SimulationEventLifecycleController::class, 'updateReadiness'])->name('admin.simulation-events.readiness');
        Route::post('/simulation-events/{simulationEvent}/cpsqc-patrol/request', [SimulationEventLifecycleController::class, 'requestCpsqcPatrol'])->name('admin.simulation-events.cpsqc-patrol.request');
        Route::get('/simulation-events/{simulationEvent}/cpsqc-patrol/requests', [SimulationEventLifecycleController::class, 'listCpsqcPatrolRequests'])->name('admin.simulation-events.cpsqc-patrol.list');
        Route::get('/simulation-events/{simulationEvent}/cpsqc-patrol/marshals', [SimulationEventLifecycleController::class, 'refreshCpsqcMarshals'])->name('admin.simulation-events.cpsqc-patrol.marshals');
        Route::put('/simulation-events/{simulationEvent}/personnel-assignments', [SimulationEventLifecycleController::class, 'saveEventPersonnelAssignments'])->name('admin.simulation-events.personnel-assignments');
        Route::post('/simulation-events/{simulationEvent}/execution-steps/{step}', [SimulationEventLifecycleController::class, 'completeStep'])->name('admin.simulation-events.execution-steps.complete');
        Route::post('/simulation-events/{simulationEvent}/post-evaluation', [SimulationEventLifecycleController::class, 'storePostEvaluation'])->name('admin.simulation-events.post-evaluation');
        Route::delete('/simulation-events/{simulationEvent}', [SimulationEventController::class, 'destroy'])->name('admin.simulation-events.destroy');
        Route::get('/simulation-events/{simulationEvent}/registrations', [EventRegistrationController::class, 'index'])->name('admin.simulation-events.registrations');
        Route::get('/simulation-events/{simulationEvent}/attendance', [AttendanceController::class, 'index'])->name('admin.simulation-events.attendance');
        Route::post('/simulation-events/{simulationEvent}/attendance/lock', [AttendanceController::class, 'lock'])->name('admin.simulation-events.attendance.lock');
        Route::get('/simulation-events/{simulationEvent}/attendance/export', [AttendanceController::class, 'export'])->name('admin.simulation-events.attendance.export');
        Route::post('/simulation-events/{simulationEvent}/attendance/mark-present', [AttendanceController::class, 'markPresentByQR'])->name('admin.simulation-events.attendance.mark-present');
        Route::post('/simulation-events/{simulationEvent}/attendance/bulk', [AttendanceController::class, 'bulkMark'])->name('admin.simulation-events.attendance.bulk');

        // Admin JSON API (session-authenticated, for React modules)
        Route::prefix('api')->name('admin.api.')->group(function () {
            Route::get('/resources', [\App\Http\Controllers\Api\ResourceApiController::class, 'index'])->name('resources.index');
            Route::get('/resources/{resource}/history', [\App\Http\Controllers\Api\ResourceApiController::class, 'getHistory'])->name('resources.history');
            Route::get('/resource-movements', [\App\Http\Controllers\Api\ResourceApiController::class, 'movements'])->name('resources.movements');
            Route::get('/resource-reports', [\App\Http\Controllers\Api\ResourceApiController::class, 'reports'])->name('resources.reports');
        });

        // Group 6 — external system integration (status & placeholders only)
        Route::prefix('integrations/group6')->name('admin.integrations.group6.')->group(function () {
            Route::get('/status', [Group6IntegrationController::class, 'status'])->name('status');
            Route::get('/pending-records', [Group6IntegrationController::class, 'pendingRecords'])->name('pending-records');
            Route::post('/fetch', [Group6IntegrationController::class, 'fetchFromGroup6'])->name('fetch');
        });

        // Participants (admin management)
        Route::get('/participants', [ParticipantController::class, 'index'])->name('admin.participants.index');
        Route::post('/participants', [ParticipantController::class, 'store'])->name('admin.participants.store');
        Route::post('/participants/sync', [ParticipantController::class, 'sync'])->name('admin.participants.sync');
        Route::post('/participants/{user}/resend-verification', [ParticipantController::class, 'resendVerificationEmail'])
            ->whereNumber('user')
            ->name('admin.participants.resend-verification');
        Route::get('/participants/export/csv', [ParticipantController::class, 'export'])->name('admin.participants.export');
        Route::get('/participants/{user}', [ParticipantController::class, 'show'])
            ->whereNumber('user')
            ->name('admin.participants.show');

        // Qualified trainers (read-only directory synced from Community Engagement System)
        Route::get('/api/qualified-trainers', [QualifiedTrainerController::class, 'apiIndex'])->name('admin.api.qualified-trainers.index');
        Route::post('/qualified-trainers/sync', [QualifiedTrainerController::class, 'sync'])->name('admin.qualified-trainers.sync');
        Route::get('/qualified-trainers/{qualifiedTrainer}', [QualifiedTrainerController::class, 'show'])->name('admin.qualified-trainers.show');

        // Event Registrations & Attendance
        Route::post('/event-registrations/{eventRegistration}/approve', [EventRegistrationController::class, 'approve'])->name('admin.event-registrations.approve');
        Route::post('/event-registrations/{eventRegistration}/reject', [EventRegistrationController::class, 'reject'])->name('admin.event-registrations.reject');
        Route::post('/event-registrations/{eventRegistration}/cancel', [EventRegistrationController::class, 'cancel'])->name('admin.event-registrations.cancel');
        Route::post('/event-registrations/{eventRegistration}/attendance', [AttendanceController::class, 'store'])->name('admin.attendance.store');
        Route::put('/attendances/{attendance}', [AttendanceController::class, 'update'])->name('admin.attendance.update');

        // Settings
        Route::get('/settings/auto-approval', [SettingController::class, 'getAutoApproval'])->name('admin.settings.auto-approval.get');
        Route::post('/settings/auto-approval', [SettingController::class, 'toggleAutoApproval'])->name('admin.settings.auto-approval.toggle');

        // Resources & Equipment Inventory
        Route::get('/resources', [ResourceController::class, 'index'])->name('admin.resources.index');
        Route::get('/resources/create', [ResourceController::class, 'create'])->name('admin.resources.create');
        Route::post('/resources', [ResourceController::class, 'store'])->name('admin.resources.store');
        Route::get('/resources/export/csv', [ResourceController::class, 'export'])->name('admin.resources.export');
        Route::get('/resources/{resource}', [ResourceController::class, 'show'])->name('admin.resources.show');
        Route::get('/resources/{resource}/edit', [ResourceController::class, 'edit'])->name('admin.resources.edit');
        Route::put('/resources/{resource}', [ResourceController::class, 'update'])->name('admin.resources.update');
        Route::post('/resources/{resource}/assign-to-event', [ResourceController::class, 'assignToEvent'])->name('admin.resources.assign-event');
        Route::post('/resources/{resource}/mark-in-use', [ResourceController::class, 'markInUse'])->name('admin.resources.mark-inuse');
        Route::post('/resources/{resource}/mark-unused', [ResourceController::class, 'markUnused'])->name('admin.resources.mark-unused');
        Route::post('/resources/{resource}/report-damage', [ResourceController::class, 'reportDamage'])->name('admin.resources.report-damage');
        Route::post('/resources/{resource}/return-from-event', [ResourceController::class, 'returnFromEvent'])->name('admin.resources.return-event');
        Route::post('/resources/{resource}/schedule-maintenance', [ResourceController::class, 'scheduleMaintenance'])->name('admin.resources.schedule-maintenance');
        Route::post('/resources/{resource}/complete-maintenance', [ResourceController::class, 'completeMaintenance'])->name('admin.resources.complete-maintenance');
        Route::get('/resources/{resource}/maintenance-logs', [ResourceController::class, 'maintenanceLogs'])->name('admin.resources.maintenance-logs');
        Route::delete('/resources/{resource}', [ResourceController::class, 'destroy'])->name('admin.resources.destroy');

        // Resource Budget Proposals
        Route::get('/api/resource-budget-proposals', [ResourceBudgetProposalController::class, 'apiIndex'])
            ->name('admin.api.resource-budget-proposals.index');
        Route::get('/resource-budget-proposals', [ResourceBudgetProposalController::class, 'index'])
            ->name('admin.resource-budget-proposals.index');
        Route::get('/resource-budget-proposals/create', [ResourceBudgetProposalController::class, 'create'])
            ->name('admin.resource-budget-proposals.create');
        Route::post('/resource-budget-proposals', [ResourceBudgetProposalController::class, 'store'])
            ->name('admin.resource-budget-proposals.store');
        Route::get('/resource-budget-proposals/{resourceBudgetProposal}', [ResourceBudgetProposalController::class, 'show'])
            ->name('admin.resource-budget-proposals.show');
        Route::get('/resource-budget-proposals/{resourceBudgetProposal}/edit', [ResourceBudgetProposalController::class, 'edit'])
            ->name('admin.resource-budget-proposals.edit');
        Route::put('/resource-budget-proposals/{resourceBudgetProposal}', [ResourceBudgetProposalController::class, 'update'])
            ->name('admin.resource-budget-proposals.update');
        Route::delete('/resource-budget-proposals/{resourceBudgetProposal}', [ResourceBudgetProposalController::class, 'destroy'])
            ->name('admin.resource-budget-proposals.destroy');
        Route::post('/resource-budget-proposals/{resourceBudgetProposal}/submit', [ResourceBudgetProposalController::class, 'submit'])
            ->name('admin.resource-budget-proposals.submit');
        Route::post('/resource-budget-proposals/{resourceBudgetProposal}/approve', [ResourceBudgetProposalController::class, 'approve'])
            ->name('admin.resource-budget-proposals.approve');
        Route::post('/resource-budget-proposals/{resourceBudgetProposal}/reject', [ResourceBudgetProposalController::class, 'reject'])
            ->name('admin.resource-budget-proposals.reject');

        // Evaluation & Scoring System (simulation event scoring dashboard)
        Route::get('/evaluations', [EvaluationController::class, 'index'])->name('admin.evaluations.index');
        Route::get('/evaluations/training-results', [EvaluationResultController::class, 'index'])->name('admin.evaluation-results.index');
        Route::post('/evaluations/reset-bulk', [EvaluationResultController::class, 'bulkReset'])->name('admin.evaluations.reset-bulk');
        Route::get('/evaluations/results/{evaluationResult}', [EvaluationResultController::class, 'show'])->name('admin.evaluation-results.show');
        Route::post('/evaluations/results/{evaluationResult}/reset', [EvaluationResultController::class, 'reset'])->name('admin.evaluation-results.reset');
        Route::delete('/evaluations/results/{evaluationResult}', [EvaluationResultController::class, 'destroy'])->name('admin.evaluation-results.destroy');

        // Simulation event manual evaluation
        Route::get('/simulation-events/{simulationEvent}/evaluation', [EvaluationController::class, 'show'])->name('admin.simulation-events.evaluation.show');
        Route::get('/simulation-events/{simulationEvent}/evaluation/summary', [EvaluationController::class, 'summary'])->name('admin.simulation-events.evaluation.summary');
        Route::get('/simulation-events/{simulationEvent}/evaluation/export/{format?}', [EvaluationController::class, 'export'])->name('admin.simulation-events.evaluation.export');
        Route::get('/simulation-events/{simulationEvent}/evaluation/{userId}', [EvaluationController::class, 'evaluate'])->name('admin.simulation-events.evaluation.evaluate');
        Route::post('/simulation-events/{simulationEvent}/evaluation/{userId}', [EvaluationController::class, 'storeEvaluation'])->name('admin.simulation-events.evaluation.store');
        Route::put('/evaluations/{evaluation}/status', [EvaluationController::class, 'updateStatus'])->name('admin.evaluations.update-status');
        Route::post('/evaluations/{evaluation}/lock', [EvaluationController::class, 'lock'])->name('admin.evaluations.lock');

        // Hazard Assessment Profile (formerly Barangay Profile)
        Route::get('/api/hazard-assessment-profiles', [App\Http\Controllers\HazardAssessmentProfileController::class, 'apiIndex'])
            ->name('admin.api.hazard-assessment-profiles.index');
        Route::get('/api/locations/regions', [App\Http\Controllers\PhilippinesLocationController::class, 'regions']);
        Route::get('/api/locations/provinces', [App\Http\Controllers\PhilippinesLocationController::class, 'provinces']);
        Route::get('/api/locations/cities', [App\Http\Controllers\PhilippinesLocationController::class, 'cities']);
        Route::get('/api/locations/barangays', [App\Http\Controllers\PhilippinesLocationController::class, 'barangays']);
        Route::get('/api/locations/resolve', [App\Http\Controllers\PhilippinesLocationController::class, 'resolve']);
        Route::get('/hazard-assessment-profiles', [App\Http\Controllers\HazardAssessmentProfileController::class, 'index'])
            ->name('admin.hazard-assessment-profiles.index');
        Route::get('/hazard-assessment-profiles/create', [App\Http\Controllers\HazardAssessmentProfileController::class, 'create'])
            ->name('admin.hazard-assessment-profiles.create');
        Route::post('/hazard-assessment-profiles', [App\Http\Controllers\HazardAssessmentProfileController::class, 'store'])
            ->name('admin.hazard-assessment-profiles.store');
        Route::get('/hazard-assessment-profiles/{barangayProfile}', [App\Http\Controllers\HazardAssessmentProfileController::class, 'show'])
            ->name('admin.hazard-assessment-profiles.show');
        Route::get('/hazard-assessment-profiles/{barangayProfile}/edit', [App\Http\Controllers\HazardAssessmentProfileController::class, 'edit'])
            ->name('admin.hazard-assessment-profiles.edit');
        Route::put('/hazard-assessment-profiles/{barangayProfile}', [App\Http\Controllers\HazardAssessmentProfileController::class, 'update'])
            ->name('admin.hazard-assessment-profiles.update');
        Route::delete('/hazard-assessment-profiles/{barangayProfile}', [App\Http\Controllers\HazardAssessmentProfileController::class, 'destroy'])
            ->name('admin.hazard-assessment-profiles.destroy');
        Route::get('/hazard-assessment-profiles/{barangayProfile}/intelligence', [App\Http\Controllers\HazardAssessmentProfileController::class, 'intelligence'])
            ->name('admin.hazard-assessment-profiles.intelligence');
        Route::get('/hazard-assessment-profiles/{barangayProfile}/documents/{document}/download', [App\Http\Controllers\HazardAssessmentProfileController::class, 'downloadDocument'])
            ->name('admin.hazard-assessment-profiles.documents.download');
        Route::delete('/hazard-assessment-profiles/{barangayProfile}/documents/{document}', [App\Http\Controllers\HazardAssessmentProfileController::class, 'deleteDocument'])
            ->name('admin.hazard-assessment-profiles.documents.destroy');

        // Legacy redirects
        Route::redirect('/barangay-profile', '/admin/hazard-assessment-profiles');
        Route::redirect('/barangay-profile/create', '/admin/hazard-assessment-profiles/create');
        Route::get('/barangay-profile/{barangayProfile}', fn ($id) => redirect("/admin/hazard-assessment-profiles/{$id}"));
        Route::get('/barangay-profile/{barangayProfile}/edit', fn ($id) => redirect("/admin/hazard-assessment-profiles/{$id}/edit"));

        // Certification Issuance
        Route::get('/certification', [App\Http\Controllers\CertificationController::class, 'index'])->name('admin.certification.index');
        Route::post('/certification/issue', [App\Http\Controllers\CertificationController::class, 'issue'])->name('admin.certification.issue');
        Route::post('/certificates/{certificate}/revoke', [App\Http\Controllers\CertificationController::class, 'revoke'])->name('admin.certificates.revoke');
        Route::post('/certification/reissue', [App\Http\Controllers\CertificationController::class, 'reissue'])->name('admin.certification.reissue');
        Route::post('/certification/templates', [App\Http\Controllers\CertificationController::class, 'storeTemplate'])->name('admin.certification.templates.store');
        Route::put('/certification/templates/{template}', [App\Http\Controllers\CertificationController::class, 'updateTemplate'])->name('admin.certification.templates.update');
        Route::post('/certification/templates/{template}/update', [App\Http\Controllers\CertificationController::class, 'updateTemplate'])->name('admin.certification.templates.update.post');
        Route::delete('/certification/templates/{template}', [App\Http\Controllers\CertificationController::class, 'destroyTemplate'])->name('admin.certification.templates.destroy');
        Route::post('/certification/templates/{template}/duplicate', [App\Http\Controllers\CertificationController::class, 'duplicateTemplate'])->name('admin.certification.templates.duplicate');
        Route::get('/certification/preview-participant', [App\Http\Controllers\CertificationController::class, 'previewParticipant'])->name('admin.certification.preview-participant');
        Route::get('/certification/templates/{template}/preview', [App\Http\Controllers\CertificationController::class, 'previewTemplate'])->name('admin.certification.templates.preview');
        Route::get('/certification/templates/{template}/background', [App\Http\Controllers\CertificationController::class, 'templateBackground'])->name('admin.certification.templates.background');
        Route::get('/certificates/{certificate}/view', [App\Http\Controllers\CertificationController::class, 'viewCertificate'])->name('admin.certificates.view');
        Route::get('/certificates/{certificate}/background', [App\Http\Controllers\CertificationController::class, 'certificateBackground'])->name('admin.certificates.background');
        Route::post('/certification/settings', [App\Http\Controllers\CertificationController::class, 'updateSettings'])->name('admin.certification.settings');
        Route::get('/certification/export/{format?}', [App\Http\Controllers\CertificationController::class, 'export'])->name('admin.certification.export');

        // LGU Admin user management
        Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::get('/users/create', [AdminUserController::class, 'create'])->name('admin.users.create');
        Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('admin.users.edit');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
        Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('admin.users.show');
        Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
        Route::post('/users/{user}/disable', [AdminUserController::class, 'disable'])->name('admin.users.disable');
        Route::post('/users/{user}/enable', [AdminUserController::class, 'enable'])->name('admin.users.enable');
        Route::post('/users/{user}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
        Route::post('/users/{user}/manual-verify', [AdminUserController::class, 'manualVerify'])->name('admin.users.manual-verify');

        // Audit logs
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('admin.audit-logs.index');
        Route::get('/api/audit-logs', [AuditLogController::class, 'history'])->name('admin.audit-logs.history');
        Route::get('/api/audit-logs/export', [AuditLogController::class, 'export'])->name('admin.audit-logs.export');

        // Roles & Permissions
        Route::get('/roles', [App\Http\Controllers\RoleController::class, 'index'])->name('admin.roles.index');
        Route::post('/roles', [App\Http\Controllers\RoleController::class, 'store'])->name('admin.roles.store');
        Route::get('/roles/{id}/edit', [App\Http\Controllers\RoleController::class, 'edit'])->name('admin.roles.edit');
        Route::put('/roles/{id}', [App\Http\Controllers\RoleController::class, 'update'])->name('admin.roles.update');
        Route::delete('/roles/{id}', [App\Http\Controllers\RoleController::class, 'destroy'])->name('admin.roles.destroy');
        Route::get('/permissions', [App\Http\Controllers\PermissionController::class, 'index'])->name('admin.permissions.index');
        Route::post('/permissions', [App\Http\Controllers\PermissionController::class, 'store'])->name('admin.permissions.store');
        Route::get('/permissions/{id}/edit', [App\Http\Controllers\PermissionController::class, 'edit'])->name('admin.permissions.edit');
        Route::put('/permissions/{id}', [App\Http\Controllers\PermissionController::class, 'update'])->name('admin.permissions.update');

    });

    // Participant portal routes
    Route::middleware('portal.participant')->prefix('participant')->group(function () {
        Route::get('/training-modules', [ParticipantTrainingModuleController::class, 'index'])
            ->name('participant.training-modules.index');
        Route::get('/training-modules/progress-summary', [ParticipantTrainingModuleController::class, 'progressSummaryAll'])
            ->name('participant.training-modules.progress-summary.all');
        Route::get('/training-modules/{trainingModule}/progress-summary', [ParticipantTrainingModuleController::class, 'progressSummary'])
            ->name('participant.training-modules.progress-summary');
        Route::get('/training-modules/{trainingModule}', [ParticipantTrainingModuleController::class, 'show'])
            ->name('participant.training-modules.show');

        Route::post('/training-modules/{trainingModule}/contents/{content}/completion', [LessonCompletionController::class, 'toggle'])
            ->name('participant.training-modules.contents.completion.toggle');
        Route::post('/training-modules/{trainingModule}/lessons/{content}/completion', [LessonCompletionController::class, 'toggle'])
            ->name('participant.training-modules.lessons.completion.toggle');

        Route::post('/training-modules/{trainingModule}/ai-scenario-training/start', [AiScenarioAttemptController::class, 'start'])
            ->name('participant.ai-scenario-training.start');
        Route::get('/training-modules/{trainingModule}/ai-scenario-training/status', [AiScenarioAttemptController::class, 'status'])
            ->name('participant.ai-scenario-training.status');
        Route::get('/ai-scenario-attempts/{attempt}', [AiScenarioAttemptController::class, 'show'])
            ->name('participant.ai-scenario-attempts.show');
        Route::post('/ai-scenario-attempts/{attempt}/answers', [AiScenarioAttemptController::class, 'saveAnswer'])
            ->name('participant.ai-scenario-attempts.save-answer');
        Route::post('/ai-scenario-attempts/{attempt}/progress', [AiScenarioAttemptController::class, 'saveProgress'])
            ->name('participant.ai-scenario-attempts.save-progress');
        Route::post('/ai-scenario-attempts/{attempt}/submit', [AiScenarioAttemptController::class, 'submit'])
            ->name('participant.ai-scenario-attempts.submit');

        Route::get('/training-modules/{trainingModule}/contents/{content}/lesson-quiz/status', [LessonQuizAttemptController::class, 'status'])
            ->name('participant.lesson-quiz.status');
        Route::post('/training-modules/{trainingModule}/contents/{content}/lesson-quiz/start', [LessonQuizAttemptController::class, 'start'])
            ->name('participant.lesson-quiz.start');
        Route::get('/lesson-quiz-attempts/{attempt}', [LessonQuizAttemptController::class, 'show'])
            ->name('participant.lesson-quiz-attempts.show');
        Route::post('/lesson-quiz-attempts/{attempt}/submit', [LessonQuizAttemptController::class, 'submit'])
            ->name('participant.lesson-quiz-attempts.submit');

        // Simulation Events (participant browse & register)
        Route::get('/simulation-events', [SimulationEventController::class, 'index'])->name('participant.simulation-events.index');
        Route::get('/simulation-events/{simulationEvent}', [SimulationEventController::class, 'show'])->name('participant.simulation-events.show');
        Route::get('/simulation-events/{simulationEvent}/calendar.ics', [SimulationEventController::class, 'calendarExport'])
            ->name('participant.simulation-events.calendar');
        Route::post('/simulation-events/{simulationEvent}/check-in', [AttendanceController::class, 'selfCheckIn'])
            ->name('participant.simulation-events.check-in');
        Route::post('/simulation-events/{simulationEvent}/register', [SimulationEventController::class, 'register'])->name('participant.simulation-events.register');
        Route::post('/simulation-events/{simulationEvent}/cancel-registration', [SimulationEventController::class, 'cancelRegistration'])->name('participant.simulation-events.cancel-registration');

        // Evaluation results (participant view)
        Route::get('/evaluations', [EvaluationResultController::class, 'index'])->name('participant.evaluations.index');
        Route::get('/evaluations/portfolio', [EvaluationResultController::class, 'portfolio'])->name('participant.evaluations.portfolio');
        Route::get('/evaluations/portfolio/download', [EvaluationResultController::class, 'portfolioDownload'])->name('participant.evaluations.portfolio.download');
        Route::get('/evaluations/results/{evaluationResult}', [EvaluationResultController::class, 'show'])->name('participant.evaluation-results.show');
        Route::get('/evaluations/event-drills/{participantEvaluation}', [App\Http\Controllers\ParticipantEventEvaluationController::class, 'show'])
            ->name('participant.event-evaluations.show');

        // Certification (participant view)
        Route::get('/certification', [App\Http\Controllers\CertificationController::class, 'index'])->name('participant.certification.index');
        Route::get('/certificates/{certificate}/view', [App\Http\Controllers\CertificationController::class, 'viewCertificate'])->name('participant.certificates.view');
        Route::post('/certificates/{certificate}/email', [App\Http\Controllers\CertificationController::class, 'emailCertificate'])->name('participant.certificates.email');
        Route::get('/certificates/{certificate}/background', [App\Http\Controllers\CertificationController::class, 'certificateBackground'])->name('participant.certificates.background');

        // My Attendance
        Route::get('/my-attendance', [ParticipantController::class, 'myAttendance'])->name('participant.my-attendance.index');

        // My Trainings
        Route::get('/my-trainings', [CampaignRegistrationController::class, 'myTrainings'])->name('participant.my-trainings.index');

        // In-app notifications
        Route::get('/notifications', [PortalNotificationController::class, 'index'])
            ->name('participant.notifications.index');
        Route::get('/notifications/unread-count', [PortalNotificationController::class, 'unreadCount'])
            ->name('participant.notifications.unread-count');
        Route::post('/notifications/{notification}/read', [PortalNotificationController::class, 'markRead'])
            ->name('participant.notifications.read');
        Route::post('/notifications/read-all', [PortalNotificationController::class, 'markAllRead'])
            ->name('participant.notifications.read-all');
    });

    // Profile (shared across portals)
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class, 'updateBasic'])->name('profile.update');
    Route::post('/profile/email', [ProfileController::class, 'requestEmailChange'])->name('profile.email.request');
    Route::get('/profile/email/confirm/{token}', [ProfileController::class, 'confirmEmailChange'])->name('profile.email.confirm');
    Route::post('/profile/email/resend', [ProfileController::class, 'resendEmailChange'])->name('profile.email.resend');
    Route::post('/profile/phone', [ProfileController::class, 'requestPhoneChange'])->name('profile.phone.request');
    Route::get('/profile/phone/confirm/{token}', [ProfileController::class, 'confirmPhoneChange'])->name('profile.phone.confirm');
    Route::post('/profile/password', [ProfileController::class, 'changePassword'])->name('profile.password.change');
    Route::put('/profile/notifications', [ProfileController::class, 'updateNotificationPreferences'])->name('profile.notifications.update');

    // Legacy shared URLs → correct portal prefix (backward compatibility)
    Route::get('/training-modules', [LegacyTrainingModuleRedirectController::class, 'redirectIndex'])
        ->name('training.modules');
    Route::get('/training-modules/create', [LegacyTrainingModuleRedirectController::class, 'redirectCreate'])
        ->name('training.modules.create');
    Route::get('/training-modules/{trainingModule}', [LegacyTrainingModuleRedirectController::class, 'redirectShow'])
        ->name('training.modules.show');
    Route::get('/training-modules/{trainingModule}/edit', [LegacyTrainingModuleRedirectController::class, 'redirectEdit'])
        ->name('training.modules.edit');

    Route::get('/evaluations', [LegacyPortalRedirectController::class, 'evaluations'])->name('legacy.evaluations');
    Route::get('/scenarios', [LegacyPortalRedirectController::class, 'scenarios'])->name('legacy.scenarios');
    Route::get('/simulation-events', [LegacyPortalRedirectController::class, 'simulationEvents'])->name('legacy.simulation-events');
    Route::get('/simulation-events/{simulationEvent}', [LegacyPortalRedirectController::class, 'simulationEventShow'])->name('legacy.simulation-events.show');
    Route::get('/simulation-events/{simulationEvent}/evaluation', [LegacyPortalRedirectController::class, 'simulationEventEvaluation'])->name('legacy.simulation-events.evaluation');
    Route::get('/simulation-events/{simulationEvent}/evaluation/summary', [LegacyPortalRedirectController::class, 'simulationEventEvaluationSummary'])->name('legacy.simulation-events.evaluation.summary');
    Route::get('/simulation-events/{simulationEvent}/evaluation/{userId}', [LegacyPortalRedirectController::class, 'simulationEventEvaluationParticipant'])
        ->whereNumber('userId')
        ->name('legacy.simulation-events.evaluation.participant');
    Route::get('/resources', [LegacyPortalRedirectController::class, 'resources'])->name('legacy.resources');
    Route::get('/resources/{resource}', [LegacyPortalRedirectController::class, 'resources'])->name('legacy.resources.show');
    Route::get('/participants', [LegacyPortalRedirectController::class, 'participants'])->name('legacy.participants');
    Route::get('/participants/{user}', [LegacyPortalRedirectController::class, 'participants'])
        ->whereNumber('user')
        ->name('legacy.participants.show');
    Route::get('/certification', [LegacyPortalRedirectController::class, 'certification'])->name('legacy.certification');
    Route::get('/barangay-profile', [LegacyPortalRedirectController::class, 'barangayProfile'])->name('legacy.barangay-profile');
    Route::get('/barangay-profile/{barangayProfile}', [LegacyPortalRedirectController::class, 'barangayProfile'])->name('legacy.barangay-profile.show');
    Route::get('/audit-logs', [LegacyPortalRedirectController::class, 'auditLogs'])->name('legacy.audit-logs');
    Route::get('/my-attendance', [LegacyPortalRedirectController::class, 'myAttendance'])->name('legacy.my-attendance');
    Route::get('/my-trainings', [LegacyPortalRedirectController::class, 'myTrainings'])->name('legacy.my-trainings');
});

