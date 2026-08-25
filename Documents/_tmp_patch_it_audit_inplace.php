<?php
/**
 * Fill answers INTO the original IT_Audit_Performance_Activity.docx
 * Student-standard answers. No backup — writes in place.
 */

$src = 'c:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx';
$out = 'c:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx';
$work = sys_get_temp_dir() . '/it_audit_fill2_' . uniqid();
mkdir($work);

$zip = new ZipArchive();
if ($zip->open($src) !== true) {
    fwrite(STDERR, "Cannot open $src\n");
    exit(1);
}
$zip->extractTo($work);
$zip->close();

$docPath = $work . '/word/document.xml';
$xml = file_get_contents($docPath);

// If already filled once, refuse to double-insert (tables may still be empty though)
if (strpos($xml, 'ANSWER:') !== false || strpos($xml, 'ANSWER (') !== false) {
    fwrite(STDERR, "Document already has ANSWER blocks. Aborting to avoid duplicates.\n");
    exit(2);
}

function esc($s) {
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function wPara($text, $bold = false, $after = 80) {
    $rPr = $bold
        ? '<w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
        : '<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>';
    $lines = preg_split("/\r\n|\n|\r/", $text);
    $out = '';
    foreach ($lines as $line) {
        if ($line === '') {
            $out .= '<w:p><w:pPr><w:spacing w:after="' . $after . '"/></w:pPr></w:p>';
            continue;
        }
        $out .= '<w:p><w:pPr><w:spacing w:after="' . $after . '"/></w:pPr><w:r>'
            . $rPr . '<w:t xml:space="preserve">' . esc($line) . '</w:t></w:r></w:p>';
    }
    return $out;
}

function fillCell($cellInnerXml, $text) {
    $tcPr = '';
    if (preg_match('/(<w:tcPr>[\s\S]*?<\/w:tcPr>)/', $cellInnerXml, $m)) {
        $tcPr = $m[1];
    }
    $para = '<w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r>'
        . '<w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>'
        . '<w:t xml:space="preserve">' . esc($text) . '</w:t></w:r></w:p>';
    return $tcPr . $para;
}

function fillTableRows($tableXml, array $rowData) {
    if (!preg_match_all('/<w:tr[\s>][\s\S]*?<\/w:tr>/', $tableXml, $trMatches)) {
        return $tableXml;
    }
    $rows = $trMatches[0];
    $dataIdx = 0;
    for ($i = 0; $i < count($rows); $i++) {
        $row = $rows[$i];
        if (preg_match('/Audit Area|Audit Question|Expected Control|Finding|Evidence|Actual Condition/', $row)
            && !preg_match('/^[\s\S]*?<w:t[^>]*>\s*[0-9]+\s*<\/w:t>/', $row)) {
            if ($i === 0 || preg_match('/Audit Area|Finding<\/w:t>/', $row)) {
                continue;
            }
        }

        if (!preg_match_all('/<w:tc[\s>]([\s\S]*?)<\/w:tc>/', $row, $tcMatches)) {
            continue;
        }
        $cells = $tcMatches[0];
        $inners = $tcMatches[1];

        $firstText = '';
        if (preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $inners[0], $ft)) {
            $firstText = trim(html_entity_decode(implode('', $ft[1]), ENT_QUOTES | ENT_XML1, 'UTF-8'));
        }

        $isNumbered = preg_match('/^\d{1,2}$/', $firstText);
        $allEmptyAfterFirst = true;
        for ($c = 1; $c < count($inners); $c++) {
            if (preg_match('/<w:t[^>]*>\S/', $inners[$c])) {
                $allEmptyAfterFirst = false;
                break;
            }
        }
        $fullyEmpty = true;
        foreach ($inners as $inn) {
            if (preg_match('/<w:t[^>]*>\S/', $inn)) {
                $fullyEmpty = false;
                break;
            }
        }

        if (!(($isNumbered && $allEmptyAfterFirst) || $fullyEmpty)) {
            continue;
        }
        if ($dataIdx >= count($rowData)) {
            break;
        }
        $data = $rowData[$dataIdx++];

        if ($isNumbered) {
            $fillFrom = 1;
            $values = $data;
        } else {
            $fillFrom = 0;
            $values = $data;
        }

        $rowOpen = preg_match('/^(<w:tr[^>]*>)/', $row, $rm) ? $rm[1] : '<w:tr>';
        $trPr = '';
        if (preg_match('/<w:trPr>[\s\S]*?<\/w:trPr>/', $row, $tpm)) {
            $trPr = $tpm[0];
        }
        $xmlCells = '';
        for ($c = 0; $c < count($cells); $c++) {
            if ($c < $fillFrom) {
                $xmlCells .= $cells[$c];
            } else {
                $val = $values[$c - $fillFrom] ?? '';
                $xmlCells .= '<w:tc>' . fillCell($inners[$c], $val) . '</w:tc>';
            }
        }
        $rows[$i] = $rowOpen . $trPr . $xmlCells . '</w:tr>';
    }

    $i = 0;
    return preg_replace_callback('/<w:tr[\s>][\s\S]*?<\/w:tr>/', function ($m) use (&$i, $rows) {
        return $rows[$i++];
    }, $tableXml);
}

