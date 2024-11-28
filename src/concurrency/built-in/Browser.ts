import playwright from 'playwright';

import { debugGenerator, timeoutExecute } from '../../util.js';
import { ConcurrencyImplementation, WorkerInstance } from '../ConcurrencyImplementation.js';

const debug = debugGenerator('BrowserConcurrency');

const BROWSER_TIMEOUT = 5000;

export class Browser extends ConcurrencyImplementation {
  public browser: playwright.Browser | null = null;

  public async init() {}

  public async close() {
    try {
      await (this.browser as playwright.Browser)?.close();
    } catch (error: any) {
      debug('Error closing browser: ' + error.message);
    }
  }

  public async workerInstance(perBrowserOptions: playwright.LaunchOptions | undefined): Promise<WorkerInstance> {
    const options = perBrowserOptions || this.options;
    const contextOptions = Object.keys(this.contextOptions).length > 0 ? this.contextOptions : undefined;
    let browser = (await this.playwright.launch(options)) as playwright.Browser;
    this.browser = browser;
    let page: playwright.Page;
    let context: playwright.BrowserContext;

    return {
      jobInstance: async () => {
        await timeoutExecute(
          BROWSER_TIMEOUT,
          (async () => {
            context = await browser.newContext(contextOptions);
            page = await context.newPage();
          })()
        );

        return {
          resources: {
            page,
          },

          close: async () => {
            await timeoutExecute(BROWSER_TIMEOUT, context.close());
          },
        };
      },

      close: async () => {
        await browser.close();
      },

      repair: async () => {
        debug('Starting repair');
        try {
          // will probably fail, but just in case the repair was not necessary
          await timeoutExecute(BROWSER_TIMEOUT, browser.close());
        } catch (e) {}

        // just relaunch as there is only one page per browser
        browser = await this.playwright.launch(options);
      },
    };
  }
}
