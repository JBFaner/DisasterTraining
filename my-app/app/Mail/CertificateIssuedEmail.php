<?php

namespace App\Mail;

use App\Models\Certificate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CertificateIssuedEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Certificate $certificate,
        public User $participant,
    ) {}

    public function envelope(): Envelope
    {
        $program = $this->certificate->training_type
            ?? $this->certificate->simulationEvent?->title
            ?? $this->certificate->trainingModule?->title
            ?? 'Disaster Preparedness Training';

        return new Envelope(
            subject: 'Your Certificate — '.$program,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.certificate-issued',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
