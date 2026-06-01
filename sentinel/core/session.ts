import { Page, BrowserContext, request } from '@playwright/test';

/**
 * Log in via the user interface login form.
 * Tests the real login form, input elements, submit button, and route redirection.
 */
export async function loginViaUI(page: Page, username: string, password_raw: string): Promise<void> {
  await page.goto('/login');
  
  // Fill inputs
  await page.fill('input[placeholder*="username" i], input[type="text"]', username);
  await page.fill('input[placeholder*="password" i], input[type="password"]', password_raw);
  
  // Click login
  await page.click('button[type="submit"]');
  
  // Wait for redirection away from /login
  await page.waitForURL(url => url.pathname !== '/login');
  await page.waitForLoadState('networkidle');
}

/**
 * Log in programmatically via the backend authentication endpoint to retrieve 
 * session cookies, setting them directly on the BrowserContext.
 * Avoids loading the UI repeatedly during API-centric testing.
 */
export async function loginViaAPI(context: BrowserContext, baseURL: string, username: string, password_raw: string): Promise<void> {
  const requestContext = await request.newContext({ baseURL });
  const response = await requestContext.post('/api/auth/login', {
    data: {
      username,
      password: password_raw
    }
  });

  if (!response.ok()) {
    throw new Error(`API Login failed for ${username}: ${response.status()} ${response.statusText()}`);
  }

  // Retrieve set-cookie headers
  const cookiesHeaders = response.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
  
  const cookiesToSet = cookiesHeaders.map(header => {
    // Parse cookie string: name=value; Path=/; HttpOnly; ...
    const cookiePart = header.value.split(';')[0];
    const indexOfEquals = cookiePart.indexOf('=');
    const name = cookiePart.substring(0, indexOfEquals).trim();
    const value = cookiePart.substring(indexOfEquals + 1).trim();
    
    return {
      name,
      value,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const
    };
  });

  await context.addCookies(cookiesToSet);
}
