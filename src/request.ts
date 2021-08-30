import { ExecutionResult } from "graphql";
import fetch, { Response } from "node-fetch";

import { SonarConfig } from "./config";
import { RequestError } from "./errors";

const { version: pkgVersion } = require("../package.json");

export interface GraphQLRequest {
  variables: Record<string, unknown>;
  operationName: string;
  query: string;
}

/**
 * Perform GraphQL request
 *
 * @param config
 * @param requestBody
 * @returns
 */
export async function performGraphQLRequest<Data>(
  config: SonarConfig,
  requestBody: GraphQLRequest
): Promise<SonarResult<Data>> {
  let res: Response;

  try {
    res = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `graphql-sonar v${pkgVersion}`,
        ...config.headers,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    if (err instanceof Error) {
      throw new RequestError(
        `Failed to initiate request: ${err.message}`,
        requestBody.operationName
      );
    }

    throw new RequestError(
      `Failed to initiate request: ${err}`,
      requestBody.operationName
    );
  }

  if (res.status >= 500) {
    throw new RequestError(
      `Received server response with status ${res.status}`,
      requestBody.operationName
    );
  }

  let body: ExecutionResult<Data>;
  try {
    body = await res.json();
  } catch (err) {
    if (err instanceof Error) {
      throw new RequestError(
        `Failed to parse server response: ${err.message}`,
        requestBody.operationName
      );
    }

    throw new RequestError(
      `Failed to parse server response: ${err}`,
      requestBody.operationName
    );
  }

  return { graphql: body, operation: requestBody.operationName };
}

export interface SonarResult<Data> {
  graphql: ExecutionResult<Data>;
  operation: string;
}
