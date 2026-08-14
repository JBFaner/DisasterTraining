<?php

/**
 * Capstone pilot site — Barangay San Agustin, Novaliches, Quezon City.
 * Hall address and landline/mobile from Quezon City barangay directory.
 */
return [

    'barangay_name' => 'Barangay San Agustin',
    'district' => 'Novaliches, Quezon City',
    'postal_code' => '1123',

    'contact' => [
        // Pilot / LGU contact (override via PILOT_CONTACT_EMAIL in .env)
        'email' => env('PILOT_CONTACT_EMAIL', 'disaster.preparedness@lgu.gov.ph'),
        'phone_landline' => '(02) 8287-6248',
        'phone_landline_alt' => '(02) 8936-1295',
        'phone_mobile' => '0919-064-7974',
        'office_hours' => 'Mon–Fri, 8:00 AM – 5:00 PM',
        'address_line1' => 'Barangay Hall, Patnubay St. cor. Katarungan St.',
        'address_line2' => 'St. Francis/Blueville Subd., San Agustin, Novaliches',
        'address_full' => 'Barangay Hall, Patnubay St. cor. Katarungan St., St. Francis/Blueville Subd., Barangay San Agustin, Novaliches, Quezon City 1123',
        'maps_query' => 'Barangay San Agustin Hall, Patnubay Street, Novaliches, Quezon City',
    ],

];
