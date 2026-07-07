import React from 'react';
import {
    Type,
    Braces,
    Trash2,
    Eye,
    EyeOff,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Plus,
} from 'lucide-react';
import {
    CERTIFICATE_FONT_OPTIONS,
    CERTIFICATE_PLACEHOLDERS,
    DEFAULT_CERTIFICATE_DESIGN,
    SAMPLE_CERTIFICATE_DATA,
    createPlaceholderElement,
    createTextElement,
    getElementDisplayText,
    getElementStyle,
    parseCertificateDesign,
} from '../utils/certificateDesign';

function CanvasElement({
    element,
    selected,
    previewMode,
    sampleData,
    onSelect,
    onDragStart,
}) {
    const isPlaceholder = element.type === 'placeholder';
    const displayText = getElementDisplayText(element, sampleData, previewMode);

    return (
        <div
            role="button"
            tabIndex={0}
            onMouseDown={(event) => {
                event.stopPropagation();
                onSelect(element.id);
                onDragStart(event, element.id);
            }}
            style={getElementStyle(element)}
            className={`rounded-sm px-1 py-0.5 transition-shadow ${
                selected
                    ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-50/40'
                    : isPlaceholder
                        ? 'bg-sky-50/60 hover:bg-sky-50'
                        : 'hover:bg-slate-50/60'
            }`}
        >
            {displayText || ' '}
        </div>
    );
}

