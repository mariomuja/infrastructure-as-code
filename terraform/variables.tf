variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-infrastructure-as-code"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Central US"
}

variable "storage_account_name" {
  description = "Base name for storage account (suffix will be added)"
  type        = string
  default     = "stcsvtransport"
}

variable "sql_server_name" {
  description = "Base name for SQL server (suffix will be added)"
  type        = string
  default     = "sql-csvtransport"
}

variable "sql_database_name" {
  description = "Name of the SQL database"
  type        = string
  default     = "csvtransportdb"
}

variable "sql_admin_login" {
  description = "SQL Server administrator login"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server administrator password"
  type        = string
  sensitive   = true
}

variable "allow_current_ip" {
  description = "Allow current IP address to access SQL Server"
  type        = bool
  default     = false
}

variable "current_ip_address" {
  description = "Current IP address for SQL firewall rule"
  type        = string
  default     = ""
}

variable "functions_storage_name" {
  description = "Base name for Functions storage account (suffix will be added)"
  type        = string
  default     = "stfuncscsv"
}

variable "functions_app_plan_name" {
  description = "Base name for Functions app service plan (suffix will be added)"
  type        = string
  default     = "plan-funcs-csv"
}

variable "functions_app_name" {
  description = "Base name for Functions app (suffix will be added)"
  type        = string
  default     = "func-csv-processor"
}



