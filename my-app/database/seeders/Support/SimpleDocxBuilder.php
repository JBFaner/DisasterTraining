<?php

namespace Database\Seeders\Support;

use ZipArchive;

/**
 * Minimal OOXML (.docx) writer for seeded supporting documents.
 */
class SimpleDocxBuilder
{
    /** @var list<string> */
    private array $body = [];

    public function title(string $text): self
    {
        $this->body[] = $this->p($text, [
            'bold' => true,
            'size' => 32,
            'align' => 'center',
            'spaceAfter' => 240,
        ]);

        return $this;
    }

    public function subtitle(string $text): self
    {
        $this->body[] = $this->p($text, [
            'italic' => true,
            'size' => 22,
            'align' => 'center',
            'spaceAfter' => 120,
        ]);

        return $this;
    }

    public function heading(string $text, int $level = 1): self
    {
        $this->body[] = $this->p($text, [
            'bold' => true,
            'size' => $level === 1 ? 26 : 22,
            'spaceBefore' => 280,
            'spaceAfter' => 120,
        ]);

        return $this;
    }

    public function para(string $text): self
    {
        $this->body[] = $this->p($text, [
            'size' => 21,
            'spaceAfter' => 160,
            'align' => 'both',
        ]);

        return $this;
    }

    public function meta(string $text): self
    {
        $this->body[] = $this->p($text, [
            'size' => 20,
            'spaceAfter' => 60,
            'italic' => true,
        ]);

        return $this;
    }

    public function bullet(string $text): self
    {
        $this->body[] = $this->p('• '.$text, [
            'size' => 21,
            'spaceAfter' => 80,
            'indent' => 360,
        ]);

        return $this;
    }

    public function save(string $absolutePath): void
    {
        $dir = dirname($absolutePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            .'<w:body>'
            .implode('', $this->body)
            .'<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
            .'</w:body></w:document>';

        $contentTypes = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML;

        $rels = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
XML;

        $docRels = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>
XML;

        if (is_file($absolutePath)) {
            unlink($absolutePath);
        }

        $zip = new ZipArchive();
        if ($zip->open($absolutePath, ZipArchive::CREATE) !== true) {
            throw new \RuntimeException("Unable to create DOCX at {$absolutePath}");
        }

        $zip->addFromString('[Content_Types].xml', $contentTypes);
        $zip->addFromString('_rels/.rels', $rels);
        $zip->addFromString('word/document.xml', $documentXml);
        $zip->addFromString('word/_rels/document.xml.rels', $docRels);
        $zip->close();
    }

    /**
     * @param  array{bold?:bool,italic?:bool,size?:int,align?:string,spaceBefore?:int,spaceAfter?:int,indent?:int}  $opts
     */
    private function p(string $text, array $opts): string
    {
        $size = (int) ($opts['size'] ?? 21);
        $bold = ! empty($opts['bold']) ? '<w:b/>' : '';
        $italic = ! empty($opts['italic']) ? '<w:i/>' : '';
        $align = isset($opts['align']) ? '<w:jc w:val="'.htmlspecialchars($opts['align'], ENT_QUOTES | ENT_XML1).'"/>' : '';
        $spaceBefore = isset($opts['spaceBefore']) ? ' w:before="'.(int) $opts['spaceBefore'].'"' : '';
        $spaceAfter = isset($opts['spaceAfter']) ? ' w:after="'.(int) $opts['spaceAfter'].'"' : '';
        $indent = isset($opts['indent']) ? '<w:ind w:left="'.(int) $opts['indent'].'"/>' : '';
        $escaped = htmlspecialchars($text, ENT_QUOTES | ENT_XML1, 'UTF-8');

        return '<w:p>'
            .'<w:pPr>'.$align.$indent.'<w:spacing'.$spaceBefore.$spaceAfter.'/></w:pPr>'
            .'<w:r><w:rPr>'.$bold.$italic.'<w:sz w:val="'.$size.'"/><w:szCs w:val="'.$size.'"/></w:rPr>'
            .'<w:t xml:space="preserve">'.$escaped.'</w:t></w:r>'
            .'</w:p>';
    }
}
