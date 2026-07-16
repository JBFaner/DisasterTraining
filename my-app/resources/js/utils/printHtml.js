/**
 * Print HTML via a hidden iframe (avoids pop-up blockers).
 * Same approach used by Participant Registry.
 */
export function printHtmlDocument(html, title = 'Print') {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', title);
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) {
        iframe.remove();
        return false;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    try {
        frameWindow.focus();
        frameWindow.print();
    } finally {
        window.setTimeout(() => {
            try {
                iframe.remove();
            } catch {
                // ignore
            }
        }, 1000);
    }

    return true;
}

export function escapePrintHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildPrintTableDocument({
    title,
    subtitle = '',
    headers = [],
    rows = [],
    emptyMessage = 'No records match the current filters.',
}) {
    const headerHtml = headers.map((h) => `<th>${escapePrintHtml(h)}</th>`).join('');
    const bodyHtml = rows.length
        ? rows.map((cells) => `<tr>${cells.map((cell) => `<td>${escapePrintHtml(cell)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${Math.max(headers.length, 1)}" style="text-align:center;padding:24px;">${escapePrintHtml(emptyMessage)}</td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapePrintHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #475569; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>${escapePrintHtml(title)}</h1>
  ${subtitle ? `<p>${escapePrintHtml(subtitle)}</p>` : ''}
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`;
}
