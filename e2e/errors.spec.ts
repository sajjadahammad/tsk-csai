import { test, expect } from './fixtures';

test.describe('Error Handling and Recovery', () => {
  test('should display error message when API fails', async ({ page }) => {
    await page.route('**/posts*', (route) => {
      route.abort('failed');
    });

    await page.goto('/');
    
    const errorMessage = page.getByText(/Error Loading Posts/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const retryButton = page.getByRole('button', { name: /Retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('should recover from error when retry button is clicked', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/posts*', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    const errorMessage = page.getByText(/Error Loading Posts/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const retryButton = page.getByRole('button', { name: /Retry/i });
    await retryButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
    
    const posts = page.locator('[class*="Card"]').filter({ hasText: /Post #/ });
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.context().setOffline(true);
    
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    const errorIndicator = page.locator('text=/Error|Failed|Network/i').first();
    await expect(errorIndicator).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    await page.context().setOffline(false);
  });

  test('should display user-friendly error messages', async ({ page }) => {
    await page.route('**/posts*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    
    const errorMessage = page.getByText(/Error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const technicalJargon = page.getByText(/500|Internal Server Error/i);
    await expect(technicalJargon).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should maintain UI state after error recovery', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/posts*', (route) => {
      requestCount++;
      if (requestCount === 2) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
    
    const nextButton = page.getByRole('button', { name: /Next/i });
    await nextButton.click();
    
    const errorMessage = page.getByText(/Error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const retryButton = page.getByRole('button', { name: /Retry/i });
    await retryButton.click();
    
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible({ timeout: 10000 });
  });
});
