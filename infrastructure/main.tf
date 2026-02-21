terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {}

resource "cloudflare_workers_script" "this" {
  account_id         = var.account_id
  script_name        = var.script_name
  content_file       = "${path.module}/worker.js"
  content_sha256     = filesha256("${path.module}/worker.js")
  main_module        = "worker.js"
  compatibility_date = "2025-01-01"

  plain_text_binding {
    name = "GITHUB_CLIENT_ID"
    text = var.github_client_id
  }

  secret_text_binding {
    name = "GITHUB_CLIENT_SECRET"
    text = var.github_client_secret
  }
}

resource "cloudflare_workers_script_subdomain" "this" {
  account_id  = var.account_id
  script_name = cloudflare_workers_script.this.script_name
  enabled     = true
}