// Student-level Q1 (simple wording, still with test procedures)
$q1Rows = [
    ['User Access', 'Are user accounts created based on approved roles?', 'Only approved roles get access; review accounts regularly', 'User list, access matrix, approval forms', 'Pick 20–25 accounts and check if role matches job', 'Pass if match; fail if wrong access'],
    ['Administrator Privileges', 'Are admin accounts limited and reviewed?', 'Few admin accounts; each has an owner; monthly check', 'Admin account list, review notes', 'Check all admin accounts and who owns them', 'Fail if no owner or unused admin still open'],
    ['Password Security', 'Do password and MFA settings follow the policy?', 'Strong password rules and MFA for admins', 'Password settings export, MFA report', 'Compare system settings with written policy', 'Fail if settings are weaker than policy'],
    ['Backup and Recovery', 'Are backups successful and restores tested?', 'Nightly backup and restore test records', 'Backup logs, restore test report', 'Review last 30 days of backups; check last restore date', 'Fail if failed jobs ignored or no restore test'],
    ['System Logs', 'Are security logs reviewed and recorded?', 'Regular log review with proof', 'Review checklist, SIEM alerts, log files', 'Ask for last 3 months of review records', 'Fail if no documented reviews'],
    ['Network Security', 'Is campus Wi-Fi secured and separated?', 'Staff and guest Wi-Fi separated; password protected', 'Wi-Fi settings, firewall rules', 'Review config and check if guest can reach internal systems', 'Fail if guest can access internal network'],
    ['Data Protection', 'Is student and payment data protected?', 'Encryption and limited access to sensitive data', 'DB settings, HTTPS/TLS, access logs', 'Check if payment page uses HTTPS and who can open student data', 'Fail if sensitive data is not protected'],
    ['Physical Security', 'Is the server room locked and monitored?', 'ID/badge access, visitor log, CCTV', 'Access logs, visitor log', 'Visit server room and sample access records', 'Fail if anyone can enter freely'],
    ['Incident Management', 'Are IT incidents recorded and closed properly?', 'Incident tickets and follow-up steps', 'Incident tickets, reports', 'Sample some closed tickets and check if cause was noted', 'Fail if incidents are only handled informally'],
    ['Employee Termination', 'Are accounts disabled when an employee resigns?', 'Disable access on last day; HR and IT reconcile lists', 'HR resignation list vs active accounts', 'Compare resigned employees to still-active accounts', 'Fail if ex-employees still have access'],
    ['IT Policies', 'Are IT policies approved and known to staff?', 'Updated policies with approval date; staff acknowledgment', 'Policy folder, acknowledgment forms', 'Check policy date and sample if employees signed', 'Fail if policies are outdated or unsigned'],
    ['Change Management', 'Are system changes approved before going live?', 'Change request, approval, and testing before release', 'Change tickets, test notes', 'Sample 8–10 production changes and check approval', 'Fail if changes were done with no approval'],
];

