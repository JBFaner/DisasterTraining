<?php
$path = 'c:/Users/Rem/Downloads/Chapter-3-Scrum-Artifacts-AlertaraQC-updated.docx';
$zip = new ZipArchive();
$zip->open($path);
$xml = $zip->getFromName('word/document.xml');
$zip->close();
$terms = ['Allocation', 'Resource Allocation', 'Group 3', 'reserve API', 'ResourceAllocation', 'Sprint 7', 'DFD', 'Lead Trainer', 'Role access', 'BPMN', 'Week 4'];
foreach ($terms as $t) {
    echo $t . ': ' . (stripos($xml, $t) !== false ? 'YES' : 'no') . "\n";
}
