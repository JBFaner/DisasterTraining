<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTrainingModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'learning_objectives' => ['required', 'array', 'min:1'],
            'learning_objectives.*' => ['required', 'string', 'max:500'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'],
            'difficulty' => ['nullable', 'string', 'in:Beginner,Intermediate,Advanced'],
            'category' => ['required', 'string', 'max:255'],
            'related_hazard' => ['nullable', 'string', 'max:255'],
            'delivery_method' => ['nullable', 'string', 'in:in_person,online'],
            'target_audience' => ['nullable', 'array'],
            'target_audience.*' => ['required', 'string', 'in:residents,barangay_officials,emergency_responders,volunteers,students,employees,community_leaders,others'],
            'recommended_audience' => ['nullable', 'string', 'max:1000'],
            'lead_qualified_trainer_id' => ['nullable', 'integer', 'exists:qualified_trainers,id'],
            'assigned_qualified_trainer_ids' => ['nullable', 'array'],
            'assigned_qualified_trainer_ids.*' => ['required', 'integer', 'distinct', 'exists:qualified_trainers,id'],
            'available_training_sessions' => ['nullable', 'array'],
            'available_training_sessions.*.title' => ['nullable', 'string', 'max:255'],
            'available_training_sessions.*.date' => ['required', 'date'],
            'available_training_sessions.*.start_time' => ['required', 'date_format:H:i'],
            'available_training_sessions.*.end_time' => ['required', 'date_format:H:i'],
            'available_training_sessions.*.delivery_method' => ['required', 'string', 'in:in_person,online'],
            'available_training_sessions.*.venue' => ['nullable', 'string', 'max:255'],
            'available_training_sessions.*.online_platform' => ['nullable', 'string', 'max:100'],
            'available_training_sessions.*.meeting_link' => ['nullable', 'url', 'max:500'],
            'available_training_sessions.*.maximum_participants' => ['required', 'integer', 'min:1', 'max:500'],
            'visibility' => ['required', 'string', 'in:all,group,staff_only'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Module title is required.',
            'category.required' => 'Disaster category is required.',
            'learning_objectives.required' => 'At least one learning objective is required.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateTimeRanges($validator, 'available_training_sessions', 'session');
            $this->validateSessionDeliveryFields($validator, 'available_training_sessions');
        });
    }

    private function validateTimeRanges(Validator $validator, string $field, string $label): void
    {
        foreach ((array) $this->input($field, []) as $index => $entry) {
            $start = $entry['start_time'] ?? null;
            $end = $entry['end_time'] ?? null;

            if (! $start || ! $end) {
                continue;
            }

            if (strtotime($end) <= strtotime($start)) {
                $validator->errors()->add("{$field}.{$index}.end_time", ucfirst($label).' end time must be after the start time.');
            }
        }
    }

    private function validateSessionDeliveryFields(Validator $validator, string $field): void
    {
        foreach ((array) $this->input($field, []) as $index => $entry) {
            $method = (string) ($entry['delivery_method'] ?? '');
            if ($method === 'in_person' && trim((string) ($entry['venue'] ?? '')) === '') {
                $validator->errors()->add("{$field}.{$index}.venue", 'Venue is required for face-to-face sessions.');
            }
            if ($method === 'online') {
                if (trim((string) ($entry['online_platform'] ?? '')) === '') {
                    $validator->errors()->add("{$field}.{$index}.online_platform", 'Platform is required for online sessions.');
                }
                if (trim((string) ($entry['meeting_link'] ?? '')) === '') {
                    $validator->errors()->add("{$field}.{$index}.meeting_link", 'Meeting link is required for online sessions.');
                }
            }
        }
    }
}
