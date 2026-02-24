<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Audit Logs</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 12px;
            color: #111827;
        }
        h1 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <h1>Audit Logs</h1>
    <p>Generated at {{ now()->format('Y-m-d H:i:s') }}</p>

    <table>
        <thead>
            <tr>
                <th>When</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Status</th>
                <th>IP</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
        @foreach ($logs as $log)
            <tr>
                <td>{{ optional($log->performed_at)->format('Y-m-d H:i:s') }}</td>
                <td>{{ $log->user_name }}</td>
                <td>{{ $log->user_role }}</td>
                <td>{{ $log->action }}</td>
                <td>{{ $log->module }}</td>
                <td>{{ $log->status }}</td>
                <td>{{ $log->ip_address }}</td>
                <td>{{ $log->description }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</body>
</html>

