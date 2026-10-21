# Fixture: Terraform TLS policies.
resource "aws_lb_listener" "legacy" {
  ssl_policy = "ELBSecurityPolicy-2016-08" # expect: terraform-aws-ssl-policy
}

resource "aws_lb_listener" "classical" {
  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06" # expect: terraform-aws-ssl-policy
}

resource "aws_lb_listener" "pq" {
  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"
}

resource "azurerm_storage_account" "sa" {
  min_tls_version = "TLS1_0" # expect: terraform-min-tls-version
}

resource "aws_cloudfront_distribution" "cdn" {
  viewer_certificate {
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
