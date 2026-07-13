<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('simulation_exercise_personnel_assignments');

        Schema::create('simulation_exercise_personnel_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->string('role');
            $table->string('source_group');
            $table->unsignedBigInteger('qualified_trainer_id')->nullable();
            $table->string('person_name');
            $table->string('person_external_id')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('template_id', 'sim_ex_pers_assign_tpl_fk')
                ->references('id')
                ->on('simulation_exercise_templates')
                ->cascadeOnDelete();

            $table->foreign('qualified_trainer_id', 'sim_ex_pers_assign_trainer_fk')
                ->references('id')
                ->on('qualified_trainers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_exercise_personnel_assignments');
    }
};
