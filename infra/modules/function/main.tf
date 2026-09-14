resource "azurerm_storage_account" "runtime" {
  name                              = "stauth${var.environment}${var.name_suffix}"
  resource_group_name               = var.resource_group_name
  location                          = var.location
  account_tier                      = "Standard"
  account_replication_type          = "LRS"
  min_tls_version                   = "TLS1_2"
  public_network_access_enabled     = true
  allow_nested_items_to_be_public   = false
  infrastructure_encryption_enabled = true

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }
}

resource "azurerm_storage_container" "package" {
  name                  = "function-package"
  storage_account_id    = azurerm_storage_account.runtime.id
  container_access_type = "private"
}

resource "azurerm_service_plan" "flex" {
  name                = "plan-auth-${var.environment}-${var.name_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "FC1"
}

resource "random_password" "jwt_client_secret" {
  length  = 48
  special = true
}

resource "azurerm_key_vault_secret" "jwt_client_secret" {
  name         = "jwt-client-secret-${var.environment}"
  value        = random_password.jwt_client_secret.result
  key_vault_id = var.key_vault_id
  content_type = "application/vnd.soat.jwt-secret"
}

resource "azurerm_function_app_flex_consumption" "this" {
  name                = "func-soat-auth-${var.environment}-${var.name_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.flex.id

  storage_container_type                         = "blobContainer"
  storage_container_endpoint                     = "${azurerm_storage_account.runtime.primary_blob_endpoint}${azurerm_storage_container.package.name}"
  storage_authentication_type                    = "StorageAccountConnectionString"
  storage_access_key                             = azurerm_storage_account.runtime.primary_access_key
  runtime_name                                   = "node"
  runtime_version                                = "20"
  maximum_instance_count                         = 10
  instance_memory_in_mb                          = 512
  virtual_network_subnet_id                      = var.function_subnet_id
  https_only                                     = true
  public_network_access_enabled                  = true
  webdeploy_publish_basic_authentication_enabled = false

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    DATABASE_URL                = "@Microsoft.KeyVault(SecretUri=${var.database_url_secret_uri})"
    JWT_CLIENT_SECRET           = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_client_secret.versionless_id})"
    JWT_CLIENT_ISSUER           = "soat-auth-function"
    JWT_CLIENT_AUDIENCE         = "soat-api"
    JWT_CLIENT_EXPIRES_IN       = "15m"
    NODE_ENV                    = var.environment
    OBSERVABILITY_ENABLED       = "true"
    OTEL_SERVICE_NAME           = "soat-auth-function"
    OTEL_SERVICE_VERSION        = var.application_version
    OTEL_EXPORTER_OTLP_ENDPOINT = "https://otlp.nr-data.net:4318"
    NEW_RELIC_LICENSE_KEY       = "@Microsoft.KeyVault(SecretUri=${var.key_vault_uri}secrets/new-relic-license-key/)"
  }

  site_config {
    minimum_tls_version    = "1.2"
    vnet_route_all_enabled = true
    http2_enabled          = true
  }
}

resource "azurerm_role_assignment" "function_key_vault" {
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_function_app_flex_consumption.this.identity[0].principal_id
}
