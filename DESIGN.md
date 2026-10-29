# MagicNet panel

An operational panel for a small personal VPS. The owner checks per-account
traffic and creates or edits users from a phone. Home and Clients have priority;
advanced proxy configuration keeps the existing S-UI controls.

Use white surfaces on a quiet grey background, restrained blue actions, 14px
surface corners and hairline dividers. Green means running; amber needs attention.
Use the system sans with tabular figures. No decorative charts or secondary copy
that repeats the layout. Real user names and current S-UI counters drive the UI.

Under 960px, user rows become cards and Home/Clients gain bottom navigation.
Under 600px, editing and QR dialogs fill the screen with fixed action footers.
Respect safe areas, 44px controls, keyboard focus and dark theme. Long identifiers
must wrap; prefer the user's human-readable remark in listings. Desktop tables
remain useful for dense account management.

Clients use the full content width beside the navigation drawer, with the same
responsive gutters. Keep Home and reading-oriented screens at their bounded
width; dense user tables should not inherit that reading-width constraint.

Traffic values use plain tabular figures, with the quota muted. A neutral grey
track sits directly below and matches the value's width; reserve semantic color
for actual usage. Use the same neutral track on mobile so unused quota never
looks like a full green bar.

Keep additions in `MagicNetOverview.vue` and `styles/magicnet.scss` where possible
to make upstream merges reviewable. Never label local accounting as CloudCone's
official billable usage. Do not alter credentials or quota semantics for presentation.
