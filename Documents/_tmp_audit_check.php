<?php
require '/var/www/html/disaster_training_alertaraqc/my-app/vendor/autoload.php';
$app = require '/var/www/html/disaster_training_alertaraqc/my-app/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AuditLog;
use Illuminate\Support\Facades\Schema;

echo 'table='.(Schema::hasTable('audit_logs') ? 'yes' : 'no').PHP_EOL;
echo 'count='.AuditLog::count().PHP_EOL;
echo 'last24h='.AuditLog::where('performed_at', '>=', now()->subDay())->count().PHP_EOL;
echo 'modules='.json_encode(AuditLog::query()->selectRaw('module, count(*) c')->groupBy('module')->orderByDesc('c')->pluck('c', 'module')).PHP_EOL;
foreach (AuditLog::orderByDesc('id')->limit(8)->get(['id', 'action', 'module', 'status', 'user_name', 'performed_at']) as $row) {
    echo json_encode($row).PHP_EOL;
}
