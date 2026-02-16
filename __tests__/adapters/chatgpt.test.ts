import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatgptAdapter } from '../../utils/adapters/chatgpt';

// jsdom throws "member view is not of type Window" for KeyboardEvent with view: window.
const OriginalKeyboardEvent = globalThis.KeyboardEvent;
vi.stubGlobal('KeyboardEvent', class extends OriginalKeyboardEvent {
    constructor(type: string, init?: KeyboardEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});

describe('chatgptAdapter', () => {
    describe('matches', () => {
        it('matches chatgpt.com', () => {
            expect(chatgptAdapter.matches('chatgpt.com')).toBe(true);
        });

        it('matches openai.com', () => {
            expect(chatgptAdapter.matches('openai.com')).toBe(true);
        });

        it('does not match example.com', () => {
            expect(chatgptAdapter.matches('example.com')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('detects textarea', () => {
            const textarea = document.createElement('textarea');
            expect(chatgptAdapter.isEditable(textarea)).toBe(true);
        });

        it('detects #prompt-textarea contentEditable', () => {
            const el = document.createElement('div');
            el.setAttribute('id', 'prompt-textarea');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(chatgptAdapter.isEditable(el)).toBe(true);
        });

        it('detects role=textbox contentEditable', () => {
            const el = document.createElement('div');
            el.setAttribute('role', 'textbox');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(chatgptAdapter.isEditable(el)).toBe(true);
        });

        it('detects ProseMirror editor', () => {
            const editor = document.createElement('div');
            editor.className = 'ProseMirror';
            editor.contentEditable = 'true';
            Object.defineProperty(editor, 'isContentEditable', { value: true });
            document.body.appendChild(editor);
            const child = document.createElement('p');
            editor.appendChild(child);
            Object.defineProperty(child, 'isContentEditable', { value: true });
            expect(chatgptAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(editor);
        });

        it('respects customExcludes', () => {
            const textarea = document.createElement('textarea');
            textarea.className = 'excluded';
            expect(chatgptAdapter.isEditable(textarea, { enabled: true, customExcludes: ['.excluded'] })).toBe(false);
        });

        it('rejects non-editable div', () => {
            const el = document.createElement('div');
            expect(chatgptAdapter.isEditable(el)).toBe(false);
        });

        it('rejects null', () => {
            expect(chatgptAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('inserts newline in textarea', () => {
            const textarea = document.createElement('textarea');
            textarea.value = 'hello';
            textarea.selectionStart = 5;
            textarea.selectionEnd = 5;
            const inputFired = vi.fn();
            textarea.addEventListener('input', inputFired);

            chatgptAdapter.insertNewline(textarea);
            expect(textarea.value).toBe('hello\n');
            expect(inputFired).toHaveBeenCalled();
        });

        it('dispatches Shift+Enter for contentEditable', () => {
            const el = document.createElement('div');
            const spy = vi.spyOn(el, 'dispatchEvent');
            chatgptAdapter.insertNewline(el);
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('clicks send button', () => {
            const form = document.createElement('form');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('data-testid', 'send-button');
            const clickSpy = vi.spyOn(button, 'click');
            form.appendChild(textbox);
            form.appendChild(button);
            document.body.appendChild(form);

            chatgptAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        it('falls back to form.requestSubmit', () => {
            const form = document.createElement('form');
            const textbox = document.createElement('div');
            form.appendChild(textbox);
            document.body.appendChild(form);
            const submitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {});

            chatgptAdapter.triggerSend(textbox);
            expect(submitSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(chatgptAdapter.name).toBe('chatgpt');
        expect(chatgptAdapter.listenerTarget).toBe('document');
        expect(chatgptAdapter.nativeSendKey).toBe('enter');
    });
});
