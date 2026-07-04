<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = (string) config("database.connections.{$connection}.database");

        if ($connection === 'mysql' && $database === 'disaster_training') {
            $this->fail(
                'Refusing to run tests against the development database "disaster_training". '
                .'Use sqlite :memory: (see phpunit.xml) or a dedicated test database.'
            );
        }
    }
}
