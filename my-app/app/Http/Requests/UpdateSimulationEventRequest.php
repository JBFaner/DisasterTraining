<?php

namespace App\Http\Requests;

class UpdateSimulationEventRequest extends StoreSimulationEventRequest
{
    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'disaster_type' => ['sometimes', 'required', 'string', 'max:255'],
            'event_category' => ['sometimes', 'required', 'string', 'max:255'],
            'event_date' => ['sometimes', 'required', 'date'],
            'start_time' => ['sometimes', 'required'],
            'end_time' => ['sometimes', 'required'],
        ]);
    }
}
