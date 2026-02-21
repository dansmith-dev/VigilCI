variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type = string
}

variable "script_name" {
  type    = string
  default = "hello-worker"
}