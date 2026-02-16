export function getMessage(messageName: string, substitutions?: string | string[]): string {
    return browser.i18n.getMessage(messageName, substitutions);
}

export function getUILanguage(): string {
    return browser.i18n.getUILanguage();
}

export function isJapanese(): boolean {
    const lang = getUILanguage();
    return lang.startsWith('ja');
}
