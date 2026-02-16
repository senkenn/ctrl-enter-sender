import { SiteAdapter } from '../types';

export const grokAdapter: SiteAdapter = {
    name: 'grok',

    matches(hostname: string): boolean {
        return hostname.includes('grok.com');
    },

    listenerTarget: 'document',
    nativeSendKey: 'enter',

    isEditable(element: Element): boolean {
        if (!element) return false;

        const editorEl = (element as HTMLElement).closest('.tiptap.ProseMirror');
        if (editorEl && (editorEl as HTMLElement).isContentEditable) {
            return true;
        }

        return false;
    },

    insertNewline(target: HTMLElement): void {
        const events = ['keydown', 'keypress', 'keyup'] as const;
        for (const eventType of events) {
            target.dispatchEvent(new KeyboardEvent(eventType, {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                shiftKey: true,
                bubbles: true, cancelable: true, view: window,
            }));
        }
    },

    triggerSend(target: HTMLElement): void {
        let container = target.closest('form') || target.parentElement;
        for (let i = 0; i < 10 && container; i++) {
            const sendButton =
                container.querySelector('button[type="submit"][aria-label]') ||
                container.querySelector('button[aria-label="\u9001\u4FE1"]') ||
                container.querySelector('button[aria-label="Send"]') ||
                container.querySelector('button[type="submit"]');
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
                return;
            }
            container = container.parentElement;
        }
    },
};
