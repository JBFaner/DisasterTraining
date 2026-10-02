<?php
/**
 * Fill answers INTO Week_7_IT_Audit_2_Hour_Online_Activity.docx (in place).
 * Student-standard answers, same approach as prior IT Audit activity.
 */

$src = 'c:/Users/Rem/Downloads/Week_7_IT_Audit_2_Hour_Online_Activity.docx';
$out = $src;
$work = sys_get_temp_dir() . '/week7_fill_' . uniqid();
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

if (strpos($xml, 'Risk Assessment') !== false && strpos($xml, 'ANSWERED_WEEK7') !== false) {
    fwrite(STDERR, "Already filled. Aborting.\n");
    exit(2);
}

function esc($s) {
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

/** Replace exact text inside a single <w:t>...</w:t> occurrence */
function replaceOnce($xml, $from, $to, $label) {
    $fromEsc = esc($from);
    $toEsc = esc($to);
    $pos = strpos($xml, $fromEsc);
    if ($pos === false) {
        // try raw (already plain in xml)
        $pos = strpos($xml, $from);
        if ($pos === false) {
            echo "MISS: $label\n";
            return $xml;
        }
        $xml = substr_replace($xml, $to, $pos, strlen($from));
        echo "OK: $label\n";
        return $xml;
    }
    $xml = substr_replace($xml, $toEsc, $pos, strlen($fromEsc));
    echo "OK: $label\n";
    return $xml;
}

/** Replace a blank-only paragraph's underscore text with answer text (first match of exact underscores) */
function replaceBlankLine($xml, $underscores, $answer, $label) {
    return replaceOnce($xml, $underscores, $answer, $label);
}

// ---------- ACTIVITY 1 Part A ----------
$xml = replaceOnce(
    $xml,
    '1. Identifying the scope and objectives of the audit. Answer: __Planning ___________________',
    '1. Identifying the scope and objectives of the audit. Answer: Planning',
    'A1'
);
$xml = replaceOnce(
    $xml,
    '2. Identifying threats and vulnerabilities associated with the IT process. Answer: ______________________________',
    '2. Identifying threats and vulnerabilities associated with the IT process. Answer: Risk Assessment',
    'A2'
);
$xml = replaceOnce(
    $xml,
    '3. Collecting audit evidence through interviews, inspection, observation, and testing. Answer: ______________________________',
    '3. Collecting audit evidence through interviews, inspection, observation, and testing. Answer: Fieldwork',
    'A3'
);
$xml = replaceOnce(
    $xml,
    '4. Examining evidence to identify exceptions and weaknesses. Answer: ______________________________',
    '4. Examining evidence to identify exceptions and weaknesses. Answer: Analysis & Evaluation',
    'A4'
);
$xml = replaceOnce(
    $xml,
    '5. Communicating findings, risks, and recommendations to management. Answer: ______________________________',
    '5. Communicating findings, risks, and recommendations to management. Answer: Reporting',
    'A5'
);
$xml = replaceOnce(
    $xml,
    '6. Checking whether management implemented corrective actions. Answer: ______________________________',
    '6. Checking whether management implemented corrective actions. Answer: Follow-Up',
    'A6'
);

// ---------- ACTIVITY 1 Part B ----------
$xml = replaceOnce(
    $xml,
    '1. An auditor asks the system administrator how user accounts are created. Technique: __________________',
    '1. An auditor asks the system administrator how user accounts are created. Technique: Interview',
    'B1'
);
$xml = replaceOnce(
    $xml,
    '2. An auditor watches an employee perform the login process. Technique: __________________',
    '2. An auditor watches an employee perform the login process. Technique: Observation',
    'B2'
);
$xml = replaceOnce(
    $xml,
    "3. An auditor examines the organization's access-control policy. Technique: __________________",
    "3. An auditor examines the organization's access-control policy. Technique: Inspection",
    'B3'
);
$xml = replaceOnce(
    $xml,
    '4. An auditor follows one transaction from beginning to end. Technique: __________________',
    '4. An auditor follows one transaction from beginning to end. Technique: Walkthrough',
    'B4'
);
$xml = replaceOnce(
    $xml,
    '5. An auditor checks whether selected user accounts actually have the appropriate access. Technique: __________________',
    '5. An auditor checks whether selected user accounts actually have the appropriate access. Technique: Testing',
    'B5'
);
$xml = replaceOnce(
    $xml,
    '6. An auditor examines a selected group of transactions instead of every transaction. Technique: __________________',
    '6. An auditor examines a selected group of transactions instead of every transaction. Technique: Sampling',
    'B6'
);
$xml = replaceOnce(
    $xml,
    '7. An auditor examines thousands of login records to identify unusual activity. Technique: __________________',
    '7. An auditor examines thousands of login records to identify unusual activity. Technique: Data Analysis',
    'B7'
);

// Long blank line used repeatedly
$BLANK = str_repeat('_', 100);

// ---------- ACTIVITY 1 Part C (2 blank lines each) ----------
$cAnswers = [
    'Audit evidence is important because it supports the auditor’s conclusions and recommendations. Without enough reliable evidence, findings can be challenged and may be incorrect. Evidence also shows that the auditor followed a proper and professional audit process.',
    'Using more than one technique makes the results stronger and more reliable. One method alone may be incomplete, biased, or based only on what people say. Combining techniques such as interview, inspection, and testing helps confirm whether a control is really working.',
    'An anomaly is only an unusual item and may still have a valid explanation, such as a timing difference or an approved exception. Investigating first helps the auditor avoid false findings and protects credibility. A confirmed finding should be reported only after the auditor verifies that a control really failed or is weak.',
];

// After each Part C question there are exactly 2 blank lines — replace in document order
foreach ($cAnswers as $idx => $ans) {
    // First blank of the pair gets the answer; second blank cleared to a short continuation note or space
    $xml = replaceBlankLine($xml, $BLANK, $ans, 'C' . ($idx + 1) . 'a');
    $xml = replaceBlankLine($xml, $BLANK, ' ', 'C' . ($idx + 1) . 'b');
}

// ---------- ACTIVITY 2 (5 questions × 3 blanks) ----------
$a2 = [
    [
        'Primary objective: To determine whether access to the Student Information System (SIS) is limited to authorized employees only, and whether account termination, access review, and related controls are operating effectively to protect student grades and personal data.',
        'The audit should also check if login activity and user records support compliance with the university’s access policy.',
        ' ',
    ],
    [
        'Risk 1: Unauthorized access — former employees still have active accounts, and some accounts were used after they left, so confidential student records may be viewed or changed without authority.',
        'Risk 2: Weak access governance — duplicate user records and no documented regular access reviews increase the chance of excess privileges, identity errors, and undetected misuse.',
        ' ',
    ],
    [
        '1) Interview/Inquiry — ask IT how accounts are created and removed. 2) Inspection — review the access-control policy and current user-access list. 3) Testing — compare terminated employees with still-active accounts.',
        '4) Data Analysis — examine login logs for activity after termination and identify duplicate user records. These techniques fit because the case involves policy claims, system lists, and log evidence.',
        ' ',
    ],
    [
        '1) Current user-access list from the SIS/directory. 2) HR termination/resignation list with leave dates. 3) Login logs showing use of former-employee accounts.',
        '4) Access-control policy and any records (or lack of records) of periodic access reviews; also the duplicate-user report found by the auditor.',
        ' ',
    ],
    [
        'Control weakness: The employee termination and periodic access-review controls are not operating effectively. Former employees remain active, some accounts were used after exit, and management cannot show regular access reviews.',
        'Corrective action: Immediately disable former-employee accounts and investigate post-termination logins. Implement a same-day offboarding process between HR and IT, remove duplicate accounts, and require documented periodic access reviews with evidence retained.',
        ' ',
    ],
];

foreach ($a2 as $qi => $lines) {
    foreach ($lines as $li => $text) {
        $xml = replaceBlankLine($xml, $BLANK, $text, 'A2-Q' . ($qi + 1) . '-' . ($li + 1));
    }
}

// ---------- ACTIVITY 3 Part A ----------
$xml = replaceBlankLine(
    $xml,
    $BLANK,
    'Audit objective: To evaluate whether the college’s IT controls for user access, password security, backups, and transaction integrity are designed and operating effectively to protect college systems and data.',
    'A3-A1a'
);
$xml = replaceBlankLine($xml, $BLANK, ' ', 'A3-A1b');

$xml = replaceOnce(
    $xml,
    '2. Major Risks: a. __________________  b. __________________',
    '2. Major Risks: a. Unauthorized access / account misuse  b. Data loss from failed backups',
    'A3-A2'
);
$xml = replaceBlankLine(
    $xml,
    $BLANK,
    'Other related risks: weak password settings (180 days) and integrity issues from duplicate transactions.',
    'A3-A2a'
);
$xml = replaceBlankLine($xml, $BLANK, ' ', 'A3-A2b');

$xml = replaceOnce(
    $xml,
    '3. Expected Controls: a. __________________  b. __________________',
    '3. Expected Controls: a. Disable accounts on termination + monthly access review  b. Monitored successful backups / restore testing',
    'A3-A3'
);
$xml = replaceBlankLine(
    $xml,
    $BLANK,
    'Also expected: enforced password policy aligned with best practice, and controls to prevent/detect duplicate transactions.',
    'A3-A3a'
);
$xml = replaceBlankLine($xml, $BLANK, ' ', 'A3-A3b');

// ---------- ACTIVITY 3 Part B table (4 rows × technique + reason) ----------
// Each blank cell is exactly 16 underscores
$shortBlank = '________________';
$tableFills = [
    ['Inspection / Testing', 'Compare active accounts with HR termination list; check recent logins'],
    ['Inspection / Testing', 'Review backup logs, failure tickets, and restore-test records'],
    ['Data Analysis / Testing', 'Use CAATs to match duplicate IDs, amounts, or timestamps'],
    ['Inspection', 'Compare system password settings with the written policy'],
];
foreach ($tableFills as $ri => $pair) {
    $xml = replaceOnce($xml, $shortBlank, $pair[0], "A3-B-tech-$ri");
    $xml = replaceOnce($xml, $shortBlank, $pair[1], "A3-B-reason-$ri");
}

// ---------- ACTIVITY 3 Part C ----------
$a3c = [
    [
        'Immediate investigation: active accounts of former employees AND login logs showing that inactive/former accounts were used recently. This shows possible unauthorized access right now.',
        'Failed backups and duplicate transactions are also important, but the live access issue should be handled first because the risk is ongoing.',
    ],
    [
        'Duplicate detection / matching analysis (audit data analysis / CAAT). The auditor can sort and match records by transaction ID, amount, date/time, and user to find exact or near duplicates.',
        'Exception reports from the system can also be used to list repeated transactions for further testing.',
    ],
    [
        'Filter login logs by account status, termination date, unusual time-of-day, failed vs successful logins, and unusual IP/location. Focus on accounts marked inactive or belonging to former employees.',
        'Compare spikes in activity and logins after the employee’s last day to spot misuse quickly.',
    ],
    [
        'Collect: HR termination list with exact leave dates; full current user-access extract; written password policy and system password configuration; backup job logs and tickets for the two failures; restore-test evidence;',
        'and management explanation/records for monthly access reviews and how duplicate transactions are prevented or corrected.',
    ],
];
foreach ($a3c as $qi => $lines) {
    foreach ($lines as $li => $text) {
        $xml = replaceBlankLine($xml, $BLANK, $text, 'A3-C' . ($qi + 1) . '-' . ($li + 1));
    }
}

// ---------- ACTIVITY 3 Part D ----------
$xml = replaceBlankLine(
    $xml,
    $BLANK,
    'Recommendation 1: Immediately disable the 10 former-employee accounts and investigate all recent logins on those accounts. Implement a same-day HR–IT offboarding process and document monthly access reviews with retained evidence.',
    'A3-D1a'
);
$xml = replaceBlankLine($xml, $BLANK, ' ', 'A3-D1b');

$xml = replaceBlankLine(
    $xml,
    $BLANK,
    'Recommendation 2: Investigate the two failed backups, fix monitoring/alerting, and perform a documented restore test. Strengthen password settings (shorter than 180 days where policy requires) and analyze/correct duplicate transactions with preventive controls.',
    'A3-D2a'
);
$xml = replaceBlankLine($xml, $BLANK, ' ', 'A3-D2b');

// ---------- ACTIVITY 4 Essay ----------
$essayTitle = 'Essay Title: The Importance of a Systematic IT Audit Process';
$xml = replaceOnce(
    $xml,
    'Essay Title: ______________________________________________',
    $essayTitle,
    'EssayTitle'
);

$essayParas = [
    'An IT audit is conducted to determine whether information systems and related controls protect the confidentiality, integrity, and availability of data. In schools and organizations, this matters because systems hold grades, personal information, finances, and other sensitive records. A systematic process is important because it keeps the auditor focused, consistent, and fair. Without a clear process, the audit may miss high risks, rely on assumptions, or produce conclusions that cannot be supported.',
    'The major phases of an IT audit usually include planning, risk assessment, fieldwork, analysis and evaluation, reporting, and follow-up. Planning defines the scope and objectives. Risk assessment identifies threats and vulnerabilities so testing time is used well. Fieldwork is where evidence is collected through interviews, inspection, observation, walkthroughs, testing, sampling, and data analysis. Analysis and evaluation turn that evidence into exceptions and control weaknesses. Reporting communicates findings, risks, causes, and recommendations to management. Follow-up checks whether corrective actions were really implemented.',
    'Reliable audit evidence is the foundation of trustworthy results. Evidence should be sufficient, relevant, and competent. System lists, logs, and configuration settings are usually stronger than verbal claims alone. That is why auditors should use more than one technique when appropriate. For example, an interview can explain how accounts are created, inspection can confirm the written policy, and testing can prove whether selected accounts actually have the correct access. Data analysis is especially useful for large volumes of records, such as login history or duplicate transactions, because it can quickly highlight unusual patterns.',
    'Auditors must also separate an anomaly from a confirmed finding. An anomaly is an unusual item that needs investigation. It becomes a confirmed finding only after the auditor verifies that a control failed or is weak and that the issue has real risk. Reporting too early can create false findings; waiting without investigation can allow real problems to continue.',
    'Finally, professional communication is essential. A good audit report clearly states the finding, the related risk, the likely cause, and practical recommendations. This helps management understand what to fix and allows follow-up to verify improvement. When phases, techniques, evidence, analysis, and reporting work together, the IT audit produces reliable and useful results instead of opinions based on incomplete information.',
];

foreach ($essayParas as $i => $p) {
    $xml = replaceBlankLine($xml, $BLANK, $p, 'Essay-' . ($i + 1));
}
// remaining essay blank lines -> clear
$cleared = 0;
while (strpos($xml, esc($BLANK)) !== false || strpos($xml, $BLANK) !== false) {
    $before = $xml;
    $xml = replaceBlankLine($xml, $BLANK, ' ', 'Essay-clear-' . $cleared);
    if ($xml === $before) {
        break;
    }
    $cleared++;
    if ($cleared > 20) {
        break;
    }
}

// ---------- Submission block ----------
$xml = replaceOnce(
    $xml,
    'Name: ______________________________________________',
    'Name: Reymon S.A. Brogada',
    'Name'
);
$xml = replaceOnce(
    $xml,
    'Section: _____________________________________________',
    'Section: IT Audit',
    'Section'
);
$xml = replaceOnce(
    $xml,
    'Date: ________________________________________________',
    'Date: September 10, 2026',
    'Date'
);

// Marker so we don't double-fill
$xml = str_replace(
    '</w:body>',
    '<w:p><w:r><w:t xml:space="preserve">ANSWERED_WEEK7</w:t></w:r></w:p></w:body>',
    $xml
);

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
    $local = str_replace('\\', '/', substr($path, strlen($work) + 1));
    if ($file->isDir()) {
        $zip->addEmptyDir($local);
    } else {
        $zip->addFile($path, $local);
    }
}
$zip->close();

echo "OK=$out SIZE=" . filesize($out) . "\n";
