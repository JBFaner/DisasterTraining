<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Confirm your new email</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 24px;">
        <tr>
            <td>
                <h1 style="font-size: 20px; margin-bottom: 12px; color: #111827;">
                    Confirm your new email address
                </h1>
                <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">
                    Hi {{ $user->name }}, you requested to change the email address associated with your Disaster Preparedness Training &amp; Simulation account.
                </p>
                <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">
                    New email: <strong>{{ $newEmail }}</strong>
                </p>
                <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">
                    To confirm this change, please click the button below:
                </p>
                <p style="text-align: center; margin-bottom: 20px;">
                    <a href="{{ $verifyUrl }}" style="display: inline-block; padding: 10px 18px; background-color: #059669; color: #ffffff; border-radius: 999px; text-decoration: none; font-size: 14px;">
                        Confirm new email
                    </a>
                </p>
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    If you did not request this change, you can ignore this email. Your current email will remain unchanged.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>

