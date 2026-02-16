import { SiteAdapter } from '../types';

export const claudeAdapter: SiteAdapter = {
    name: 'claude',

    matches(hostname: string): boolean {
        return hostname.includes('claude.ai');
    },

    listenerTarget: 'window',
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
        let container = target.parentElement;
        for (let i = 0; i < 10 && container; i++) {
            const sendButton =
                container.querySelector('button[aria-label="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1"]') ||
                container.querySelector('button[aria-label="Send message"]') ||
                container.querySelector('button[aria-label*="\u9001\u4FE1"]') ||
                container.querySelector('button[aria-label*="Send"]');

            if (sendButton instanceof HTMLElement) {
                const eventOptions = { bubbles: true, cancelable: true, view: window };
                sendButton.dispatchEvent(new MouseEvent('mousedown', eventOptions));
                sendButton.dispatchEvent(new MouseEvent('mouseup', eventOptions));
                sendButton.click();
                return;
            }
            container = container.parentElement;
        }
    },
};
