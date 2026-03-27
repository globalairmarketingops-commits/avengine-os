# Av/EngineOS — GlobalAir.com Revenue Engine

Marketing operations command center for GlobalAir.com. Tracks PPC campaigns, SEO rankings, listing inventory, advertiser monetization, opportunities, decisions, and system gaps.

## Pages

1. **Command Center** — System gates, KPIs, top opportunities, weekly decisions
2. **PPC Hub** — Campaign health, signal integrity, governance hierarchy, scaling math
3. **SEO Hub** — Rank tracking, content pipeline, CTR trends, competitive gaps
4. **Listings Hub** — Inventory health, freshness, broker quality, CSV upload
5. **Monetization Hub** — MRR, ARPA, churn risk, renewal pipeline, MVS
6. **Opportunity Queue** — Scored actions across all domains
7. **Decision Log** — Audit trail of what changed and why
8. **Gaps & Blockers** — System-wide blocking issues with cost-of-delay

## Tech Stack

- **Frontend:** Vanilla JavaScript (no framework, no build step)
- **Persistence:** localStorage with versioned CRUD
- **Data:** Windsor.ai pre-fetched JSON + manual input + seed data
- **Styling:** CSS custom properties (GlobalAir design tokens)
- **Fonts:** Montserrat 700 (headings), DM Sans (body)
- **Deployment:** GitHub Pages via Actions

## Data Refresh

Windsor.ai data is pre-fetched via Claude Code MCP and committed as JSON files in `app/data/`. The app hydrates localStorage from these files on boot.

## Brand Colors

| Token | Hex |
|-------|-----|
| Navy | #102297 |
| Green | #97CB00 |
| Blue | #4782D3 |
| Red | #E8503A |
| Amber | #F59E0B |

## Local Development

Serve `app/` on any static server. Default port: 8092.

---

GlobalAir.com &copy; 2026
