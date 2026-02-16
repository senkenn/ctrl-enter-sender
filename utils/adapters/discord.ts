import { SiteAdapter } from '../types';

export const discordAdapter: SiteAdapter = {
    name: 'discord',

    matches(hostname: string): boolean {
        return hostname.includes('discord.com');
    },

    listenerTarget: 'document',
    nativeSendKey: 'enter',

    isEditable(element: Element): boolean {
        if (!element) return false;

        const role = element.getAttribute('role');
        if (role === 'textbox' && (element as HTMLElement).isContentEditable) {
            return true;
        }

        const textbox = (element as HTMLElement).closest('[role="textbox"]');
        if (textbox && (textbox as HTMLElement).isContentEditable) {
            return true;
        }

        return false;
    },

    insertNewline(_target: HTMLElement): void {
        // Slate ignores synthetic KeyboardEvents (isTrusted === false).
        // Use MAIN world script via injectScript() to call Slate API.
        document.dispatchEvent(new CustomEvent('__ces_insert_newline'));
    },

    triggerSend(target: HTMLElement): void {
        // Find the textbox (target might be a child element)
        const textbox = target.closest('[role="textbox"]') as HTMLElement || target;

        // Dispatch a synthetic Enter keydown.
        // isTrusted=false so our extension ignores it ('pass'),
        // but Discord's Slate/React handler processes it and sends.
        textbox.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        }));
    },
};
