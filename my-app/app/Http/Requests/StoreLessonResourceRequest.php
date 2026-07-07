<?php

namespace App\Http\Requests;

use App\Models\LessonResource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLessonResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $type = $this->input('resource_type');

        return [
            'title' => ['required', 'string', 'max:255'],
            'resource_type' => ['required', 'string', Rule::in(LessonResource::ADMIN_TYPES)],
            'body' => [Rule::requiredIf($type === LessonResource::TYPE_TEXT), 'nullable', 'string'],
            'external_url' => [
                Rule::requiredIf($type === LessonResource::TYPE_YOUTUBE),
                'nullable',
                'url',
                'max:2048',
            ],
            'file' => [
                Rule::requiredIf(in_array($type, [LessonResource::TYPE_PDF, LessonResource::TYPE_IMAGE], true)),
                'nullable',
                'file',
                'max:51200',
                'mimes:pdf,jpg,jpeg,png,gif,webp',
            ],
            'storage_target' => ['nullable', 'string', 'in:auto,local,cloudinary'],
        ];
    }
}
