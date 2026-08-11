<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Support\PortalAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

$paths = [
    '/admin/training-modules',
    '/admin/evaluations',
    '/admin/participants',
    '/admin/simulation-events',
    '/participant/training-modules',
    '/participant/evaluations',
];

function probePath(Illuminate\Contracts\Http\Kernel $kernel, User $user, string $path): int
{
    Auth::logout();
    session()->flush();
    PortalAuth::login($user, false);

    $request = Request::create($path, 'GET', [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
    ]);
    $request->setLaravelSession(app('session.store'));
    session()->start();

    $response = $kernel->handle($request);
    $kernel->terminate($request, $response);

    return $response->getStatusCode();
}

$rolesToTest = ['PARTICIPANT', 'LGU_TRAINER', 'LGU_ADMIN'];

echo "=== HTTP status by role (JSON/ajax) ===\n";
foreach ($rolesToTest as $role) {
    $user = User::query()->where('role', $role)->orderBy('id')->first();
    if (! $user) {
        echo "{$role}: no user\n";
        continue;
    }
    echo "{$role} ({$user->email}):\n";
    foreach ($paths as $path) {
        $status = probePath($kernel, $user, $path);
        echo "  {$status} {$path}\n";
    }
    echo "\n";
}

// Ensure evaluator role works if we create a temp probe user
$trainer = User::query()->where('role', 'LGU_TRAINER')->orderBy('id')->first();
if ($trainer) {
    $trainer->role = 'EVALUATOR';
    echo "=== Simulated EVALUATOR (trainer account role swap, no DB save) ===\n";
    foreach ($paths as $path) {
        $status = probePath($kernel, $trainer, $path);
        echo "  {$status} {$path}\n";
    }
    $trainer->role = 'LGU_TRAINER';
}
