import { describe, it, expect } from 'vitest';
import { resolveKeyAction, KeyEvent } from '../utils/key-handler';

function makeEvent(overrides: Partial<KeyEvent> = {}): KeyEvent {
    return {
        key: 'Enter',
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        isTrusted: true,
        isComposing: false,
        ...overrides,
    };
}

describe('resolveKeyAction', () => {
    describe('enter-to-send sites (capture phase)', () => {
        it('plain Enter → newline', () => {
            const result = resolveKeyAction(makeEvent(), 'enter', true, 'capture', false);
            expect(result).toBe('newline');
        });

        it('Cmd+Enter (Mac) → send', () => {
            const result = resolveKeyAction(
                makeEvent({ metaKey: true }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('send');
        });

        it('Ctrl+Enter (Windows) → send', () => {
            const result = resolveKeyAction(
                makeEvent({ ctrlKey: true }),
                'enter', false, 'capture', false,
            );
            expect(result).toBe('send');
        });

        it('Shift+Enter → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ shiftKey: true }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('Alt+Enter → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ altKey: true }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('isComposing=true → pass (IME)', () => {
            const result = resolveKeyAction(
                makeEvent({ isComposing: true }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('isTrusted=false → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ isTrusted: false }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('non-Enter key → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ key: 'Backspace' }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('Delete key → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ key: 'Delete' }),
                'enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('bubble phase → pass (enter-to-send only handles capture)', () => {
            const result = resolveKeyAction(makeEvent(), 'enter', true, 'bubble', false);
            expect(result).toBe('pass');
        });
    });

    describe('ctrl+enter sites', () => {
        it('capture: plain Enter → newline', () => {
            const result = resolveKeyAction(makeEvent(), 'ctrl+enter', true, 'capture', false);
            expect(result).toBe('newline');
        });

        it('bubble: Ctrl+Enter (Mac: Cmd+Enter) → send', () => {
            const result = resolveKeyAction(
                makeEvent({ metaKey: true }),
                'ctrl+enter', true, 'bubble', false,
            );
            expect(result).toBe('send');
        });

        it('bubble: Ctrl+Enter (Win) → send', () => {
            const result = resolveKeyAction(
                makeEvent({ ctrlKey: true }),
                'ctrl+enter', false, 'bubble', false,
            );
            expect(result).toBe('send');
        });

        it('bubble: defaultPrevented → pass', () => {
            const result = resolveKeyAction(
                makeEvent({ metaKey: true }),
                'ctrl+enter', true, 'bubble', true,
            );
            expect(result).toBe('pass');
        });

        it('capture: Cmd+Enter → pass (handled in bubble)', () => {
            const result = resolveKeyAction(
                makeEvent({ metaKey: true }),
                'ctrl+enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });

        it('isComposing=true → pass (IME)', () => {
            const result = resolveKeyAction(
                makeEvent({ isComposing: true }),
                'ctrl+enter', true, 'capture', false,
            );
            expect(result).toBe('pass');
        });
    });
});
