import { migrateStorage } from '@/utils/storage';

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === 'install' || details.reason === 'update') {
            await migrateStorage();
        }
    });

    migrateStorage().catch(console.error);
});
