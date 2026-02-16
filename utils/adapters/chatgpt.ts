import { SiteAdapter, DomainConfig } from '../types';

export const chatgptAdapter: SiteAdapter = {
    name: 'chatgpt',

    matches(hostname: string): boolean {
        return hostname.includes('chatgpt.com') || hostname.includes('openai.com');
    },

    listenerTarget: 'document',
    nativeSendKey: 'enter',

    isEditable(element: Element, config?: DomainConfig): boolean {
        if (!element) return false;

        if (config?.customExcludes) {
            if (element.matches(config.customExcludes.join(','))) return false;
        }

        if (element.tagName === 'TEXTAREA') return true;

        if ((element as HTMLElement).isContentEditable) {
            const id = element.getAttribute('id');
            const role = element.getAttribute('role');
            if (id === 'prompt-textarea' || role === 'textbox') return true;

            const editorEl = (element as HTMLElement).closest('.ProseMirror');
            if (editorEl && (editorEl as HTMLElement).isContentEditable) return true;
        }

        return false;
    },

    insertNewline(target: HTMLElement): void {
        if (target.tagName === 'TEXTAREA') {
            const textarea = target as HTMLTextAreaElement;
            textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            const events = ['keydown', 'keypress', 'keyup'] as const;
            for (const eventType of events) {
                target.dispatchEvent(new KeyboardEvent(eventType, {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                    shiftKey: true,
                    bubbles: true, cancelable: true, view: window,
                }));
            }
        }
    },

    triggerSend(target: HTMLElement): void {
        let container = target.closest('form') || target.parentElement;
        for (let i = 0; i < 10 && container; i++) {
            const sendButton =
                container.querySelector('button[data-testid="send-button"]') ||
                container.querySelector('button[aria-label="Send prompt"]') ||
                container.querySelector('button[aria-label="\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u9001\u4FE1\u3059\u308B"]') ||
                container.querySelector('button[aria-label*="Send"]') ||
                container.querySelector('button[aria-label*="\u9001\u4FE1"]');
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
                return;
            }
            container = container.parentElement;
        }

        const form = target.closest('form');
        if (form) {
            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
                return;
            }
        }
    },
};
