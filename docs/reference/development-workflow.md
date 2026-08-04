# Development workflow

Common development tasks and workflows for working on the Fluxnova Control Center project are documented in this
page.

## Automatic code reloading

The app will automatically rebuild & reload if you change any of the source files while the dev
server is running.

## Building

NOTE: you typically do not need to build the project for local development, as the development
server will handle this for you. However, if you want to build the project manually, you can use the
following commands.

Run `nx build` to build the project. The build artifacts will be stored in the `dist/` directory.
Use the `--prod` flag for a production build.

Run `nx build server` to build the nodejs backend project.

## Code formatting

There are a few ways that code formatting is handled in this project:

- [EditorConfig](https://editorconfig.org/): This project uses an .editorconfig file to enforce
  consistent coding styles across different editors and IDEs. Make sure you have an editor plugin
  that supports editorconfig to take advantage of this.
- [Prettier](https://prettier.io/) is run on staged files when committing. This means that any code
  that is staged for commit will be automatically formatted with Prettier when you commit it.

  **Make sure that you have pre-commit hooks set up in your local environment for this to work.**

  Configuring your IDE to run Prettier on save can also be helpful for ensuring that your code is
  consistently formatted as you work on it, even before you stage it for commit. This has the added
  benefit of preventing surprises that might occur due to the reformatting happening in the
  background by the pre-commit hook.

- [ESLint](https://eslint.org/) is used to enforce code quality and consistency. You can run ESLint
  manually with `pnpm run lint`, or you can set up your editor to run ESLint on save for real-time
  feedback on linting issues. ESLint can also be used in a CI context to ensure that code quality
  standards are met before code is merged or deployed.

If you are using IntelliJ, the easiest way to make sure ESLint/Typescript/formatting issues are
resolved is to set code style based on EditorConfig and Prettier, then enable ESLint.

## Linting

Run `pnpm run lint` to lint the project. This uses ESLint to check for code quality and consistency
issues.

## Testing

This project has a few different types of tests, including unit tests, end-to-end (E2E) tests, and
mocked end-to-end (ME2E) tests. Different tests serve different purposes and have overlapping
scopes.

### Unit tests

Run `nx test` to execute the unit tests via [Vitest](https://vitest.dev/). This will run 1 app's
unit tests, which defaults to the frontend.

There are a few ways to run tests for specific libraries or in specific modes:

- `nx test <library>` will run the tests for a specific library. For example:
  `nx test process-modification` will run all tests in the process-modification lib
- `nx test <library> --watch` will only test the code that has changed since your last commit.
- `nx test <library> --testFile <file-name>` will run a specific test file
- `pnpm run test:all` will run all app's unit tests in parallel

Tests can also be run and debugged inside your IDE.

In IntelliJ, you may need to set the Vitest "template" working directory to the project root (top
folder, not /src). In the run/debug configuration, make sure you also add
`--run --config=vite.config.ts` to the Vitest Options in the template configuration.

### Running end-to-end (E2E) tests

We use [Playwright](https://playwright.dev/) for our E2E testing framework. E2E tests are located in
the `apps/e2e/src/e2e` directory.

Playwright does not require you to start the app and server before running the tests. If the app and
server aren't running when the tests are kicked off, Playwright will start them for you. If for some
reason Playwright fails to start the server and app, you can start them yourself before running the
tests.

There are a few ways to run E2E tests:

- `pnpm e2e` or `nx e2e e2e` will run all Playwright tests in headless mode (i.e. without launching
  a browser)
- `pnpm e2e-ui` or `nx e2e e2e --ui` will
  launch [Playwright UI Mode](https://playwright.dev/docs/test-ui-mode) where you can explore and
  run individual tests and even run in watch mode (i.e. re-run tests when files change)
- `pnpm e2e-debug` or `nx e2e e2e --debug` will launch a debug window that will allow you to step
  through tests
- `pnpm e2e:env` The functional tests (me2e, e2e, and reg) require certain environment variables to run. If you're using the HashiCorp Vault to provide secrets to your environment, you can use this command to have the required env vars loaded into the environment before running the tests. This command will prompt you for which tests you want to run. Valid options are found in the package.json file, but to run all e2es in headless mode, enter `e2e`.

Tests run against localhost by default. If you want to run against a specific environment, you can set the `FXN_BASE_URL` environment variable to the base URL of that
environment. For example: `FXN_BASE_URL=https://dev.example.com/ pnpm e2e`

### Running mocked end-to-end (ME2E) tests

We use [Playwright](https://playwright.dev/) for our mocked E2Es. ME2Es are located in the
`apps/e2e/src/mocked-e2e` directory.

- `pnpm me2e` or `nx me2e e2e` will run all Playwright tests in headless mode (i.e. without
  launching a browser).
- `pnpm me2e-ui` or `nx me2e e2e --ui` will
  launch [Playwright UI Mode](https://playwright.dev/docs/test-ui-mode) where you can explore and
  run individual tests and even run in watch mode (i.e. re-run tests when files change).
- `pnpm me2e-debug` or `nx me2e e2e --debug` will launch a debug window that will allow you to step
  through tests.
- `pnpm e2e:env` The functional tests (me2e, e2e, and reg) require certain environment variables to run. If you're using the HashiCorp Vault to provide secrets to your environment, you can use this command to have the required env vars loaded into the environment before running the tests. This command will prompt you for which tests you want to run. Valid options are found in the package.json file, but to run all me2es in headless mode, enter `me2e`.

Tests run against localhost by default. If you want to run against a specific environment, you can set the `FXN_BASE_URL`. For example:
`FXN_BASE_URL=https://dev.example.com/my-branch/ pnpm me2e`

### E2Es vs ME2Es - when we use each

The E2E and ME2E tests both test how our application behaves in the browser from a user's
perspective. The difference is that E2Es test the application against the real backend services such
as the Fluxnova engine, while ME2Es test the application against mocked backend services.

This means that ME2Es tend to be faster and more reliable than E2Es because they don't rely on the
backend services being up and running.

E2Es should be written for any major feature in our app such as moving tokens, activating or
suspending a process instance, etc. ME2Es should be used for smaller features or interactions in our
app such as clicking a button, opening a modal, etc. We want to test most major features with real
services to ensure they work as expected, but we don't want to rely on real services for every test
because it can slow down the test suite and make it more brittle.

## Icons

The UI uses custom icons from a single SVG file. For more information,
see [Icons](./icons.md).

## Custom font sizes

NOTE: Scope CSS files don't include font size, Where possible elements use utility classes for font
size.

- font-size: 10px = .fs-12
- font-size: 12px = .fs-11
- font-size: 14px = .fs-10
- font-size: 18px = .fs-9
- font-size: 20px = .fs-8
- font-size: 24px = .fs-7
- font-size: 28px = .fs-6
- font-size: 30px = .fs-5
- font-size: 32px = .fs-4
- font-size: 35px = .fs-3
- font-size: 50px = .fs-2
- font-size: 100px = .fs-1
