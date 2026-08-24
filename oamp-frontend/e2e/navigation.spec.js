import { test, expect } from '@playwright/test'

test.describe('Navigation & Basic UI', () => {
  test('Dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OAMP|Dashboard/)
    // Leaderboard table or heading should exist
    await expect(page.locator('text=/leaderboard|Leaderboard|Dashboard/i').first()).toBeVisible()
  })

  test('Participants page loads', async ({ page }) => {
    await page.goto('/participants')
    await expect(page.locator('text=/participants|peserta/i').first()).toBeVisible()
  })

  test('Register page loads with UID input', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[name="uid"], input[placeholder*="UID"]').first()).toBeVisible()
  })

  test('Tournaments page loads', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page.locator('text=/tournament|turnamen/i').first()).toBeVisible()
  })

  test('Duel page loads', async ({ page }) => {
    await page.goto('/duel')
    await expect(page.locator('text=/duel|kompetisi|competition/i').first()).toBeVisible()
  })
})
