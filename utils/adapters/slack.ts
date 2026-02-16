import { SiteAdapter } from '../types';

export const slackAdapter: SiteAdapter = {
    name: 'slack',

    matches(hostname: string): boolean {
        return hostname.includes('slack.com');
    },

    listenerTarget: 'document',
    nativeSendKey: 'enter',

    isEditable(element: Element): boolean {
        if (!element) return false;

        if (element.classList.contains('ql-editor') && (element as HTMLElement).isContentEditable) {
            return true;
        }

        const editor = (element as HTMLElement).closest('.ql-editor');
        if (editor && (editor as HTMLElement).isContentEditable) {
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
        let container = target.closest('.c-texty_input_unstyled__container') ||
            target.closest('.c-message_kit__editor') ||
            target.closest('[data-qa="message_editor"]');

        if (container) {
            let sendButton = container.querySelector('button[data-qa="texty_send_button"]');
            if (!sendButton && container.parentElement) {
                sendButton = container.parentElement.querySelector('button[data-qa="texty_send_button"]');
            }
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
                return;
            }
        }

        let current = target.parentElement;
        for (let i = 0; i < 10 && current; i++) {
            const sendButton = current.querySelector('button[data-qa="texty_send_button"]');
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
                return;
            }
            current = current.parentElement;
        }
    },
};
