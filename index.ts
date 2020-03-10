const core = require("@actions/core");
const github = require("@actions/github");
const util = require("util");
const fs = require("fs");

const readFile = util.promisify(fs.readFile);
const META_REGEX_PATTERN = /\/([^\/\n]+)\//g;

const buildTesterUrl = (pattern: string) => {
  const encoded = encodeURIComponent(pattern);
  return `https://pythex.org/?regex=${encoded}&test_string=&ignorecase=0&multiline=0&dotall=0&verbose=0`
}

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
  const modifiedPaths: string[] = pull.data.map(file => file.filename);

  const modifiedFilesContents = await Promise.all(
    modifiedPaths.map(async path => {
      const content = await readFile(path, { encoding: "utf8" });
      return [path, content] as [string, string];
    })
  );

  const fileRegexps = modifiedFilesContents.map(([path, content]) => {
    const matches = content.match(META_REGEX_PATTERN);
    return matches?.length > 0 ? [path, matches] as [string, RegExpMatchArray] : null;
  }).filter(x => x !== null);

  const header = "## Found Regex Patterns";
  const body = `${header}
  ${fileRegexps.map(([path, matches]) => {
    return `### ${path}\n${
      matches.map(match =>
        `*${match}* ${buildTesterUrl(match)}`
      ).join("\n")
    }`;
  }).join("\n\n")}`;


  const existingComment = (
    await client.issues.listComments({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number
    })
  ).data.find(comment => comment.body.includes(header));

  if (existingComment) {
    await client.issues.updateComment({
      owner: issue.owner,
      repo: issue.repo,
      comment_id: existingComment.id,
      body
    });
  } else {
    await client.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body
    });
  }
}

run().catch(err => core.setFailed(err.message));