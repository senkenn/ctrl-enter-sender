import { SiteAdapter, DomainConfig } from '../types';

export const defaultAdapter: SiteAdapter = {
    name: 'default',

    matches(_hostname: string): boolean {
        return true;
    },

    listenerTarget: 'document',
    nativeSendKey: 'ctrl+enter',

    isEditable(element: Element, config?: DomainConfig): boolean {
        if (!element) return false;

        const hostname = window.location.hostname;

        if (hostname === 'docs.google.com') return false;
        if (hostname === 'mail.google.com') return false;

        if (config?.customExcludes) {
            if (element.matches(config.customExcludes.join(','))) return false;
        }

        if (config?.customTargets) {
            if (element.matches(config.customTargets.join(','))) return true;
        }

        if (element.tagName === 'INPUT') return false;

        const role = element.getAttribute('role');
        if (role === 'searchbox') return false;

        const ariaMultiline = element.getAttribute('aria-multiline');
        if (ariaMultiline === 'false') return false;

        if (element.tagName === 'TEXTAREA') return true;

        if ((element as HTMLElement).isContentEditable) {
            const ariaLabel = element.getAttribute('aria-label');
            const id = element.getAttribute('id');
            const className = element.className;

            const keywords = ['message', 'chat', 'compose', 'reply', 'comment', 'post', 'write', 'prompt', '\u30E1\u30C3\u30BB\u30FC\u30B8', '\u30C1\u30E3\u30C3\u30C8', '\u30B3\u30E1\u30F3\u30C8'];
            const hasKeyword = keywords.some(keyword =>
                (ariaLabel && ariaLabel.toLowerCase().includes(keyword.toLowerCase())) ||
                (id && id.toLowerCase().includes(keyword.toLowerCase())) ||
                (className && typeof className === 'string' && className.toLowerCase().includes(keyword.toLowerCase()))
            );

            if (role === 'textbox' || hasKeyword) return true;
        }

        return false;
    },

    insertNewline(target: HTMLElement): void {
        if (target.tagName === 'TEXTAREA') {
            const textarea = target as HTMLTextAreaElement;
            textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (target.isContentEditable) {
            const success = document.execCommand('insertText', false, '\n');
            if (!success) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const br = document.createTextNode('\n');
                    range.deleteContents();
                    range.insertNode(br);
                    range.setStartAfter(br);
                    range.setEndAfter(br);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    },

    triggerSend(target: HTMLElement): void {
        const form = target.closest('form');
        if (form) {
            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
                return;
            }
            form.submit();
            return;
        }

        const selectors = [
            'button[type="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="\u9001\u4FE1"]',
            '[data-testid*="send"]',
            '[data-testid*="submit"]',
            'button[class*="send"]',
            'div[role="button"][aria-label*="\u9001\u4FE1"]',
            'div[role="button"][aria-label*="Send"]',
            'div[role="button"][class*="send"]',
            'button[title*="Send"]',
            'button[title*="\u9001\u4FE1"]',
            'div[role="button"][aria-label="Send message"]',
            'div[role="button"][aria-label="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1"]',
            'button[aria-label="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1"]',
            'button[jsname="SoqoBf"]',
            'div[aria-label="Press Enter to send"]',
            'div[aria-label="Send"]',
        ];
        let container = target.parentElement;
        let button: Element | null = null;

        for (let i = 0; i < 7 && container; i++) {
            for (const selector of selectors) {
                button = container.querySelector(selector);
                if (button) break;
            }
            if (button) break;
            container = container.parentElement;
        }

        if (button && button instanceof HTMLElement) {
            button.click();
        } else {
            const events = ['keydown', 'keypress', 'keyup'] as const;
            for (const eventType of events) {
                target.dispatchEvent(new KeyboardEvent(eventType, {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                    bubbles: true, cancelable: true, view: window,
                }));
            }
        }
    },
};
