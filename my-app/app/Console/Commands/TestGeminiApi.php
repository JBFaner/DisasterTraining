<?php

namespace App\Console\Commands;

use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestGeminiApi extends Command
{
    protected $signature = 'gemini:test';

    protected $description = 'Test Gemini API connection, list models, and run a generateContent smoke test';

    public function handle(): int
    {
        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-2.0-flash');
        $version = config('services.gemini.api_version', 'v1beta');

        $this->info('Gemini API diagnostics');
        $this->line('');

        if (! $apiKey) {
            $this->error('GEMINI_API_KEY is not set in .env');
            $this->line('Add: GEMINI_API_KEY=your_key_from_https://aistudio.google.com/apikey');

            return Command::FAILURE;
        }

        $this->line('GEMINI_API_KEY: set (length '.strlen($apiKey).')');
        $this->line('GEMINI_MODEL: '.$model);
        $this->line('GEMINI_API_VERSION: '.$version);
        $this->line('');

        $listUrl = 'https://generativelanguage.googleapis.com/'.$version.'/models?key='.$apiKey;
        $listResponse = Http::timeout(20)->get($listUrl);

        if ($listResponse->status() === 403) {
            $msg = $listResponse->json('error.message') ?? $listResponse->body();
            $this->error('ListModels failed (HTTP 403)');
            $this->error($msg);
            if (stripos($msg, 'leaked') !== false) {
                $this->line('');
                $this->warn('This key was disabled because Google flagged it as leaked.');
                $this->line('1. Go to https://aistudio.google.com/apikey');
                $this->line('2. Delete the old key and create a NEW one');
                $this->line('3. Update GEMINI_API_KEY in .env');
                $this->line('4. Run: php artisan config:clear');
            }

            return Command::FAILURE;
        }

        if (! $listResponse->successful()) {
            $this->error('ListModels failed: HTTP '.$listResponse->status());
            $this->error($listResponse->json('error.message') ?? $listResponse->body());

            return Command::FAILURE;
        }

        $generateModels = [];
        foreach ($listResponse->json('models') ?? [] as $m) {
            $methods = $m['supportedGenerationMethods'] ?? [];
            if (in_array('generateContent', $methods, true)) {
                $name = str_replace('models/', '', $m['name'] ?? '');
                $generateModels[] = $name;
            }
        }

        $this->info('Models supporting generateContent ('.count($generateModels).'):');
        foreach (array_slice($generateModels, 0, 12) as $name) {
            $this->line('  - '.$name);
        }
        if (count($generateModels) > 12) {
            $this->line('  ... and '.(count($generateModels) - 12).' more');
        }
        $this->line('');

        $service = new GeminiService();
        $this->info('Smoke test (generateContent via GeminiService)...');

        try {
            $result = $service->generateScenarioFromPrompt(
                'A small fire in a municipal records office',
                'Fire',
                'Basic'
            );
            $this->info('Success!');
            $this->line('Title: '.($result['title'] ?? 'N/A'));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Generation failed:');
            $this->error($e->getMessage());

            return Command::FAILURE;
        }
    }
}
