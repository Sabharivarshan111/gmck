# Checkout catalogue and free Vault previews — 24 October 2026

## User-visible scope

Production browser checkout now separates Premium (₹150/180 days, ₹300/365 days; offer ends 30 November 2026 23:59:59 IST) from two curated lifetime note packs: FM + SPM and Pharmacology, each ₹150. General Vault Notes remain free. Existing Premium FM/SPM bonus and note-pack 30-day access bonus are preserved. Owned note packs show their existing Drive delivery links after a server-row check or verified purchase. The header is smaller, plan cards are readable when signed out, and notes appear below Premium.

Website Vault cards now open free previews: anatomy includes heart/lungs/brain; auscultation includes normal S1/S2 and vesicular breath sounds; the CVS master proforma is the free case sample; each exam offers the first ten fixed questions. Other organ selections, sounds, clinical tools/cases, proformas and full-bank import open a Premium prompt. Anki and separate case libraries retain their existing Premium gate. Notes remain unrestricted.

The fixed practice reader filters chapters, saved IDs, pagination and images against the same ten IDs; searches do not rotate the sample. Its study-state ID is separate from the full reader. Direct simulator organ/tool links use the same sample rules. Paid access is still read from the authenticated user's Supabase entitlement; the default simulator context preserves existing native/development behavior. These changes do not produce or release an Android binary.

## Payment handling

Current notes orders cost exactly 15000 paise and carry server-recorded catalogue version 2. Captured-payment verification uses that provider metadata; historical unversioned 5000-paise notes orders remain restorable. The service-only atomic grant accepts these two supported note prices and retains account ownership/replay protections. No client can execute the grant RPC.

An unpublished old Lovable page still advertises ₹50 notes. Notes order creation therefore requires the current catalogue marker; stale callers receive HTTP409 explaining the new price and pointing to orbitmbbs.site/unlock, before any Razorpay order/payment window starts. Current browser note checkout supplies the marker. Existing historical receipts remain verifiable.

Live Supabase: create-order v41, verify-payment v39, restore-purchase v22. Migration generated with Supabase CLI and applied as checkout_note_pack_pricing. No secrets changed/read. RLS/grant permissions remain unchanged.

## Lovable publication blocker

Lovable project 89df4dbc-89e6-4e44-a7b1-76b9de94066e saved a four-product checkout redesign at f66364518478668873f3955a0b5401210988cd16. The tool reported 11 tests and 360/412px preview checks passed, but explicitly did not publish. A follow-up publication request returned workspace out-of-credits. Do not claim the public Lovable page changed. After credits are restored: include catalogue_version:'2' in notes create requests; use orbitmbbs.site Back links; align current note-card prices; clear success on account changes/defer async auth callbacks; finish publication and live verification. Do not replace hardened Supabase handlers from the older Lovable source.

## Verification and limits

39 provider/transport/security cases, fixed sample-reader boundary checks, native/server-row entitlement fixtures, browser/root TypeScript and targeted lint. Root app TypeScript config now uses ES2022 library support matching existing Object.hasOwn usage, so the normal CI type command passes. Existing full-content simulator browser checks explicitly install the test-only paid provider; the separate sample test still checks denial for free users. Paid browser checks also verify ECG opens and a liver dossier remains available. Combined production build passes. All nine emitted-browser scenarios pass: guest, two Premium viewports, verification failure/restore, interrupted order, both note products, free sample/paid selections and paid access; zero runtime errors. Free browser checks cover all exam samples, CVS allowed/respiratory proforma denied, normal auscultation/abnormal sound denied, locked organ deep links and heart dossier allowed. Live rollback-only database checks verify both ₹150 note grants, lifetime note access, 30-day bonus, replay idempotency, historic ₹50 restore and invalid amount rejection; no synthetic users/grants persist.

Browser checkout/payment/auth traffic is explicitly mocked: no real Google sign-in, Razorpay charge or physical Android purchase was performed. Source UI limits do not provide DRM for public static assets. Deployment/browser verification receipts belong to the final PR metadata. No production webhook dashboard configuration verified.

## Paid startup and complimentary grants follow-up

The simulator now waits for its initial membership query before mounting, preserving paid deep links and avoiding a false upsell while the account check is pending. Full-content organ-connection/direct-open tests also use the explicit paid provider fixture. All nine production-browser scenarios pass with the loading correction.

A private, service-only promotion ledger can pre-authorize an email for access on its first verified Google sign-in. The auth trigger grants ad-free and both curated note entitlements for the approved duration, uses source=promotion and zero amounts, and never fabricates a Razorpay transaction. The owner-approved influencer email has a pending365-day grant; the address is stored only in the database. Rollback-only tests prove no unverified-email access, exactly three grants,365-day expiry, idempotency and client-role denial. No real account has been created on the influencer's behalf.


2026-10-25 continuation: Simulator mobile harness now explicitly opens mode=anatomy and waits for the simulator root (the default route is the skills studio); supports CHROME_PATH for local reproducibility. Local full-content run4passed/8failed: all36organ dossiers and representative routes pass; older assertions target hidden toolbar controls, retired labels/class styling/geometry. Assertions retained; no bypass. Checkout/access browser9scenarios previously passed; production build and all four Connected Anatomy partitions pass. Existing dossier vascular-source unit and iOS touch checks remain failing. Android PR126 independently preserves attendance organizer and passes targeted native access checks/Metro/lint/types. Influencer promotion remains pending verified Google sign-in.
