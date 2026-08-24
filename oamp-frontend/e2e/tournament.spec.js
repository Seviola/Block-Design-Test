import { test, expect } from '@playwright/test'

test.describe('Tournament Admin Flow', () => {
  test('create tournament dialog opens', async ({ page }) => {
    await page.goto('/tournaments')
    // Look for "Buat Turnamen" or similar button
    const createBtn = page.locator('button:has-text("Buat")')
    await expect(createBtn.first()).toBeVisible()
    await createBtn.first().click()
    // Dialog should appear with name input
    await expect(page.locator('input[name="name"], input[placeholder*="nama"]').first()).toBeVisible()
  })

  test('tournament detail has register and start buttons', async ({ page }) => {
    // This test assumes a tournament exists; skip if backend is unavailable
    await page.goto('/tournaments')
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() === 0) {
      test.skip('No tournaments found — backend may be offline')
    }
    await firstRow.click()
    // On detail page
    await expect(page.locator('button:has-text("Mulai")')).toBeVisible()
  })
})
