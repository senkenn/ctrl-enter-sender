import { describe, it, expect, vi, beforeEach } from 'vitest';
import { grokAdapter } from '../../utils/adapters/grok';

// jsdom throws "member view is not of type Window" for KeyboardEvent with view: window.
const OriginalKeyboardEvent = globalThis.KeyboardEvent;
vi.stubGlobal('KeyboardEvent', class extends OriginalKeyboardEvent {
    constructor(type: string, init?: KeyboardEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});

describe('grokAdapter', () => {
    describe('matches', () => {
        it('matches grok.com', () => {
            expect(grokAdapter.matches('grok.com')).toBe(true);
        });

        it('does not match example.com', () => {
            expect(grokAdapter.matches('example.com')).toBe(false);
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

            expect(grokAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(editor);
        });

        it('rejects non-editor element', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            expect(grokAdapter.isEditable(el)).toBe(false);
            document.body.removeChild(el);
        });

        it('rejects null', () => {
            expect(grokAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('dispatches Shift+Enter', () => {
            const el = document.createElement('div');
            const spy = vi.spyOn(el, 'dispatchEvent');
            grokAdapter.insertNewline(el);
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('clicks submit button', () => {
            const form = document.createElement('form');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('type', 'submit');
            button.setAttribute('aria-label', 'Send');
            const clickSpy = vi.spyOn(button, 'click');
            form.appendChild(textbox);
            form.appendChild(button);
            document.body.appendChild(form);

            grokAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(grokAdapter.name).toBe('grok');
        expect(grokAdapter.listenerTarget).toBe('document');
        expect(grokAdapter.nativeSendKey).toBe('enter');
    });
});
