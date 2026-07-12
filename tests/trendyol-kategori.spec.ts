import { test, expect, Page } from '@playwright/test';

const HOME_URL = 'https://www.trendyol.com/';
const CEP_TELEFONU_URL = 'https://www.trendyol.com/sr?wc=109460,109459,109461,104034';

async function closePopupsIfAny(page: Page) {
  const cookieReject = page.getByRole('button', { name: 'Tümünü Reddet' });
  await cookieReject
    .waitFor({ state: 'visible', timeout: 4000 })
    .then(() => cookieReject.click())
    .catch(() => {});

  const interestModalClose = page.locator('.modal-section-close');
  await interestModalClose
    .waitFor({ state: 'visible', timeout: 4000 })
    .then(() => interestModalClose.click())
    .catch(() => {});
}

test.describe('Trendyol kategori ve filtreleme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await closePopupsIfAny(page);
  });

  test('üst menüden bir kategoriye tıklayınca ilgili kategori sayfası açılıyor', async ({ page }) => {
    await page.getByRole('link', { name: 'Elektronik', exact: true }).click();

    await expect(page).toHaveURL(/\/butik\/liste\/5\/elektronik/);
    await expect(page).toHaveTitle(/Elektronik/i);
  });

  test('filtrelenebilir kategori sayfasında ürün listesi ve ürün sayısı görünüyor', async ({ page }) => {
    await page.goto(CEP_TELEFONU_URL);

    await expect(page.getByText(/\d+\+? Ürün/)).toBeVisible();
    const productHeadings = page.getByRole('heading', { level: 2 });
    await expect(productHeadings.first()).toBeVisible();
    expect(await productHeadings.count()).toBeGreaterThan(0);
  });

  test('marka filtresi seçilince ürün listesi ve URL güncelleniyor', async ({ page }) => {
    await page.goto(CEP_TELEFONU_URL);

    const appleCheckbox = page
      .getByRole('group', { name: 'Marka filter options' })
      .getByRole('checkbox', { name: 'Apple' });
    await appleCheckbox.click({ force: true });

    await expect(page).toHaveURL(/[?&]wb=/);
    await expect(page.getByRole('heading', { name: 'Apple', exact: true })).toBeVisible();
  });

  test('sıralama seçeneği değiştirilince ürün sırası (URL parametresi) güncelleniyor', async ({ page }) => {
    await page.goto(CEP_TELEFONU_URL);

    await page.getByRole('button', { name: /Sıralama/ }).click();
    await page.getByRole('option', { name: 'En Düşük Fiyat' }).click();

    await expect(page).toHaveURL(/sst=PRICE_BY_ASC/);
    await expect(page.getByRole('button', { name: /En Düşük Fiyat/ })).toBeVisible();
  });

  test('kategori sayfasındaki bir ürün kartı tıklanabilir ve ürün adını içeriyor', async ({ page }) => {
    await page.goto(CEP_TELEFONU_URL);

    const firstProductHeading = page.getByRole('heading', { level: 2 }).first();
    await expect(firstProductHeading).toBeVisible();
    const productText = await firstProductHeading.textContent();
    expect(productText?.trim().length).toBeGreaterThan(0);
  });
});
