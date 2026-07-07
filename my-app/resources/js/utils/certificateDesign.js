export const CERTIFICATE_PLACEHOLDERS = [
    { key: 'name', label: 'Participant name' },
    { key: 'date', label: 'Completion date' },
    { key: 'event', label: 'Event title' },
    { key: 'certificate_number', label: 'Certificate number' },
    { key: 'score', label: 'Score' },
    { key: 'training_type', label: 'Training type' },
];

export const CERTIFICATE_FONT_OPTIONS = [
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
    { value: '"Segoe UI", Tahoma, sans-serif', label: 'Segoe UI' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
];

export const SAMPLE_CERTIFICATE_DATA = {
    name: 'Juan Dela Cruz',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    event: 'Sample Simulation Event',
    certificate_number: `CERT-${new Date().getFullYear()}-00001`,
    score: '85',
    training_type: 'Disaster Preparedness Training',
};

export const DEFAULT_CERTIFICATE_DESIGN = {
    version: 1,
    width: 800,
    height: 565,
    backgroundColor: '#ffffff',
    borderColor: '#16a34a',
    borderWidth: 2,
    elements: [
        {
            id: 'title',
            type: 'text',
            content: 'Certificate of Completion',
            x: 400,
            y: 48,
            width: 680,
            fontSize: 34,
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold',
            color: '#16a34a',
            textAlign: 'center',
        },
        {
            id: 'subtitle',
            type: 'text',
            content: 'This is to certify that',
            x: 400,
            y: 130,
            width: 500,
            fontSize: 18,
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#334155',
            textAlign: 'center',
        },
        {
            id: 'name',
            type: 'placeholder',
            key: 'name',
            x: 400,
            y: 190,
            width: 560,
            fontSize: 28,
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold',
            color: '#0f172a',
            textAlign: 'center',
        },
        {
            id: 'completed',
            type: 'text',
            content: 'has successfully completed',
            x: 400,
            y: 250,
            width: 500,
            fontSize: 16,
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#334155',
            textAlign: 'center',
        },
        {
            id: 'training_type',
            type: 'placeholder',
            key: 'training_type',
            x: 400,
            y: 290,
            width: 560,
            fontSize: 20,
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold',
            color: '#0f172a',
            textAlign: 'center',
        },
        {
            id: 'meta',
            type: 'placeholder',
            key: 'event',
            x: 400,
            y: 380,
            width: 680,
            fontSize: 14,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#475569',
            textAlign: 'center',
        },
        {
            id: 'footer',
            type: 'text',
            content: 'Certificate No: {certificate_number}  |  Date: {date}  |  Score: {score}%',
            x: 400,
            y: 430,
            width: 680,
            fontSize: 13,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#64748b',
            textAlign: 'center',
        },
    ],
};

export function createElementId(prefix = 'el') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseCertificateDesign(input) {
    if (!input) {
        return structuredClone(DEFAULT_CERTIFICATE_DESIGN);
    }

    let design = input;
    if (typeof design === 'string') {
        try {
            design = JSON.parse(design);
        } catch {
            return structuredClone(DEFAULT_CERTIFICATE_DESIGN);
        }
    }

    if (!design || !Array.isArray(design.elements)) {
        return structuredClone(DEFAULT_CERTIFICATE_DESIGN);
    }

    return {
        ...DEFAULT_CERTIFICATE_DESIGN,
        ...design,
        elements: design.elements.map((element) => ({ ...element })),
    };
}

export function getElementDisplayText(element, sampleData, previewMode = true) {
    if (!element) {
        return '';
    }

    if (element.type === 'placeholder') {
        const key = element.key || '';
        if (previewMode && sampleData?.[key]) {
            return sampleData[key];
        }
        return `{${key}}`;
    }

    let content = element.content || '';
    if (previewMode && sampleData) {
        Object.entries(sampleData).forEach(([key, value]) => {
            content = content.split(`{${key}}`).join(String(value));
        });
    }

    return content;
}

export function getElementStyle(element) {
    const width = Math.max(40, Number(element.width) || 200);
    const textAlign = ['left', 'center', 'right'].includes(element.textAlign) ? element.textAlign : 'left';
    const x = Number(element.x) || 0;
    const y = Number(element.y) || 0;
    const left = x - (textAlign === 'center' ? width / 2 : textAlign === 'right' ? width : 0);

    return {
        position: 'absolute',
        left: `${left}px`,
        top: `${y}px`,
        width: `${width}px`,
        fontSize: `${Math.max(8, Number(element.fontSize) || 16)}px`,
        fontFamily: element.fontFamily || 'Georgia, serif',
        fontWeight: element.fontWeight || 'normal',
        color: element.color || '#0f172a',
        textAlign,
        lineHeight: 1.35,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: 'move',
        userSelect: 'none',
    };
}

export function createTextElement(content = 'New text') {
    return {
        id: createElementId('text'),
        type: 'text',
        content,
        x: 400,
        y: 200,
        width: 400,
        fontSize: 18,
        fontFamily: 'Georgia, serif',
        fontWeight: 'normal',
        color: '#0f172a',
        textAlign: 'center',
    };
}

export function createPlaceholderElement(key = 'name') {
    const placeholder = CERTIFICATE_PLACEHOLDERS.find((item) => item.key === key) || CERTIFICATE_PLACEHOLDERS[0];

    return {
        id: createElementId('ph'),
        type: 'placeholder',
        key: placeholder.key,
        x: 400,
        y: 240,
        width: 400,
        fontSize: 22,
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
    };
}
