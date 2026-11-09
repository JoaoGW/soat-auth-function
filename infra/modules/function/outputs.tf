output "name" {
  value = azurerm_function_app_flex_consumption.this.name
}

output "hostname" {
  value = azurerm_function_app_flex_consumption.this.default_hostname
}

output "storage_account_id" {
  value = azurerm_storage_account.runtime.id
}
