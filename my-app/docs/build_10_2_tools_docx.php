<?php
/**
 * Build Section 10.2 Tools and Technologies Used as Word (.docx).
 * Source: 10.2_Tools_and_Technologies_Used.md
 * Output: 10.2_Tools_and_Technologies_Used.docx
 */
$docsDir = __DIR__;
$sourceMd = $docsDir . DIRECTORY_SEPARATOR . '10.2_Tools_and_Technologies_Used.md';
$outDocx = $docsDir . DIRECTORY_SEPARATOR . '10.2_Tools_and_Technologies_Used.docx';

function xml($s)
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function stripInlineMd($text)
{
    $text = preg_replace('/\*\*(.+?)\*\*/', '$1', $text);
    $text = preg_replace('/`([^`]+)`/', '$1', $text);

    return trim($text);
}

function inlineRuns($text)
{
    $parts = preg_split('/(\*\*.+?\*\*)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    $xml = '';
    foreach ($parts as $part) {
        if ($part === '') {
            continue;
        }
        if (preg_match('/^\*\*(.+)\*\*$/', $part, $m)) {
            $xml .= '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">' . xml($m[1]) . '</w:t></w:r>';
        } else {
            $plain = preg_replace('/`([^`]+)`/', '$1', $part);
            $xml .= '<w:r><w:t xml:space="preserve">' . xml($plain) . '</w:t></w:r>';
        }
    }

    return $xml !== '' ? $xml : '<w:r><w:t></w:t></w:r>';
}

function p($text, $style = 'Normal')
{
    return '<w:p><w:pPr><w:pStyle w:val="' . $style . '"/></w:pPr>' . inlineRuns($text) . '</w:p>';
}

function tableXml($rows)
{
    if (!$rows) {
        return '';
    }

    $cols = max(array_map('count', $rows));
    $width = (int) floor(9000 / max(1, $cols));
    $xml = '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>'
        . '<w:top w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '<w:left w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '<w:bottom w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '<w:right w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '<w:insideH w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '<w:insideV w:val="single" w:sz="4" w:color="94A3B8"/>'
        . '</w:tblBorders></w:tblPr><w:tblGrid>';
    for ($i = 0; $i < $cols; $i++) {
        $xml .= '<w:gridCol w:w="' . $width . '"/>';
    }
    $xml .= '</w:tblGrid>';

    foreach ($rows as $rIndex => $cells) {
        $xml .= '<w:tr>';
        for ($i = 0; $i < $cols; $i++) {
            $cell = stripInlineMd($cells[$i] ?? '');
            $shd = $rIndex === 0 ? '<w:shd w:val="clear" w:fill="F1F5F9"/>' : '';
            $bold = $rIndex === 0 ? '<w:rPr><w:b/><w:sz w:val="18"/></w:rPr>' : '<w:rPr><w:sz w:val="18"/></w:rPr>';
            $xml .= '<w:tc><w:tcPr><w:tcW w:w="' . $width . '" w:type="dxa"/>' . $shd . '</w:tcPr><w:p>'
                . '<w:r>' . $bold . '<w:t xml:space="preserve">' . xml($cell) . '</w:t></w:r></w:p></w:tc>';
        }
        $xml .= '</w:tr>';
    }

    return $xml . '</w:tbl>' . p('');
}

function md_to_word($md)
{
    $lines = preg_split("/\r\n|\n|\r/", $md);
    $out = '';
    $inTable = false;
    $tableRows = [];
    $inCode = false;
    $codeLang = '';

    $flushTable = function () use (&$out, &$inTable, &$tableRows) {
        if (!$inTable) {
            return;
        }
        $out .= tableXml($tableRows);
        $inTable = false;
        $tableRows = [];
    };

    foreach ($lines as $line) {
        $trim = rtrim($line);

        if (preg_match('/^```(\w*)$/', $trim, $m)) {
            if (!$inCode) {
                $flushTable();
                $inCode = true;
                $codeLang = strtolower($m[1] ?? '');
            } else {
                $inCode = false;
                if ($codeLang === 'mermaid') {
                    $out .= p('[Diagram: Technology Stack by Layer — Client, Application, Data, and External Services. See repository documentation for the full Mermaid figure.]');
                }
                $codeLang = '';
            }
            continue;
        }
        if ($inCode) {
            continue;
        }

        if (preg_match('/^\|(.+)\|$/', $trim)) {
            if (preg_match('/^\|\s*-+/', $trim)) {
                continue;
            }
            $inTable = true;
            $cells = array_map('trim', explode('|', trim($trim, '|')));
            $tableRows[] = $cells;
            continue;
        }

        $flushTable();

        if ($trim === '') {
            $out .= p('');
            continue;
        }
        if (preg_match('/^# (.+)$/', $trim, $m)) {
            $out .= p($m[1], 'Heading1');
            continue;
        }
        if (preg_match('/^## (.+)$/', $trim, $m)) {
            $out .= p($m[1], 'Heading2');
            continue;
        }
        if (preg_match('/^### (.+)$/', $trim, $m)) {
            $out .= p($m[1], 'Heading3');
            continue;
        }
        if (preg_match('/^---+$/', $trim)) {
            $out .= '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/></w:pBdr></w:pPr></w:p>';
            continue;
        }
        if (preg_match('/^[-*] `([^`]+)`/', $trim, $m)) {
            $out .= p('• ' . stripInlineMd($trim));
            continue;
        }
        if (preg_match('/^[-*] (.+)$/', $trim, $m)) {
            $out .= p('• ' . stripInlineMd($m[1]));
            continue;
        }
        if (preg_match('/^\d+\. (.+)$/', $trim, $m)) {
            $out .= p(stripInlineMd($trim));
            continue;
        }

        $out .= p(stripInlineMd($trim));
    }

    $flushTable();

    return $out;
}

if (!is_file($sourceMd)) {
    fwrite(STDERR, "Missing source markdown: $sourceMd\n");
    exit(1);
}

$md = file_get_contents($sourceMd);
if (substr($md, 0, 3) === "\xEF\xBB\xBF") {
    $md = substr($md, 3);
}

$body = md_to_word($md);

$documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    . '<w:body>' . $body
    . '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
    . '</w:body></w:document>';

$contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    . '<Default Extension="xml" ContentType="application/xml"/>'
    . '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    . '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    . '</Types>';

$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    . '</Relationships>';

$docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    . '</Relationships>';

$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    . '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>'
    . '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F766E"/></w:rPr></w:style>'
    . '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="134E4A"/></w:rPr></w:style>'
    . '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="115E59"/></w:rPr></w:style>'
    . '</w:styles>';

if (is_file($outDocx)) {
    unlink($outDocx);
}

$zip = new ZipArchive();
if ($zip->open($outDocx, ZipArchive::CREATE) !== true) {
    fwrite(STDERR, "Cannot create zip\n");
    exit(1);
}

$zip->addFromString('[Content_Types].xml', $contentTypes);
$zip->addFromString('_rels/.rels', $rels);
$zip->addFromString('word/document.xml', $documentXml);
$zip->addFromString('word/_rels/document.xml.rels', $docRels);
$zip->addFromString('word/styles.xml', $styles);
$zip->close();

echo 'DOCX_OK=' . $outDocx . PHP_EOL;
echo 'SIZE=' . filesize($outDocx) . PHP_EOL;
