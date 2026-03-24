import puppeteer, { Browser, Page } from 'puppeteer';

export class BrowserController {
  private static instance: BrowserController;
  private browser: Browser | undefined;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): BrowserController {
    if (!BrowserController.instance) {
      BrowserController.instance = new BrowserController();
    }

    return BrowserController.instance;
  }

  public async openBrowser(): Promise<Browser> {
    if (this.browser) {
      console.warn('Browser is already open');

      return this.browser;
    }

    this.browser = await puppeteer.launch({
      // TODO: nie można użyć Firefoxa, bo:
      // ProtocolError: Protocol error (network.getData): unknown error RangeError: source array is too long decodeResponseChunks@resource://devtools/shared/network-observer/NetworkUtils.sys.mjs:803:11
      // browser: "firefox",
      headless: false
      // devtools: true,
    });

    return this.browser;
  }

  public async closeBrowser(): Promise<void> {
    if (!this.browser) {
      console.warn('Browser is not open');

      return;
    }

    await this.browser.close();
    this.browser = undefined;
  }

  async newPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser is not open');
    }

    return this.browser.newPage();
  }
}
