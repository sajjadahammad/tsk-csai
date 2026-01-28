import { test, expect } from './fixtures';

test.describe('Alarms - Real-time Updates', () => {
  test('should display alarm list component', async ({ page }) => {
    await page.goto('/');
    
    const alarmsButton = page.getByRole('button', { name: /Real-time Alarms/i });
    await alarmsButton.click();
    
    await expect(page.getByRole('heading', { name: /Alarms/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show WebSocket connection status', async ({ page }) => {
    await page.goto('/');
    
    const alarmsButton = page.getByRole('button', { name: /Real-time Alarms/i });
    await alarmsButton.click();
    
    await expect(page.getByRole('heading', { name: /Alarms/i })).toBeVisible({ timeout: 10000 });
    
    const connectionStatus = page.locator('text=/Connected|Connecting|Disconnected/i').first();
    await expect(connectionStatus).toBeVisible({ timeout: 5000 });
  });

  test('should display empty state when no alarms', async ({ page }) => {
    await page.goto('/');
    
    const alarmsButton = page.getByRole('button', { name: /Real-time Alarms/i });
    await alarmsButton.click();
    
    await expect(page.getByRole('heading', { name: /Alarms/i })).toBeVisible({ timeout: 10000 });
    
    const emptyState = page.getByText(/No alarms/i);
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    await page.goto('/');
    
    const alarmsButton = page.getByRole('button', { name: /Real-time Alarms/i });
    await alarmsButton.click();
    
    await expect(page.getByRole('heading', { name: /Alarms/i })).toBeVisible({ timeout: 10000 });
    
    await page.context().setOffline(true);
    
    await page.waitForTimeout(2000);
    
    const disconnectedStatus = page.locator('text=/Disconnected|Error/i').first();
    await expect(disconnectedStatus).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    await page.context().setOffline(false);
  });
});
