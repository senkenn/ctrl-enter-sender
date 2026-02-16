import { SiteAdapter } from '../types';
import { discordAdapter } from './discord';
import { claudeAdapter } from './claude';
import { slackAdapter } from './slack';
import { grokAdapter } from './grok';
import { chatgptAdapter } from './chatgpt';
import { teamsAdapter } from './teams';
import { defaultAdapter } from './default';

const adapters: SiteAdapter[] = [
    discordAdapter,
    claudeAdapter,
    slackAdapter,
    grokAdapter,
    chatgptAdapter,
    teamsAdapter,
    defaultAdapter,
];

export function getAdapter(hostname: string): SiteAdapter {
    for (const adapter of adapters) {
        if (adapter.matches(hostname)) {
            return adapter;
        }
    }
    return defaultAdapter;
}
