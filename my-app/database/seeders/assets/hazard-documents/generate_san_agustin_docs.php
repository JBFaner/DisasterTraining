<?php

/**
 * Generate capstone supporting Word documents for Barangay San Agustin.
 * Run: php database/seeders/assets/hazard-documents/generate_san_agustin_docs.php
 */

require __DIR__.'/../../../../vendor/autoload.php';

use Database\Seeders\Support\SimpleDocxBuilder;

$outDir = __DIR__;

// ---------------------------------------------------------------------------
// 1) Flood Hazard Map / QCDMP coverage summary
// ---------------------------------------------------------------------------
$flood = new SimpleDocxBuilder();
$flood
    ->title('Flood Hazard Coverage Summary')
    ->subtitle('Barangay San Agustin, Novaliches, Quezon City')
    ->meta('Document type: Flood Hazard Map (supporting reference pack)')
    ->meta('Prepared for: Capstone Disaster Preparedness Training & Simulation Platform')
    ->meta('Version: 2025.1 | Classification: Academic / Training Use')
    ->heading('1. Purpose of this Document')
    ->para('This document consolidates publicly available Quezon City drainage and flood-assessment references relevant to Barangay San Agustin (District 5 / Novaliches). It is intended to support simulation exercise design, early-warning drills, and oral defense of the barangay hazard profile used in the training platform. Findings summarized here are for education and preparedness planning; operational decisions must still verify the latest official maps and LGU advisories.')
    ->heading('2. Study Area')
    ->bullet('Barangay: San Agustin')
    ->bullet('City / LGU: Quezon City, National Capital Region')
    ->bullet('General setting: Urban residential barangay within the Novaliches catchment area')
    ->bullet('Estimated population (profile baseline): ~22,000 residents / ~4,800 households')
    ->bullet('Dominant exposure pathway: street flooding, prolonged ponding, and drainage congestion during intense rainfall and typhoon-enhanced monsoon events')
    ->heading('3. Primary Hazard Finding — Flood (High)')
    ->para('Barangay San Agustin is included among localities covered by the Quezon City Drainage Master Plan (QCDMP) Phase I and II assessment materials. Public portal listings associated with the Drainage Master Plan identify San Agustin with “ALL STREETS” among assessed / field-validated flood-prone coverage areas. This supports treating flood as the primary hazard for readiness exercises in the barangay.')
    ->para('Observed / expected flood mechanisms in dense Novaliches residential blocks include: (a) rainfall intensity exceeding roadside and secondary drainage capacity; (b) temporary blockage of inlets by debris; (c) backflow / overflow from local drainage channels and tributaries; and (d) compounded ponding when tropical cyclone rainfall coincides with high antecedent soil / pavement wetness.')
    ->heading('4. Implications for Training and Simulation')
    ->bullet('Prioritize flood evacuation and early-warning communication drills for low-lying / drainage-constrained streets.')
    ->bullet('Pre-position scenarios for blocked drainage, assisted evacuation of vulnerable households, and traffic / access interruption.')
    ->bullet('Integrate typhoon rainfall context (PAGASA advisories) as a trigger that escalates flood operations from monitoring to evacuation.')
    ->bullet('Use barangay assembly points and vertical/horizontal evacuation routes that remain accessible during moderate street flooding.')
    ->heading('5. Recommended Exercise Injects (examples)')
    ->bullet('T0: Heavy rainfall advisory issued for NCR; barangay activates monitoring cells.')
    ->bullet('T+30 min: Ponding reported on multiple residential streets; drainage teams deployed.')
    ->bullet('T+90 min: Evacuation assistance requested for households with PWDs / elderly in ponding hotspots.')
    ->bullet('T+3 hrs: Access lane partially impassable; alternate route and shelter capacity check.')
    ->heading('6. Limitations and Defense Notes')
    ->para('This pack summarizes publicly linked QC materials and academic/local governance literature for demo and defense. It is not a substitute for cadastral flood maps, LiDAR-derived flood depths, or real-time QCDRRMO / barangay flood monitors. During defense, clarify that the platform uses San Agustin as a grounded case study community and that live operations must follow official LGU/PAGASA products.')
    ->heading('7. References')
    ->para('Quezon City Government. (n.d.). Quezon City Drainage Master Plan (Final Report, Phase I and II) / QC Profile portal. https://quezoncity.gov.ph/qc-profile/drainage-master-plan/')
    ->para('Quezon City Government. Areas Covered in Phases I and II (Drainage Master Plan related listing). San Agustin appears among assessed localities (all streets noted in coverage materials).')
    ->para('Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA). (n.d.). Tropical cyclone and monsoon rainfall products for NCR. https://www.pagasa.dost.gov.ph/')
    ->para('Republic Act No. 10121. (2010). Philippine Disaster Risk Reduction and Management Act of 2010.')
    ->para('National Disaster Risk Reduction and Management Council (NDRRMC). National Disaster Risk Reduction and Management Plan (NDRRMP) frameworks for prevention, preparedness, response, and rehabilitation.')
    ->para('Office of Civil Defense (OCD). Community-based disaster risk reduction and management guidance materials for LGUs and barangays.')
    ->meta('End of document — Flood Hazard Coverage Summary (San Agustin, QC)');
