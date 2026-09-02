---
name: step-verification-screenshot
description: >-
  Captures UI screenshots after completing implementation or verification steps in the application,
  embedding them in the response/walkthrough for instant visual inspection by the user.
---

# Step Verification Screenshot Skill

This skill enforces automatic visual screenshot capture whenever UI components, screens, or features are modified or completed.

## Workflow

1. **Complete Implementation & Local Checks**:
   - Run typecheck and unit/lint checks:
     `npm --prefix mobile run typecheck`
     `npm --prefix mobile run lint`
2. **Capture Visual Screenshots**:
   - For mobile UI screens (Timer, Notes, Flashcards, Home, Themes, etc.), run the screenshot capture script:
     `node mobile/preview/shoot.mjs`
   - Or use Playwright / Puppeteer to capture target views at `http://localhost:5173/`.
3. **Embed in Response**:
   - Embed captured PNG/JPG images in `walkthrough.md` or directly in the response:
     `![Screenshot Description](/absolute/path/to/screenshot.png)`
   - Highlight key visual improvements so the user can verify immediately.
