<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Support\PortalAuth;

$roles = ['LGU_ADMIN', 'LGU_TRAINER', 'LEAD_TRAINER', 'EVALUATOR', 'PARTICIPANT', 'STAFF'];

echo "=== PortalAuth evaluation access ===\n";
foreach ($roles as $role) {
    echo sprintf(
        "%-14s evaluate=%s participants=%s events=%s\n",
        $role,
        PortalAuth::canEvaluate($role) ? 'yes' : 'no',
        PortalAuth::canViewParticipantRegistry($role) ? 'yes' : 'no',
        PortalAuth::canAccessAdminSimulationEvents($role) ? 'yes' : 'no',
    );
}

echo "\n=== Sample users by role ===\n";
foreach (['PARTICIPANT', 'EVALUATOR', 'LGU_TRAINER', 'LEAD_TRAINER', 'LGU_ADMIN'] as $role) {
    $user = User::query()->where('role', $role)->orderBy('id')->first();
    if (! $user) {
        echo "{$role}: (none)\n";
        continue;
    }
    echo sprintf("%s: id=%d email=%s\n", $role, $user->id, $user->email);
}

echo "\n=== Evaluation flow data snapshot ===\n";
echo 'modules='.App\Models\TrainingModule::count().PHP_EOL;
echo 'events='.App\Models\SimulationEvent::count().PHP_EOL;
echo 'evaluations='.App\Models\Evaluation::count().PHP_EOL;
echo 'participant_evaluations='.App\Models\ParticipantEvaluation::count().PHP_EOL;
