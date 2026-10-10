# Compliance release checklist — Evidență PPL

**Audit static:** 10 octombrie 2026  
**Status:** Pagini de informare pregătite; lansarea nu este „legal approved” până când elementele restante nu sunt verificate.

## Operator and legal identity
- [ ] Replace every `[DE COMPLETAT: ...]` marker with verified contact/business details.
- [ ] Confirm whether the publisher acts as a private individual, PFA/company, or on behalf of a public authority.
- [ ] If acting for a public authority, obtain written authorization, approve the processing purpose and complete the institution's security/privacy review before real personal data is used.

## Privacy and data processing
- [ ] Confirm Supabase project region, data retention, backup and deletion settings, RLS policies, RPC permissions and logs.
- [ ] Determine and document controller/processor roles and applicable data protection law for every processing purpose.
- [ ] Test network requests in production before consent, after acceptance, after rejection and after withdrawal.
- [ ] Verify no real prisoner data or OCR text is persisted/sent to analytics.
- [ ] Confirm hosting/network log processing and review GitHub/Supabase terms and data processing agreements.

## Cookies/local storage and third parties
- [ ] Inspect browser cookies, localStorage, sessionStorage, IndexedDB, Cache Storage, service workers, outbound requests and embedded content on each route.
- [ ] Ensure analytics/optional storage starts only after valid consent and that refusal is equally easy to select.
- [ ] Confirm how existing stored consent can be withdrawn and how long backend events are retained.
- [ ] Re-audit external dependencies and hashes whenever the AI/OCR runtime changes.

## Accessibility and UI
- [ ] Run an automated accessibility scan and manual keyboard/screen-reader testing for every route and theme.
- [ ] Measure WCAG contrast ratios for all text, icons, focus indicators, controls and error/disabled states.
- [ ] Verify visible focus, modal focus management, form errors, accessible names for dynamic controls, image alt text and responsive reflow.
- [ ] Change vague/destructive control labels when tests identify ambiguity; do not alter core calculation controls without regression tests.

## Claims, reviews, assets and commercial use
- [ ] No testimonials were added; verify all page copy for unsupported claims before release.
- [ ] No public checkout/price flow was identified. Complete refund and consumer terms before any paid launch.
- [ ] Create an asset/dependency inventory with source, license and attribution; confirm rights to all images, fonts, icons, code and training/OCR files.
- [ ] Add seller identification, total prices, contract confirmation and applicable consumer cancellation disclosures before any e-commerce flow goes live.

## Legal framework for review
The relevant provisions may include GDPR (Regulation (EU) 2016/679), Directive 2002/58/EC Article 5(3), Romanian Law No. 506/2004 on privacy in electronic communications, Law No. 363/2018 for competent authorities' law-enforcement processing, Law No. 254/2013 and implementing rules, Emergency Ordinance No. 34/2014 for distance contracts, Government Ordinance No. 21/1992 on consumer protection and Law No. 8/1996 on copyright. Applicability depends on purpose, publisher and audience and must be confirmed from current official consolidated texts.

This checklist is a record of issues for resolution, not a legal opinion, certification, DPIA or penetration-test report.
