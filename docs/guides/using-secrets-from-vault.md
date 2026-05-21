# Consume secrets from HashiCorp Vault

Instead of manually defining environment variables for your secrets, you can use the vault integration to automatically
retrieve secrets from vault and populate the appropriate environment variables. This can help ensure that your secrets
are kept secure and up-to-date without requiring manual intervention.

## Prerequisites

- [vault](https://developer.hashicorp.com/vault/install)

NOTE: this guide assumes a Mac or Unix OS. If you are using a different operating system, you may need to adjust the
commands and file paths accordingly.

## Setting up vault integration

1. Create a vault token retrieval script.
   1. Paste the following into a new shell script file (e.g. `get-vault-token.sh`). Placing it
      somewhere in your PATH can make it easier to run from any terminal session.

      IMPORTANT: Be sure to replace "secrets.example.com" with the appropriate URL for your
      vault server, and adjust the login path as needed based on your vault configuration. If
      your username in Vault is different from your username in your terminal environment, you
      will also need to modify the `${USER}` variable in the `LOGIN_LOCATION` assignment to
      reflect the appropriate vault username.

      ```bash
      #!/usr/bin/env bash

      LOGIN_LOCATION="https://secrets.example.com/v1/auth/ldap/login/${USER}"

      # Instead of prompting for the password every time the script runs, you could also
      # consider changing this to read the password from a password manager or similar secure
      # location.
      echo -n 'Password: '
      read -s password

      while true
      do
          echo "Refreshing token"
          curl --location --request POST $LOGIN_LOCATION \
              -s \
              --header 'Content-Type: application/json' \
              --data-raw "{
                  \"password\": \"${password}\"
              }" |  grep -Eo '"client_token"[^,]*' | grep -Eo '[^:]*$' | sed -e s/\"//g > ~/.vault-token
          echo "Token refreshed"
          sleep 21600
      done
      ```

   2. Make the shell script created above executable (e.g. `chmod +x get-vault-token.sh`).

2. Run the vault token retrieval script created in the previous step to get a vault
   token & populate it in your environment.
   - NOTE: the script will continue running and refreshing your token as needed, so you should
     keep it running in a terminal session while you are working with the application. You can
     open a new terminal session to run the following steps to start the application.

3. Copy the file `scripts/vault/agent-config.e2e.hcl.tpl` to `scripts/vault/agent-config.e2e.hcl`
4. Edit `scripts/vault/agent-config.e2e.hcl`
   1. Replace the following placeholders with the appropriate values:
      - `###PATH_TO_TOKEN###`: The file path on your local computer where the vault token will
        be stored (e.g. `/Users/my-username/.vault-token`). This should match the file path
        where the vault token retrieval script is writing the token.
      - `###VAULT_ADDR###`: The URL of your Vault server (e.g. `https://vault.example.com`).
   2. Add/remove/modify the `env-template` blocks as needed to specify which secrets you want
      the vault agent to retrieve and how they should be mapped to environment variables.
