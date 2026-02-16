import { getAdapter } from '@/utils/adapters';
import { getDomainConfig } from '@/utils/storage';
import { resolveKeyAction } from '@/utils/key-handler';
import { DomainConfig } from '@/utils/types';

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_end',

    main() {
        let currentConfig: DomainConfig | null = null;
        const origin = window.location.origin;
        const hostname = window.location.hostname;

        const adapter = getAdapter(hostname);

        // Inject MAIN world script for Discord
        if (adapter.name === 'discord') {
            injectScript('/discord-main-world.js', { keepInDom: false });
        }

        getDomainConfig(origin).then(config => {
            currentConfig = config;
        });

        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes['ctrl_enter_sender_config']) {
                getDomainConfig(origin).then(config => {
                    currentConfig = config;
                });
            }
        });

        function attachListeners(doc: Document) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

            const captureTarget: EventTarget = adapter.listenerTarget === 'window'
                ? (doc.defaultView || window)
                : doc;

            // Capture phase
            captureTarget.addEventListener('keydown', (evt) => {
                const event = evt as KeyboardEvent;
                if (!currentConfig || !currentConfig.enabled) return;

                const target = event.target as HTMLElement;
                if (!adapter.isEditable(target, currentConfig)) return;

                const action = resolveKeyAction(
                    event,
                    adapter.nativeSendKey,
                    isMac,
                    'capture',
                    event.defaultPrevented,
                );

                if (action === 'send') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    adapter.triggerSend(target);
                } else if (action === 'newline') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    adapter.insertNewline(target);
                }
            }, true);

            // Bubble phase (ctrl+enter sites only)
            if (adapter.nativeSendKey === 'ctrl+enter') {
                doc.addEventListener('keydown', (event) => {
                    if (!currentConfig || !currentConfig.enabled) return;

                    const target = event.target as HTMLElement;
                    if (!adapter.isEditable(target, currentConfig)) return;

                    const action = resolveKeyAction(
                        event,
                        adapter.nativeSendKey,
                        isMac,
                        'bubble',
                        event.defaultPrevented,
                    );

                    if (action === 'send') {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        adapter.triggerSend(target);
                    }
                }, false);
            }
        }

        attachListeners(document);

        // Handle iframes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLIFrameElement) {
                        try {
                            const iframeDoc = node.contentDocument;
                            if (iframeDoc) {
                                attachListeners(iframeDoc);
                            } else {
                                node.addEventListener('load', () => {
                                    const loadedDoc = node.contentDocument;
                                    if (loadedDoc) {
                                        attachListeners(loadedDoc);
                                    }
                                });
                            }
                        } catch {
                            // Cross-origin iframe
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument;
                if (iframeDoc) {
                    attachListeners(iframeDoc);
                }
            } catch {
                // Cross-origin
            }
        });
    },
});
