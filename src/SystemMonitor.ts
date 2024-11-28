import * as os from 'os';

interface SystemLoad {
  idle: number;
  total: number;
}

const INIT_INTERVAL = 50;

//
// Do not forget to update test/SystemMonitor.test.ts if you change these two values
const MEASURE_INTERVAL = 200;
// timespan of which to measure load
// must be a multiple of MEASURE_INTERVAL
const MEASURE_TIMESPAN = 5000;

const loadListSize = MEASURE_TIMESPAN / MEASURE_INTERVAL;

export class SystemMonitor {
  private cpuUsage = 0;
  private memoryUsage = 0;

  private loads: SystemLoad[] = [];

  private interval: NodeJS.Timeout | null = null;

  // After init is called there is at least something in the cpuUsage thingy
  public async init(): Promise<void> {
    this.calcLoad();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), INIT_INTERVAL));
    this.calcLoad();

    this.interval = setInterval(() => this.calcLoad(), MEASURE_INTERVAL);
  }

  public close() {
    clearInterval(this.interval as NodeJS.Timeout);
  }

  private calcLoad() {
    // based on https://gist.github.com/bag-man/5570809
    let totalIdle = 0;
    let totalTick = 0;
    const cpus = os.cpus();

    /* istanbul ignore next */
    if (!cpus) {
      // In some environments, os.cpus() might return undefined (although it's not stated in
      // the Node.js docs), see #113 for more information
      return;
    }

    for (let i = 0, len = cpus.length; i < len; i += 1) {
      const cpu = cpus[i];
      // eslint-disable-next-line guard-for-in
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }

    const currentLoad = {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
    };

    if (this.loads.length !== 0) {
      const compareLoad = this.loads[0];
      const idleDifference = currentLoad.idle - compareLoad.idle;
      const totalDifference = currentLoad.total - compareLoad.total;

      this.cpuUsage = 100 - (100 * idleDifference) / totalDifference;
      this.memoryUsage = 100 - (100 * os.freemem()) / os.totalmem();
    }

    this.loads.push(currentLoad);
    if (this.loads.length > loadListSize) {
      // remove oldest entry
      this.loads.shift();
    }
  }

  public getCpuUsage() {
    return this.cpuUsage;
  }

  public getMemoryUsage() {
    return this.memoryUsage;
  }
}
