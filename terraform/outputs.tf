output "app_public_ip" {
  description = "Elastic IP attached to the Veris EC2 instance."
  value       = aws_eip.app.public_ip
}

output "app_public_dns" {
  description = "AWS public DNS name for the Veris EC2 instance. Useful when no custom domain is configured yet."
  value       = aws_instance.app.public_dns
}

output "app_domain" {
  description = "Optional custom domain for Veris. Null when using AWS default DNS or raw IP."
  value       = var.app_domain
}

output "s3_bucket_name" {
  description = "Private media bucket used by Veris."
  value       = aws_s3_bucket.media.bucket
}

output "ec2_role_name" {
  description = "IAM role attached to the Veris EC2 instance."
  value       = aws_iam_role.ec2.name
}

output "ses_verification_token" {
  description = "SES verification token. Only needed when DNS is not managed by this Terraform stack."
  value       = local.ses_enabled ? aws_ses_domain_identity.this[0].verification_token : null
}

output "ses_dkim_tokens" {
  description = "SES DKIM tokens. Only needed when DNS is not managed by this Terraform stack."
  value       = local.ses_enabled ? aws_ses_domain_dkim.this[0].dkim_tokens : []
}
