<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class HazardAssessmentDocument extends Model
{
    protected $fillable = [
        'barangay_profile_id',
        'document_type',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function barangayProfile(): BelongsTo
    {
        return $this->belongsTo(BarangayProfile::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function downloadUrl(): string
    {
        return route('admin.hazard-assessment-profiles.documents.download', [
            'barangayProfile' => $this->barangay_profile_id,
            'document' => $this->id,
        ]);
    }

    protected static function booted(): void
    {
        static::deleting(function (HazardAssessmentDocument $document) {
            if ($document->file_path && Storage::disk('local')->exists($document->file_path)) {
                Storage::disk('local')->delete($document->file_path);
            }
        });
    }
}
