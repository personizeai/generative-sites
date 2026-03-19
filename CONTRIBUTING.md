# Contributing to Generative Sites

> **Early Access** — This project is under active development. The SDK API and zone behavior may change between releases. We're building in the open and would love your help.

Thank you for your interest in contributing! Whether it's a new CMS integration, zone type, bug fix, or documentation improvement — every contribution matters.

---

## Before You Start

1. **Check existing issues** — someone may already be working on it
2. **Open an issue first** for large changes so we can discuss the approach
3. **Read the [SETUP-GUIDE.md](SETUP-GUIDE.md)** to get the project running locally

---

## Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/generative-sites.git
cd generative-sites

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
# Add your PERSONIZE_SECRET_KEY

# 4. Run setup
npm run setup      # Create schemas + governance
npm run seed       # Import sample contacts

# 5. Create a feature branch
git checkout -b feat/your-feature-name

# 6. Make changes and test
npm test              # Run test suite
npm run test:coverage # Check coverage
npm run typecheck     # TypeScript strict mode
npm run build         # Verify production build

# 7. Commit and push
git add .
git commit -m "feat: describe your change"
git push origin feat/your-feature-name

# 8. Open a Pull Request
```

---

## Code Standards

- **TypeScript strict mode** for setup/test files
- **Clean vanilla JS** for gs.js — no build-step required for end users
- **Tests required** — add vitest tests for new logic
- **All tests must pass** before merging
- **Keep the SDK lightweight** — every byte matters for a script tag

---

## What We're Looking For

Great first contributions:

- **CMS integrations** — WordPress plugin, Webflow embed, Shopify theme snippet
- **Framework adapters** — React, Vue, Svelte, Angular wrappers
- **New zone types** — image zones, CTA zones, form field zones
- **Analytics integrations** — GA4, Mixpanel, Amplitude event forwarding
- **Consent manager support** — new providers beyond OneTrust/CookieBot/Osano
- **Documentation** — tutorials, video walkthroughs, translations
- **Bug fixes** — edge cases in SPA detection, SSE reconnection, zone batching

---

## Collaborate Closely

We're actively looking for contributors and partners who want to help shape the future of AI-powered website personalization. If you'd like to collaborate closely on this project or our other open-source work:

- **Open an issue** with the `collaboration` label
- **Reach out** at [team@personize.ai](mailto:team@personize.ai)
- **Join the discussion** in GitHub Discussions

---

## Sponsors

We're grateful to the companies and individuals who support this project. Sponsorship helps us maintain the SDK, add integrations, and keep it free for everyone.

### Become a Sponsor

Sponsors get their logo and link displayed here and in the project README — visible to every developer adding AI personalization to their site.

| Tier | Benefits |
|------|----------|
| **Gold** | Large logo in README + CONTRIBUTING + link + priority issue support |
| **Silver** | Medium logo in README + CONTRIBUTING + link |
| **Bronze** | Name listed in sponsors section |

**Interested?** Reach out at [sponsors@personize.ai](mailto:sponsors@personize.ai) or [open a sponsorship inquiry](https://github.com/personizeai/generative-sites/issues/new?labels=sponsorship&title=Sponsorship+Inquiry).

<!--
### Gold Sponsors
<a href="https://example.com"><img src="https://example.com/logo.png" width="200" alt="Sponsor Name" /></a>

### Silver Sponsors
<a href="https://example.com"><img src="https://example.com/logo.png" width="120" alt="Sponsor Name" /></a>

### Bronze Sponsors
- [Sponsor Name](https://example.com)
-->

*Your logo here — [become a sponsor](mailto:sponsors@personize.ai)*

---

## Code of Conduct

Be respectful, constructive, and inclusive. We're all here to build something great together.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
