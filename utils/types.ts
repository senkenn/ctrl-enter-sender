export type ActivationMode = 'blacklist' | 'whitelist';

export interface DomainConfig {
    enabled: boolean;
    customTargets?: string[];
    customExcludes?: string[];
}

export interface StorageSchema {
    activationMode?: ActivationMode;
    domains: {
        [origin: string]: DomainConfig;
    };
}

/**
 * SiteAdapter interface
 *
 * Each supported site implements this interface to encapsulate ALL site-specific logic.
 */
export interface SiteAdapter {
    readonly name: string;
    matches(hostname: string): boolean;
    readonly listenerTarget: 'window' | 'document';
    readonly nativeSendKey: 'enter' | 'ctrl+enter';
    isEditable(element: Element, config?: DomainConfig): boolean;
    insertNewline(target: HTMLElement): void;
    triggerSend(target: HTMLElement): void;
}
