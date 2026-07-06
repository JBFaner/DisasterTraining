<?php

namespace Tests\Unit;

use App\Support\MaskedEmail;
use PHPUnit\Framework\TestCase;

class MaskedEmailTest extends TestCase
{
    public function test_masks_short_local_part(): void
    {
        $this->assertSame('bro***@gmail.com', MaskedEmail::mask('bro@gmail.com'));
    }

    public function test_masks_longer_local_part(): void
    {
        $this->assertSame('reym******@outlook.com', MaskedEmail::mask('reymarquez@outlook.com'));
    }

    public function test_returns_empty_string_for_null(): void
    {
        $this->assertSame('', MaskedEmail::mask(null));
    }
}
