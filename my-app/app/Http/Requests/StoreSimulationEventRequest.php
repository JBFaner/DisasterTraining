<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSimulationEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return portal_user() && in_array(portal_user()->role, ['LGU_ADMIN', 'LGU_TRAINER'], true);
    }

    public function rules(): array
    {
        return $this->baseRules();
    }

    /**
     * @return array<string, mixed>
     */
    protected function baseRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'disaster_type' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_category' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required'],
            'end_time' => ['required'],
            'venue' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'training_module_id' => ['nullable', 'exists:training_modules,id'],
            'barangay_profile_id' => ['nullable', 'exists:barangay_profiles,id'],
            'assigned_trainer_id' => ['nullable', 'exists:qualified_trainers,id'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
            'registration_deadline' => ['nullable', 'date'],
            'scenario_id' => ['nullable', 'exists:scenarios,id'],
            'self_registration_enabled' => ['nullable', 'boolean'],
            'approval_required' => ['nullable', 'boolean'],
            'qr_code_enabled' => ['nullable', 'boolean'],
        ];
    }
}
