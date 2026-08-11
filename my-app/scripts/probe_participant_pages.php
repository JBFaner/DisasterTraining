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
    '/participant/dashboard',
    '/participant/training-modules',
    '/participant/simulation-events',
    '/participant/my-trainings',
    '/participant/my-attendance',
    '/participant/evaluations',
    '/participant/certification',
];

$user = User::query()->where('role', 'PARTICIPANT')->orderBy('id')->first();
if (! $user) {
    echo "NO_PARTICIPANT\n";
    exit(1);
}

echo 'participant='.$user->email.PHP_EOL;

foreach ($paths as $path) {
    Auth::logout();
    session()->flush();
    PortalAuth::login($user, false);

    $request = Request::create($path, 'GET', [], [], [], [
        'HTTP_ACCEPT' => 'text/html',
    ]);
    $request->setLaravelSession(app('session.store'));
    session()->start();

    $response = $kernel->handle($request);
    echo $response->getStatusCode().' '.$path.PHP_EOL;
    $kernel->terminate($request, $response);
}
