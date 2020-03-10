const core = require("@actions/core");
const github = require("@actions/github");
const util = require("util");
const fs = require("fs");

const readFile = util.promisify(fs.readFile);
const META_REGEX_PATTERN = /\/([^\/]+)\//g;

async function run() {
  const issue: { owner: string; repo: string; number: number } =
    github.context.issue;
  
  const ghToken = core.getInput("gh-token");
  const client = new github.GitHub(ghToken);

  const pull = await client.pulls.listFiles({
    owner: issue.owner,
    repo: issue.repo,
    pull_number: issue.number
  });
  console.log(pull);
  
  const modifiedPaths: string[] = pull.data.map(file => file.filename);

  const modifiedFilesContents = await Promise.all(
    modifiedPaths.map(async path => {
      const content = await readFile(path, { encoding: "utf8" });
      console.log(path, content);
      return [path, content] as [string, string];
    })
  );

  const fileRegexps = modifiedFilesContents.map(([path, content]) => {
    const matches = content.match(META_REGEX_PATTERN);
    return matches?.length > 0 ? [path, matches] as [string, RegExpMatchArray] : null;
  }).filter(x => x !== null);

  await client.issues.createComment({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body: fileRegexps.map(([path, matches]) => {
      return `${path}: ${matches.join(", ")}`;
    }).join("\n")
  });
}

run().catch(err => core.setFailed(err.message));
