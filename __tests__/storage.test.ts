import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock browser API
const storageData: Record<string, any> = {};

const mockBrowser = {
    storage: {
        sync: {
            get: vi.fn(async (key: string) => {
                return { [key]: storageData[key] };
            }),
            set: vi.fn(async (data: Record<string, any>) => {
                Object.assign(storageData, data);
            }),
            remove: vi.fn(async (key: string) => {
                delete storageData[key];
            }),
        },
        local: {
            get: vi.fn(async (key: string) => {
                return { [key]: storageData[`local_${key}`] };
            }),
            set: vi.fn(async (data: Record<string, any>) => {
                for (const [k, v] of Object.entries(data)) {
                    storageData[`local_${k}`] = v;
                }
            }),
        },
    },
    runtime: {
        getManifest: vi.fn(() => ({ version: '1.3.2' })),
    },
};

vi.stubGlobal('browser', mockBrowser);

// Import after mocking
const {
    getDomainConfig,
    setDomainConfig,
    getActivationMode,
    setActivationMode,
    getNormalizedOrigin,
    resetAllSettings,
    isDefaultDisabledOrigin,
    isDefaultWhitelistedOrigin,
} = await import('../utils/storage');

describe('storage', () => {
    beforeEach(() => {
        for (const key of Object.keys(storageData)) {
            delete storageData[key];
        }
        vi.clearAllMocks();
    });

    describe('getDomainConfig', () => {
        it('blacklist mode: returns enabled=true for normal site', async () => {
            const config = await getDomainConfig('https://example.com');
            expect(config.enabled).toBe(true);
        });

        it('blacklist mode: returns enabled=false for default disabled domain', async () => {
            const config = await getDomainConfig('https://x.com');
            expect(config.enabled).toBe(false);
        });

        it('whitelist mode: returns enabled=false for non-whitelisted site', async () => {
            storageData['ctrl_enter_sender_config'] = {
                activationMode: 'whitelist',
                domains: {},
            };
            const config = await getDomainConfig('https://example.com');
            expect(config.enabled).toBe(false);
        });

        it('whitelist mode: returns enabled=true for default whitelisted domain', async () => {
            storageData['ctrl_enter_sender_config'] = {
                activationMode: 'whitelist',
                domains: {},
            };
            const config = await getDomainConfig('https://chatgpt.com');
            expect(config.enabled).toBe(true);
        });

        it('returns saved config when exists', async () => {
            storageData['ctrl_enter_sender_config'] = {
                domains: {
                    'https://example.com': { enabled: false },
                },
            };
            const config = await getDomainConfig('https://example.com');
            expect(config.enabled).toBe(false);
        });
    });

    describe('setDomainConfig', () => {
        it('saves config for both www and non-www origins', async () => {
            await setDomainConfig('https://example.com', { enabled: false });
            const savedData = storageData['ctrl_enter_sender_config'];
            expect(savedData.domains['https://example.com']).toEqual({ enabled: false });
            expect(savedData.domains['https://www.example.com']).toEqual({ enabled: false });
        });
    });

    describe('getNormalizedOrigin', () => {
        it('removes www prefix', () => {
            expect(getNormalizedOrigin('https://www.example.com')).toBe('https://example.com');
        });

        it('preserves non-www origins', () => {
            expect(getNormalizedOrigin('https://example.com')).toBe('https://example.com');
        });
    });

    describe('getActivationMode / setActivationMode', () => {
        it('defaults to blacklist', async () => {
            const mode = await getActivationMode();
            expect(mode).toBe('blacklist');
        });

        it('can set and get whitelist', async () => {
            await setActivationMode('whitelist');
            const mode = await getActivationMode();
            expect(mode).toBe('whitelist');
        });
    });

    describe('resetAllSettings', () => {
        it('removes storage key', async () => {
            storageData['ctrl_enter_sender_config'] = { domains: { 'https://x.com': { enabled: true } } };
            await resetAllSettings();
            expect(storageData['ctrl_enter_sender_config']).toBeUndefined();
        });
    });

    describe('isDefaultDisabledOrigin', () => {
        it('x.com is disabled', () => {
            expect(isDefaultDisabledOrigin('https://x.com')).toBe(true);
        });

        it('google.com exact match only', () => {
            expect(isDefaultDisabledOrigin('https://google.com')).toBe(true);
            expect(isDefaultDisabledOrigin('https://gemini.google.com')).toBe(false);
        });
    });

    describe('isDefaultWhitelistedOrigin', () => {
        it('chatgpt.com is whitelisted', () => {
            expect(isDefaultWhitelistedOrigin('https://chatgpt.com')).toBe(true);
        });

        it('random site is not whitelisted', () => {
            expect(isDefaultWhitelistedOrigin('https://random.com')).toBe(false);
        });
    });
});
