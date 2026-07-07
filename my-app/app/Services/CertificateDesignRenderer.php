<?php

namespace App\Services;

class CertificateDesignRenderer
{
    /**
     * @param  array<string, mixed>|string|null  $design
     * @param  array<string, string>  $data
     */
    public function render(array|string|null $design, array $data = []): string
    {
        if (is_string($design)) {
            $design = json_decode($design, true);
        }

        if (! is_array($design) || empty($design['elements'])) {
            return '';
        }

        $width = (int) ($design['width'] ?? 800);
        $height = (int) ($design['height'] ?? 565);
        $backgroundColor = e((string) ($design['backgroundColor'] ?? '#ffffff'));
        $borderColor = e((string) ($design['borderColor'] ?? '#16a34a'));
        $borderWidth = max(0, (int) ($design['borderWidth'] ?? 2));

        $elementsHtml = '';
        foreach ($design['elements'] as $element) {
            if (! is_array($element)) {
                continue;
            }
            $elementsHtml .= $this->renderElement($element, $data);
        }

        return '<div class="certificate" style="position:relative; width:' . $width . 'px; height:' . $height . 'px; margin:0 auto; background:' . $backgroundColor . '; border:' . $borderWidth . 'px solid ' . $borderColor . '; box-sizing:border-box; overflow:hidden;">'
            . $elementsHtml
            . '</div>';
    }

    /**
     * @param  array<string, mixed>  $element
     * @param  array<string, string>  $data
     */
    protected function renderElement(array $element, array $data): string
    {
        $type = (string) ($element['type'] ?? 'text');
        $x = (float) ($element['x'] ?? 0);
        $y = (float) ($element['y'] ?? 0);
        $width = max(40, (float) ($element['width'] ?? 200));
        $fontSize = max(8, (int) ($element['fontSize'] ?? 16));
        $fontFamily = e((string) ($element['fontFamily'] ?? 'Georgia, serif'));
        $fontWeight = e((string) ($element['fontWeight'] ?? 'normal'));
        $color = e((string) ($element['color'] ?? '#0f172a'));
        $textAlign = in_array($element['textAlign'] ?? 'left', ['left', 'center', 'right'], true)
            ? $element['textAlign']
            : 'left';

        $content = '';
        if ($type === 'placeholder') {
            $key = (string) ($element['key'] ?? '');
            $content = e((string) ($data[$key] ?? '{' . $key . '}'));
        } else {
            $content = e((string) ($element['content'] ?? ''));
        }

        $left = $x - ($textAlign === 'center' ? $width / 2 : ($textAlign === 'right' ? $width : 0));

        return '<div style="position:absolute; left:' . $left . 'px; top:' . $y . 'px; width:' . $width . 'px; font-size:' . $fontSize . 'px; font-family:' . $fontFamily . '; font-weight:' . $fontWeight . '; color:' . $color . '; text-align:' . $textAlign . '; line-height:1.35; white-space:pre-wrap; word-break:break-word;">'
            . $content
            . '</div>';
    }

    /**
     * @return array<string, mixed>
     */
    public function defaultDesign(): array
    {
        return [
            'version' => 1,
            'width' => 800,
            'height' => 565,
            'backgroundColor' => '#ffffff',
            'borderColor' => '#16a34a',
            'borderWidth' => 2,
            'elements' => [
                [
                    'id' => 'title',
                    'type' => 'text',
                    'content' => 'Certificate of Completion',
                    'x' => 400,
                    'y' => 48,
                    'width' => 680,
                    'fontSize' => 34,
                    'fontFamily' => 'Georgia, serif',
                    'fontWeight' => 'bold',
                    'color' => '#16a34a',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'subtitle',
                    'type' => 'text',
                    'content' => 'This is to certify that',
                    'x' => 400,
                    'y' => 130,
                    'width' => 500,
                    'fontSize' => 18,
                    'fontFamily' => 'Georgia, serif',
                    'fontWeight' => 'normal',
                    'color' => '#334155',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'name',
                    'type' => 'placeholder',
                    'key' => 'name',
                    'x' => 400,
                    'y' => 190,
                    'width' => 560,
                    'fontSize' => 28,
                    'fontFamily' => 'Georgia, serif',
                    'fontWeight' => 'bold',
                    'color' => '#0f172a',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'completed',
                    'type' => 'text',
                    'content' => 'has successfully completed',
                    'x' => 400,
                    'y' => 250,
                    'width' => 500,
                    'fontSize' => 16,
                    'fontFamily' => 'Georgia, serif',
                    'fontWeight' => 'normal',
                    'color' => '#334155',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'training_type',
                    'type' => 'placeholder',
                    'key' => 'training_type',
                    'x' => 400,
                    'y' => 290,
                    'width' => 560,
                    'fontSize' => 20,
                    'fontFamily' => 'Georgia, serif',
                    'fontWeight' => 'bold',
                    'color' => '#0f172a',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'meta',
                    'type' => 'placeholder',
                    'key' => 'event',
                    'x' => 400,
                    'y' => 380,
                    'width' => 680,
                    'fontSize' => 14,
                    'fontFamily' => 'Arial, sans-serif',
                    'fontWeight' => 'normal',
                    'color' => '#475569',
                    'textAlign' => 'center',
                ],
                [
                    'id' => 'footer',
                    'type' => 'text',
                    'content' => 'Certificate No: {certificate_number}  |  Date: {date}  |  Score: {score}%',
                    'x' => 400,
                    'y' => 430,
                    'width' => 680,
                    'fontSize' => 13,
                    'fontFamily' => 'Arial, sans-serif',
                    'fontWeight' => 'normal',
                    'color' => '#64748b',
                    'textAlign' => 'center',
                ],
            ],
        ];
    }

    /**
     * Render design HTML while keeping merge placeholders intact.
     *
     * @param  array<string, mixed>|string|null  $design
     */
    public function renderWithPlaceholders(array|string|null $design): string
    {
        if (is_string($design)) {
            $design = json_decode($design, true);
        }

        if (! is_array($design) || empty($design['elements'])) {
            return '';
        }

        $placeholderData = [];
        foreach ($design['elements'] as $element) {
            if (! is_array($element) || ($element['type'] ?? '') !== 'placeholder') {
                continue;
            }
            $key = (string) ($element['key'] ?? '');
            if ($key !== '') {
                $placeholderData[$key] = '{' . $key . '}';
            }
        }

        return $this->render($design, $placeholderData);
    }

    /**
     * Replace inline placeholders inside static text elements before render.
     *
     * @param  array<string, mixed>  $design
     * @param  array<string, string>  $data
     * @return array<string, mixed>
     */
    public function applyDataToDesign(array $design, array $data): array
    {
        $next = $design;
        $next['elements'] = array_map(function ($element) use ($data) {
            if (! is_array($element)) {
                return $element;
            }

            if (($element['type'] ?? '') === 'text' && isset($element['content'])) {
                $content = (string) $element['content'];
                foreach ($data as $key => $value) {
                    $content = str_replace('{' . $key . '}', (string) $value, $content);
                }
                $element['content'] = $content;
            }

            return $element;
        }, $design['elements'] ?? []);

        return $next;
    }
}
