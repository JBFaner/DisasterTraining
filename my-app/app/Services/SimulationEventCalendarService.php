<?php

namespace App\Services;

use App\Models\SimulationEvent;
use Carbon\Carbon;

class SimulationEventCalendarService
{
    public function buildIcs(SimulationEvent $event): string
    {
        $start = $this->eventStart($event);
        $end = $this->eventEnd($event, $start);
        $uid = 'simulation-event-'.$event->id.'@'.parse_url(config('app.url'), PHP_URL_HOST);
        $now = now()->utc()->format('Ymd\THis\Z');
        $dtStart = $start->utc()->format('Ymd\THis\Z');
        $dtEnd = $end->utc()->format('Ymd\THis\Z');

        $summary = $this->escapeIcs($event->title);
        $description = $this->escapeIcs(trim(($event->description ?: '')."\n\nDisaster type: ".($event->disaster_type ?: '—')));
        $location = $this->escapeIcs($this->locationLine($event));
        $url = $this->escapeIcs(url('/participant/simulation-events/'.$event->id));

        return implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//LGU Disaster Training//Simulation Events//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:'.$uid,
            'DTSTAMP:'.$now,
            'DTSTART:'.$dtStart,
            'DTEND:'.$dtEnd,
            'SUMMARY:'.$summary,
            'DESCRIPTION:'.$description,
            'LOCATION:'.$location,
            'URL:'.$url,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT24H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Simulation event tomorrow',
            'END:VALARM',
            'BEGIN:VALARM',
            'TRIGGER:-PT1H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Simulation event in 1 hour',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ]);
    }

    private function eventStart(SimulationEvent $event): Carbon
    {
        $date = $event->event_date instanceof Carbon
            ? $event->event_date->copy()
            : Carbon::parse($event->event_date);

        [$hour, $minute] = $this->parseTime($event->start_time);

        return $date->setTime($hour, $minute, 0);
    }

    private function eventEnd(SimulationEvent $event, Carbon $start): Carbon
    {
        if ($event->end_time) {
            [$hour, $minute] = $this->parseTime($event->end_time);
            $end = $start->copy()->setTime($hour, $minute, 0);
            if ($end->greaterThan($start)) {
                return $end;
            }
        }

        return $start->copy()->addHours(2);
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function parseTime(?string $time): array
    {
        if ($time && preg_match('/^(\d{2}):(\d{2})/', $time, $matches)) {
            return [(int) $matches[1], (int) $matches[2]];
        }

        return [9, 0];
    }

    private function locationLine(SimulationEvent $event): string
    {
        $parts = array_filter([
            $event->location,
            $event->building,
            $event->room_zone,
            $event->venue,
        ]);

        return $parts !== [] ? implode(', ', $parts) : 'Location TBD';
    }

    private function escapeIcs(string $value): string
    {
        $value = str_replace('\\', '\\\\', $value);
        $value = str_replace(';', '\;', $value);
        $value = str_replace(',', '\,', $value);
        $value = preg_replace('/\r\n|\r|\n/', '\n', $value) ?? $value;

        return $value;
    }
}
