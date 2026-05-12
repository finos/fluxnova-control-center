# Vault Agent configuration file template for Fluxnova Control Center.
# To be used for local e2e testing.
# This template should be copied and saved in the current folder as agent-config.e2e.hcl,
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

env_template "FXN_DESIGNER_USR" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.usr }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_DESIGNER_PSW" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.psw }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_SUPPORT_USR" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.usr }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_SUPPORT_PSW" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.psw }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_PLAT_READ_USR" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.usr }}{{ end }}"
   error_on_missing_key = true
}
env_template "FXN_PLAT_READ_PSW" {
   contents             = "{{ with secret \"###PATH_TO_SECRET_IN_VAULT###\" }}{{ .Data.psw }}{{ end }}"
   error_on_missing_key = true
}

exec {
   command                   = ["./scripts/vault/agent-command.sh"]
   restart_on_secret_changes = "never"
   restart_stop_signal       = "SIGTERM"
}
