<?php

namespace App\Http\Requests;

use App\Models\TrainingContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTrainingContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $type = $this->input('content_type');

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
            'file' => [
                Rule::requiredIf(in_array($type, [TrainingContent::TYPE_PDF, TrainingContent::TYPE_VIDEO, TrainingContent::TYPE_IMAGE], true)),
                'nullable',
                'file',
                'max:51200',
                'mimes:pdf,jpg,jpeg,png,gif,webp,mp4,mov,avi',
            ],
            'storage_target' => ['nullable', 'string', 'in:auto,local,cloudinary'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Content title is required.',
            'content_type.required' => 'Content type is required.',
            'body.required' => 'Text content is required for text lessons.',
            'external_url.required' => 'YouTube URL is required for embedded video content.',
            'file.required' => 'A file upload is required for this content type.',
        ];
    }
}
