import { defineConfig } from 'wxt';

export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: {
        name: '__MSG_extensionName__',
        description: '__MSG_extensionDescription__',
        default_locale: 'en',
        version: '1.3.2',
        permissions: ['storage', 'activeTab'],
        browser_specific_settings: {
            gecko: {
                id: 'ctrl-enter-sender@senkenn',
            },
        },
        host_permissions: ['<all_urls>'],
        icons: {
            '16': 'icons/icon16.png',
            '32': 'icons/icon32.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png',
        },
        web_accessible_resources: [
            {
                resources: ['discord-main-world.js'],
                matches: ['*://*.discord.com/*'],
            },
        ],
    },
});
