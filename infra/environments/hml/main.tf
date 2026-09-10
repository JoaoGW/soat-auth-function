terraform {
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

data "terraform_remote_state" "foundation" {
  backend = "azurerm"

  config = {
    resource_group_name  = var.state_resource_group_name
    storage_account_name = var.state_storage_account_name
    container_name       = var.aks_state_container_name
    key                  = "foundation.tfstate"
    use_azuread_auth     = true
  }
}

module "function" {
  source = "../../modules/function"

  environment             = "hml"
  location                = var.location
  resource_group_name     = data.terraform_remote_state.foundation.outputs.auth_resource_group_name
  name_suffix             = var.resource_name_suffix
  key_vault_id            = data.terraform_remote_state.foundation.outputs.key_vault_id
  key_vault_uri           = data.terraform_remote_state.foundation.outputs.key_vault_uri
  function_subnet_id      = data.terraform_remote_state.foundation.outputs.function_subnet_id
  database_url_secret_uri = "${data.terraform_remote_state.foundation.outputs.key_vault_uri}secrets/database-url-hml/"
  application_version     = var.application_version
}
