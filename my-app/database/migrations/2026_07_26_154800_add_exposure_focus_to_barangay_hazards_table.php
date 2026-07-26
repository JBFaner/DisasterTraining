<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('barangay_hazards')) {
            return;
        }

        Schema::table('barangay_hazards', function (Blueprint $table) {
            if (! Schema::hasColumn('barangay_hazards', 'exposure_scope')) {
                $table->string('exposure_scope')->nullable()->after('description');
            }
            if (! Schema::hasColumn('barangay_hazards', 'focus_area')) {
                $table->text('focus_area')->nullable()->after('exposure_scope');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('barangay_hazards')) {
            return;
        }

        Schema::table('barangay_hazards', function (Blueprint $table) {
            $columns = collect(['exposure_scope', 'focus_area'])
                ->filter(fn (string $col) => Schema::hasColumn('barangay_hazards', $col))
                ->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
