import { test, expect } from '@playwright/test';

test('arama calisiyor mu', async ({ page }) => {
  // Siteye git
  await page.goto('https://playwright.dev/');

  // Arama butonuna tikla (genelde bir buton/link olarak duruyor)
  await page.getByRole('button', { name: 'Search' }).click();

  // Arama kutusuna yaz
  await page.getByPlaceholder('Search docs').fill('installation');

  // "Installation" yazan bir sonuc gorunur mu kontrol et
  await expect(page.getByText('Installation', { exact: false }).first()).toBeVisible();
});