$q2Rows = [
    ['Ex-employees still have active accounts', 'Evidence 1 and 5: 6 resigned staff still active; no formal HR–IT report', 'Disable accounts when someone resigns; HR and IT should reconcile', '6 former employees still active; only email handoff; no recon report', 'Someone can still open SIS, email, or payment data even after leaving'],
    ['Admin accounts with problems', '14 admins; 3 no owner; 2 faculty have admin rights; 1 idle for 14 months', 'Admin accounts should have owners; unused ones should be disabled', 'Orphaned and unused elevated accounts are still enabled', 'High privilege can be misused and it is hard to know who did what'],
    ['Password/MFA weaker than policy', 'Policy: 12 chars, 90 days, MFA for all admins. Actual: 8 chars, 180 days, MFA only 11/14', 'System settings should match the written policy', 'Settings do not follow the policy', 'Easier for someone to guess/steal admin passwords'],
    ['Backup failures and no restore test', '4 failed backups in 30 days; not investigated; last restore test ~11 months ago', 'Failed backups should be checked; restore should be tested regularly', 'Failures ignored; recoverability not proven', 'If systems crash or ransomware hits, data may not be restored'],
    ['Log review has no records', 'Security officer says logs are checked but no records for 3 months', 'Log reviews should be documented', 'No proof of review; only verbal claim', 'Attacks may not be noticed early'],
    ['Relying only on previous “Satisfactory” audit', 'CIO says reuse previous audit because nothing changed', 'Current controls should still be tested this period', 'Old rating is treated like current proof', 'False confidence; problems today may be missed'],
];

if (!preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $tblMatches)) {
    fwrite(STDERR, "No tables found\n");
    exit(1);
}
$tables = $tblMatches[0];
echo 'TABLE_COUNT=' . count($tables) . PHP_EOL;

$q1Idx = null;
$q2Idx = null;
foreach ($tables as $idx => $t) {
    if (strpos($t, 'Audit Area') !== false && strpos($t, 'Test Procedure') !== false) {
        $q1Idx = $idx;
    }
    if (strpos($t, 'Actual Condition') !== false || (strpos($t, 'Finding') !== false && strpos($t, 'Expected Control') !== false && strpos($t, 'Audit Question') === false)) {
        $q2Idx = $idx;
    }
}
echo "Q1_TABLE=$q1Idx Q2_TABLE=$q2Idx\n";

if ($q1Idx !== null) {
    $tables[$q1Idx] = fillTableRows($tables[$q1Idx], $q1Rows);
}
if ($q2Idx !== null) {
    $tables[$q2Idx] = fillTableRows($tables[$q2Idx], $q2Rows);
}

$ti = 0;
$xml = preg_replace_callback('/<w:tbl>[\s\S]*?<\/w:tbl>/', function ($m) use (&$ti, $tables) {
    return $tables[$ti++];
}, $xml);