$flood->save($outDir.'/san-agustin-qcdmp-flood-coverage-summary.docx');

// ---------------------------------------------------------------------------
// 2) Multi-hazard assessment report
// ---------------------------------------------------------------------------
$report = new SimpleDocxBuilder();
$report
    ->title('Barangay Hazard Assessment Report')
    ->subtitle('Barangay San Agustin, Novaliches, Quezon City — Profile Year 2025')
    ->meta('Document type: Hazard Assessment Report')
    ->meta('Scope: Capstone reference profile for simulation-based DRRM training')
    ->meta('Risk framing: Risk ≈ Hazard × Exposure × Vulnerability (qualitative LGU-oriented scoring)')
    ->heading('1. Executive Summary')
    ->para('This report presents a barangay-level multi-hazard assessment for San Agustin, Quezon City, prepared as a supporting document for a disaster preparedness training and simulation information system. Flood and typhoon are rated High based on urban drainage exposure and tropical cyclone rainfall/wind compounding. Earthquake and fire are rated Moderate based on Metro Manila ground-shaking context and dense residential fire-spread potential. The assessment supports selecting San Agustin as the capstone community for drills that emphasize early warning, evacuation coordination, and after-action evaluation.')
    ->heading('2. Location and Socio-Physical Context')
    ->bullet('Administrative location: Barangay San Agustin, District 5 (Novaliches area), Quezon City, NCR')
    ->bullet('Settlement character: Urban / densely built residential fabric with constrained access lanes in places')
    ->bullet('Approximate land area (profile): 1.15 km²')
    ->bullet('Approximate population / households (profile): 22,000 / 4,800')
    ->bullet('Contact baseline used in system profile: barangay LGU contact channels for coordination drills')
    ->heading('3. Methodology (for defense)')
    ->para('The profile combines: (1) document review of Quezon City Drainage Master Plan coverage materials; (2) national hazard context from PAGASA (hydro-meteorological), PHIVOLCS / GeoRiskPH HazardHunterPH (seismic), and BFP urban fire preparedness framing; (3) local BDRRM implementation literature specific to San Agustin; and (4) qualitative risk scoring aligned with LGU training needs rather than engineering design flood depths. Scores are stored in the system as Flood 75 (High), Typhoon 75 (High), Earthquake 50 (Moderate), and Fire 50 (Moderate).')
    ->heading('4. Hazard Findings')
    ->heading('4.1 Flood — High (Score 75)', 2)
    ->para('San Agustin is listed under QCDMP Phase I/II coverage with all-streets assessment context. Primary drivers: intense rainfall, limited drainage capacity, creek/tributary overflow, and prolonged ponding on low-lying residential streets. Exposure scope in the system: zone-specific (prioritize drainage-constrained streets and ponding hotspots). Source framing: MDRRMO / LGU drainage assessment references.')
    ->heading('4.2 Typhoon — High (Score 75)', 2)
    ->para('Tropical cyclones bring extreme rainfall and strong winds that compound flooding and utility disruption (downed lines, interrupted access). Exposure is treated as barangay-wide because wind and rainfall can affect residential blocks across San Agustin. Source framing: PAGASA NCR tropical cyclone / monsoon context.')
    ->heading('4.3 Earthquake — Moderate (Score 50)', 2)
    ->para('Metro Manila, including Quezon City, is exposed to damaging ground shaking from the West Valley Fault and other regional sources. Barangay preparedness should assume strong shaking scenarios for drills (drop-cover-hold, evacuation to open assembly areas, utility shutoff awareness). Use HazardHunterPH / PHIVOLCS products for location screening. Exposure: barangay-wide.')
    ->heading('4.4 Fire — Moderate (Score 50)', 2)
    ->para('Compact housing, narrow lanes, and electrical loading create moderate structural fire-spread risk. Fire can ignite anywhere; spread risk is higher where houses are adjacent and egress is constrained (pattern-based exposure). Community fire drills and egress planning remain priority BDRRM activities alongside flood readiness. Source framing: BFP / LGU fire safety preparedness.')
    ->heading('5. Cross-Cutting Vulnerabilities')
    ->bullet('Urban density and mixed building stock increase consequence of flood depth and fire spread.')
    ->bullet('Vulnerable groups (elderly, PWDs, young children) require assisted evacuation planning in flood scenarios.')
    ->bullet('Communication gaps during warnings reduce lead time — a recurring theme in local BDRRM studies.')
    ->bullet('Interdependence of hazards: typhoon rainfall escalates flood; earthquake may trigger secondary fire / access issues.')
    ->heading('6. Recommended Capability Development')
    ->bullet('Regular flood evacuation + early-warning communication drills (primary).')
    ->bullet('Typhoon pre-landfall checklist exercises (household securing, shelter activation).')
    ->bullet('Earthquake drop-cover-hold and assembly-area drills (barangay-wide).')
    ->bullet('Fire egress and fire-lane keep-clear campaigns in dense clusters.')
    ->bullet('After-action reviews feeding the training platform evaluation module.')
    ->heading('7. References')
    ->para('Quezon City Government. (n.d.). Quezon City Drainage Master Plan (Phase I & II). https://quezoncity.gov.ph/qc-profile/drainage-master-plan/')
    ->para('PAGASA-DOST. (n.d.). Weather, monsoon, and tropical cyclone information services. https://www.pagasa.dost.gov.ph/')
    ->para('PHIVOLCS-DOST. (n.d.). Earthquake hazard maps and related geohazard information. https://www.phivolcs.dost.gov.ph/')
    ->para('GeoRiskPH / HazardHunterPH. (n.d.). Multi-hazard screening map portal. https://hazardhunter.georisk.gov.ph/map')
    ->para('Bureau of Fire Protection. (n.d.). Fire safety and community preparedness resources. https://bfp.gov.ph/')
    ->para('Ascendens Asia / Bestlink College of the Philippines. Implementation of Barangay Disaster Risk Reduction Management in Barangay San Agustin Novaliches Quezon City. Ascendens Asia Singapore – Bestlink College Journal of Multidisciplinary Research. https://ojs.aaresearchindex.com/index.php/aasgbcpjmra/article/view/13917')
    ->para('Republic Act No. 10121. (2010). Philippine Disaster Risk Reduction and Management Act of 2010.')
    ->para('United Nations Office for Disaster Risk Reduction (UNDRR). Sendai Framework for Disaster Risk Reduction 2015–2030 (international policy alignment for risk understanding and preparedness).')
    ->meta('End of document — Hazard Assessment Report 2025 (San Agustin, QC)');
