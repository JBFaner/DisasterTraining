<?php
/**
 * Fill IT Audit Performance Activity answers into a new DOCX (original unchanged).
 * Output: Downloads/IT_Audit_Performance_Activity_ANSWERED.docx
 */

$out = 'c:/Users/Rem/Downloads/IT_Audit_Performance_Activity_ANSWERED.docx';
$tmp = sys_get_temp_dir() . '/it_audit_ans_' . uniqid();
mkdir($tmp);
mkdir("$tmp/word");
mkdir("$tmp/_rels");
mkdir("$tmp/word/_rels");

function esc($s) {
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function p($text, $bold = false, $size = 22) {
    $rPr = $bold
        ? '<w:rPr><w:b/><w:sz w:val="' . $size . '"/><w:szCs w:val="' . $size . '"/></w:rPr>'
        : '<w:rPr><w:sz w:val="' . $size . '"/><w:szCs w:val="' . $size . '"/></w:rPr>';
    // Split long text into runs; keep newlines as separate paragraphs
    $parts = preg_split("/\r\n|\n|\r/", $text);
    $xml = '';
    foreach ($parts as $line) {
        $xml .= '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r>' . $rPr . '<w:t xml:space="preserve">' . esc($line) . '</w:t></w:r></w:p>';
    }
    return $xml;
}

function h($text) {
    return p($text, true, 28);
}

function sh($text) {
    return p($text, true, 24);
}

function cell($text, $bold = false) {
    $rPr = $bold ? '<w:rPr><w:b/><w:sz w:val="18"/></w:rPr>' : '<w:rPr><w:sz w:val="18"/></w:rPr>';
    return '<w:tc><w:tcPr><w:tcW w:w="1400" w:type="dxa"/></w:tcPr><w:p><w:r>' . $rPr . '<w:t xml:space="preserve">' . esc($text) . '</w:t></w:r></w:p></w:tc>';
}

function row(array $cols, $header = false) {
    $xml = '<w:tr>';
    foreach ($cols as $c) {
        $xml .= cell($c, $header);
    }
    return $xml . '</w:tr>';
}

function table(array $headers, array $rows) {
    $xml = '<w:tbl><w:tblPr><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders>'
        . '<w:top w:val="single" w:sz="4" w:color="000000"/>'
        . '<w:left w:val="single" w:sz="4" w:color="000000"/>'
        . '<w:bottom w:val="single" w:sz="4" w:color="000000"/>'
        . '<w:right w:val="single" w:sz="4" w:color="000000"/>'
        . '<w:insideH w:val="single" w:sz="4" w:color="000000"/>'
        . '<w:insideV w:val="single" w:sz="4" w:color="000000"/>'
        . '</w:tblBorders></w:tblPr>';
    $xml .= row($headers, true);
    foreach ($rows as $r) {
        $xml .= row($r, false);
    }
    return $xml . '</w:tbl>';
}

$body = '';
$body .= h('IT AUDIT: EVIDENCE, CONTROL TESTING, AND AUDITOR JUDGMENT');
$body .= p('ANSWERED SUBMISSION — Student answers only (activity questions preserved conceptually).');
$body .= p('Student: Reymon S.A. Brogada | Suggested filename: Brogada_IT_Audit_Hard_Activity.docx');
$body .= p('');

// ========== Q1 ==========
$body .= h('PART A — Question 1: IT Audit Checklist (12 items)');
$q1 = [
    ['1','User Access','Are user accounts provisioned and reviewed based on approved roles?','Role-based access; periodic access review','Access matrix; user listing; approval forms','Sample 25 accounts; match roles vs HR job titles','Compliant / Exception if unauthorized access found'],
    ['2','Administrator Privileges','Are privileged accounts limited, owned, and reviewed monthly?','Least privilege; named owners; monthly admin review','Admin account list; review tickets; ownership log','Inspect all admin accounts; verify owners and last review date','Exception if orphaned/ex-employee admin accounts'],
    ['3','Password Security','Does password/MFA configuration match written policy?','Min length, expiration, MFA for admins as policy states','Password policy config export; MFA enrollment report','Compare system settings to policy; count MFA coverage','Exception if config weaker than policy'],
    ['4','Backup and Recovery','Are backups completed and restorations tested periodically?','Nightly backup + documented restore test','Backup logs; restore test reports; tickets for failures','Review 30 days of jobs; inspect last restore test date','Exception if failed jobs uninvestigated or restore stale'],
    ['5','System Logs','Are security logs reviewed and retained with evidence?','Documented log review; retention period','SIEM alerts; review checklists; log archives','Request last 3 months review records; spot-check samples','Exception if no documented reviews'],
    ['6','Network Security','Is campus Wi-Fi segmented and authenticated?','Separate guest/staff SSIDs; WPA2/3; NAC if applicable','Firewall rules; Wi-Fi config; vulnerability scan','Observe config; test guest isolation; review open ports','Exception if open/unauthenticated critical segments'],
    ['7','Data Protection','Is sensitive student/payment data encrypted and access-controlled?','Encryption at rest/in transit; DLP where feasible','DB encryption status; TLS certs; access logs','Verify TLS on payment portal; check DB encryption flags','Exception if PII stored/transmitted in clear'],
    ['8','Physical Security','Is the server room restricted and monitored?','Badge access; visitor log; CCTV','Access logs; visitor register; photos','Observe entry controls; sample badge logs','Exception if uncontrolled server room access'],
    ['9','Incident Management','Are security incidents logged, classified, and closed?','Incident response procedure with tickets','Incident tickets; SLA reports','Sample closed incidents; verify root cause & lessons','Exception if informal undocumented handling'],
    ['10','Employee Termination','Are accounts disabled on or before last day?','Joiner-mover-leaver process; HR-IT reconciliation','HR termination list vs AD/SIS accounts','Reconcile last 12 months terminations to active accounts','Exception if ex-employees still active'],
    ['11','IT Policies','Are IT policies approved, current, and communicated?','Approved policies with version/date; staff acknowledgment','Policy repository; acknowledgment records','Check approval date; sample employee acknowledgments','Exception if outdated/unapproved policies'],
    ['12','Change Management','Are production changes approved and tested before release?','Change tickets; CAB/approval; rollback plan','Change tickets; release notes','Sample 10 production changes; verify approval & test evidence','Exception if emergency/undocumented changes'],
];
$body .= table(
    ['#','Audit Area','Audit Question','Expected Control','Evidence','Test Procedure','Possible Result'],
    $q1
);
$body .= p('Hard requirement met: Items 1–5 and 10–12 include explicit control testing procedures (sample, inspect, reconcile, compare), not document requests only.');
$body .= p('');

// ========== Q2 ==========
$body .= h('PART B — Question 2: Control Weaknesses (Six Findings)');
$q2 = [
    ['F1: Former employees still have active accounts','Evidence 1 & 5: 6 resigned employees; no HR–IT reconciliation','Disable/remove access on termination; formal reconciliation','6 terminated staff remain active; email-only handoff, no recon report','Unauthorized access to SIS/email/payment data; identity fraud; regulatory/privacy liability'],
    ['F2: Privileged accounts without owners / excessive rights','14 admins; 3 no owner; 2 faculty with admin rights; 1 inactive 14 months still enabled','Named ownership; least privilege; disable unused privileged accounts','Orphaned/unused elevated accounts remain enabled without justification','Privilege abuse; undetected malicious activity; insider threat; audit trail gaps'],
    ['F3: Password/MFA settings weaker than policy','Policy 12 chars / 90 days / MFA all admins vs actual 8 / 180 / MFA 11 of 14','Enforce policy via technical controls (GPO/IdP)','System config does not match policy; 3 admins without MFA','Credential stuffing/brute force success; compromised admin sessions'],
    ['F4: Backup failures uninvestigated; restore untested','4 failed jobs/30 days; no investigation; restore test 10–11 months old','Investigate failures; periodic restore testing','“Backup runs” but recoverability not proven; failures ignored','Data loss after outage; inability to restore student/payment records'],
    ['F5: Log monitoring without documented evidence','Claim of regular review; no records for 3 months','Documented periodic log review with retention','Busy-work excuse; no review evidence','Missed intrusion indicators; delayed detection of breaches'],
    ['F6: Over-reliance on prior “Satisfactory” rating','CIO: use previous audit; “nothing changed”','Current-period testing; revalidate operating effectiveness','Prior rating not current evidence of control operation','False assurance; undetected control decay since last audit'],
];
$body .= table(['Finding','Evidence','Expected Control','Actual Condition','Risk'], $q2);
$body .= p('');

// ========== Q3 ==========
$body .= h('Question 3 — Evidence Reliability Ranking');
$body .= p('Strongest → Weakest:');
$body .= p('1) System configuration — machine-generated technical setting; hard to fabricate without privileged access.');
$body .= p('2) Backup logs — system-generated chronological records of job success/failure.');
$body .= p('3) User account report — extract from directory/SIS showing current entitlements.');
$body .= p('4) HR termination records — independent HR source supporting joiner-mover-leaver tests.');
$body .= p('5) System log-review documentation — useful if contemporaneous; weaker if created after the fact.');
$body .= p('6) Security policy — defines criteria, but does not prove operation.');
$body .= p('7) Employee interview — helpful context, subject to bias and memory errors.');
$body .= p('8) IT manager verbal statement — weakest; unsupported management assertion.');
$body .= p('Reason: Auditors prioritize independent, objective, and re-performable evidence over oral claims. Policies set criteria; interviews explain; only technical/system records prove whether controls operated.');
$body .= p('');

// ========== Q4 ==========
$body .= h('Question 4 — The Trap (≈280 words)');
$body .= p('A prior “IT Controls Satisfactory” rating is historical assurance, not current evidence. Controls decay: staff leave, configurations drift, and monitoring can stop without a public breach. Absence of a known incident also does not prove controls are effective—many compromises remain undetected for months. Auditing evaluates whether controls are designed and operating now, using objective evidence and testing, not the lack of bad news.');
$body .= p('In this engagement, system evidence already contradicts management comfort: terminated employees with active accounts, orphaned administrator IDs, password/MFA settings below policy, failed backups without tickets, and undocumented log reviews. These are reportable conditions because they show control failure or non-operation against stated criteria, regardless of yesterday’s clean opinion.');
$body .= p('Auditor judgment requires professional skepticism. Management preference to avoid findings is not a criterion. The auditor should report findings supported by evidence, rate risk by likelihood and impact, and recommend corrective action with follow-up. Declining to report because “nothing bad happened yet” would itself be an audit failure—it substitutes assumption for testing and leaves the university exposed to preventable harm to student data, payments, and academic continuity.');
$body .= p('');

// ========== Q5 ==========
$body .= h('Question 5 — Risk Prioritization (1 = most critical)');
$body .= p('1 — F1 Former employees with active accounts (high likelihood of misuse; high impact on confidentiality; easy if credentials known; weak existing offboarding).');
$body .= p('2 — F2 Orphaned/excessive admin privileges (high impact; moderate–high likelihood; easy exploitation once accessed; weak ownership reviews).');
$body .= p('3 — F3 Password/MFA below policy (increases likelihood of credential compromise for privileged users).');
$body .= p('4 — F4 Untested backups / ignored failures (high impact on availability/integrity if disaster occurs; likelihood of restore failure elevated).');
$body .= p('5 — F5 Undocumented log reviews (raises detection risk; impact depends on undetected events).');
$body .= p('6 — F6 Reliance on prior audit rating (process/assurance risk; enables other weaknesses to persist).');
$body .= p('');

// ========== Q6 ==========
$body .= h('Question 6 — Management Response (Top 2)');
$body .= sh('Finding 1 — Active accounts of former employees');
$body .= p('Risk: Unauthorized access to SIS, email, LMS, and payment-related data.');
$body .= p('Recommended Action: Immediately disable the 6 accounts; implement same-day disable workflow; weekly HR–IT reconciliation for 90 days then monthly.');
$body .= p('Responsible: IT Security / Identity Management with HR Operations.');
$body .= p('Evidence of Completion: Disable screenshots/logs; updated access list; signed reconciliation reports.');
$body .= p('Follow-up Test: Re-extract active accounts and match to current HR roster; zero matches for terminated staff.');
$body .= sh('Finding 2 — Orphaned / excessive administrator accounts');
$body .= p('Risk: Privilege abuse and untraceable privileged activity.');
$body .= p('Recommended Action: Assign owners or disable orphaned admins; remove faculty admin rights unless approved; disable 14-month inactive admin; enforce monthly privileged access review.');
$body .= p('Responsible: IT Infrastructure / Network Administration; approved by CIO.');
$body .= p('Evidence of Completion: Updated admin inventory with owners; change tickets; monthly review checklist.');
$body .= p('Follow-up Test: Recheck admin list for owners, inactivity, and MFA coverage = 100%.');
$body .= p('');

// ========== Q7-8 ==========
$body .= h('PART C — Question 7: Auditor Response');
$body .= p('Next actions: (1) Treat the interview as an assertion only—do not accept “routine so no records.” (2) Obtain a full privileged-account extract with last logon, created date, and owner fields. (3) Independently match admin names to HR active/terminated lists. (4) For the 3 unowned, 2 former-employee, and 1 long-inactive accounts, open exception tickets and request written business justification or immediate disable. (5) Test whether a monthly review control exists by searching for tickets, emails, or calendar evidence for the last 6 months. (6) Expand sample to related systems (SIS, email). (7) Document condition/criteria/cause/effect and discuss with auditee before closing. Reporting comes after evidence is complete.');
$body .= p('');
$body .= h('Question 8 — Three Control Tests');
$body .= p('Test 1 — Objective: Verify monthly privileged-account reviews occur. Procedure: Request review artifacts for last 6 months; if none, conclude control not operating. Evidence: Tickets/checklists/emails. Expected: Dated reviews covering all admins.');
$body .= p('Test 2 — Objective: Confirm no terminated staff retain admin rights. Procedure: Reconcile admin list to HR terminations. Evidence: HR list + directory extract. Expected: Zero terminated users with admin access.');
$body .= p('Test 3 — Objective: Confirm unused privileged accounts are disabled. Procedure: Identify accounts with last logon > 90 days; verify status disabled. Evidence: Last-logon report. Expected: Stale accounts disabled or formally risk-accepted.');
$body .= p('');

// ========== Q9-10 ==========
$body .= h('Question 9 — Backup Control Effectiveness');
$body .= p('No. A dashboard “Backup Job Completed: YES” is insufficient. Effectiveness requires successful, complete backups and proven restorability. Incomplete backup files, 8% storage remaining, prior failed jobs without tickets, and no restoration test mean the control is not operating effectively. Completing a job flag without integrity/restore assurance creates a false sense of compliance.');
$body .= p('');
$body .= h('Question 10 — Evidence vs. Assumption');
$body .= p('A. Claim: 100% backup compliance; backups always complete.');
$body .= p('B. Evidence proves: A completion flag exists on the dashboard; prior failures occurred; storage is nearly full; no restore test documentation.');
$body .= p('C. Evidence does NOT prove: Backup sets are complete/usable; RTO/RPO can be met; failures were handled; data can be restored.');
$body .= p('D. Additional test: Perform (or witness) a controlled restore of a critical system (e.g., SIS sample DB) to a test environment; verify file completeness/checksums; review capacity alerts and incident tickets for failed jobs.');
$body .= p('');

// ========== Q11 ==========
$body .= h('PART D — Question 11: Formal Audit Finding');
$body .= p('Selected issue: Former employees with active user accounts (joined with weak offboarding).');
$body .= p('CONDITION: Six accounts belonging to resigned employees remain enabled. Neither HR nor IT produced a formal termination-access reconciliation. IT stated HR does not always notify promptly; HR stated notices are emailed—yet no evidence of consistent processing.');
$body .= p('CRITERIA: University access-control / joiner-mover-leaver policy and good practice require disabling access upon termination and reconciling HR terminations to system accounts.');
$body .= p('CAUSE: Informal email-based handoff without SLA, no automated disable trigger, and no periodic reconciliation control.');
$body .= p('EFFECT/RISK: Former staff or anyone possessing residual credentials could access student records, faculty systems, or email, causing data breach, grade/integrity issues, and reputational/legal exposure.');
$body .= p('RECOMMENDATION: Disable the six accounts within 24 hours; implement same-day disable workflow; require HR ticket mandatory field; weekly reconciliation for 90 days then monthly; report metrics to CIO.');
$body .= p('Evidence Reference: User account extract (Evidence 1); HR termination list & interview notes (Evidence 5).');
$body .= p('Risk Rating: High (Critical if payment/SIS admin rights confirmed on any of the six).');
$body .= p('Management Response (anticipated): “We will disable accounts and improve coordination.”');
$body .= p('Auditor Rebuttal: Acceptance of action is noted; residual risk remains until reconciliation evidence is produced and retested. Prior clean audit does not reduce the current finding.');
$body .= p('');

// ========== Q12 ==========
$body .= h('PART E — Question 12: Critical Thinking Essay (~650 words)');
$body .= p('Auditors cannot treat paper compliance as proof that controls work. Policies and procedures define what should happen; they do not demonstrate what actually happens day to day. An organization may have polished documents, confident staff, and even a prior “satisfactory” audit opinion, yet still fail to operate key controls. The auditor’s duty is to obtain sufficient appropriate evidence about the current period’s design and operating effectiveness.');
$body .= p('Policy versus practice is the first gap. A password policy requiring twelve characters and MFA for administrators is only criteria. If the directory enforces eight characters and three administrators lack MFA, practice diverges from policy. Without independent examination of system configuration, the auditor would incorrectly conclude compliance. The same logic applies to backup policies that require restore testing: a written procedure is worthless if the last restore test is nearly a year old.');
$body .= p('Interview versus evidence is the second gap. Interviews provide context and help auditors identify where to look, but people are biased, busy, and sometimes mistaken. A network administrator may sincerely believe monthly reviews occur, yet produce no records. A security officer may say logs are checked regularly while admitting reviews are undocumented. Professional standards prioritize evidence that is objective and re-performable over oral assurance.');
$body .= p('Control testing closes the gap between assertion and reality. Testing may include inspection of configurations, reperformance of reconciliations, observation of processes, and examination of logs and tickets. Documentary evidence (policies, tickets), technical evidence (configs, account extracts), observational evidence (server-room access), and interview evidence each play a role—but technical and documentary sources generally outweigh interviews when they conflict.');
$body .= p('Risk exists even when no incident is known. Many breaches are silent. Failed backups may not matter until a ransomware event. Orphaned admin accounts may sit unused until compromised. The absence of reported incidents is not a control. Auditors evaluate exposure—likelihood and impact—based on weaknesses observed, not on luck so far.');
$body .= p('Professional judgment requires skepticism and independence. Management may pressure the auditor to rely on a previous clean report or to soft-pedal findings to protect reputation. Succumbing to that pressure undermines the audit’s purpose. Evidence-based findings—condition, criteria, cause, effect, and recommendation—protect both the auditor and the organization by making conclusions defensible.');
$body .= p('Therefore, independent examination and testing remain necessary whenever policies, interviews, and prior audits are offered as substitutes for proof. Assurance is earned by verifying controls in operation, not by accepting comfort narratives. In environments like universities—holding student PII, grades, and payments—that discipline is not optional; it is the core of responsible IT auditing.');
$body .= p('');

// ========== Q13 ==========
$body .= h('FINAL CHALLENGE — Question 13: Risk-Based Audit Strategy (4 hours left)');
$body .= p('A. Investigate immediately: (1) Former employees with active accounts; (2) Administrator accounts without owners / ex-employee admins; (3) Failed backup jobs + lack of restore testing (availability of core systems).');
$body .= p('B. Defer: (1) Full password-policy deep dive beyond confirming MFA gaps already seen; (2) Comprehensive historical log-review sampling beyond establishing absence of records; (3) Broader network/Wi-Fi testing not tied to identity/backup emergencies.');
$body .= p('C. Evidence to request: Live AD/SIS account extract; HR termination list (12 months); privileged account inventory with owners/last logon; MFA enrollment report; 30-day backup job logs; last restore test pack; incident tickets for backup failures.');
$body .= p('D. Tests: HR–IT account reconciliation; privileged access ownership/inactivity test; MFA coverage count for admins; backup failure investigation trail; witness/restore sample if time allows.');
$body .= p('E. Expected findings: Active terminated accounts; orphaned/stale privileged IDs; backup recoverability not assured; possible MFA exceptions.');
$body .= p('F. Immediate escalation: Confirmed active privileged account belonging to a former employee, or evidence of recent logons on terminated accounts.');
$body .= p('G. Prioritization rationale: With four hours, focus on issues with highest impact and exploitability (identity & privilege) and existential recovery risk (backups). Defer lower-urgency documentation gaps that are already directionally clear, and convert them into findings based on existing evidence without exhaustive retesting.');
$body .= p('');
$body .= p('END OF ANSWERS');

$documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    . '<w:body>' . $body
    . '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>'
    . '</w:body></w:document>';

file_put_contents("$tmp/word/document.xml", $documentXml);
file_put_contents("$tmp/[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?>'
    . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    . '<Default Extension="xml" ContentType="application/xml"/>'
    . '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    . '</Types>');
file_put_contents("$tmp/_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    . '</Relationships>');
file_put_contents("$tmp/word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');

$zip = new ZipArchive();
if ($zip->open($out, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    fwrite(STDERR, "Cannot create $out\n");
    exit(1);
}
$zip->addFile("$tmp/[Content_Types].xml", '[Content_Types].xml');
$zip->addFile("$tmp/_rels/.rels", '_rels/.rels');
$zip->addFile("$tmp/word/document.xml", 'word/document.xml');
$zip->addFile("$tmp/word/_rels/document.xml.rels", 'word/_rels/document.xml.rels');
$zip->close();

echo "OK=$out\n";
echo "SIZE=" . filesize($out) . "\n";