$answers = [
    'Question 3 – Evidence Reliability (5 points)' =>
        "ANSWER:\nStrongest to weakest:\n1. System configuration\n2. Backup logs\n3. User account report\n4. HR termination records\n5. System log-review documentation\n6. Security policy\n7. Employee interview\n8. IT manager verbal statement\n\nExplanation:\nSystem settings, logs, and account reports are stronger because they come from the system itself and can be checked again. HR records are useful but may be incomplete. A policy only shows what should happen, not what is really happening. Interviews and verbal statements are the weakest because people can be wrong, forget details, or try to defend their work without proof.",

    'Question 4 – The Trap (5 points)' =>
        "ANSWER (~270 words):\nI disagree with the CIO. A previous audit that said “Satisfactory” only shows the situation at that time. Controls can get weaker after six months. People resign, settings change, and monitoring may stop. So the old result cannot automatically clear today’s findings.\n\nAlso, saying there was no known security breach does not mean controls are working. Some incidents are never reported, or the school simply has not discovered them yet. An auditor looks at whether controls are operating now, not only whether something bad already happened.\n\nIn this case, the evidence already shows real problems: former employees still have accounts, some admin accounts have no owner, password and MFA settings are weaker than policy, backups failed and were not investigated, and there are no log-review records. These are based on documents and system data, not guesses.\n\nAs an auditor, I should still report the findings if the evidence supports them. Management may not like the findings, but auditor judgment should follow the facts. The recommendation should explain the risk and what to fix. Ignoring findings because “nothing bad happened yet” is dangerous, especially for a university that holds student and payment information.",

    'Question 5 – Risk Prioritization (5 points)' =>
        "ANSWER (1 = Most Critical, 6 = Least Critical):\n1. Former employees with active accounts — easy to exploit if passwords are still known; high impact on student/email data\n2. Problem admin accounts (no owner / excess rights / long unused) — high impact if misused\n3. Password and MFA weaker than policy — makes accounts easier to break\n4. Backup failures and no restore test — big problem if a disaster happens\n5. Missing log-review evidence — harder to detect attacks early\n6. Relying only on the previous audit rating — process issue that can hide other problems\n\nI ranked them using likelihood, impact, how exposed the systems are, how sensitive the data is, how easy it is to abuse the weakness, and whether there are strong compensating controls (in this case, there are not).",

    'Question 6 – Management Response (5 points)' =>
        "ANSWER — Two highest-risk findings:\n\nFinding 1: Former employees still have active accounts\nRisk: Unauthorized access to SIS, email, LMS, or payment-related data.\nRecommended Action: Disable the 6 accounts now. Make a clear process so HR informs IT on the last day. Do weekly HR–IT account checks for the next 90 days.\nResponsible Person/Department: IT Security / Account Management and HR.\nRequired Evidence of Completion: Disable logs, updated user list, signed reconciliation report.\nFollow-up Test: Compare active accounts again with the latest HR resignation list; no resigned employee should still be active.\n\nFinding 2: Admin accounts without proper control\nRisk: Someone with high privilege can change systems or hide activity.\nRecommended Action: Assign owners or disable unused/orphan admin accounts. Remove admin rights from faculty who should not have them. Require MFA for all admins and do monthly admin reviews.\nResponsible Person/Department: IT Infrastructure / Network Admin, with CIO approval.\nRequired Evidence of Completion: Updated admin list with owners, change tickets, monthly review checklist.\nFollow-up Test: Recheck the admin list for owners, unused accounts, and full MFA coverage.",

    'Question 7 – Auditor Response (5 points)' =>
        "ANSWER:\nI should not just believe the interview. Next steps:\n1. Treat the statement as a claim only, not as proof.\n2. Get the full list of administrator accounts with last login and owner details.\n3. Compare the list with HR active and resigned employees.\n4. For the 3 accounts with no owner, 2 former employees, and 1 unused for 9 months, ask for written explanation or request that they be disabled.\n5. Look for any tickets, emails, or checklists that show monthly reviews in the last 6 months.\n6. If there is still no proof, document this as a finding with evidence.\n7. Discuss with the auditee, then include it in the report.\nReporting comes after gathering enough evidence, not before.",

    'Question 8 – Control Testing (5 points)' =>
        "ANSWER — Three tests:\n\nTest 1\nTest Objective: Check if monthly admin account reviews really happen.\nProcedure: Ask for review records for the last 6 months. If none are given, the control is not operating.\nEvidence: Tickets, checklists, or emails.\nExpected Result: Dated reviews that cover all admin accounts.\n\nTest 2\nTest Objective: Confirm resigned employees do not keep admin access.\nProcedure: Match the admin list with the HR termination list.\nEvidence: HR list and system account extract.\nExpected Result: Zero resigned users with admin rights.\n\nTest 3\nTest Objective: Confirm unused admin accounts are disabled.\nProcedure: Find accounts with no login for a long time (example: more than 90 days) and check if they are disabled.\nEvidence: Last-login report.\nExpected Result: Old unused accounts are disabled or formally approved to remain.",

    'Question 9 – Backup Control Effectiveness (5 points)' =>
        "ANSWER:\nNo. The auditor cannot conclude that the backup control is effective. A dashboard that only says “Backup Job Completed: YES” is not enough. The backup file is incomplete, there is no restoration test, storage is almost full (8% left), earlier jobs failed, and no incident ticket was made. Effective backup means the data can really be restored when needed. Right now, that is not proven.",

    'Question 10 – Evidence vs. Assumption (5 points)' =>
        "ANSWER:\nA. What the organization claims: They have 100% backup compliance and backups are complete.\nB. What the evidence actually proves: There is a completion flag on the dashboard, some past jobs failed, storage space is very low, and there is no restore-test document.\nC. What the evidence does NOT prove: That backup files are complete and usable, that recovery time goals can be met, that failed jobs were handled, or that important data can be restored.\nD. What additional test is necessary: Do a controlled restore of an important system (example: sample SIS data) in a test environment, check if the restored files are complete, and review tickets/alerts for failed backups and low storage.",

    'Question 11 – Prepare a Formal Audit Finding (15 points)' =>
        "ANSWER — Chosen issue: Former employees with active accounts\n\nCONDITION: Six accounts belonging to resigned employees are still enabled. HR and IT could not show a formal reconciliation report. IT said HR does not always inform them quickly, while HR said notices are sent by email, but there is no clear proof that access was always removed on time.\n\nCRITERIA: Access should be removed when employment ends. HR and IT should compare resignation lists with active system accounts.\n\nCAUSE: The process depends on informal email only. There is no clear deadline, no automatic disable step, and no regular reconciliation.\n\nEFFECT/RISK: A former employee, or anyone who still knows the password, may still access student records, email, or related systems. This can lead to data leakage, unauthorized changes, and damage to the university’s reputation.\n\nRECOMMENDATION: Disable the six accounts within 24 hours. Create a same-day disable process. Require an official ticket from HR for every resignation. Do weekly reconciliation for 90 days, then monthly. Report the results to the CIO.\n\nEvidence Reference: User account extract (Evidence 1); HR termination list and interviews (Evidence 5)\nRisk Rating: High\nManagement Response: Management may say they will disable the accounts and improve coordination between HR and IT.\nAuditor Rebuttal: The plan is noted, but the risk remains until the accounts are disabled and a reconciliation report is shown and retested. A previous clean audit does not remove this current finding.",

    'Question 12 – When Compliance on Paper Is Not Compliance in Practice (15 points)' =>
        "ANSWER (~650 words):\nAn auditor should still examine and test controls even if an organization already has policies, procedures, employees who say everything is fine, and a previous audit that was satisfactory. Paper compliance is not the same as real compliance. Policies only describe what should happen. They do not automatically prove that the control is working every day.\n\nFirst is policy versus practice. A university may have a password policy that requires 12 characters, 90-day expiration, and MFA for administrators. But if the system is set to 8 characters, 180 days, and MFA is missing for some admins, then practice does not match the policy. If the auditor only reads the policy and believes management, the audit conclusion will be wrong. The same idea applies to backups. A written backup procedure means little if failed jobs are ignored and restore testing has not been done for almost a year.\n\nSecond is interview versus evidence. Interviews are useful because they give explanations and context. But interviews are weak if they stand alone. People may honestly believe a process is happening, or they may avoid admitting problems. In the case, the network administrator said monthly admin reviews are done, but there were no records. The security officer said logs are checked regularly, but also said reviews are not documented. When words and records do not match, the auditor should trust the evidence more than the interview.\n\nThis is why control testing is important. Control testing means the auditor checks how the control really operates. Examples are comparing system configuration with policy, matching resigned employees with active accounts, reviewing backup logs, and asking for restore-test documents. Without testing, the auditor is only collecting opinions.\n\nAuditors should also use different types of evidence. Documentary evidence includes policies, tickets, and reports. Technical evidence includes system settings, account extracts, and logs. Observational evidence includes seeing physical controls like a locked server room. Interview evidence includes explanations from staff. All can be useful, but when they conflict, technical and documentary evidence are usually stronger.\n\nAnother reason to keep testing is that risk can exist even when no incident is known. The absence of a reported breach does not mean the school is safe. An unused admin account can sit quietly for months until someone abuses it. A backup may look successful on a dashboard until the day the school needs to restore and discovers the file is incomplete. Waiting for an incident before reporting a weakness is already too late.\n\nProfessional judgment also matters. Management may pressure the auditor to rely on the previous “Satisfactory” rating or to avoid findings because it looks bad. The auditor should stay independent. Findings should be based on evidence: what was found (condition), what should have happened (criteria), why it happened (cause), what could go wrong (effect), and what should be fixed (recommendation).\n\nIn short, policies, confident interviews, and old audit ratings are not enough. An auditor must still independently examine and test controls to know if they are really working. For a university handling student information and online payments, this careful approach is necessary to protect the school and its users.",

    'Question 13 – Risk-Based Audit Strategy (10 points)' =>
        "ANSWER:\nA. Three issues to investigate immediately:\n1. Former employees with active accounts\n2. Administrator accounts with no owner / former-employee admins\n3. Failed backup jobs and missing restore testing\n\nB. Three issues to defer:\n1. Deep password-policy review beyond the MFA gaps already seen\n2. Very detailed historical log sampling after confirming records are missing\n3. Broad Wi-Fi/network testing not directly tied to the urgent identity and backup issues\n\nC. Evidence to request:\nCurrent user/admin account extract, HR resignation list, MFA status for admins, 30-day backup logs, latest restore-test document, and tickets for failed backups.\n\nD. Tests to perform:\nCompare resigned staff with active accounts; check admin owners and last login; confirm MFA for all admins; review failed backup handling; if time allows, request a sample restore test.\n\nE. Findings expected:\nActive accounts of former employees; orphaned or unused admin accounts; recoverability not assured; possible MFA exceptions.\n\nF. One issue for immediate escalation:\nAn active privileged account belonging to a former employee, or proof that a terminated account was recently used.\n\nG. Why this prioritization:\nWith only four hours left, I should focus on issues with high impact and easier exploitation (identity and admin access) and issues that can stop recovery during a disaster (backups). Other issues can still be reported using the evidence already available, but they do not need the same urgent deep testing before the closing meeting.",
];

