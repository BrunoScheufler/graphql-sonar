import { assertNoErrors, runOperations, SonarConfig } from "graphql-sonar";
import { fetchPosts } from "./sonar";

const authToken = process.env.AUTH_TOKEN;
if (!authToken) {
  throw new Error("Missing AUTH_TOKEN");
}

const config: SonarConfig = {
  endpoint:
    "https://api-eu-central-1.graphcms.com/v2/cks5v2v5e0qg701xo9bnu02za/master",
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
};

runOperations([
  async () => {
    const res = await fetchPosts(config, {});
    const withoutErrors = assertNoErrors(res);

    const posts = withoutErrors.data.posts;
    if (!posts || posts.length !== 1) {
      throw new Error("Missing posts");
    }

    const [post] = posts;
    if (post.title !== "My post") {
      throw new Error(`Invalid title "${post.title}", expected "My Post"`);
    }

    return res;
  },
]);
