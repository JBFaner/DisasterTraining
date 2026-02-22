<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Terms and Conditions - Disaster Preparedness Training</title>
    @vite(['resources/css/app.css'])
    <style>
        .terms-container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
        .terms-container h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
        .terms-container h2 { font-size: 1.25rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; }
        .terms-container h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .terms-container p { margin-bottom: 1rem; line-height: 1.6; }
        .terms-container ul { margin-bottom: 1rem; padding-left: 1.5rem; }
        .terms-container li { margin-bottom: 0.5rem; }
        .terms-meta { font-size: 0.875rem; color: #64748b; margin-bottom: 2rem; }
        .terms-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #64748b; }
        .terms-back { display: inline-block; margin-bottom: 1.5rem; color: #0d9488; text-decoration: none; font-size: 0.875rem; }
        .terms-back:hover { text-decoration: underline; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div class="terms-container">
        <a href="{{ url()->previous() ?? url('/') }}" class="terms-back">← Back</a>
        <h1>Terms and Conditions</h1>
        <p class="terms-meta">Disaster Preparedness Training and Simulation System · Last updated: {{ now()->format('F j, Y') }}</p>

        <div class="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing, browsing, or using the Disaster Preparedness Training and Simulation System ("Service"), including the website https://disaster-training.alertaraqc.com and any related subdomains or applications, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms in their entirety, you must not access or use the Service.</p>
            <p>Your use of the Service constitutes your acceptance of these Terms and your agreement to comply with all applicable laws and regulations of the Republic of the Philippines. If you are using the Service on behalf of an organization or government unit, you represent that you have the authority to bind that entity to these Terms.</p>

            <h2>2. Description of the Service</h2>
            <p>The Disaster Preparedness Training and Simulation System is a web-based platform operated by or on behalf of AlertaraQC and local government units ("LGUs") for the purpose of:</p>
            <ul>
                <li>Delivering disaster preparedness and response training modules;</li>
                <li>Managing simulation events and scenario-based exercises;</li>
                <li>Registering and tracking participants in training and simulation activities;</li>
                <li>Recording attendance, lesson completion, and certification status;</li>
                <li>Managing resources, equipment, and barangay profiles;</li>
                <li>Administering user accounts, roles, and permissions for administrators and trainers;</li>
                <li>Facilitating evaluation and reporting of training outcomes;</li>
                <li>Integrating with the AlerTara Centralized Login System (https://login.alertaraqc.com) for single sign-on where applicable.</li>
            </ul>
            <p>The Service is intended for use by LGU administrators, trainers, and registered participants in disaster preparedness programs. Access to certain features is restricted based on user role and permissions.</p>

            <h2>3. User Accounts</h2>
            <h3>3.1 Account Types</h3>
            <p>The Service supports two primary user types:</p>
            <ul>
                <li><strong>Administrators and Trainers (LGU Admin, LGU Trainer):</strong> Authorized personnel who manage training content, simulation events, participants, and system configuration. Admin accounts may require additional verification (e.g., OTP, USB security key) as configured.</li>
                <li><strong>Participants:</strong> Individuals registered to participate in training modules and simulation events. Participant accounts require email verification before full access.</li>
            </ul>
            <h3>3.2 Account Creation and Security</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials, including your password and any USB security key or OTP device associated with your account. You must notify the system administrator immediately of any unauthorized use of your account or any breach of security.</p>
            <p>Account creation may be subject to approval by administrators. You agree to provide accurate, current, and complete information during registration and to update such information as needed.</p>
            <h3>3.3 Centralized Login</h3>
            <p>Where the Service is integrated with the AlerTara Centralized Login System, your access may be authenticated through that system. By using centralized login, you also agree to the terms and policies of that system. The Service Provider is not responsible for the availability or policies of third-party authentication systems.</p>

            <h2>4. User Responsibilities and Prohibited Uses</h2>
            <h3>4.1 Permitted Use</h3>
            <p>You agree to use the Service only for lawful purposes related to disaster preparedness training, simulation, and related administrative functions. You must comply with all applicable laws, regulations, and institutional policies.</p>
            <h3>4.2 Prohibited Conduct</h3>
            <p>You must not:</p>
            <ul>
                <li>Use the Service for any illegal, fraudulent, or unauthorized purpose;</li>
                <li>Attempt to gain unauthorized access to the Service, other user accounts, or any systems or networks connected to the Service;</li>
                <li>Interfere with or disrupt the integrity or performance of the Service;</li>
                <li>Transmit any virus, malware, or other harmful code;</li>
                <li>Scrape, harvest, or collect data from the Service through automated means without prior written consent;</li>
                <li>Impersonate any person or entity or misrepresent your affiliation;</li>
                <li>Share your credentials or allow others to access the Service using your account;</li>
                <li>Use the Service to harass, abuse, or harm others;</li>
                <li>Remove, alter, or obscure any proprietary notices on the Service;</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service except as permitted by law.</li>
            </ul>
            <p>Violation of these provisions may result in immediate suspension or termination of your account and may subject you to legal action.</p>

            <h2>5. Intellectual Property Rights</h2>
            <p>All content, materials, software, design, text, graphics, logos, and other elements of the Service are the property of the Service Provider, AlertaraQC, the relevant LGU, or their licensors and are protected by copyright, trademark, and other intellectual property laws of the Republic of the Philippines and international treaties.</p>
            <p>You are granted a limited, non-exclusive, non-transferable license to access and use the Service for its intended purpose. You may not copy, modify, distribute, sell, or create derivative works from the Service or any part thereof without prior written authorization.</p>

            <h2>6. User-Generated Content</h2>
            <p>Where the Service permits you to submit content (e.g., responses to evaluations, registration information, or other data), you grant the Service Provider and the relevant LGU a non-exclusive, royalty-free, perpetual license to use, store, and process such content for the purposes of operating the Service, administering training programs, and generating reports. You represent that you have the right to submit such content and that it does not infringe the rights of any third party.</p>

            <h2>7. Fees and Billing</h2>
            <p>The Service is currently provided without charge to authorized users for disaster preparedness training purposes. The Service Provider reserves the right to introduce fees for certain features or usage in the future. Any such change will be communicated in advance.</p>

            <h2>8. Privacy Policy Reference</h2>
            <p>Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, store, and protect your personal information. The Privacy Policy is incorporated into these Terms by reference. By using the Service, you consent to the practices described in the Privacy Policy.</p>
            <p>The Service processes personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.</p>

            <h2>9. Service Availability Disclaimer</h2>
            <p>The Service is provided "as is" and "as available." The Service Provider does not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. The Service is designed for disaster preparedness training and simulation. It is not a substitute for professional emergency response or official disaster management procedures.</p>

            <h2>10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law in the Republic of the Philippines, the Service Provider, AlertaraQC, the relevant LGU, and their officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Service. The total aggregate liability shall not exceed the amount you paid (if any) for access in the twelve (12) months preceding the claim, or one thousand Philippine Pesos (PHP 1,000), whichever is greater.</p>

            <h2>11. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless the Service Provider, AlertaraQC, the relevant LGU, and their officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party right.</p>

            <h2>12. Termination and Suspension</h2>
            <p>You may cease using the Service at any time. The Service Provider reserves the right to suspend or terminate your access, with or without notice, for any reason, including violation of these Terms, fraudulent activity, or operational necessity. Upon termination, your right to use the Service ceases immediately.</p>

            <h2>13. Changes to Terms</h2>
            <p>The Service Provider may modify these Terms at any time. Material changes will be communicated by posting the updated Terms on the Service. Your continued use after the effective date constitutes acceptance. If you do not agree, you must stop using the Service.</p>

            <h2>14. Governing Law and Dispute Resolution</h2>
            <p>These Terms shall be governed by the laws of the Republic of the Philippines. Any dispute shall first be attempted to be resolved amicably. If not resolved within thirty (30) days, it shall be submitted to the exclusive jurisdiction of the courts of Quezon City, Philippines.</p>

            <h2>15. General Provisions</h2>
            <p><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement regarding the Service. <strong>Severability:</strong> If any provision is invalid, the remaining provisions continue in effect. <strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver. <strong>Force Majeure:</strong> The Service Provider is not liable for failures due to circumstances beyond its reasonable control.</p>

            <h2>16. Contact Information</h2>
            <p>For questions, complaints, or notices regarding these Terms or the Service, please contact the system administrator or the relevant LGU. For data privacy concerns, contact the Data Protection Officer of the LGU or AlertaraQC.</p>

            <div class="terms-footer">
                <p><strong>By using the Disaster Preparedness Training and Simulation System, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
