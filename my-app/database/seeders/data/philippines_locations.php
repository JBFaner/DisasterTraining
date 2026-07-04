<?php

/**
 * Quezon City–focused location master data.
 * Region: NCR → Province: Metro Manila → City: Quezon City → 142 barangays.
 */
$barangayNames = require __DIR__.'/quezon_city_barangays.php';

$barangays = [];
foreach ($barangayNames as $index => $name) {
    $barangays[] = [
        'city_code' => '137404000',
        'psgc_code' => sprintf('137404%03d', $index + 1),
        'name' => $name,
    ];
}

return [
    'regions' => [
        ['psgc_code' => '130000000', 'name' => 'NCR'],
    ],

    'provinces' => [
        ['region_code' => '130000000', 'psgc_code' => '133900000', 'name' => 'Metro Manila'],
    ],

    'cities' => [
        ['region_code' => '130000000', 'province_code' => '133900000', 'psgc_code' => '137404000', 'name' => 'Quezon City', 'type' => 'city'],
    ],

    'barangays' => $barangays,
];
