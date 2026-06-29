<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkResetTrainingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return portal_user()?->role === 'LGU_ADMIN';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'evaluation_result_ids' => ['required', 'array', 'min:1'],
            'evaluation_result_ids.*' => ['required', 'integer', 'exists:evaluation_results,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
