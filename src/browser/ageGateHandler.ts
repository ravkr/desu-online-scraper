import { Page } from 'puppeteer';

export async function handleAgeGate(page: Page): Promise<void> {
  const gate = await page.$('.age-gate');

  if (!gate) {
    return;
  }

  console.log('Handling age gate...');

  await page.waitForSelector('#age-gate-d', { visible: true, timeout: 500 });
  await page.select('#age-gate-d', '01');
  await page.select('#age-gate-m', '01');
  await page.select('#age-gate-y', '2000');

  await page.click('.age-gate button[type="submit"], .age-gate .age-gate-button');

  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 2000 });
}
