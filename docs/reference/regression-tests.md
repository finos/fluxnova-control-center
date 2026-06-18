# Regression Tests

Fluxnova has a robust suite of regression tests that can be utilized to validate the functionality of the application
and ensure that new changes do not introduce bugs or regressions.

## Test Areas

The regression tests are organised by feature area. The table below describes each area and the aspects of the UI it covers.

| Area                            | Script         | Description                                                                                                                                                                                                                     |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batch Details**               | `pnpm reg:bd`  | Covers the batch details page, including the info panel, tab area, failed jobs tab, remaining jobs tab, job logs tab, layout, and modal close-out behaviour.                                                                    |
| **Batches List**                | `pnpm reg:bl`  | Covers the batches list page, including layout, ID linking, bulk actions, filter reset, and modal close-out behaviour.                                                                                                          |
| **Decision Definition Details** | `pnpm reg:ddd` | Covers the decision definition details page, including the diagram view, info panel, decision instances tab, evaluate-decision functionality, layout, and modal close-out behaviour.                                            |
| **Decision Definitions List**   | `pnpm reg:ddl` | Covers the decision definitions list page, including layout, ID linking, filter toggling, and view reset.                                                                                                                       |
| **Deployment Details**          | `pnpm reg:dd`  | Covers the deployment details page, including the diagram view, info panel, resource list, definitions tab, tab area, layout, and modal close-out behaviour.                                                                    |
| **Deployments List**            | `pnpm reg:dl`  | Covers the deployments list page, including layout, ID linking, filter reset, and modal close-out behaviour.                                                                                                                    |
| **Incidents List**              | `pnpm reg:il`  | Covers the incidents list page, including layout, ID linking, filter reset, and modal close-out behaviour.                                                                                                                      |
| **Jobs List**                   | `pnpm reg:jl`  | Covers the jobs list page, including layout, ID linking, bulk actions, filter reset, and modal close-out behaviour.                                                                                                             |
| **Process Definition Details**  | `pnpm reg:pdd` | Covers the process definition details page, including the diagram view, job definition bulk actions, layout, and modal close-out behaviour.                                                                                     |
| **Process Definitions List**    | `pnpm reg:pdl` | Covers the process definitions list page, including layout, ID linking, bulk actions, filter reset, and modal close-out behaviour.                                                                                              |
| **Process Instance Details**    | `pnpm reg:pid` | Covers the process instance details page, including the diagram view, info panel, actions, tab section, and all detail tabs: variables, incidents, jobs, user tasks, called process instances, decision instances, and history. |
| **Process Instances List**      | `pnpm reg:pil` | Covers the process instances list page, including layout, ID linking, bulk actions, filter reset, and modal close-out behaviour.                                                                                                |

## Running Regression Tests

### Run All Regression Tests

To run the full regression suite, execute the following command from the workspace root:

```bash
pnpm reg
```

### Debug Mode

To run the regression tests in Playwright's debug mode (step through tests with the Playwright Inspector):

```bash
pnpm reg-debug
```

## Using the Playwright UI

The Playwright UI provides an interactive browser-based interface for browsing, filtering, and running individual tests or groups of tests. It is the recommended way to investigate failures or run a targeted subset of the regression suite.

To open the Playwright UI for the regression tests, run:

```bash
pnpm reg-ui
```

Once the UI is open:

1. The left-hand panel lists all test files grouped by feature area.
2. Click on a test file or an individual test name to run it in isolation.
3. Use the search bar at the top to filter tests by name or file path.
4. Click the **Run all** button (▶) to execute the entire suite within the UI.
5. After a test run, select any test to inspect its timeline, screenshots, traces, and network activity.

> **Tip:** The Playwright UI keeps a persistent browser session, making it easy to re-run failing tests without restarting the whole suite.

## ⚠️ Timeout Note

> When running the **full regression suite** (via `pnpm reg` or the **Run all** button in the UI) some tests may fail due to timeouts caused by the volume of concurrent requests and browser activity. These failures are not indicative of genuine regressions.
>
> If you encounter a timeout failure, **re-run the affected test(s) in isolation** (using the area-specific script or by clicking the individual test in the Playwright UI). Tests that failed due to timeouts will pass when run on their own.
