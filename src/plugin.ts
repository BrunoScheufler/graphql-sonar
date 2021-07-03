import { CodegenPlugin } from "@graphql-codegen/plugin-helpers";
import { print } from "graphql";

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}

const plugin: CodegenPlugin = {
  plugin: (schema, documents, config, info) => {
    const generated: string[] = [];

    generated.push(`
import fetch, { Response } from "node-fetch";
import { SonarConfig, performGraphQLRequest } from "graphql-sonar";`);

    for (const { document } of documents) {
      if (!document) {
        console.log(`Skipping missing document`);
        continue;
      }

      for (const definition of document.definitions) {
        if (definition.kind !== "OperationDefinition") {
          console.log(`Filtering out definition of kind ${definition.kind}`);
          continue;
        }

        if (!definition.name) {
          throw new Error(`Found unnamed operation: ${print(definition)}`);
        }

        const operationName = definition.name.value;

        const upperOp = capitalize(definition.operation);
        const upperFirst = capitalize(operationName);

        const generatedOpName = `${upperFirst}${upperOp}`;

        generated.push(`
/**
 * Run the \`${operationName}\` ${
          definition.operation
        } against a configured endpoint.
 * 
 * @param config Sonar config containing endpoint, headers, and other request options.
 * @param variables ${upperOp} operation variables
 * 
 * @returns Sonar result
 */
export async function ${
          definition.name.value
        } (config: SonarConfig, variables: ${generatedOpName}Variables) {
    return performGraphQLRequest<${generatedOpName}>(config, {
        operationName: "${operationName}",
        query: \`${print(document)}\`,
        variables,
    });
}            
        `);
      }
    }

    return generated.join("\n");
  },
};

module.exports = plugin;
