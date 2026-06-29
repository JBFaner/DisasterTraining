<?php

use App\Models\User;
use App\Support\PortalAuth;

if (! function_exists('portal_user')) {
    function portal_user(): ?User
    {
        return PortalAuth::user();
    }
}

if (! function_exists('portal_id')) {
    function portal_id(): ?int
    {
        return PortalAuth::id();
    }
}

if (! function_exists('portal_check')) {
    function portal_check(): bool
    {
        return PortalAuth::check();
    }
}
