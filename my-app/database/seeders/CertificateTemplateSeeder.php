<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use App\Models\CertificationSetting;
use Illuminate\Database\Seeder;

class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        if (CertificateTemplate::count() > 0) {
            return;
        }
        CertificateTemplate::create([
            'name' => 'Default Completion Certificate',
            'type' => 'completion',
            'title_text' => 'Certificate of Completion',
            'certificate_number_format' => 'CERT-{YEAR}-{SEQ}',
            'status' => 'active',
        ]);
        CertificateTemplate::create([
            'name' => 'Default Participation Certificate',
            'type' => 'participation',
            'title_text' => 'Certificate of Participation',
            'certificate_number_format' => 'CERT-{YEAR}-{SEQ}',
            'status' => 'active',
        ]);

        CertificationSetting::set('auto_issue_when_passed', '0');
        CertificationSetting::set('require_attendance', '1');
        CertificationSetting::set('require_supervisor_approval', '0');
    }
}
