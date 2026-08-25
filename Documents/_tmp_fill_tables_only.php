<?php
/**
 * Fill ONLY the empty Q1/Q2 tables (answers already inserted).
 * Fixes false match of w:tcW as w:t.
 */

$src = 'c:/Users/Rem/Downloads/IT_Audit_Performance_Activity.docx';
$out = $src;
$work = sys_get_temp_dir() . '/it_audit_tbl_' . uniqid();
mkdir($work);

$zip = new ZipArchive();
if ($zip->open($src) !== true) {
    fwrite(STDERR, "Cannot open\n");
    exit(1);
}
$zip->extractTo($work);
$zip->close();

$docPath = $work . '/word/document.xml';
$xml = file_get_contents($docPath);

function esc($s) {
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

/** Match real w:t only, not w:tcW / w:tr / etc. */
function wtPattern($inner = true) {
    return $inner
        ? '/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/'
        : '/<w:t(?:\s[^>]*)?>\S/';
}

function cellHasText($inner) {
    return (bool) preg_match('/<w:t(?:\s[^>]*)?>\S/', $inner);
}

function cellPlainText($inner) {
    if (!preg_match_all('/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/', $inner, $ft)) {
        return '';
    }
    return trim(html_entity_decode(implode('', $ft[1]), ENT_QUOTES | ENT_XML1, 'UTF-8'));
}

function fillCell($cellInnerXml, $text) {
    $tcPr = '';
    if (preg_match('/(<w:tcPr>[\s\S]*?<\/w:tcPr>)/', $cellInnerXml, $m)) {
        $tcPr = $m[1];
    }
    return $tcPr
        . '<w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r>'
        . '<w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>'
        . '<w:t xml:space="preserve">' . esc($text) . '</w:t></w:r></w:p>';
}

function fillTableRows($tableXml, array $rowData) {
    if (!preg_match_all('/<w:tr[\s>][\s\S]*?<\/w:tr>/', $tableXml, $trMatches)) {
        return $tableXml;
    }
    $rows = $trMatches[0];
    $dataIdx = 0;

    for ($i = 0; $i < count($rows); $i++) {
        $row = $rows[$i];
        if (!preg_match_all('/<w:tc[\s>]([\s\S]*?)<\/w:tc>/', $row, $tcMatches)) {
            continue;
        }
        $cells = $tcMatches[0];
        $inners = $tcMatches[1];

        $firstText = cellPlainText($inners[0]);
        $isNumbered = (bool) preg_match('/^\d{1,2}$/', $firstText);

        $allEmptyAfterFirst = true;
        for ($c = 1; $c < count($inners); $c++) {
            if (cellHasText($inners[$c])) {
                $allEmptyAfterFirst = false;
                break;
            }
        }
        $fullyEmpty = true;
        foreach ($inners as $inn) {
            if (cellHasText($inn)) {
                $fullyEmpty = false;
                break;
            }
        }

        // Skip header rows (have many labels)
        $rowPlain = '';
        foreach ($inners as $inn) {
            $rowPlain .= ' ' . cellPlainText($inn);
        }
        if (preg_match('/Audit Area|Expected Control|Test Procedure|Actual Condition/', $rowPlain)
            && !$isNumbered) {
            continue;
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
        echo "Filled row i=$i dataIdx=" . ($dataIdx - 1) . " numbered=" . ($isNumbered ? 'Y' : 'N') . " first=[$firstText]\n";
    }

    $i = 0;
    return preg_replace_callback('/<w:tr[\s>][\s\S]*?<\/w:tr>/', function ($m) use (&$i, $rows) {
        return $rows[$i++];
    }, $tableXml);
}

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
    ['Relying only on previous Satisfactory audit', 'CIO says reuse previous audit because nothing changed', 'Current controls should still be tested this period', 'Old rating is treated like current proof', 'False confidence; problems today may be missed'],
];

if (!preg_match_all('/<w:tbl>[\s\S]*?<\/w:tbl>/', $xml, $tblMatches)) {
    fwrite(STDERR, "No tables\n");
    exit(1);
}
$tables = $tblMatches[0];
$q1Idx = null;
$q2Idx = null;
foreach ($tables as $idx => $t) {
    if (strpos($t, 'Audit Area') !== false && strpos($t, 'Test Procedure') !== false) {
        $q1Idx = $idx;
    }
    if (strpos($t, 'Actual Condition') !== false) {
        $q2Idx = $idx;
    }
}
echo "Q1=$q1Idx Q2=$q2Idx\n";

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

file_put_contents($docPath, $xml);

@unlink($out);
$zip = new ZipArchive();
$zip->open($out, ZipArchive::CREATE);
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($work, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);
foreach ($iterator as $file) {
    $path = $file->getPathname();
    $local = str_replace('\\', '/', substr($path, strlen($work) + 1));
    if ($file->isDir()) {
        $zip->addEmptyDir($local);
    } else {
        $zip->addFile($path, $local);
    }
}
$zip->close();
echo "OK SIZE=" . filesize($out) . "\n";