$report->save($outDir.'/san-agustin-hazard-profile-2025.docx');

// ---------------------------------------------------------------------------
// 3) BDRRM study synthesis note
// ---------------------------------------------------------------------------
$bdrrm = new SimpleDocxBuilder();
$bdrrm
    ->title('Local BDRRM Practice Note')
    ->subtitle('Synthesis for Barangay San Agustin, Novaliches, Quezon City')
    ->meta('Document type: Other (BDRRM study & policy synthesis)')
    ->meta('Use: Capstone justification for simulation-based training in the barangay')
    ->heading('1. Why this note matters for defense')
    ->para('Selecting San Agustin as the focus barangay is not arbitrary. Public drainage-assessment coverage and local research on Barangay Disaster Risk Reduction and Management (BDRRM) practice both point to the need for stronger drills, early-warning familiarity, and household emergency planning. This note synthesizes those sources so the training platform can be defended as community-grounded, policy-aligned, and pedagogically purposeful.')
    ->heading('2. Policy Anchors (Philippines)')
    ->bullet('RA 10121 institutionalizes DRRM across national, regional, and local levels, including barangay DRRM committees and contingency planning.')
    ->bullet('NDRRMP pillars (Prevention/Mitigation, Preparedness, Response, Rehabilitation/Recovery) guide how exercises should be designed and evaluated.')
    ->bullet('LGU / barangay roles include risk communication, evacuation management, and coordination with city DRRM offices during hydro-meteorological events.')
    ->heading('3. Local Study Snapshot — San Agustin BDRRM Implementation')
    ->para('A published multidisciplinary research article examines implementation of BDRRM in Barangay San Agustin, Novaliches, Quezon City (Ascendens Asia Singapore – Bestlink College of the Philippines Journal of Multidisciplinary Research). For training-system design, the practical takeaway is that documented gaps commonly cluster around: frequency and quality of drills; clarity and reach of early-warning signals; and residents’ emergency planning behavior. These gaps justify building a platform that schedules simulation events, tracks attendance, and evaluates participant performance.')
    ->heading('4. Link to the Training Platform Modules')
    ->bullet('Hazard Assessment Profile: encodes San Agustin multi-hazard context used to justify exercise scenarios.')
    ->bullet('Exercise / Simulation Planning: translates flood-first priorities into timeline injects and readiness checklists.')
    ->bullet('Attendance & Evaluation: addresses the “drill practice” gap by making participation and learning outcomes measurable.')
    ->bullet('Notifications / Lifecycle Monitoring: supports early-warning communication rehearsal beyond paper plans.')
    ->heading('5. Suggested Talking Points for Oral Defense')
    ->bullet('Community selection: San Agustin has both flood-coverage documentation (QCDMP) and BDRRM implementation literature.')
    ->bullet('Primary scenario: flood evacuation under typhoon/monsoon rainfall — highest operational relevance.')
    ->bullet('Secondary scenarios: earthquake awareness and fire egress in dense residential clusters.')
    ->bullet('Ethics / limits: seeded documents summarize public sources; live response must follow official LGU/PAGASA/PHIVOLCS issuances.')
    ->bullet('Contribution: the system operationalizes preparedness practice (plan → drill → evaluate → improve), not only static hazard listing.')
    ->heading('6. References')
    ->para('Ascendens Asia Singapore – Bestlink College of the Philippines. Implementation of Barangay Disaster Risk Reduction Management in Barangay San Agustin Novaliches Quezon City. Journal of Multidisciplinary Research, Vol. 4, No. 1. https://ojs.aaresearchindex.com/index.php/aasgbcpjmra/article/view/13917')
    ->para('Republic Act No. 10121. (2010). Philippine Disaster Risk Reduction and Management Act of 2010.')
    ->para('National Disaster Risk Reduction and Management Council. National Disaster Risk Reduction and Management Plan (NDRRMP).')
    ->para('Quezon City Government. (n.d.). Quezon City Drainage Master Plan portal materials. https://quezoncity.gov.ph/qc-profile/drainage-master-plan/')
    ->para('Office of Civil Defense. Barangay / community DRRM capacity development references.')
    ->para('UNDRR. Sendai Framework for Disaster Risk Reduction 2015–2030.')
    ->para('PAGASA-DOST & PHIVOLCS-DOST. National hydro-meteorological and seismic public information services used as hazard context sources.')
    ->meta('End of document — Local BDRRM Practice Note (San Agustin, QC)');
$bdrrm->save($outDir.'/san-agustin-bdrrm-study-note.docx');

echo "Generated:\n";
foreach ([
    'san-agustin-qcdmp-flood-coverage-summary.docx',
    'san-agustin-hazard-profile-2025.docx',
    'san-agustin-bdrrm-study-note.docx',
] as $file) {
    $path = $outDir.'/'.$file;
    echo ' - '.$file.' ('.filesize($path)." bytes)\n";
}
