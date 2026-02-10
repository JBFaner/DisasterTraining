<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">
                                LGU Disaster Preparedness Admin Login
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                            <p style="margin: 0 0 8px 0;">Hello {{ $name }},</p>
                            <p style="margin: 0 0 12px 0;">
                                A login attempt was made to the LGU Disaster Preparedness Admin Dashboard using your account.
                            </p>
                            <p style="margin: 0 0 12px 0;">
                                To continue, please enter the following verification code on the login screen:
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; text-align: center;">
                            <div style="display: inline-block; padding: 12px 24px; border-radius: 9999px; background-color: #0f766e; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.3em;">
                                {{ $otp }}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">
                            <p style="margin: 0 0 8px 0;">
                                This code will expire in 10 minutes. If you did not attempt to log in, you can safely ignore this email.
                            </p>
                            <p style="margin: 0;">
                                For your security, do not share this code with anyone.
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

