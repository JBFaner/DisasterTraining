<?php

namespace App\Http\Requests;

use App\Models\TrainingContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrainingContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $type = $this->input('content_type', $this->route('content')?->content_type);

        return [
            'title' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', Rule::in(TrainingContent::TYPES)],
            'body' => [Rule::requiredIf($type === TrainingContent::TYPE_TEXT), 'nullable', 'string'],
            'external_url' => [
                Rule::requiredIf($type === TrainingContent::TYPE_YOUTUBE),
                'nullable',
                'url',
                'max:2048',
            ],
            'file' => ['nullable', 'file', 'max:51200', 'mimes:pdf,jpg,jpeg,png,gif,webp,mp4,mov,avi'],
            'storage_target' => ['nullable', 'string', 'in:auto,local,cloudinary'],
        ];
    }
}
