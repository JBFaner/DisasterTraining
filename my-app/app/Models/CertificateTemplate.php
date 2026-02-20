<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'type',
        'title_text',
        'template_content',
        'logo_path',
        'signature_path',
        'background_path',
        'background_opacity',
        'certificate_number_format',
        'font_style',
        'last_used_at',
        'status',
        'paper_size', // 'a4' | 'letter' for print layout
    ];

    /** Placeholders the system will replace when generating a certificate. */
    public static function placeholders(): array
    {
        return ['name', 'date', 'event', 'certificate_number', 'score', 'training_type', 'background_image'];
    }

    /**
     * Merge placeholder values into template content.
     * Template content can contain {name}, {date}, {event}, {certificate_number}, {score}, {training_type}, {background_image}.
     */
    public function mergeContent(array $data): string
    {
        $content = $this->template_content ?? $this->defaultTemplateContent();
        if (!isset($data['background_image']) && $this->background_path) {
            $data['background_image'] = \Illuminate\Support\Facades\Storage::disk('public')->url($this->background_path);
        }
        foreach (self::placeholders() as $key) {
            $content = str_replace('{' . $key . '}', (string) ($data[$key] ?? ''), $content);
        }
        return $content;
    }

    public function defaultTemplateContent(): string
    {
        return '<div class="certificate" style="font-family:serif; max-width:800px; margin:0 auto; padding:40px; border:2px solid #16a34a; text-align:center;">'
            . '<h1 style="color:#16a34a;">Certificate of Completion</h1>'
            . '<p style="font-size:18px; margin-top:30px;">This is to certify that</p>'
            . '<p style="font-size:24px; font-weight:bold; margin:15px 0;">{name}</p>'
            . '<p style="font-size:16px;">has successfully completed</p>'
            . '<p style="font-size:18px; font-weight:bold;">{training_type}</p>'
            . '<p style="font-size:14px; margin-top:20px;">Event: {event} &nbsp;|&nbsp; Date: {date}</p>'
            . '<p style="font-size:14px;">Certificate No: {certificate_number} &nbsp;|&nbsp; Score: {score}%</p>'
            . '</div>';
    }

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function certificates()
    {
        return $this->hasMany(Certificate::class, 'certificate_template_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
