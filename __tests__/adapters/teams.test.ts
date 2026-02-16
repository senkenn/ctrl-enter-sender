import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamsAdapter } from '../../utils/adapters/teams';

// jsdom throws "member view is not of type Window" for KeyboardEvent with view: window.
const OriginalKeyboardEvent = globalThis.KeyboardEvent;
vi.stubGlobal('KeyboardEvent', class extends OriginalKeyboardEvent {
    constructor(type: string, init?: KeyboardEventInit) {
        const { view: _v, ...rest } = init || {};
        super(type, rest);
    }
});

describe('teamsAdapter', () => {
    describe('matches', () => {
        it('matches teams.microsoft.com', () => {
            expect(teamsAdapter.matches('teams.microsoft.com')).toBe(true);
        });

        it('matches teams.live.com', () => {
            expect(teamsAdapter.matches('teams.live.com')).toBe(true);
        });

        it('does not match example.com', () => {
            expect(teamsAdapter.matches('example.com')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('detects contentEditable textbox', () => {
            const el = document.createElement('div');
            el.setAttribute('role', 'textbox');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(teamsAdapter.isEditable(el)).toBe(true);
        });

        it('detects child of textbox', () => {
            const parent = document.createElement('div');
            parent.setAttribute('role', 'textbox');
            parent.contentEditable = 'true';
            Object.defineProperty(parent, 'isContentEditable', { value: true });
            const child = document.createElement('p');
            parent.appendChild(child);
            document.body.appendChild(parent);
            expect(teamsAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(parent);
        });

        it('rejects non-editable element', () => {
            const el = document.createElement('div');
            expect(teamsAdapter.isEditable(el)).toBe(false);
        });

        it('rejects null', () => {
            expect(teamsAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('dispatches Shift+Enter', () => {
            const el = document.createElement('div');
            const spy = vi.spyOn(el, 'dispatchEvent');
            teamsAdapter.insertNewline(el);
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('clicks send button', () => {
            const container = document.createElement('div');
            const textbox = document.createElement('div');
            const button = document.createElement('button');
            button.setAttribute('aria-label', 'Send');
            const clickSpy = vi.spyOn(button, 'click');
            container.appendChild(textbox);
            container.appendChild(button);
            document.body.appendChild(container);

            teamsAdapter.triggerSend(textbox);
            expect(clickSpy).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(teamsAdapter.name).toBe('teams');
        expect(teamsAdapter.listenerTarget).toBe('document');
        expect(teamsAdapter.nativeSendKey).toBe('enter');
    });
});
