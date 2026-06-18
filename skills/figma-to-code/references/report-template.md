# Review Report Template

```markdown
### 【{页面名称}】Review Phase

## Screenshots

- Figma: {figmaScreenshot}
- Implementation: {implementationScreenshot}
- Viewport: {viewport}

## Difference Ranking

| Priority | Category | Status | Notes |
|----------|----------|--------|-------|
| 1 | Layout / alignment / size | pass/partial/fail | |
| 2 | Spacing | pass/partial/fail | |
| 3 | Typography | pass/partial/fail | |
| 4 | Color | pass/partial/fail | |
| 5 | Shadow / radius / icons / image assets | pass/partial/fail | |
| 6 | Responsive viewport details | pass/partial/fail | |

## Automatic Fixes

- round: {currentRound}/{maxRounds}
- selected categories: {1-3 highest-impact categories}
- files changed: {files}
- validation: {lint/typecheck result}

## Remaining Issues

- visual: {remaining visual issues or "none"}
- needs_decision: {business/API/routing/state/component API issues or "none"}
- blocked: {reason or "none"}
```

Status values: `pass` means matched, `partial` means minor remaining differences, `fail` means visibly different.
