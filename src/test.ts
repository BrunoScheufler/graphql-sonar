import { AssertionError, SonarError } from "./errors";
import { SonarResult } from "./request";

/**
 * Assert that GraphQL response does not contain errors and
 * contains data.
 *
 * @param result sonar result
 * @returns
 */
export function assertNoErrors<T>({ graphql: res, operation }: SonarResult<T>) {
  if (res.errors) {
    throw new AssertionError(
      `Expected response not to contain any errors`,
      operation
    );
  }

  if (!res.data) {
    throw new AssertionError(`Expected data to be defined`, operation);
  }

  return { data: res.data, extensions: res.extensions };
}

function formatOperationResponse(
  pass: boolean,
  name: string,
  duration: number,
  error?: string
) {
  return `${pass ? "✅" : "❌"} ${name} (${duration}ms)${
    error ? `: ${error}` : ""
  }`;
}

export type WithTimerResult<T> =
  | { res: T; duration: number; kind: "pass" }
  | { kind: "fail"; err: unknown; duration: number };

async function withTimer(
  handler: () => Promise<SonarResult<unknown>>
): Promise<WithTimerResult<SonarResult<unknown>>> {
  const start = Date.now();
  try {
    const res = await handler();
    assertNoErrors(res);

    return { kind: "pass", res, duration: Date.now() - start };
  } catch (err) {
    return { kind: "fail", duration: Date.now() - start, err };
  }
}

function round(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function mean(arr: number[]) {
  const sum = arr.reduce((prev, curr) => prev + curr, 0);
  return round(sum / arr.length);
}

function quantile(p: number, x: number[]) {
  // Before we start, sort the raw data
  const sorted = x.sort();

  const n = sorted.length;
  const np = n * p;

  if (!Number.isInteger(np)) {
    return round(sorted[Math.floor(np) + 1]);
  }

  return round(0.5 * (sorted[np] + sorted[np + 1]));
}

function median(x: number[]) {
  return quantile(0.5, x);
}

export interface RunOperationsOptions {
  /**
   * Whether to stop after an operation fails. Defaults to true
   */
  failEarly?: boolean;

  /**
   * Whether to exit the process after completing the test run. Defaults to true
   *
   * If this is disabled, runOperations returns stats after completion
   */
  exitProcess?: boolean;

  /**
   * Whether to log run statistics to stdout. Defaults to true
   */
  logStats?: boolean;
}

/**
 * Run given operations in sequence and assert no errors
 * are present in the response.
 *
 * If failEarly is disabled, we will continue
 * running operations even if a previous one failed.
 *
 * @param operations a list of operations. Anything asynchronously returning a Sonar result is fine
 * @param options optional configuration for the test runner
 * @returns
 */
export async function runOperations(
  operations: Array<() => Promise<SonarResult<unknown>>>,
  options?: RunOperationsOptions
) {
  options = {
    exitProcess: options?.exitProcess ?? true,
    failEarly: options?.failEarly ?? true,
    logStats: options?.logStats ?? true,
  };

  let passed = new Set<string>();
  let failed = new Set<string>();

  let durations: number[] = [];

  for (const operation of operations) {
    const res = await withTimer(operation);
    durations.push(res.duration);

    if (res.kind === "pass") {
      console.log(
        formatOperationResponse(true, res.res.operation, res.duration)
      );

      passed.add(res.res.operation);

      continue;
    }

    const err = res.err;
    if (err instanceof SonarError) {
      failed.add(err.operationName);

      console.error(
        formatOperationResponse(
          false,
          err.operationName,
          res.duration,
          err.stack
        )
      );
    } else if (err instanceof Error) {
      failed.add("unknown");

      console.error(
        formatOperationResponse(false, "unknown", res.duration, err.stack)
      );
    } else {
      failed.add("unknown");

      console.error(
        formatOperationResponse(
          false,
          "unknown",
          res.duration,
          JSON.stringify(res.err)
        )
      );
    }

    if (options.failEarly) {
      // Do not continue
      break;
    }
  }

  const total = passed.size + failed.size;
  const successRate = round((passed.size / total) * 100);
  const meanDuration = mean(durations);
  const medianDuration = median(durations);
  const p90Duration = quantile(0.9, durations);
  const p95Duration = quantile(0.95, durations);

  if (options.logStats) {
    console.log(
      `➡️  ${total} total, ${passed.size} passed, ${failed.size} failed (${successRate}% success rate)`
    );

    console.log(`\n⏱  Duration`);

    console.log(`1️⃣  mean: ${meanDuration}ms`);
    console.log(`2️⃣  median: ${medianDuration}ms`);

    if (durations.length > 4) {
      console.log(`3️⃣  p90: ${p90Duration}ms`);
      console.log(`4️⃣  p95: ${p95Duration}ms`);
    }
  }

  if (options.exitProcess) {
    if (failed.size > 0) {
      process.exit(1);
    }
    process.exit(0);
  }

  return {
    total,
    passed,
    failed,
    successRate,
    meanDuration,
    medianDuration,
    p90Duration,
    p95Duration,
  };
}
