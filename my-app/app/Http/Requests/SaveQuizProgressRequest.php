<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveQuizProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) \App\Support\PortalAuth::participantUser();
    }

    public function rules(): array
    {
        return [
            'current_question' => ['required', 'integer', 'min:1'],
        ];
    }
}
