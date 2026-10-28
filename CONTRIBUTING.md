# Contributing to NMQ

NMQ is an ebook-library frontend based on [HomeBranch Web](https://github.com/Oghamark/homebranch-web). Contributions to this maintained copy belong in [alshawshfras3-cmd/nmq](https://github.com/alshawshfras3-cmd/nmq), with pull requests targeting **`main`**.

## Report a problem or propose a change

Use this repository's [issues](https://github.com/alshawshfras3-cmd/nmq/issues) for reproducible bugs and feature proposals. Include:

- The affected commit or branch, browser, and operating system.
- Steps to reproduce the problem and the expected and actual behavior.
- Relevant frontend or backend errors, with passwords, tokens, cookies, and personal information removed.
- Whether the library API and authentication service are reachable and which services were involved.

For a larger change, explain the use case and proposed scope in an issue before implementation. Authentication replacements and API contract changes need coordination with the backend; a frontend-only change cannot provide missing backend behavior.

## Set up a working copy

1. Fork [alshawshfras3-cmd/nmq](https://github.com/alshawshfras3-cmd/nmq) into your GitHub account and clone your fork.
2. Add NMQ as the remote used to keep your copy current:

   ```sh
   git remote add upstream https://github.com/alshawshfras3-cmd/nmq.git
   git fetch upstream
   git switch -c fix/describe-the-problem upstream/main
   ```

3. Install dependencies and prepare local configuration:

   ```sh
   npm ci
   cp .env.example .env
   ```

4. Follow [the README's local development instructions](README.md#local-development) to connect the library API and authentication service, then run:

   ```sh
   npm run dev
   ```

Unit tests, type checking, and a frontend build can be run independently of a live library. Testing login, uploads, permissions, or synchronization end to end requires the backend services.

## Implement and verify

Keep changes focused on a reproducible problem or a clearly described user need. Follow the surrounding TypeScript and React conventions, and add a regression test when changing behavior that can fail again.

Run the checks relevant to your changes. Code changes should pass:

```sh
npm test
npm run typecheck
npm run build
git diff --check
```

For an interface change, check a narrow and a wide viewport and include a screenshot when it helps review. For authentication or API changes, describe the backend configuration used and the user flows you actually exercised. Report tests you could not run along with the reason.

Do not commit `.env`, credentials, generated build output, or `node_modules`. Update setup instructions when configuration or backend requirements change.

## Open a pull request

Push your branch to your fork and open a pull request against **`alshawshfras3-cmd/nmq:main`**. Explain:

- The problem and how users encounter it.
- What changes and the resulting behavior.
- The checks performed and any remaining limitations.

Link the relevant issue when there is one. Include dependency lockfile changes when dependencies change, and retain the project's license and attribution.

## Relationship to HomeBranch

The HomeBranch repositories remain the source of the original frontend, backend, and authentication components. Preserve their attribution when adapting code. Fixes that also apply upstream can be proposed to the relevant HomeBranch repository through its own contribution process; an NMQ pull request does not automatically reach those maintainers.
