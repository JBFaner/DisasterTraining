<?php
$pdf = 'c:/Users/Rem/Downloads/CHAPTER 1 -5.pdf';
$raw = file_get_contents($pdf);

// Pull text from PDF literal strings in BT...ET blocks (rough)
$chunks = [];
if (preg_match_all('/\(([^\\\\()]{8,200})\)/', $raw, $m)) {
    foreach ($m[1] as $s) {
        $s = str_replace(['\\(', '\\)', '\\\\'], ['(', ')', '\\'], $s);
        if (preg_match('/[A-Za-z]{4,}/', $s)) {
            $chunks[] = $s;
        }
    }
}

$joined = implode(' ', $chunks);
$keywords = ['Closing Remarks', 'Key Takeaways', 'Future Work', 'Project Achievements', 'Alertara', 'disaster', 'Gemini', 'Barangay', 'LGU', 'team', 'gratitude', 'panel', 'capstone'];
$hits = [];
foreach ($chunks as $c) {
    foreach ($keywords as $k) {
        if (stripos($c, $k) !== false) {
            $hits[] = $c;
            break;
        }
    }
}

echo "=== RELEVANT STRING CHUNKS ===\n";
echo implode("\n---\n", array_unique(array_slice($hits, 0, 60)));

echo "\n\n=== SEARCH Closing Remarks CONTEXT ===\n";
$pos = stripos($joined, 'Closing Remarks');
if ($pos !== false) {
    echo substr($joined, max(0, $pos - 500), 2000);
}

echo "\n\n=== SEARCH 13.4 CONTEXT ===\n";
$pos = stripos($joined, '13.4');
if ($pos !== false) {
    echo substr($joined, max(0, $pos - 200), 2500);
}
