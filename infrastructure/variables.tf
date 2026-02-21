variable "account_id" {
  type = string
}

variable "script_name" {
  type    = string
  default = "hello-worker"
}

variable "github_client_id" {
  type = string
}

variable "github_client_secret" {
  type      = string
  sensitive = true
}