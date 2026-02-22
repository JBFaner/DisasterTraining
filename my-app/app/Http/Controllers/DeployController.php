<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;

class DeployController extends Controller
{
    /**
     * Show the deployment dashboard (admin only).
     * Auth is enforced by the route group; canDeploy() restricts to LGU_ADMIN.
     */
    public function index()
    {
        if (!$this->canDeploy()) {
            abort(403, 'Unauthorized.');
        }

        return view('app', ['section' => 'deployment']);
    }

    /**
     * Step 1: Git stash, pull, stash pop.
     */
    public function gitPull(Request $request)
    {
        if (!$this->canDeploy()) {
            return response()->json([
                'success' => false,
                'output' => [['command' => 'auth', 'output' => 'Unauthorized.', 'exit' => 1]],
            ], 403);
        }

        $basePath = base_path();
        $output = [];
        $success = true;

        foreach (['git stash', 'git pull', 'git stash pop'] as $cmd) {
            $result = Process::path($basePath)->run($cmd);
            $out = trim($result->output() . "\n" . $result->errorOutput());
            $output[] = ['command' => $cmd, 'output' => $out ?: '(no output)', 'exit' => $result->exitCode()];
            if ($result->exitCode() !== 0) {
                $success = false;
                // Continue to run remaining commands; stash pop might fail if nothing was stashed
            }
        }

        Log::info('Deploy: git pull executed', ['user_id' => auth()->id(), 'success' => $success]);

        return response()->json([
            'success' => $success,
            'output' => $output,
        ]);
    }

    /**
     * Step 2: Artisan migrate, seed, clears, then npm run build.
     */
    public function laravelBuild(Request $request)
    {
        if (!$this->canDeploy()) {
            return response()->json([
                'success' => false,
                'output' => [['command' => 'auth', 'output' => 'Unauthorized.', 'exit' => 1]],
            ], 403);
        }

        $basePath = base_path();
        $output = [];
        $success = true;

        $artisanCommands = [
            'migrate --force',
            'db:seed --force',
            'config:clear',
            'cache:clear',
            'route:clear',
            'view:clear',
        ];

        foreach ($artisanCommands as $cmd) {
            $result = Process::path($basePath)->run('php artisan ' . $cmd);
            $out = trim($result->output() . "\n" . $result->errorOutput());
            $output[] = ['command' => 'php artisan ' . $cmd, 'output' => $out ?: '(no output)', 'exit' => $result->exitCode()];
            if ($result->exitCode() !== 0) {
                $success = false;
            }
        }

        $npmResult = Process::path($basePath)->run('npm run build');
        $npmOut = trim($npmResult->output() . "\n" . $npmResult->errorOutput());
        $output[] = ['command' => 'npm run build', 'output' => $npmOut ?: '(no output)', 'exit' => $npmResult->exitCode()];
        if ($npmResult->exitCode() !== 0) {
            $success = false;
        }

        Log::info('Deploy: Laravel build executed', ['user_id' => auth()->id(), 'success' => $success]);

        return response()->json([
            'success' => $success,
            'output' => $output,
        ]);
    }

    private function canDeploy(): bool
    {
        $user = auth()->user();
        if (!$user) {
            return false;
        }
        return $user->role === 'LGU_ADMIN';
    }
}
