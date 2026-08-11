<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (App\Models\HazardAssessmentDocument::query()->orderBy('id')->get() as $d) {
    $exists = Illuminate\Support\Facades\Storage::disk('local')->exists($d->file_path) ? 'yes' : 'no';
    echo $d->original_filename.' | '.$d->mime_type.' | '.$d->file_size.' | exists='.$exists.PHP_EOL;
}
