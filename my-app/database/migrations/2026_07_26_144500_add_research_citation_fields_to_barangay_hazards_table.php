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
            if (! Schema::hasColumn('barangay_hazards', 'reference_title')) {
                $table->string('reference_title')->nullable()->after('source_reference_number');
            }
            if (! Schema::hasColumn('barangay_hazards', 'reference_year')) {
                $table->unsignedSmallInteger('reference_year')->nullable()->after('reference_title');
            }
            if (! Schema::hasColumn('barangay_hazards', 'reference_url')) {
                $table->string('reference_url')->nullable()->after('reference_year');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('barangay_hazards')) {
            return;
        }

        Schema::table('barangay_hazards', function (Blueprint $table) {
            $columns = collect(['reference_title', 'reference_year', 'reference_url'])
                ->filter(fn (string $col) => Schema::hasColumn('barangay_hazards', $col))
                ->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
