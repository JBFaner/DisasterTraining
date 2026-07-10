import React from 'react';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Strikethrough,
    Underline,
    Undo2,
} from 'lucide-react';

function ToolbarButton({ title, onClick, active = false, children }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`inline-flex h-8 w-8 items-center justify-center rounded border text-slate-700 transition-colors ${
                active
                    ? 'border-sky-400 bg-sky-100 text-sky-900'
                    : 'border-transparent hover:border-slate-300 hover:bg-white'
            }`}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />;
}

export function hasRichTextContent(html) {
    if (!html) return false;
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || '').replace(/\u00a0/g, ' ').trim().length > 0;
}

export function LessonRichTextEditor({ value, onChange, placeholder = 'Write lesson content here…' }) {
    const editorRef = React.useRef(null);

    const emitChange = React.useCallback(() => {
        if (!editorRef.current) return;
        onChange(editorRef.current.innerHTML);
    }, [onChange]);

    const runCommand = (command, commandValue = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        emitChange();
    };

    React.useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== (value || '')) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="lesson-rich-editor rounded-xl border border-slate-300 overflow-hidden bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-300 bg-[#f3f3f3] px-2 py-1.5">
                <ToolbarButton title="Undo" onClick={() => runCommand('undo')}>
                    <Undo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => runCommand('redo')}>
                    <Redo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarDivider />
                <select
                    className="h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700"
                    defaultValue="p"
                    onChange={(e) => runCommand('formatBlock', e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <option value="p">Normal</option>
                    <option value="h2">Heading 1</option>
                    <option value="h3">Heading 2</option>
                </select>
                <ToolbarDivider />
                <ToolbarButton title="Bold" onClick={() => runCommand('bold')}>
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Italic" onClick={() => runCommand('italic')}>
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Underline" onClick={() => runCommand('underline')}>
                    <Underline className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Strikethrough" onClick={() => runCommand('strikeThrough')}>
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarDivider />
                <ToolbarButton title="Bulleted list" onClick={() => runCommand('insertUnorderedList')}>
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Numbered list" onClick={() => runCommand('insertOrderedList')}>
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarDivider />
                <ToolbarButton title="Align left" onClick={() => runCommand('justifyLeft')}>
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align center" onClick={() => runCommand('justifyCenter')}>
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align right" onClick={() => runCommand('justifyRight')}>
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Justify" onClick={() => runCommand('justifyFull')}>
                    <AlignJustify className="w-4 h-4" />
                </ToolbarButton>
            </div>
            <div
                ref={editorRef}
                className="lesson-rich-editor__body min-h-[220px] max-h-[360px] overflow-y-auto px-4 py-3 text-sm text-slate-800 focus:outline-none"
                contentEditable
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={emitChange}
                onBlur={emitChange}
                suppressContentEditableWarning
            />
        </div>
    );
}
