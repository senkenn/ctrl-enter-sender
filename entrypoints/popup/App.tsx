import { useEffect, useState, ChangeEvent } from 'react';
import { getDomainConfig, setDomainConfig, getActivationMode, hasOnboardingBeenShown, setOnboardingShown, shouldShowWhatsNew } from '@/utils/storage';
import { DomainConfig, ActivationMode } from '@/utils/types';
import { getMessage } from '@/utils/i18n';
import { Onboarding } from '@/components/Onboarding';
import { WhatsNew } from '@/components/WhatsNew';

function App() {
    const [origin, setOrigin] = useState<string | null>(null);
    const [config, setConfig] = useState<DomainConfig | null>(null);
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [showWhatsNew, setShowWhatsNew] = useState<boolean>(false);
    const [currentVersion, setCurrentVersion] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [activationMode, setActivationModeState] = useState<ActivationMode>('blacklist');

    useEffect(() => {
        const manifest = browser.runtime.getManifest();
        const version = manifest.version;
        setCurrentVersion(version);
        hasOnboardingBeenShown().then(shown => {
            if (!shown) {
                setShowOnboarding(true);
                setOnboardingShown();
            } else {
                shouldShowWhatsNew(version).then(show => {
                    setShowWhatsNew(show);
                });
            }
        });

        let isCancelled = false;
        let timeoutId: number | null = null;

        timeoutId = setTimeout(() => {
            if (!isCancelled) {
                setOrigin('');
                setConfig({ enabled: false });
                setIsLoaded(true);
            }
        }, 2000);

        const loadTabInfo = async () => {
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (isCancelled) return;

                const tab = tabs[0];
                if (tab?.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('about:')) {
                    const url = new URL(tab.url);
                    const tabOrigin = url.origin;
                    if (!isCancelled) {
                        setOrigin(tabOrigin);
                        const loadedConfig = await getDomainConfig(tabOrigin);
                        const mode = await getActivationMode();
                        if (!isCancelled) {
                            setConfig(loadedConfig);
                            setActivationModeState(mode);
                            setIsLoaded(true);
                            if (timeoutId) {
                                clearTimeout(timeoutId);
                                timeoutId = null;
                            }
                        }
                    }
                } else {
                    if (!isCancelled) {
                        setOrigin('');
                        setConfig({ enabled: false });
                        setIsLoaded(true);
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                    }
                }
            } catch {
                if (!isCancelled) {
                    setOrigin('');
                    setConfig({ enabled: false });
                    setIsLoaded(true);
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                }
            }
        };

        loadTabInfo();

        return () => {
            isCancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    const handleEnabledChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!config || !origin) return;
        const newConfig = { ...config, enabled: e.target.checked };
        setConfig(newConfig);
        await setDomainConfig(origin, newConfig);
    };

    if (origin === null && !isLoaded) {
        return <div style={{ padding: '16px' }}>{getMessage('loading')}</div>;
    }

    const isSpecialPage = !origin;

    return (
        <>
            {showOnboarding && (
                <Onboarding onClose={() => setShowOnboarding(false)} />
            )}
            {showWhatsNew && currentVersion && (
                <WhatsNew onClose={() => setShowWhatsNew(false)} version={currentVersion} />
            )}
            <div className="container">
            <div className="header">
                <h2 className="title">{getMessage('popupTitle')}</h2>
                <button
                    className="help-button"
                    onClick={() => setShowOnboarding(true)}
                    title={getMessage('helpTitle')}
                >
                    ?
                </button>
            </div>

            <div className="card">
                <div className="domain-label">{getMessage('currentDomain')}</div>
                <div className="domain-value">{origin || getMessage('noDomainAvailable')}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {activationMode === 'whitelist' ? getMessage('modeWhitelist') : getMessage('modeBlacklist')}
                </div>
            </div>

            {!isSpecialPage && config && (
                <div className="card row">
                    <label htmlFor="enabled-toggle" className="label" style={{ cursor: 'pointer' }}>{getMessage('enableForThisSite')}</label>
                    <label className="switch">
                        <input
                            id="enabled-toggle"
                            type="checkbox"
                            checked={config.enabled}
                            onChange={handleEnabledChange}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            )}

            {isSpecialPage && (
                <div className="card" style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {getMessage('specialPageNotSupported')}
                </div>
            )}

            <div className="footer">
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    v{currentVersion}
                </div>
                <button
                    className="link-button"
                    onClick={() => browser.runtime.openOptionsPage()}
                >
                    {getMessage('advancedSettings')}
                </button>
                <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                <a
                    className="link-button"
                    href="https://github.com/kimura512/ctrlEnterSenderA/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {getMessage('reportIssue')}
                </a>
            </div>
        </div>
        </>
    );
}

export default App;
