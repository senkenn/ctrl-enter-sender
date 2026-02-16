import { ActivationMode, DomainConfig, StorageSchema } from './types';

const STORAGE_KEY = 'ctrl_enter_sender_config';

const DEFAULT_DISABLED_DOMAINS = ['x.com', 'twitter.com', 'google.com', 'docs.google.com'];

const DEFAULT_WHITELIST_DOMAINS = [
    'chatgpt.com',
    'claude.ai',
    'gemini.google.com',
    'grok.com',
    'chat.deepseek.com',
    'z.ai',
    'chat.z.ai',
    'perplexity.ai',
    'web.telegram.org',
    'app.slack.com',
    'discord.com',
    'teams.live.com',
    'wechat.com',
];

function getHostnameFromOrigin(origin: string): string {
    try {
        const url = new URL(origin);
        return url.hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

export function getNormalizedOrigin(origin: string): string {
    try {
        const url = new URL(origin);
        const normalizedHostname = url.hostname.replace(/^www\./, '');
        return `${url.protocol}//${normalizedHostname}`;
    } catch {
        return origin;
    }
}

function getBothOrigins(normalizedOrigin: string): string[] {
    try {
        const url = new URL(normalizedOrigin);
        const hostname = url.hostname;
        const origins = [`${url.protocol}//${hostname}`];
        if (!hostname.startsWith('www.')) {
            origins.push(`${url.protocol}//www.${hostname}`);
        }
        return origins;
    } catch {
        return [normalizedOrigin];
    }
}

function isDefaultDisabledDomain(origin: string): boolean {
    const hostname = getHostnameFromOrigin(origin);
    return DEFAULT_DISABLED_DOMAINS.some(domain => {
        if (domain === 'google.com') {
            return hostname === domain;
        }
        return hostname === domain || hostname.endsWith('.' + domain);
    });
}

function isDefaultWhitelistedDomain(origin: string): boolean {
    const hostname = getHostnameFromOrigin(origin);
    return DEFAULT_WHITELIST_DOMAINS.some(domain => {
        return hostname === domain || hostname.endsWith('.' + domain);
    });
}

export function isDefaultDisabledOrigin(origin: string): boolean {
    return isDefaultDisabledDomain(origin);
}

export function isDefaultWhitelistedOrigin(origin: string): boolean {
    return isDefaultWhitelistedDomain(origin);
}

export async function getActivationMode(): Promise<ActivationMode> {
    const data = await browser.storage.sync.get(STORAGE_KEY);
    const config = data[STORAGE_KEY] as StorageSchema | undefined;
    return config?.activationMode || 'blacklist';
}

export async function setActivationMode(mode: ActivationMode): Promise<void> {
    const data = await browser.storage.sync.get(STORAGE_KEY);
    const schema = (data[STORAGE_KEY] as StorageSchema) || { domains: {} };
    schema.activationMode = mode;
    await browser.storage.sync.set({ [STORAGE_KEY]: schema });
}

export async function getDomainConfig(origin: string): Promise<DomainConfig> {
    const data = await browser.storage.sync.get(STORAGE_KEY);
    const config = data[STORAGE_KEY] as StorageSchema | undefined;
    const mode = config?.activationMode || 'blacklist';

    if (config?.domains?.[origin]) {
        const savedConfig = config.domains[origin];
        const cleanConfig: DomainConfig = {
            enabled: savedConfig.enabled,
            ...(savedConfig.customTargets && { customTargets: savedConfig.customTargets }),
            ...(savedConfig.customExcludes && { customExcludes: savedConfig.customExcludes })
        };
        return cleanConfig;
    }

    if (mode === 'whitelist') {
        if (isDefaultWhitelistedDomain(origin)) {
            return { enabled: true };
        }
        return { enabled: false };
    }

    if (isDefaultDisabledDomain(origin)) {
        return { enabled: false };
    }

    return { enabled: true };
}

export async function setDomainConfig(origin: string, config: DomainConfig): Promise<void> {
    const data = await browser.storage.sync.get(STORAGE_KEY);
    const currentSchema = (data[STORAGE_KEY] as StorageSchema) || { domains: {} };

    const normalizedOrigin = getNormalizedOrigin(origin);
    const bothOrigins = getBothOrigins(normalizedOrigin);

    const cleanConfig: DomainConfig = {
        enabled: config.enabled,
        ...(config.customTargets && { customTargets: config.customTargets }),
        ...(config.customExcludes && { customExcludes: config.customExcludes })
    };

    for (const orig of bothOrigins) {
        currentSchema.domains[orig] = cleanConfig;
    }

    await browser.storage.sync.set({ [STORAGE_KEY]: currentSchema });
}

export function groupDomainsByNormalizedOrigin(domains: { [origin: string]: DomainConfig }): { [normalizedOrigin: string]: DomainConfig } {
    const grouped: { [normalizedOrigin: string]: DomainConfig } = {};

    for (const origin of Object.keys(domains)) {
        const normalizedOrigin = getNormalizedOrigin(origin);
        if (!grouped[normalizedOrigin]) {
            grouped[normalizedOrigin] = domains[origin];
        }
    }

    return grouped;
}

export async function getAllConfigs(): Promise<StorageSchema> {
    try {
        const data = await browser.storage.sync.get(STORAGE_KEY);
        const schema = (data[STORAGE_KEY] as StorageSchema) || { domains: {} };
        const mode = schema.activationMode || 'blacklist';

        const allDomains = { ...schema.domains };

        if (mode === 'blacklist') {
            const defaultDisabledOrigins = [
                'https://x.com',
                'https://www.x.com',
                'https://twitter.com',
                'https://www.twitter.com',
                'https://google.com',
                'https://www.google.com',
                'https://docs.google.com'
            ];

            for (const origin of defaultDisabledOrigins) {
                if (!allDomains[origin] && isDefaultDisabledDomain(origin)) {
                    allDomains[origin] = { enabled: false };
                }
            }
        }

        if (mode === 'whitelist') {
            const defaultWhitelistOrigins = [
                'https://chatgpt.com',
                'https://claude.ai',
                'https://gemini.google.com',
                'https://grok.com',
                'https://chat.deepseek.com',
                'https://z.ai',
                'https://chat.z.ai',
                'https://www.perplexity.ai',
                'https://web.telegram.org',
                'https://app.slack.com',
                'https://discord.com',
                'https://teams.live.com',
                'https://www.wechat.com',
            ];

            for (const origin of defaultWhitelistOrigins) {
                if (!allDomains[origin] && isDefaultWhitelistedDomain(origin)) {
                    allDomains[origin] = { enabled: true };
                }
            }
        }

        return { activationMode: mode, domains: allDomains };
    } catch (error) {
        console.error('Failed to get all configs:', error);
        return { domains: {} };
    }
}

export function getDefaultDisabledDomains(): string[] {
    return DEFAULT_DISABLED_DOMAINS;
}

const ONBOARDING_SHOWN_KEY = 'ctrl_enter_sender_onboarding_shown';

export async function hasOnboardingBeenShown(): Promise<boolean> {
    const data = await browser.storage.local.get(ONBOARDING_SHOWN_KEY);
    return data[ONBOARDING_SHOWN_KEY] === true;
}

export async function setOnboardingShown(): Promise<void> {
    await browser.storage.local.set({ [ONBOARDING_SHOWN_KEY]: true });
}

const LAST_VERSION_KEY = 'ctrl_enter_sender_last_version';

export async function getLastVersion(): Promise<string | null> {
    const data = await browser.storage.local.get(LAST_VERSION_KEY);
    return data[LAST_VERSION_KEY] || null;
}

export async function setLastVersion(version: string): Promise<void> {
    await browser.storage.local.set({ [LAST_VERSION_KEY]: version });
}

export async function shouldShowWhatsNew(currentVersion: string): Promise<boolean> {
    const lastVersion = await getLastVersion();
    if (!lastVersion) {
        await setLastVersion(currentVersion);
        return false;
    }
    if (lastVersion !== currentVersion) {
        await setLastVersion(currentVersion);
        return true;
    }
    return false;
}

const MIGRATION_VERSION_KEY = 'ctrl_enter_sender_migration_version';

async function getMigrationVersion(): Promise<string | null> {
    const data = await browser.storage.local.get(MIGRATION_VERSION_KEY);
    return data[MIGRATION_VERSION_KEY] || null;
}

async function setMigrationVersion(version: string): Promise<void> {
    await browser.storage.local.set({ [MIGRATION_VERSION_KEY]: version });
}

export async function resetAllSettings(): Promise<void> {
    await browser.storage.sync.remove(STORAGE_KEY);
}

export async function migrateStorage(): Promise<void> {
    try {
        const currentVersion = browser.runtime.getManifest().version;
        const lastMigrationVersion = await getMigrationVersion();

        if (lastMigrationVersion === currentVersion) {
            return;
        }

        const data = await browser.storage.sync.get(STORAGE_KEY);
        const schema = (data[STORAGE_KEY] as StorageSchema) || { domains: {} };

        let hasChanges = false;
        const cleanedDomains: { [origin: string]: DomainConfig } = {};

        for (const [origin, config] of Object.entries(schema.domains)) {
            const cleanConfig: DomainConfig = {
                enabled: config.enabled ?? true,
                ...(config.customTargets && { customTargets: config.customTargets }),
                ...(config.customExcludes && { customExcludes: config.customExcludes })
            };

            const originalKeys = Object.keys(config);
            const cleanKeys = Object.keys(cleanConfig);
            if (originalKeys.length !== cleanKeys.length ||
                originalKeys.some(key => !cleanKeys.includes(key))) {
                hasChanges = true;
            }

            cleanedDomains[origin] = cleanConfig;
        }

        if (hasChanges) {
            await browser.storage.sync.set({ [STORAGE_KEY]: { domains: cleanedDomains } });
        }

        await setMigrationVersion(currentVersion);
    } catch (error) {
        console.error('Migration failed:', error);
    }
}
