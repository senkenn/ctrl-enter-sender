import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaultAdapter } from '../../utils/adapters/default';

// Mock window.location
const locationMock = { hostname: 'example.com' };
vi.stubGlobal('location', locationMock);

describe('defaultAdapter', () => {
    beforeEach(() => {
        locationMock.hostname = 'example.com';
    });

    describe('matches', () => {
        it('matches everything', () => {
            expect(defaultAdapter.matches('anything.com')).toBe(true);
            expect(defaultAdapter.matches('example.com')).toBe(true);
        });
    });

    describe('isEditable', () => {
        it('detects textarea', () => {
            const textarea = document.createElement('textarea');
            expect(defaultAdapter.isEditable(textarea)).toBe(true);
        });

        it('rejects INPUT', () => {
            const input = document.createElement('input');
            expect(defaultAdapter.isEditable(input)).toBe(false);
        });

        it('rejects searchbox role', () => {
            const el = document.createElement('div');
            el.setAttribute('role', 'searchbox');
            el.contentEditable = 'true';
            expect(defaultAdapter.isEditable(el)).toBe(false);
        });

        it('rejects aria-multiline=false', () => {
            const el = document.createElement('div');
            el.setAttribute('aria-multiline', 'false');
            el.contentEditable = 'true';
            expect(defaultAdapter.isEditable(el)).toBe(false);
        });

        it('detects contentEditable with role=textbox', () => {
            const el = document.createElement('div');
            el.setAttribute('role', 'textbox');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(defaultAdapter.isEditable(el)).toBe(true);
        });

        it('detects contentEditable with message keyword in aria-label', () => {
            const el = document.createElement('div');
            el.setAttribute('aria-label', 'Type a message');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(defaultAdapter.isEditable(el)).toBe(true);
        });

        it('rejects docs.google.com', () => {
            locationMock.hostname = 'docs.google.com';
            const textarea = document.createElement('textarea');
            expect(defaultAdapter.isEditable(textarea)).toBe(false);
        });

        it('rejects mail.google.com', () => {
            locationMock.hostname = 'mail.google.com';
            const textarea = document.createElement('textarea');
            expect(defaultAdapter.isEditable(textarea)).toBe(false);
        });

        it('respects customTargets', () => {
            const el = document.createElement('div');
            el.className = 'my-editor';
            expect(defaultAdapter.isEditable(el, { enabled: true, customTargets: ['.my-editor'] })).toBe(true);
        });

        it('respects customExcludes', () => {
            const textarea = document.createElement('textarea');
            textarea.className = 'no-intercept';
            expect(defaultAdapter.isEditable(textarea, { enabled: true, customExcludes: ['.no-intercept'] })).toBe(false);
        });

        it('rejects null', () => {
            expect(defaultAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('inserts newline in textarea', () => {
            const textarea = document.createElement('textarea');
            textarea.value = 'test';
            textarea.selectionStart = 4;
            textarea.selectionEnd = 4;
            defaultAdapter.insertNewline(textarea);
            expect(textarea.value).toBe('test\n');
        });

        it('uses execCommand for contentEditable', () => {
            const el = document.createElement('div');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            // jsdom does not implement document.execCommand; define it so vi.spyOn works.
            if (typeof document.execCommand !== 'function') {
                document.execCommand = () => false;
            }
            const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
            defaultAdapter.insertNewline(el);
            expect(execSpy).toHaveBeenCalledWith('insertText', false, '\n');
            execSpy.mockRestore();
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('submits form when available', () => {
            const form = document.createElement('form');
            const textbox = document.createElement('textarea');
            form.appendChild(textbox);
            document.body.appendChild(form);
            const submitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {});

            defaultAdapter.triggerSend(textbox);
            expect(submitSpy).toHaveBeenCalledOnce();
        });

        it('clicks send button when no form', () => {
            const container = document.createElement('div');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('type', 'submit');
            const clickSpy = vi.spyOn(button, 'click');
            container.appendChild(textbox);
            container.appendChild(button);
            document.body.appendChild(container);

            defaultAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(defaultAdapter.name).toBe('default');
        expect(defaultAdapter.listenerTarget).toBe('document');
        expect(defaultAdapter.nativeSendKey).toBe('ctrl+enter');
    });
});
