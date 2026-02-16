import { SiteAdapter } from '../types';

export const teamsAdapter: SiteAdapter = {
    name: 'teams',

    matches(hostname: string): boolean {
        return hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com');
    },

    listenerTarget: 'document',
    nativeSendKey: 'enter',

    isEditable(element: Element): boolean {
        if (!element) return false;

        if ((element as HTMLElement).isContentEditable) {
            const role = element.getAttribute('role');
            if (role === 'textbox') return true;
        }

        const textbox = (element as HTMLElement).closest('[role="textbox"]');
        if (textbox && (textbox as HTMLElement).isContentEditable) {
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
                container.querySelector('button[aria-label="Send"]') ||
                container.querySelector('button[aria-label="\u9001\u4FE1"]') ||
                container.querySelector('button[data-tid="newMessageCommands-send"]') ||
                container.querySelector('button[aria-label*="Send"]') ||
                container.querySelector('button[aria-label*="\u9001\u4FE1"]');
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
                return;
            }
            container = container.parentElement;
        }

        const events = ['keydown', 'keypress', 'keyup'] as const;
        for (const eventType of events) {
            target.dispatchEvent(new KeyboardEvent(eventType, {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                bubbles: true, cancelable: true, view: window,
            }));
        }
    },
};
