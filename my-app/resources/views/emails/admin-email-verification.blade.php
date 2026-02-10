<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify Your LGU Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">
                                LGU Disaster Preparedness Account Verification
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                            <p style="margin: 0 0 8px 0;">Hello {{ $admin->name }},</p>
                            <p style="margin: 0 0 12px 0;">
                                You have been registered as an {{ $admin->role === 'LGU_TRAINER' ? 'LGU Trainer' : 'LGU Admin' }} for the Disaster Preparedness Training &amp; Simulation System.
                            </p>
                            <p style="margin: 0 0 12px 0;">
                                To activate your account and be able to log in, please confirm your email address by clicking the button below:
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; text-align: center;">
                            <a href="{{ $verificationUrl }}" style="display: inline-block; padding: 10px 24px; border-radius: 9999px; background-color: #0f766e; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                                Verify LGU Account Email
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">
                            <p style="margin: 0 0 8px 0;">
                                This link will expire in 60 minutes for security reasons. If it expires, please contact your LGU system administrator to resend the verification.
                            </p>
                            <p style="margin: 0;">
                                If you did not expect this email, you can safely ignore it.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
                            LGU Disaster Preparedness Training &amp; Simulation System
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

