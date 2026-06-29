<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveQuizAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return portal_check() && portal_user()?->role === 'PARTICIPANT';
    }

    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'min:1'],
            'selected_answer' => ['required', 'string', 'size:1', 'in:A,B,C,D,a,b,c,d'],
            'current_question' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
