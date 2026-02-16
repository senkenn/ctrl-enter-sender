# Ctrl+Enter Sender

Chrome/Firefox extension that swaps Enter and Ctrl+Enter behavior on chat websites — Enter inserts a newline, Ctrl+Enter sends the message.

Inspired by [ctrlEnterSenderA](https://github.com/kimura512/ctrlEnterSenderA)

## Supported Sites

| Site | Adapter |
|------|---------|
| Discord | `discord` |
| Claude | `claude` |
| Slack | `slack` |
| ChatGPT | `chatgpt` |
| Grok | `grok` |
| Microsoft Teams | `teams` |
| Other sites | `default` |

## Features

- **Per-site toggle** — enable/disable from the popup on any site
- **Blacklist / Whitelist mode** — choose default-ON or default-OFF globally
- **iframe support** — works inside nested iframes (same-origin)
- **35 languages** — i18n with `_locales`
- **Storage sync** — settings sync across devices via `chrome.storage.sync`

## Development

```bash
pnpm install
pnpm dev          # dev mode (Chrome)
pnpm dev:firefox  # dev mode (Firefox)
pnpm build        # production build
pnpm test         # unit tests (vitest)
pnpm test:e2e     # e2e tests (playwright)
```

Built with [WXT](https://wxt.dev) + React + TypeScript.
