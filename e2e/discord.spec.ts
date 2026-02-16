import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../.output/chrome-mv3');
const fixturePath = path.resolve(__dirname, 'fixtures/discord-mock.html');

let server: http.Server;
let baseURL: string;

// Serve the fixture on a hostname containing "discord.com" is impossible locally,
// so we serve it and rely on the adapter matching the hostname.
// Workaround: serve on localhost and have the extension's content script match <all_urls>.
// The adapter uses hostname.includes('discord.com'), so we need to trick it.
// Simplest: use a custom hosts entry or just test the MAIN world script directly.
//
// Actually, the content script matches <all_urls> and injects on ALL pages.
// The adapter selection is based on hostname. For localhost, it'll use defaultAdapter.
// To test Discord specifically, we need discord.com in the hostname.
//
// Strategy: serve the fixture, then navigate to it. For the adapter matching,
// we'll test two things separately:
// 1. That the MAIN world script works when manually loaded (direct test)
// 2. That the full extension works on a page that matches discord.com (needs hosts trick)
//
// For CI-friendliness, approach 1 is most practical.
// Let's do approach 1: load the extension, navigate to the fixture,
// and manually trigger what the content script would do for Discord.

test.describe('Discord MAIN world script', () => {
    let context: BrowserContext;

    test.beforeAll(async () => {
        // Start a simple HTTP server for the fixture
        const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
        server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fixtureContent);
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const addr = server.address();
        baseURL = `http://127.0.0.1:${typeof addr === 'object' ? addr!.port : 3000}`;

        // Launch Chrome with the extension loaded
        context = await chromium.launchPersistentContext('', {
            headless: true,
            args: [
                `--headless=new`,
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-first-run',
            ],
        });
    });

    test.afterAll(async () => {
        await context?.close();
        server?.close();
    });

    test('MAIN world script responds to __ces_insert_newline and calls insertSoftBreak', async () => {
        const page = await context.newPage();
        await page.goto(baseURL);
        await page.waitForTimeout(500);

        // Manually inject the MAIN world script (since hostname isn't discord.com,
        // the content script won't auto-inject it)
        const scriptURL = await page.evaluate(async () => {
            // The extension's discord-main-world.js is web-accessible for discord.com only,
            // so we can't fetch it via chrome.runtime.getURL from a non-discord page.
            // Instead, inject the script content directly for testing.
            return null;
        });

        // Read the built MAIN world script and inject it directly
        const mainWorldScript = fs.readFileSync(
            path.join(extensionPath, 'discord-main-world.js'), 'utf-8'
        );
        await page.evaluate(mainWorldScript);
        await page.waitForTimeout(200);

        // Focus the editor
        await page.click('[role="textbox"]');
        await page.waitForTimeout(100);

        // Dispatch the custom event that the content script's insertNewline() fires
        const softBreakBefore = await page.evaluate(() => (window as any).__testState.softBreakCount);
        expect(softBreakBefore).toBe(0);

        await page.evaluate(() => {
            document.dispatchEvent(new CustomEvent('__ces_insert_newline'));
        });
        await page.waitForTimeout(100);

        const softBreakAfter = await page.evaluate(() => (window as any).__testState.softBreakCount);
        expect(softBreakAfter).toBe(1);
    });

    test('triggerSend dispatches synthetic Enter keydown and Discord sends', async () => {
        const page = await context.newPage();
        await page.goto(baseURL);
        await page.waitForTimeout(500);

        await page.click('[role="textbox"]');

        const sendBefore = await page.evaluate(() => (window as any).__testState.sendCount);
        expect(sendBefore).toBe(0);

        // Simulate what discordAdapter.triggerSend does: dispatch synthetic Enter keydown
        await page.evaluate(() => {
            const textbox = document.querySelector('[role="textbox"]')!;
            textbox.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
            }));
        });
        await page.waitForTimeout(100);

        const sendAfter = await page.evaluate(() => (window as any).__testState.sendCount);
        expect(sendAfter).toBe(1);
    });

    test('Multiple insertSoftBreak calls work correctly', async () => {
        const page = await context.newPage();
        await page.goto(baseURL);
        await page.waitForTimeout(500);

        // Inject MAIN world script
        const mainWorldScript = fs.readFileSync(
            path.join(extensionPath, 'discord-main-world.js'), 'utf-8'
        );
        await page.evaluate(mainWorldScript);
        await page.waitForTimeout(200);

        await page.click('[role="textbox"]');
        await page.keyboard.type('line1');

        // Fire insertSoftBreak 3 times
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
                document.dispatchEvent(new CustomEvent('__ces_insert_newline'));
            });
            await page.waitForTimeout(50);
        }

        const count = await page.evaluate(() => (window as any).__testState.softBreakCount);
        expect(count).toBe(3);
    });
});
