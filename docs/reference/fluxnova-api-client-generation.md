# Fluxnova engine client generation

The Fluxnova Control Center interacts with the Fluxnova BPM Engine REST API through a TypeScript client. This
client is generated from the Fluxnova Engine OpenAPI specification. To generate or update the engine
API client, use the `./scripts/generate-fluxnova-client.sh` script:

### Command-Line Arguments

The script supports the following arguments. All of these are optional. If not provided, the
script will attempt to use environment variables or default values.

- `--fxn-artifact-repo <REPO>`
  - Private artifact repository URL, e.g. artifactory.example.com/maven-releases
  - Default: public Maven repository
- `--fxn-artifact-repo-user <USERNAME>`
  - Artifact repository username
  - If not provided, authentication will not be used.
- `--fxn-artifact-repo-token <TOKEN>`
  - Artifact repository authentication token
  - If using authentication, either this or password must be provided.
- `--fxn-artifact-repo-pass <PASSWORD>`
  - Artifact repository password
  - If using authentication, either this or token must be provided
- `--fluxnova-version <VERSION>`
  - API version to use
  - Default: 2.0.0
- `--output-dir <DIR>`
  - Output directory for the generated client.
  - Default: apps/server/src/fluxnova/generated

### Environment Variables

Instead of command-line arguments, you can also set the following environment variables:

- `export FXN_ARTIFACT_REPO="artifactory.example.com/maven-releases"`
  - Private artifact repository URL
  - Default: public Maven repository
- `export FXN_ARTIFACT_REPO_USER="your-username"`
  - If not provided, authentication will not be used
- `export FXN_ARTIFACT_REPO_TOKEN="your-token"`
  - If using authentication, either this or password must be provided
- `export FXN_ARTIFACT_REPO_PASS="your-password"`
  - If using authentication, either this or token must be provided

### Authentication

The script supports two authentication methods for private artifact repositories (in order of
priority):

1. Token authentication (using `--fxn-artifact-repo-token` or `FXN_ARTIFACT_REPO_TOKEN`)
2. Password authentication (using `--fxn-artifact-repo-pass` or `FXN_ARTIFACT_REPO_PASS`)

For either case, a username must be provided (using `--fxn-artifact-repo-user` or
`FXN_ARTIFACT_REPO_USER`).

### Example with Private Repository

Using environment variables:

```bash
export FXN_ARTIFACT_REPO="artifactory.example.com/my-repo"
export FXN_ARTIFACT_REPO_USER="your-username"
export FXN_ARTIFACT_REPO_TOKEN="your-token"

./scripts/generate-fluxnova-client.sh
```

Or using command-line arguments:

```bash
./scripts/generate-fluxnova-client.sh \
  --fxn-artifact-repo "artifactory.example.com/my-repo" \
  --fxn-artifact-repo-user "your-username" \
  --fxn-artifact-repo-token "your-token"
```
