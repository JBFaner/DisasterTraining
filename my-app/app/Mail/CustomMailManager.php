<?php

namespace App\Mail;

use Illuminate\Mail\MailManager;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;

class CustomMailManager extends MailManager
{
    protected function configureSmtpTransport(EsmtpTransport $transport, array $config)
    {
        parent::configureSmtpTransport($transport, $config);

        $stream = $transport->getStream();

        if (! $stream instanceof SocketStream) {
            return $transport;
        }

        $options = $stream->getStreamOptions();
        $cafile = $config['cafile'] ?? storage_path('certs/cacert.pem');

        if (is_file($cafile)) {
            $options['ssl']['cafile'] = $cafile;
        }

        $stream->setStreamOptions($options);

        return $transport;
    }
}
