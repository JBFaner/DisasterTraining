<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Support\PortalAuth;

$roles = ['LGU_ADMIN', 'LEAD_TRAINER', 'LGU_TRAINER', 'EVALUATOR', 'STAFF', 'PARTICIPANT'];

echo "=== Role access matrix ===\n";
foreach ($roles as $role) {
    echo sprintf(
        "%-14s ops=%s evaluate=%s attendance=%s events=%s\n",
        $role,
        PortalAuth::canManageOperations($role) ? 'yes' : 'no',
        PortalAuth::canEvaluate($role) ? 'yes' : 'no',
        PortalAuth::canManageAttendance($role) ? 'yes' : 'no',
        PortalAuth::canAccessAdminSimulationEvents($role) ? 'yes' : 'no',
    );
}
