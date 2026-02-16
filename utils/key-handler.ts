export type KeyAction = 'send' | 'newline' | 'pass';

export interface KeyEvent {
    key: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    isTrusted: boolean;
    isComposing: boolean;
}

export function resolveKeyAction(
    event: KeyEvent,
    nativeSendKey: 'enter' | 'ctrl+enter',
    isMac: boolean,
    phase: 'capture' | 'bubble',
    defaultPrevented: boolean,
): KeyAction {
    if (!event.isTrusted) return 'pass';
    if (event.isComposing) return 'pass';
    if (event.key !== 'Enter') return 'pass';

    const isSendKey = isMac
        ? event.metaKey && event.key === 'Enter'
        : event.ctrlKey && event.key === 'Enter';
    const isPlainEnter = event.key === 'Enter'
        && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;

    if (event.shiftKey || event.altKey) return 'pass';

    if (nativeSendKey === 'enter') {
        // Enter-to-send apps: handle everything in capture phase
        if (phase !== 'capture') return 'pass';
        if (isSendKey) return 'send';
        if (isPlainEnter) return 'newline';
        return 'pass';
    }

    // ctrl+enter sites
    if (phase === 'capture') {
        if (isPlainEnter) return 'newline';
        return 'pass';
    }

    // bubble phase for ctrl+enter sites
    if (isSendKey) {
        if (defaultPrevented) return 'pass';
        return 'send';
    }

    return 'pass';
}
