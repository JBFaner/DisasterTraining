<?php

return [

    'hazard_types' => [
        'Flood',
        'Fire',
        'Earthquake',
        'Landslide',
        'Typhoon',
        'Storm Surge',
        'Tsunami',
        'Volcanic Eruption',
        'Tornado',
        'Liquefaction',
        'Others',
    ],

    'hazard_colors' => [
        'Flood' => 'blue',
        'Fire' => 'orange',
        'Earthquake' => 'amber',
        'Landslide' => 'stone',
        'Typhoon' => 'sky',
        'Storm Surge' => 'cyan',
        'Tsunami' => 'indigo',
        'Volcanic Eruption' => 'rose',
        'Tornado' => 'violet',
        'Liquefaction' => 'slate',
        'Others' => 'gray',
    ],

    'risk_levels' => [
        'Low',
        'Moderate',
        'High',
        'Very High',
    ],

    'risk_level_scores' => [
        'Low' => 25,
        'Moderate' => 50,
        'High' => 75,
        'Very High' => 95,
    ],

    'source_agencies' => [
        'PHIVOLCS',
        'PAGASA',
        'DENR-MGB',
        'MDRRMO',
        'CDRRMO',
        'DOST',
        'OCD',
        'BFP',
        'NDRRMC',
        'GeoRiskPH',
        'Other',
    ],

    'source_agency_labels' => [
        'PHIVOLCS' => 'PHIVOLCS',
        'PAGASA' => 'PAGASA',
        'DENR-MGB' => 'DENR-MGB',
        'MDRRMO' => 'MDRRMO',
        'CDRRMO' => 'CDRRMO',
        'DOST' => 'DOST',
        'DOST-PHIVOLCS' => 'DOST-PHIVOLCS',
        'OCD' => 'Office of Civil Defense (OCD)',
        'BFP' => 'Bureau of Fire Protection (BFP)',
        'NDRRMC' => 'NDRRMC',
        'GeoRiskPH' => 'GeoRiskPH',
        'Other' => 'Other Source',
    ],

    'document_types' => [
        'Hazard Assessment Report',
        'Flood Hazard Map',
        'Fire Risk Assessment',
        'Evacuation Map',
        'Disaster Risk Reduction Report',
        'Other',
    ],

    'training_recommendations' => [
        'Flood' => ['Flood Preparedness and Early Warning', 'Flood Preparedness and Evacuation'],
        'Fire' => ['Basic Fire Safety and Evacuation', 'Fire Safety and Emergency Response'],
        'Earthquake' => ['Earthquake Drill and Evacuation', 'Earthquake Preparedness', 'Search and Rescue Awareness'],
        'Landslide' => ['Landslide Preparedness', 'Flood Preparedness and Early Warning'],
        'Typhoon' => ['Typhoon Preparedness', 'Flood Preparedness and Early Warning'],
        'Storm Surge' => ['Coastal Evacuation and Storm Surge Preparedness', 'Typhoon Preparedness'],
        'Tsunami' => ['Tsunami Evacuation', 'Coastal Evacuation and Storm Surge Preparedness'],
        'Volcanic Eruption' => ['Volcanic Hazard Preparedness', 'Evacuation and Ashfall Response'],
        'Tornado' => ['Severe Weather Response', 'Emergency Shelter Management'],
        'Liquefaction' => ['Earthquake Preparedness', 'Geohazard Awareness'],
        'Others' => ['Disaster Risk Reduction'],
    ],

    'scenario_suggestions' => [
        'Flood' => 'Flash flood evacuation drill in low-lying barangay zones',
        'Fire' => 'Residential fire response and building evacuation exercise',
        'Earthquake' => 'Earthquake drill with structural damage assessment',
        'Landslide' => 'Rain-triggered landslide early warning and evacuation',
        'Typhoon' => 'Pre-typhoon community preparedness and shelter activation',
        'Storm Surge' => 'Coastal storm surge evacuation to designated high ground',
        'Tsunami' => 'Tsunami warning siren response and inland evacuation',
        'Volcanic Eruption' => 'Volcanic ashfall response and phased evacuation drill',
        'Tornado' => 'Severe wind event shelter-in-place and damage assessment',
        'Liquefaction' => 'Post-earthquake liquefaction zone assessment and evacuation',
        'Others' => 'Multi-hazard community disaster response tabletop exercise',
    ],

    'equipment_suggestions' => [
        'Flood' => ['Rescue boats', 'Life vests', 'Flood barriers', 'Water pumps', 'Rescue ropes'],
        'Fire' => ['Fire extinguishers', 'Fire hoses', 'Breathing apparatus', 'Thermal blankets', 'Fire axes'],
        'Earthquake' => ['Search and rescue kits', 'Shoring equipment', 'First aid kits', 'Crowbars', 'Helmets'],
        'Landslide' => ['Geotextiles', 'Early warning sirens', 'Shovels', 'Rescue ropes', 'Rain gauges'],
        'Typhoon' => ['Emergency shelter kits', 'Sandbags', 'Generators', 'Tarps', 'Radio equipment'],
        'Storm Surge' => ['Evacuation vehicles', 'Life vests', 'Rescue boats', 'Megaphones', 'GPS units'],
        'Tsunami' => ['Warning sirens', 'Evacuation route signage', 'Life vests', 'Rescue boats', 'Two-way radios'],
        'Volcanic Eruption' => ['N95 masks', 'Goggles', 'Ash cleanup tools', 'Evacuation buses', 'Water tanks'],
        'Tornado' => ['Emergency shelter supplies', 'First aid kits', 'Chainsaws', 'Tarps', 'Two-way radios'],
        'Liquefaction' => ['Soil testing kits', 'Survey equipment', 'Evacuation markers', 'First aid kits', 'Helmets'],
        'Others' => ['Multi-purpose emergency kits', 'Two-way radios', 'First aid supplies'],
    ],

    'participant_suggestions' => [
        'default' => ['Barangay officials', 'Barangay tanod', 'Youth volunteers', 'Senior citizens representatives'],
        'Flood' => ['Flood response teams', 'Evacuation marshals', 'Vulnerable household representatives'],
        'Fire' => ['BFP auxiliaries', 'Building administrators', 'Neighborhood watch'],
        'Earthquake' => ['Search and rescue volunteers', 'Medical first responders', 'Engineering assessors'],
    ],

    'api' => [
        'enabled' => env('HAZARD_ASSESSMENT_API_ENABLED', false),
        'base_url' => rtrim((string) env('HAZARD_ASSESSMENT_API_BASE_URL', ''), '/'),
        'key' => env('HAZARD_ASSESSMENT_API_KEY'),
        'timeout' => (int) env('HAZARD_ASSESSMENT_API_TIMEOUT', 30),
    ],

];
