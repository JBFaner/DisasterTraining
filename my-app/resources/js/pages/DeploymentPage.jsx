import React, { useState } from 'react';
import { GitPullRequest, Package, Loader2, CheckCircle2, XCircle, Terminal } from 'lucide-react';

export function DeploymentPage() {
    const [gitLoading, setGitLoading] = useState(false);
    const [buildLoading, setBuildLoading] = useState(false);
    const [gitResult, setGitResult] = useState(null);
    const [buildResult, setBuildResult] = useState(null);

    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const runGitPull = async () => {
        setGitResult(null);
        setGitLoading(true);
        try {
            const res = await fetch('/admin/deploy/git-pull', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            setGitResult(data);
        } catch (e) {
            setGitResult({ success: false, output: [{ command: 'Error', output: String(e.message || e), exit: 1 }] });
        } finally {
            setGitLoading(false);
        }
    };

    const runLaravelBuild = async () => {
        setBuildResult(null);
        setBuildLoading(true);
        try {
            const res = await fetch('/admin/deploy/laravel-build', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();
            setBuildResult(data);
        } catch (e) {
            setBuildResult({ success: false, output: [{ command: 'Error', output: String(e.message || e), exit: 1 }] });
        } finally {
            setBuildLoading(false);
        }
    };

    const renderOutput = (result) => {
        if (!result || !result.output || !result.output.length) return null;
        return (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">Output</span>
                    {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                    ) : (
                        <XCircle className="w-4 h-4 text-rose-400 ml-auto" />
                    )}
                </div>
                <pre className="p-4 text-xs overflow-auto max-h-80 whitespace-pre-wrap font-mono">
                    {result.output.map((item, i) => (
                        <span key={i}>
                            {item.command != null && (
                                <span className="text-amber-300">$ {item.command}{'\n'}</span>
                            )}
                            {item.output}
                            {item.exit !== undefined && (
                                <span className="text-slate-500"> (exit: {item.exit})</span>
                            )}
                            {'\n\n'}
                        </span>
                    ))}
                </pre>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-semibold text-slate-800">Deployment</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Run deployment steps from the server. Use <strong>Step 1</strong> to pull code, then <strong>Step 2</strong> to run migrations and build assets.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                            <GitPullRequest className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Step 1: Git Pull</h2>
                            <p className="text-sm text-slate-500">git stash → git pull → git stash pop</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={runGitPull}
                        disabled={gitLoading}
                        className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {gitLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running…
                            </>
                        ) : (
                            'Run Git Pull'
                        )}
                    </button>
                    {renderOutput(gitResult)}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                            <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Step 2: Laravel & Build</h2>
                            <p className="text-sm text-slate-500">migrate, seed, clear caches, npm run build</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={runLaravelBuild}
                        disabled={buildLoading}
                        className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {buildLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running…
                            </>
                        ) : (
                            'Run Laravel & Build'
                        )}
                    </button>
                    {renderOutput(buildResult)}
                </div>
            </div>
        </div>
    );
}
