import { Job } from './Job';
import type { Cluster, TaskFunction } from './Cluster';
import type { Page } from 'playwright';
import { timeoutExecute, debugGenerator, log } from './util';
import { inspect } from 'util';
import { WorkerInstance, JobInstance } from './concurrency/ConcurrencyImplementation';

const debug = debugGenerator('Worker');

interface WorkerOptions {
  cluster: Cluster;
  args: string[];
  id: number;
  browser: WorkerInstance;
}

const BROWSER_INSTANCE_TRIES = 10;

export interface WorkError {
  type: 'error';
  error: Error;
}

export interface WorkData {
  type: 'success';
  data: any;
}

export type WorkResult = WorkError | WorkData;

export class Worker<JobData, ReturnData> implements WorkerOptions {
  public cluster: Cluster;
  public args: string[];
  public id: number;
  public browser: WorkerInstance;

  public activeTarget: Job<JobData, ReturnData> | null = null;

  public constructor({ cluster, args, id, browser }: WorkerOptions) {
    this.cluster = cluster;
    this.args = args;
    this.id = id;
    this.browser = browser;

    debug(`Starting #${this.id}`);
  }

  public async handle(
    task: TaskFunction<JobData, ReturnData>,
    job: Job<JobData, ReturnData>,
    timeout: number
  ): Promise<WorkResult> {
    this.activeTarget = job;

    let jobInstance: JobInstance | null = null;
    let page: Page | null = null;

    let tries = 0;

    while (jobInstance === null) {
      try {
        jobInstance = await this.browser.jobInstance();
        page = jobInstance.resources.page;
      } catch (err: any) {
        debug(`Error getting browser page (try: ${tries}), message: ${err.message}`);
        await this.browser.repair();
        tries += 1;
        if (tries >= BROWSER_INSTANCE_TRIES) {
          throw new Error('Unable to get browser page');
        }
      }
    }

    // We can be sure that page is set now, otherwise an exception would've been thrown
    page = page as Page; // this is just for TypeScript

    let errorState: Error | null = null;

    page.on('pageerror', (err: any) => {
      errorState = err;
      log(`Error (page error) crawling ${inspect(job.data)} // message: ${err.message}`);
    });

    debug(`Executing task on worker #${this.id} with data: ${inspect(job.data)}`);

    let result: any;
    try {
      result = await timeoutExecute(
        timeout,
        task({
          page,
          // data might be undefined if queue is only called with a function
          // we ignore that case, as the user should use Cluster<undefined> in that case
          // to get correct typings
          data: job.data as JobData,
          worker: {
            id: this.id,
          },
        })
      );
    } catch (err: any) {
      errorState = err;
      log(`Error crawling ${inspect(job.data)} // message: ${err.message}`);
    }

    debug(`Finished executing task on worker #${this.id}`);

    try {
      await jobInstance.close();
    } catch (e: any) {
      debug(`Error closing browser instance for ${inspect(job.data)}: ${e.message}`);
      await this.browser.repair();
    }

    this.activeTarget = null;

    if (errorState) {
      return {
        type: 'error',
        error: errorState || new Error('asf'),
      };
    }
    return {
      data: result,
      type: 'success',
    };
  }

  public async close(): Promise<void> {
    try {
      await this.browser.close();
    } catch (err: any) {
      debug(`Unable to close worker browser. Error message: ${err.message}`);
    }
    debug(`Closed #${this.id}`);
  }
}