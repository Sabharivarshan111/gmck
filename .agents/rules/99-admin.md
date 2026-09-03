---
description: The admin dashboard — why the gate is a role in the database and never an email compared in the client, and what deliberately stays in the web panel
---

# The admin dashboard, and why it is not an email check

`components/AdminPanel.tsx` sits at the bottom of My Progress. It renders
nothing for everybody else.

## The gate is a role in Postgres, never an email in the client

`hooks/useIsAdmin.ts` calls `is_admin()`, which reads the `user_roles` table.
It does **not** compare `user.email` to an address.

That distinction is the entire security of the panel:

- An email check in the app is a check anybody can edit out of their own build,
  and this app ships as an APK from a public GitHub release.
- The role check cannot be edited out, because the **database** does it. Every
  admin function is `SECURITY DEFINER` and calls `is_admin()` itself before
  returning a row.

So the hook decides only whether to *draw* the panel. If it were wrong, the
panel would render and every call inside it would still come back empty.
Verified: with no admin session the panel is absent and no errors are raised.

Adding an admin is a row in `user_roles`, not a release.

## What it does, and what stays on the web

Mirrors the Lovable/web project's two admin cards so both surfaces report the
same numbers:

| Section | Functions |
|---|---|
| Subscribers | `admin_list_subscribers`, `admin_revoke_user_access` — buyers, which unlocks are live, revenue, revoke |
| Diagrams | counts from `question_diagrams` |
| Textbook pages | `admin_page_ref_stats`, `admin_list_page_refs`, `admin_delete_page_ref`, `admin_delete_reference_book` |

**Diagram generation and approval deliberately stay in the web panel.** They
need a Gemini API key pasted in, and that does not belong in a text field on a
phone.

**The diagram number that matters is "with a picture", not the row count.**
`question_diagrams` has ~5,400 rows and only ~915 carry a `public_url`; the rest
are placeholders for a picture nobody has generated. A panel reporting 5,400
would be reporting coverage the app does not have.

## The page-reference moderation exists because the quorum is not enough

Three readers agreeing stops one person putting a number in front of the app. It
does not stop three people being wrong, or one person with three accounts. Both
destructive actions go through a `Dialog` because each takes **every** reader's
rows with it, not one.
