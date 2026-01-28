import { test, expect } from './fixtures';

test.describe('Posts - Data Fetching and Pagination', () => {
  test('should load and display posts on initial page load', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Frontend Assessment/i })).toBeVisible();
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
    
    const posts = page.locator('[class*="Card"]').filter({ hasText: /Post #/ });
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
    
    const postCount = await posts.count();
    expect(postCount).toBeGreaterThan(0);
  });

  test('should navigate between pages using pagination controls', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
    
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    
    await nextButton.click();
    
    await expect(page.getByText(/Page 2/i)).toBeVisible({ timeout: 5000 });
    
    const previousButton = page.getByRole('button', { name: /Previous/i });
    await expect(previousButton).toBeEnabled();
    
    await previousButton.click();
    
    await expect(page.getByText(/Page 1/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display loading state while fetching posts', async ({ page }) => {
    await page.goto('/');
    
    const loadingIndicator = page.locator('[class*="animate-spin"]').first();
    
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 }).catch(() => {});
  });

  test('should switch between different view modes', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
    
    const infiniteScrollButton = page.getByRole('button', { name: /Infinite Scroll/i });
    await infiniteScrollButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts \(Infinite Scroll\)/i })).toBeVisible({ timeout: 5000 });
    
    const filteredButton = page.getByRole('button', { name: /With Filters/i });
    await filteredButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts \(With Filters\)/i })).toBeVisible({ timeout: 5000 });
  });

  test('should filter posts by search query', async ({ page }) => {
    await page.goto('/');
    
    const filteredButton = page.getByRole('button', { name: /With Filters/i });
    await filteredButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts \(With Filters\)/i })).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('test');
    
    await page.waitForTimeout(500);
    
    const resultsText = page.getByText(/result/i);
    await expect(resultsText).toBeVisible({ timeout: 5000 });
  });

  test('should filter posts by user', async ({ page }) => {
    await page.goto('/');
    
    const filteredButton = page.getByRole('button', { name: /With Filters/i });
    await filteredButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts \(With Filters\)/i })).toBeVisible({ timeout: 10000 });
    
    const userSelect = page.locator('select#userId');
    await expect(userSelect).toBeVisible();
    
    await userSelect.selectOption('1');
    
    await page.waitForTimeout(500);
    
    const userBadges = page.locator('text=/User 1/');
    const count = await userBadges.count();
    expect(count).toBeGreaterThan(0);
  });
});