export function CertificateTemplateDesigner({
    value,
    onChange,
    backgroundPreviewUrl = null,
    backgroundOpacity = 0.35,
}) {
    const canvasRef = React.useRef(null);
    const dragRef = React.useRef(null);
    const design = React.useMemo(() => parseCertificateDesign(value), [value]);
    const [selectedId, setSelectedId] = React.useState(null);
    const [previewMode, setPreviewMode] = React.useState(true);
    const [scale, setScale] = React.useState(1);

    const setDesign = React.useCallback((updater) => {
        const next = typeof updater === 'function' ? updater(parseCertificateDesign(value)) : updater;
        onChange?.(next);
    }, [onChange, value]);

    React.useEffect(() => {
        const updateScale = () => {
            if (!canvasRef.current?.parentElement) {
                return;
            }
            const available = canvasRef.current.parentElement.clientWidth - 24;
            setScale(Math.min(1, available / (design.width || DEFAULT_CERTIFICATE_DESIGN.width)));
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [design.width]);

    const selectedElement = design.elements.find((element) => element.id === selectedId) || null;

    const updateDesign = (patch) => {
        setDesign((current) => ({ ...current, ...patch }));
    };

    const updateElement = (id, patch) => {
        setDesign((current) => ({
            ...current,
            elements: current.elements.map((element) => (
                element.id === id ? { ...element, ...patch } : element
            )),
        }));
    };

    const removeElement = (id) => {
        setDesign((current) => ({
            ...current,
            elements: current.elements.filter((element) => element.id !== id),
        }));
        if (selectedId === id) {
            setSelectedId(null);
        }
    };

    const handleDragStart = (event, elementId) => {
        const element = design.elements.find((item) => item.id === elementId);
        if (!element || !canvasRef.current) {
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        dragRef.current = {
            elementId,
            startX: event.clientX,
            startY: event.clientY,
            originX: element.x,
            originY: element.y,
            scale,
            rect,
        };

        const handleMove = (moveEvent) => {
            const drag = dragRef.current;
            if (!drag) {
                return;
            }

            const deltaX = (moveEvent.clientX - drag.startX) / drag.scale;
            const deltaY = (moveEvent.clientY - drag.startY) / drag.scale;

            updateElement(drag.elementId, {
                x: Math.round(drag.originX + deltaX),
                y: Math.round(Math.max(0, drag.originY + deltaY)),
            });
        };

        const handleUp = () => {
            dragRef.current = null;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    };

    const addText = () => {
        const element = createTextElement();
        setDesign((current) => ({
            ...current,
            elements: [...current.elements, element],
        }));
        setSelectedId(element.id);
    };

    const addPlaceholder = (key) => {
        const element = createPlaceholderElement(key);
        setDesign((current) => ({
            ...current,
            elements: [...current.elements, element],
        }));
        setSelectedId(element.id);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={addText}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                    <Type className="h-3.5 w-3.5" />
                    Add text
                </button>
                <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1">
                    <Braces className="h-3.5 w-3.5 text-slate-500" />
                    <select
                        className="border-0 bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                        defaultValue=""
                        onChange={(event) => {
                            if (event.target.value) {
                                addPlaceholder(event.target.value);
                                event.target.value = '';
                            }
                        }}
                    >
                        <option value="" disabled>Add placeholder</option>
                        {CERTIFICATE_PLACEHOLDERS.map((placeholder) => (
                            <option key={placeholder.key} value={placeholder.key}>
                                {placeholder.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => setPreviewMode((current) => !current)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                    {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {previewMode ? 'Show placeholders' : 'Live preview'}
                </button>
                {selectedElement && (
                    <button
                        type="button"
                        onClick={() => removeElement(selectedElement.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete selected
                    </button>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3 overflow-x-auto">
                    <div
                        style={{
                            width: `${(design.width || 800) * scale}px`,
                            height: `${(design.height || 565) * scale}px`,
                            margin: '0 auto',
                        }}
                    >
                        <div
                            ref={canvasRef}
                            onMouseDown={() => setSelectedId(null)}
                            style={{
                                position: 'relative',
                                width: `${design.width || 800}px`,
                                height: `${design.height || 565}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                                backgroundColor: design.backgroundColor || '#ffffff',
                                border: `${design.borderWidth ?? 2}px solid ${design.borderColor || '#16a34a'}`,
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                            }}
                            className="shadow-sm"
                        >
                            {backgroundPreviewUrl && (
                                <img
                                    src={backgroundPreviewUrl}
                                    alt=""
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        opacity: backgroundOpacity,
                                        zIndex: 0,
                                    }}
                                />
                            )}
                            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                                {design.elements.map((element) => (
                                    <CanvasElement
                                        key={element.id}
                                        element={element}
                                        selected={selectedId === element.id}
                                        previewMode={previewMode}
                                        sampleData={SAMPLE_CERTIFICATE_DATA}
                                        onSelect={setSelectedId}
                                        onDragStart={handleDragStart}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-500">
                        Drag elements to reposition. Click to select and edit properties.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Canvas</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs text-slate-600">
                                Background
                                <input
                                    type="color"
                                    value={design.backgroundColor || '#ffffff'}
                                    onChange={(event) => updateDesign({ backgroundColor: event.target.value })}
                                    className="mt-1 h-9 w-full cursor-pointer rounded border border-slate-300"
                                />
                            </label>
                            <label className="text-xs text-slate-600">
                                Border
                                <input
                                    type="color"
                                    value={design.borderColor || '#16a34a'}
                                    onChange={(event) => updateDesign({ borderColor: event.target.value })}
                                    className="mt-1 h-9 w-full cursor-pointer rounded border border-slate-300"
                                />
                            </label>
                        </div>
                        <label className="block text-xs text-slate-600">
                            Border width
                            <input
                                type="number"
                                min="0"
                                max="12"
                                value={design.borderWidth ?? 2}
                                onChange={(event) => updateDesign({ borderWidth: Number(event.target.value) || 0 })}
                                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            />
                        </label>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {selectedElement ? 'Selected element' : 'Element properties'}
                        </h4>
                        {!selectedElement && (
                            <p className="text-xs text-slate-500">Select an element on the canvas to edit its text, font, and color.</p>
                        )}
                        {selectedElement && (
                            <>
                                {selectedElement.type === 'text' ? (
                                    <label className="block text-xs text-slate-600">
                                        Text
                                        <textarea
                                            rows={3}
                                            value={selectedElement.content || ''}
                                            onChange={(event) => updateElement(selectedElement.id, { content: event.target.value })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                ) : (
                                    <label className="block text-xs text-slate-600">
                                        Placeholder
                                        <select
                                            value={selectedElement.key || 'name'}
                                            onChange={(event) => updateElement(selectedElement.id, { key: event.target.value })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        >
                                            {CERTIFICATE_PLACEHOLDERS.map((placeholder) => (
                                                <option key={placeholder.key} value={placeholder.key}>
                                                    {placeholder.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-xs text-slate-600">
                                        Font size
                                        <input
                                            type="number"
                                            min="8"
                                            max="96"
                                            value={selectedElement.fontSize || 16}
                                            onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) || 16 })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                    <label className="text-xs text-slate-600">
                                        Width
                                        <input
                                            type="number"
                                            min="40"
                                            max={design.width || 800}
                                            value={selectedElement.width || 200}
                                            onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) || 200 })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                </div>
                                <label className="block text-xs text-slate-600">
                                    Font
                                    <select
                                        value={selectedElement.fontFamily || 'Georgia, serif'}
                                        onChange={(event) => updateElement(selectedElement.id, { fontFamily: event.target.value })}
                                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                    >
                                        {CERTIFICATE_FONT_OPTIONS.map((font) => (
                                            <option key={font.value} value={font.value}>{font.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block text-xs text-slate-600">
                                    Weight
                                    <select
                                        value={selectedElement.fontWeight || 'normal'}
                                        onChange={(event) => updateElement(selectedElement.id, { fontWeight: event.target.value })}
                                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </label>
                                <label className="block text-xs text-slate-600">
                                    Color
                                    <input
                                        type="color"
                                        value={selectedElement.color || '#0f172a'}
                                        onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })}
                                        className="mt-1 h-9 w-full cursor-pointer rounded border border-slate-300"
                                    />
                                </label>
                                <div>
                                    <span className="block text-xs text-slate-600 mb-1">Alignment</span>
                                    <div className="flex gap-1">
                                        {[
                                            { value: 'left', Icon: AlignLeft },
                                            { value: 'center', Icon: AlignCenter },
                                            { value: 'right', Icon: AlignRight },
                                        ].map(({ value: align, Icon }) => (
                                            <button
                                                key={align}
                                                type="button"
                                                onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                                                className={`rounded-md border p-2 ${
                                                    (selectedElement.textAlign || 'left') === align
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-xs text-slate-600">
                                        X
                                        <input
                                            type="number"
                                            value={selectedElement.x || 0}
                                            onChange={(event) => updateElement(selectedElement.id, { x: Number(event.target.value) || 0 })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                    <label className="text-xs text-slate-600">
                                        Y
                                        <input
                                            type="number"
                                            value={selectedElement.y || 0}
                                            onChange={(event) => updateElement(selectedElement.id, { y: Number(event.target.value) || 0 })}
                                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Placeholders</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {CERTIFICATE_PLACEHOLDERS.map((placeholder) => (
                                <button
                                    key={placeholder.key}
                                    type="button"
                                    onClick={() => addPlaceholder(placeholder.key)}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    <Plus className="h-3 w-3" />
                                    {`{${placeholder.key}}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
