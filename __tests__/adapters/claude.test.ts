import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claudeAdapter } from '../../utils/adapters/claude';

// jsdom throws "member view is not of type Window" for KeyboardEvent/MouseEvent with view: window.
// Wrap constructors to strip `view` so adapter source code runs without error.
const OriginalKeyboardEvent = globalThis.KeyboardEvent;
vi.stubGlobal('KeyboardEvent', class extends OriginalKeyboardEvent {
    constructor(type: string, init?: KeyboardEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});
const OriginalMouseEvent = globalThis.MouseEvent;
vi.stubGlobal('MouseEvent', class extends OriginalMouseEvent {
    constructor(type: string, init?: MouseEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});

describe('claudeAdapter', () => {
    describe('matches', () => {
        it('matches claude.ai', () => {
            expect(claudeAdapter.matches('claude.ai')).toBe(true);
        });

        it('does not match example.com', () => {
            expect(claudeAdapter.matches('example.com')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('detects TipTap/ProseMirror editor', () => {
            const editor = document.createElement('div');
            editor.className = 'tiptap ProseMirror';
            editor.contentEditable = 'true';
            Object.defineProperty(editor, 'isContentEditable', { value: true });
            document.body.appendChild(editor);

            const child = document.createElement('p');
            editor.appendChild(child);

            expect(claudeAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(editor);
        });

        it('rejects non-editor element', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            expect(claudeAdapter.isEditable(el)).toBe(false);
            document.body.removeChild(el);
        });

        it('rejects null element', () => {
            expect(claudeAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('dispatches Shift+Enter keyboard events', () => {
            const el = document.createElement('div');
            const spy = vi.spyOn(el, 'dispatchEvent');
            claudeAdapter.insertNewline(el);
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('clicks send button when found', () => {
            const container = document.createElement('div');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('aria-label', 'Send message');
            const clickSpy = vi.spyOn(button, 'click');
            container.appendChild(textbox);
            container.appendChild(button);
            document.body.appendChild(container);

            claudeAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(claudeAdapter.name).toBe('claude');
        expect(claudeAdapter.listenerTarget).toBe('window');
        expect(claudeAdapter.nativeSendKey).toBe('enter');
    });
});
