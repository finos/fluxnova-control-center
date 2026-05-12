# Vault Agent configuration file template for Fluxnova Control Center.
# To be used for local development.
# This template should be copied and saved in the current folder as agent-config.hcl,
# with the placeholders replaced with actual values.

auto_auth {
   method {
      type = "token_file"

      config {
        # Path to the file containing the token.
        # This file should be created by an external process,
        # and typically lives in the user's home directory as .vault-token.
        token_file_path = "###PATH_TO_TOKEN###/.vault-token"
      }
   }
}

template_config {
   static_secret_render_interval = "5m"
   exit_on_retry_failure         = true
}

vault {
  # URL of the Vault server. This should be the same URL
  # that you use to interact with Vault using the CLI or API.
  address = "https://###VAULT_ADDR###/"
}

env_template "FXN_OIDC_CLIENT_ID" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.clientId }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_OIDC_CLIENT_SECRET" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.clientSecret }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_API_AUTH_CLIENT_ID" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.clientId }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_API_AUTH_CLIENT_SECRET" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.clientSecret }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_CSRF_KEY" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.key }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_COOKIE_KEYS" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.keys }}{{ end }}"
   error_on_missing_key = true
}

exec {
   command                   = ["pnpm start"]
   restart_on_secret_changes = "always"
   restart_stop_signal       = "SIGTERM"
}
