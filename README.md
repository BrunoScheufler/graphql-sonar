# GraphQL Sonar

> An API testing tool for GraphQL, leveraging TypeScript code generation based on your schema and operations

## The Motivation

When you want to make sure your services are working in production as intended, beyond the scope of your testing infrastructure
based on unit and integration tests, you may want to send _real_ queries and mutations against your production deployments, as this is the
only way to assert that everything is really working for your users and customers.

While uptime testing tools are great for static queries, with GraphQL, we can leverage the queries we already use for our frontend applications,
or write them ourselves to generate everything we need to create robust end-to-end tests that run wherever we need them, whether that is after every deployment
or scheduled every day or night, your team is completely in charge of that.

GraphQL Sonar aims to be the connection between your operations and end-to-end tests running against real deployments. As this involves the network layer and all external
services you may be using, GraphQL Sonar should only be used for the most important parts, for example, signup and onboarding, auth in general, billing and checkout, and other
critical or hot paths.

Focusing on these will give you the certainty that your systems are really working, while running as fast as possible, making them suitable to run whenever you wish. For every
other case, check out the talk on Testing GraphQL APIs, which goes through different ways you can test your backend services exposing GraphQL APIs.

GraphQL Sonar will get you started writing and running end-to-end GraphQL tests quickly, but will never impose any restrictions on how you want to test: While we export a simple test runner for getting started, using the generated operations in an external framework such as Jest is not at all discouraged.

## Getting started

### Installing graphql-sonar

```
yarn install graphql-sonar
```

### Creating or locating your operations

You might already have operations defined when you query your GraphQL API in a frontend application. Usually, all queries or mutations are placed in separate `.graphql` files,
which graphql-sonar supports right out of the box. If you're not using the same operations, or if there are none to begin with, you can create some queries right now.

### Generating TypeScript testing code

After creating your operations, graphql-sonar will use the latest schema of your API to validate the operations and generate both type definitions and helper functions for testing in TypeScript.

Every defined operation will lead to a generated function performing a request against a configured endpoint and returning the GraphQL result, as well as some additional data.

```bash
graphql-sonar \
    --schema [file path or URL to your API endpoint] \
    --operations [path or glob to your operation file(s)] \
    --output [optional path where to store the generated output, defaults to sonar.ts]
```

### Writing tests with the built-in reporter

Now that you generated some types, let's get to writing and running tests!

GraphQL Sonar exports a couple of methods for running simple test cases, helping you to get started quickly! Whenever you need more flexibility, you can invoke all generated functions on your own and use existing testing frameworks like Jest, or build your own.

```typescript
// Import some general-purpose Sonar structures
import { runOperations, SonarConfig } from "graphql-sonar";

// Import our generated operations
import { createUser, fetchUser } from "./sonar";

const config: SonarConfig = {
  // Our live endpoint we want to query
  endpoint: "<Your API Endpoint>",

  // Optionally pass an access token if we want to
  // perform restricted operations
  headers: {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
  },
};

// Temporarily store our user's ID
let createdUserId: string | undefined;

// Run all operations one-by-one, and fail early
runOperations([
  // Start by creating user with mutation
  async () => {
    const res = await createUser(config, {
      data: {
        name: "Sonar Sample User",
      },
    });

    createdUserId = res.graphql.data?.createUser.id;

    return res;
  },
  // Continue to fetch user with query
  () => {
    if (!createdUserId) {
      throw new Error("Missing user ID");
    }
    return fetchUser(config, {
      data: { id: createdUserId },
    });
  },
]);
```

### Automating test runs

With GraphQL Sonar, you're free to choose where and when to run your end-to-end tests. You could run them whenever a new deployment is made, on a fixed schedule, or just manually when you want to make sure everything's working. You can potentially run Sonar in every CI system, and other environments alike.

#### GitHub Actions Example Workflow

To provide an example for using GraphQL Sonar with GitHub actions, we provided a workflow configuration below. If you want to use this, make sure to adapt it to your systems and processes.

```yaml
name: Run Sonar Tests
on:
  # Allow to run tests manually
  workflow_dispatch:
  # Run tests every night
  schedule:
    - cron: "0 0 * * *"
  # Run tests when pushing to main
  push:
    paths:
      # Rerun the tests when we change this workflow
      # Has to match your workflow file location
      - ".github/workflows/sonar.yaml"

      # Rerun the tests when they change
      - "tests"
    branches:
      - main
jobs:
  run-sonar:
    name: Run Sonar tests
    runs-on: ubuntu-20.04
    steps:
      # Check out latest code
      - name: Checkout
        uses: actions/checkout@v2
      # Here you can install tools and build your code
      - name: Prepare env
        run: |
          yarn install          
          yarn build
      - name: Run tests
        run: |
          node tests/index.js
```

## Examples

- [Simple Example](./examples/simple): Showcases an example setup of GraphQL Sonar

## Contributing

If you'd like to propose a feature or use case you have, feel free to start a [discussion](https://github.com/BrunoScheufler/graphql-sonar/discussions/categories/ideas)! As this project is still an early iteration of what it could be, we did not want to make too many assumptions of how you want to use it and made sure to build the most important tools right in, without getting in your way too much.

If you find a bug, please [file an issue](https://github.com/BrunoScheufler/graphql-sonar/issues/new?assignees=&labels=bug&template=bug_report.md&title=) and fill out the template completely, including everything we can use to speed up the process of triaging, investigating, and resolving the issue at hand.
