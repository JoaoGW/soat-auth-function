variable "location" {
  type    = string
  default = "brazilsouth"
}
variable "resource_name_suffix" { type = string }
variable "state_resource_group_name" { type = string }
variable "state_storage_account_name" { type = string }
variable "aks_state_container_name" { type = string }
