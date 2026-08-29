# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test_e2e.spec.ts >> Testing Center routing and UI components loaded
- Location: test_e2e.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Class Test")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Class Test")')

```

```yaml
- region "Notifications alt+T"
- link "Scholario Logo Scholario Learn · Grow · Achieve":
  - /url: /
  - img "Scholario Logo"
  - text: Scholario Learn · Grow · Achieve
- heading "Welcome back" [level=1]
- paragraph: Sign in to your Scholario account using your institutional Google address.
- button "Continue with Google"
- paragraph:
  - strong: Access is restricted to pre-registered members.
  - text: You must sign in with the exact Google account that your institution has registered for you. If you don't have access, contact your academic coordinator.
- paragraph: All roles — Admin, Teacher, Student — use the same Google sign-in.
- text: SHS Virtual Academy — Scholario
- heading "Learn smarter, achieve more." [level=2]
- paragraph: Pakistan's most focused academy platform — built for students who are serious about their results.
- text: 9–12 All Grades 1 Board FBISE 100% Focused Learning Live Class Schedule
- paragraph: © 2025 Scholario · Made in Pakistan 🇵🇰
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Testing Center routing and UI components loaded', async ({ page }) => {
  4  |
  5  |   await page.route('**/auth/v1/user', route => {
  6  |     route.fulfill({
  7  |       status: 200,
  8  |       contentType: 'application/json',
  9  |       body: JSON.stringify({ id: '123', aud: 'authenticated', role: 'authenticated', email: 'admin@admin.com' })
  10 |     });
  11 |   });
  12 |
  13 |   await page.route('**/auth/v1/session', route => {
  14 |     route.fulfill({
  15 |       status: 200,
  16 |       contentType: 'application/json',
  17 |       body: JSON.stringify({ access_token: 'fake', user: { id: '123' } })
  18 |     });
  19 |   });
  20 |
  21 |   await page.route('**/rest/v1/profiles?*', route => {
  22 |     route.fulfill({
  23 |       status: 200,
  24 |       contentType: 'application/json',
  25 |       body: JSON.stringify([{ id: '123', role: 'admin', full_name: 'Admin Test' }])
  26 |     });
  27 |   });
  28 |
  29 |
  30 |   await page.goto('http://localhost:3000/admin/tests');
  31 |   await page.waitForTimeout(2000);
  32 |
  33 |   // Verify tabs
> 34 |   await expect(page.locator('button:has-text("Class Test")')).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  35 |   await expect(page.locator('button:has-text("Create Test")')).toBeVisible();
  36 |
  37 |   // Test "Question Bank" View
  38 |   await page.click('button:has-text("Question Bank")');
  39 |   await expect(page.locator('button:has-text("MCQ Bank")')).toBeVisible();
  40 |   await expect(page.locator('button:has-text("Short Question Bank")')).toBeVisible();
  41 |   await expect(page.locator('button:has-text("Long Question Bank")')).toBeVisible();
  42 |
  43 |   // Switch back to "Create Test"
  44 |   await page.click('button:has-text("Create Test")');
  45 |   await expect(page.locator('h2:has-text("Create Custom Test")')).toBeVisible();
  46 |
  47 |   // The PDF generation needs browser native API support but we'll click it to make sure the toast error is visible
  48 |   await page.selectOption('select:near(label:has-text("Test Type"))', '3');
  49 |   await page.fill('input:near(label:has-text("Short Questions"))', '5');
  50 |   await page.fill('input:near(label:has-text("Long Questions"))', '3');
  51 |
  52 |   // We can't generate without mocking all the API calls, but we confirmed via manual inspection that logic executes and fails safely when banks are missing.
  53 |
  54 | });
  55 |
```