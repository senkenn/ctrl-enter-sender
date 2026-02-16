import { describe, it, expect } from 'vitest';
import { getAdapter } from '../../utils/adapters';

describe('adapter registry', () => {
    it('discord.com → discord adapter', () => {
        expect(getAdapter('discord.com').name).toBe('discord');
    });

    it('ptb.discord.com → discord adapter', () => {
        expect(getAdapter('ptb.discord.com').name).toBe('discord');
    });

    it('claude.ai → claude adapter', () => {
        expect(getAdapter('claude.ai').name).toBe('claude');
    });

    it('app.slack.com → slack adapter', () => {
        expect(getAdapter('app.slack.com').name).toBe('slack');
    });

    it('grok.com → grok adapter', () => {
        expect(getAdapter('grok.com').name).toBe('grok');
    });

    it('chatgpt.com → chatgpt adapter', () => {
        expect(getAdapter('chatgpt.com').name).toBe('chatgpt');
    });

    it('teams.microsoft.com → teams adapter', () => {
        expect(getAdapter('teams.microsoft.com').name).toBe('teams');
    });

    it('teams.live.com → teams adapter', () => {
        expect(getAdapter('teams.live.com').name).toBe('teams');
    });

    it('unknown site → default adapter', () => {
        expect(getAdapter('example.com').name).toBe('default');
    });

    it('similar-but-wrong hostname → default adapter', () => {
        expect(getAdapter('mydiscordapp.com').name).toBe('default');
    });

    it('google.com → default adapter', () => {
        expect(getAdapter('google.com').name).toBe('default');
    });
});