foreach ($answers as $marker => $answerText) {
    $answerXml = wPara(' ', false, 40) . wPara($answerText, false, 120);
    $words = preg_split('/\s+/', $marker);
    $flex = '';
    foreach ($words as $w) {
        if ($flex !== '') {
            $flex .= '[\s\S]{0,80}?';
        }
        $flex .= preg_quote($w, '/');
    }
    $pattern = '/(<w:p\b[^>]*>[\s\S]*?' . $flex . '[\s\S]*?<\/w:p>)/u';
    $found = false;
    $xml2 = preg_replace_callback($pattern, function ($m) use ($answerXml, &$found) {
        if ($found) {
            return $m[0];
        }
        $found = true;
        return $m[0] . $answerXml;
    }, $xml, 1, $count);

    if ($count > 0) {
        $xml = $xml2;
        echo "INSERTED: $marker\n";
    } else {
        echo "MISS: $marker\n";
    }
}

$note = wPara('NOTE: Items 1–5 and 10–12 include how the control will be tested (sample, inspect, compare, reconcile), not only what document to request.', false, 100);
if (preg_match('/At least five questions must explain how the control will be tested/', $xml)) {
    $xml = preg_replace(
        '/(<w:p\b[^>]*>[\s\S]*?At least five questions must explain how the control will be tested[\s\S]*?<\/w:p>)/u',
        '$1' . $note,
        $xml,
        1
    );
}

file_put_contents($docPath, $xml);

@unlink($out);
$zip = new ZipArchive();
if ($zip->open($out, ZipArchive::CREATE) !== true) {
    fwrite(STDERR, "Cannot write $out\n");
    exit(1);
}
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($work, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);
foreach ($iterator as $file) {
    $path = $file->getPathname();
    $local = substr($path, strlen($work) + 1);
    $local = str_replace('\\', '/', $local);
    if ($file->isDir()) {
        $zip->addEmptyDir($local);
    } else {
        $zip->addFile($path, $local);
    }
}
$zip->close();

echo "OK=$out SIZE=" . filesize($out) . "\n";
