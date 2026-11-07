# Getting Started

This guide covers the steps necessary to set up and run the Fluxnova Control Center application locally for
development purposes. It includes instructions for setting up the project, installing dependencies,
configuring environment variables, and starting the development server.

This guide assumes you are running the application on a Mac or Linux/Unix system. If you are using
Windows, you may need to make some modifications to the instructions below. Please report any such
modifications back to the project maintainers for inclusion in this guide.

## Prerequisites

Before setting up the project, make sure you have the following installed:

- git
- Node.js 24
- Corepack (included with Node.js 24)
- (optional) If you want to use the Vault integration to manage your secrets, set up vault and add your secrets there.
  See [Consume secrets from Vault](../guides/using-secrets-from-vault.md) for more information.

You will also need a running instance of the Fluxnova engine and API. You can set this up locally by following the
instructions in the [fluxnova-bpm-platform repo](https://github.com/finos/fluxnova-bpm-platform).
By default, this will set up the engine and API to run locally at http://localhost:8080 with no
API authentication required.

## Project Setup

This guide assumes that you are running the Fluxnova engine and API locally at http://localhost:8080 for development
purposes, and that API is configured to not require authentication. The configuration below is based on that assumption.
If your setup is different, you will need to adjust the configuration of the UI accordingly. If you need to call the API
hosted somewhere else, you will need to set the `FXN_REST_API_URL` variable to point to the URL of the engine's REST
API. To authenticate with the API, refer to the "API Authentication" section of
the [Authentication](../reference/authentication.md#api-authentication) documentation for a list of available
configuration variables and options.

1. Set up environment variables as needed
   1. Add the following to your shell initialization file (e.g. ~/.zshrc, ~/.bashrc, etc.) and
      restart your terminal session to make the changes take effect.

      NOTE: For full details on supported configuration items,
      see [Configuration](../reference/configuration.md).

      ```bash
      export FXN_AUTH_STRATEGY=none

      export NODE_TLS_REJECT_UNAUTHORIZED=0
      ```

      - NOTE: with `NODE_TLS_REJECT_UNAUTHORIZED=0` in your environment like this, you SHOULD expect to see the
        following error / warning message similar to this when starting the server if you do NOT have a local
        certificate installed:

        ```
        Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
        ```

        - If you use Node for other purposes where you do not want this behavior, consider
          creating a separate script to start the Fluxnova Control Center that sets this variable only for
          that process. Something as simple as `NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm start` would
          work.

2. Clone the repository:

   ```bash
   git clone https://github.com/finos/fluxnova-control-center.git
   ```

3. Navigate to the project directory:

   ```bash
   cd fluxnova-control-center
   ```

4. Enable the repository's pinned pnpm version and install dependencies:

   ```bash
   corepack enable
   corepack install
   pnpm install
   ```

5. Generate Fluxnova API client library:

   ```bash
   ./scripts/generate-fluxnova-client.sh
   ```

6. Start the development server:

   ```bash
   pnpm start
   ```

   - NOTE: If you are using the Vault integration, use this instead:
     ```bash
     pnpm start:env
     ```

7. Open your web browser and navigate to [http://localhost:4000](http://localhost:4000) to access the Fluxnova Control Center.

At this point, the application should be running locally.
See [Development Workflow](../reference/development-workflow.md) for more information on how to make changes to the
codebase and test them.

## References

- [Generating Fluxnova API client library](../reference/fluxnova-api-client-generation.md)
- [Local development with Keycloak OIDC and fluxnova-bpm-platform](./local-oidc-setup.md)
