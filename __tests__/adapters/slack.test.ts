import { describe, it, expect, vi, beforeEach } from 'vitest';
import { slackAdapter } from '../../utils/adapters/slack';

// jsdom throws "member view is not of type Window" for KeyboardEvent with view: window.
const OriginalKeyboardEvent = globalThis.KeyboardEvent;
vi.stubGlobal('KeyboardEvent', class extends OriginalKeyboardEvent {
    constructor(type: string, init?: KeyboardEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});

describe('slackAdapter', () => {
    describe('matches', () => {
        it('matches slack.com', () => {
            expect(slackAdapter.matches('slack.com')).toBe(true);
        });

        it('matches app.slack.com', () => {
            expect(slackAdapter.matches('app.slack.com')).toBe(true);
        });

        it('does not match example.com', () => {
            expect(slackAdapter.matches('example.com')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('detects ql-editor', () => {
            const el = document.createElement('div');
            el.classList.add('ql-editor');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(slackAdapter.isEditable(el)).toBe(true);
        });

        it('detects child of ql-editor', () => {
            const editor = document.createElement('div');
            editor.classList.add('ql-editor');
            editor.contentEditable = 'true';
            Object.defineProperty(editor, 'isContentEditable', { value: true });
            const child = document.createElement('p');
            editor.appendChild(child);
            document.body.appendChild(editor);
            expect(slackAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(editor);
        });

        it('rejects non-editor element', () => {
            const el = document.createElement('div');
            expect(slackAdapter.isEditable(el)).toBe(false);
        });

        it('rejects null', () => {
            expect(slackAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('dispatches Shift+Enter', () => {
            const el = document.createElement('div');
            const spy = vi.spyOn(el, 'dispatchEvent');
            slackAdapter.insertNewline(el);
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('clicks send button via data-qa', () => {
            const container = document.createElement('div');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('data-qa', 'texty_send_button');
            const clickSpy = vi.spyOn(button, 'click');
            container.appendChild(textbox);
            container.appendChild(button);
            document.body.appendChild(container);

            slackAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(slackAdapter.name).toBe('slack');
        expect(slackAdapter.listenerTarget).toBe('document');
        expect(slackAdapter.nativeSendKey).toBe('enter');
    });
});
