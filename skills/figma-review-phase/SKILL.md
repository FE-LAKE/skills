---
name: figma-review-phase
description: >-
  Internal helper for figma-to-code review phase. Run isolated Figma visual
  review and automatic visual fixes from a review brief.
context: fork
license: MIT
metadata:
  author: fe-lake
  version: "1.0.0"
compatibility: Requires Framelink Figma MCP, Chrome DevTools MCP, and a review brief from figma-to-code.
---

# Figma Review Phase

Internal helper for `figma-to-code`. Run this skill from a fixed review brief after code generation, asset handling, and lint/typecheck are complete. The goal is to keep screenshot comparison, browser inspection, and visual fix rounds in an isolated context.

Do not use prior generation-stage visual guesses as evidence. Judge only from the review brief, Figma reference, implementation screenshots, browser/runtime evidence, and code.

## Input

The caller must provide a review brief in this shape:

```markdown
## Review Brief

- mode: generate | review-only
- figmaUrl: <Figma URL>
- nodeId: <target node id, e.g. 1234:5678>
- modifiedFiles:
  - <path>
- devCommand: <command or "unknown">
- devUrl: <URL or "unknown">
- route: <route or "unknown">
- viewport: <width>x<height>
- techStack: <framework / styling / build info>
- assumptions:
  - <item or "none">
- assetsSummary: downloaded: N | linked: N | placeholder: N
- tokensSummary: figma: N | project: N | literals: N
- lintTypecheckResult: pass | failed (<command>) | not-run (<reason>)
- allowedFixScope: visual-only
- blockedConditions:
  - business logic
  - API
  - routing
  - state model
  - persistence
  - public component API
```

If required fields are missing:

1. Recover only from code evidence, `@figma` file headers, package scripts, dev server output, or explicit user input already present in the task.
2. If `figmaUrl`, target node, and an implementation URL/route cannot be recovered, stop with `blocked: incomplete review brief`.
3. If Figma screenshots or implementation screenshots are unavailable, stop with `blocked: capability unavailable`.

## Capability Gate

Before visual judgment:

1. Confirm Figma screenshot capability. Read the MCP tool schema before calling any Figma MCP tool.
2. Confirm browser screenshot capability, such as Chrome DevTools MCP or an equivalent browser tool.
3. Confirm the implementation can be opened through `devUrl` or `route` plus `devCommand`.
4. Confirm the review file list. In review-only mode, if no file list is available, locate likely page files from route and `@figma` headers.

Do not guess visual differences without both a Figma reference and an implementation screenshot.

## Review Loop

Run at most 3 rounds by default. If high-impact differences are still obvious, continue up to 5 rounds. Stop after 5 rounds and report the remaining issues.

Each round:

1. Capture or refresh the Figma reference screenshot for the target node.
2. Open the implementation at the same viewport and capture a screenshot.
3. Compare in this priority order:
   - layout structure, alignment, width, height
   - spacing
   - typography
   - color
   - shadow, radius, icons, image assets
   - responsive viewport details
4. Select 1-3 highest-impact categories to fix.
5. Modify only visual/display code in the listed files or directly related style/assets files.
6. Run the relevant lint/typecheck command from the brief or project scripts.
7. Re-screenshot and reassess.

## Allowed Fixes

Allowed without asking:

- display structure needed to match Figma
- spacing, size, color, typography, border, radius, shadow
- flex/grid layout and responsive visual details
- image/icon references, dimensions, `object-fit`, alignment, clipping
- visual TODOs that do not implement business behavior

Stop and report `needs_decision` before changing:

- business logic, API calls, permissions, auth, form submission, validation rules
- routing structure
- state management, data model, persistence
- public props/events/slots or component API
- behavior that conflicts with explicit user requirements

## Fix Patterns

- When the whole page is offset, fix root/container width, max-width, padding, or alignment before child margins.
- When multiple children are misaligned together, fix the parent gap, padding, flex/grid axis, or alignment.
- Use project spacing tokens, Tailwind scale, or CSS variables when present.
- Match font family, size, line-height, weight, and letter-spacing before changing text content.
- Prefer project color tokens. Use literal Figma values only when no token exists, and report them in `tokensSummary`.
- For shadows, match offset, blur, spread, and opacity. Preserve the primary visual layer if the stack cannot express every Figma layer.
- Do not invent missing image content. Export from Figma or use existing project assets; otherwise report `blocked` or a confirmed placeholder.

## Output

Return this summary to the caller:

```markdown
Review phase         : pass | partial | blocked (<reason>)
Fix rounds           : N / 3 | N / 5
Screenshots          : Figma <path-or-id> | Implementation <path-or-id>
Validation           : pass | failed (<command>) | not-run (<reason>)
Files changed        : <list or "none">
Remaining issues     : <list or "none">
needs_decision       : <list or "none">
blocked              : <reason or "none">
```

When reporting differences, use `pass`, `partial`, or `fail` for each category. `pass` means matched, `partial` means minor remaining differences, and `fail` means visibly different.
