import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discordAdapter } from '../../utils/adapters/discord';

describe('discordAdapter', () => {
    describe('matches', () => {
        it('matches discord.com', () => {
            expect(discordAdapter.matches('discord.com')).toBe(true);
        });

        it('matches ptb.discord.com', () => {
            expect(discordAdapter.matches('ptb.discord.com')).toBe(true);
        });

        it('does not match discordapp.com', () => {
            expect(discordAdapter.matches('discordapp.com')).toBe(false);
        });

        it('does not match example.com', () => {
            expect(discordAdapter.matches('example.com')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('detects contenteditable textbox', () => {
            const el = document.createElement('div');
            el.setAttribute('role', 'textbox');
            el.contentEditable = 'true';
            Object.defineProperty(el, 'isContentEditable', { value: true });
            expect(discordAdapter.isEditable(el)).toBe(true);
        });

        it('detects child element inside textbox', () => {
            const parent = document.createElement('div');
            parent.setAttribute('role', 'textbox');
            parent.contentEditable = 'true';
            Object.defineProperty(parent, 'isContentEditable', { value: true });
            const child = document.createElement('p');
            parent.appendChild(child);
            document.body.appendChild(parent);
            expect(discordAdapter.isEditable(child)).toBe(true);
            document.body.removeChild(parent);
        });

        it('rejects non-editable element', () => {
            const el = document.createElement('div');
            expect(discordAdapter.isEditable(el)).toBe(false);
        });

        it('rejects null-like element', () => {
            expect(discordAdapter.isEditable(null as any)).toBe(false);
        });
    });

    describe('insertNewline', () => {
        it('dispatches __ces_insert_newline custom event', () => {
            const handler = vi.fn();
            document.addEventListener('__ces_insert_newline', handler);
            const el = document.createElement('div');
            discordAdapter.insertNewline(el);
            expect(handler).toHaveBeenCalledOnce();
            document.removeEventListener('__ces_insert_newline', handler);
        });
    });

    describe('triggerSend', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('dispatches synthetic Enter keydown on the textbox', () => {
            const textbox = document.createElement('div');
            textbox.setAttribute('role', 'textbox');
            document.body.appendChild(textbox);

            const handler = vi.fn();
            textbox.addEventListener('keydown', handler);

            discordAdapter.triggerSend(textbox);

            expect(handler).toHaveBeenCalledOnce();
            const event = handler.mock.calls[0][0] as KeyboardEvent;
            expect(event.key).toBe('Enter');
            expect(event.bubbles).toBe(true);
        });

        it('dispatches on closest textbox when target is a child', () => {
            const textbox = document.createElement('div');
            textbox.setAttribute('role', 'textbox');
            const child = document.createElement('span');
            textbox.appendChild(child);
            document.body.appendChild(textbox);

            const handler = vi.fn();
            textbox.addEventListener('keydown', handler);

            discordAdapter.triggerSend(child);

            expect(handler).toHaveBeenCalledOnce();
        });
    });

    it('has correct properties', () => {
        expect(discordAdapter.name).toBe('discord');
        expect(discordAdapter.listenerTarget).toBe('document');
        expect(discordAdapter.nativeSendKey).toBe('enter');
    });
});
