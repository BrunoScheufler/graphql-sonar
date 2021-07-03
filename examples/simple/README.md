# Simple GraphQL Sonar Example

This example showcases how to integrate GraphQL sonar, with queries against the GitHub GraphQL API.

## Using GraphQL Sonar code generation

All operations stored in [operations](./operations) will be converted to type-safe testing helpers by GraphQL Sonar when running [`yarn generate`](package.json).

## Running our tests with the built-in runner

To run our tests, we use the built-in test runner to get started quickly. We add some custom [assertions](./src/index.ts) to make sure the response matches our expectations.
