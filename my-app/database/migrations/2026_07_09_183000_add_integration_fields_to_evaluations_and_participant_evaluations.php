<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('evaluations')) {
            Schema::table('evaluations', function (Blueprint $table) {
                if (! Schema::hasColumn('evaluations', 'group6_outbound_payload')) {
                    $table->json('group6_outbound_payload')->nullable()->after('overall_notes');
                }

                if (! Schema::hasColumn('evaluations', 'group6_payload_prepared_at')) {
                    $table->timestamp('group6_payload_prepared_at')->nullable()->after('group6_outbound_payload');
                }
            });
        }

        if (Schema::hasTable('participant_evaluations')) {
            Schema::table('participant_evaluations', function (Blueprint $table) {
                if (! Schema::hasColumn('participant_evaluations', 'attendance_status')) {
                    $table->string('attendance_status', 32)->nullable()->after('attendance_id');
                }

                if (! Schema::hasColumn('participant_evaluations', 'competency_rating')) {
                    $table->string('competency_rating', 32)->nullable()->after('result');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('participant_evaluations')) {
            Schema::table('participant_evaluations', function (Blueprint $table) {
                $dropColumns = [];
                foreach (['attendance_status', 'competency_rating'] as $column) {
                    if (Schema::hasColumn('participant_evaluations', $column)) {
                        $dropColumns[] = $column;
                    }
                }

                if ($dropColumns !== []) {
                    $table->dropColumn($dropColumns);
                }
            });
        }

        if (Schema::hasTable('evaluations')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $dropColumns = [];
                foreach (['group6_outbound_payload', 'group6_payload_prepared_at'] as $column) {
                    if (Schema::hasColumn('evaluations', $column)) {
                        $dropColumns[] = $column;
                    }
                }

                if ($dropColumns !== []) {
                    $table->dropColumn($dropColumns);
                }
            });
        }
    }
};
