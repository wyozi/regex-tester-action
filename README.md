## regex-tester-action

Attempts to find regex patterns in changed files, displays a table of them
and provides links to test the patterns. The action takes no input other
than the Github token (to add/edit issue comments).

### Action

```
on: [pull_request]

jobs:
  regex_tester:
    runs-on: ubuntu-latest
    name: Regex Tester
    steps:
      - name: Regex Tester
        uses: wyozi/regex-tester-action@master
        with:
          gh-token: ${{ secrets.GITHUB_TOKEN }}
```

### Example

See https://github.com/wyozi/regex-tester-action/pull/1#issuecomment-596914585