<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use Illuminate\Database\Seeder;

/**
 * Creates / refreshes Fire, Flood, and Earthquake certificate templates.
 */
class HazardCertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Fire Safety Completion Certificate',
                'hazard_category' => 'Fire',
                'type' => 'completion',
                'title_text' => 'Certificate of Completion — Fire Safety',
                'accent' => '#dc2626',
                'course' => 'Fire Safety and Emergency Response Training',
            ],
            [
                'name' => 'Flood Preparedness Completion Certificate',
                'hazard_category' => 'Flood',
                'type' => 'completion',
                'title_text' => 'Certificate of Completion — Flood Preparedness',
                'accent' => '#2563eb',
                'course' => 'Flood Preparedness and Early Warning Training',
            ],
            [
                'name' => 'Earthquake Drill Completion Certificate',
                'hazard_category' => 'Earthquake',
                'type' => 'completion',
                'title_text' => 'Certificate of Completion — Earthquake Preparedness',
                'accent' => '#b45309',
                'course' => 'Earthquake Drill and Evacuation Training',
            ],
        ];

        foreach ($templates as $row) {
            $html = $this->buildHtml($row['accent'], $row['title_text'], $row['course']);

            CertificateTemplate::updateOrCreate(
                [
                    'name' => $row['name'],
                ],
                [
                    'type' => $row['type'],
                    'hazard_category' => $row['hazard_category'],
                    'title_text' => $row['title_text'],
                    'template_content' => $html,
                    'certificate_number_format' => 'CERT-{YEAR}-{SEQ}',
                    'status' => 'active',
                    'paper_size' => 'a4',
                ]
            );
        }

        $this->command?->info('Hazard certificate templates ready: Fire, Flood, Earthquake.');
    }

    private function buildHtml(string $accent, string $title, string $defaultCourse): string
    {
        return <<<HTML
<div class="certificate" style="font-family:Georgia, 'Times New Roman', serif; max-width:900px; margin:0 auto; padding:48px 56px; border:3px solid {$accent}; background:#fffaf5; text-align:center; position:relative;">
  <div style="border:1px solid {$accent}; padding:28px 32px;">
    <p style="margin:0; letter-spacing:0.28em; text-transform:uppercase; font-size:11px; color:{$accent}; font-weight:700;">LGU Disaster Preparedness Training &amp; Simulation</p>
    <h1 style="margin:18px 0 8px; color:{$accent}; font-size:30px; font-weight:700;">{$title}</h1>
    <p style="margin:0; font-size:15px; color:#475569;">This is to certify that</p>
    <p style="margin:16px 0; font-size:28px; font-weight:700; color:#0f172a;">{name}</p>
    <p style="margin:0; font-size:15px; color:#475569;">has successfully completed</p>
    <p style="margin:12px 0 4px; font-size:18px; font-weight:700; color:#1e293b;">{training_type}</p>
    <p style="margin:0; font-size:13px; color:#64748b; font-style:italic;">(Default course: {$defaultCourse})</p>
    <p style="margin:28px 0 0; font-size:14px; color:#334155;">Event: {event} &nbsp;|&nbsp; Date: {date}</p>
    <p style="margin:8px 0 0; font-size:14px; color:#334155;">Certificate No: {certificate_number} &nbsp;|&nbsp; Score: {score}%</p>
    <p style="margin:36px 0 0; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:{$accent};">Awarded for demonstrated readiness and safe response skills</p>
  </div>
</div>
HTML;
    }
}
