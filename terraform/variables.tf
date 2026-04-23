variable "project_name" {
  description = "Short project slug used in names and tags."
  type        = string
  default     = "veris"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for Veris infrastructure."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance size for the application server."
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH access."
  type        = string
}

variable "repo_url" {
  description = "Git repository URL cloned onto the EC2 instance."
  type        = string
  default     = "git@github.com:imireallan/veris.git"
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 30
}

variable "ssh_ingress_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into the EC2 instance."
  type        = list(string)
  default     = []
}

variable "app_domain" {
  description = "Optional custom domain for the Veris app. Leave null when using the EC2 public DNS name or Elastic IP for staging."
  type        = string
  default     = null
}

variable "zone_id" {
  description = "Route53 hosted zone ID for the app domain. Required when create_route53_records is true."
  type        = string
  default     = null
}

variable "create_route53_records" {
  description = "Whether Terraform should manage Route53 DNS records in the hosted zone."
  type        = bool
  default     = false
}

variable "manage_ses_dns" {
  description = "Whether Terraform should create SES verification/DKIM DNS records in Route53."
  type        = bool
  default     = false
}

variable "ses_domain" {
  description = "Optional domain used for SES sending identity. Usually the same as app_domain or the parent domain. Leave null when skipping domain-based email setup."
  type        = string
  default     = null
}

variable "notification_email" {
  description = "Optional email address used in outputs/docs for TLS and ops notifications. Required for DMARC records when SES DNS is managed here."
  type        = string
  default     = null
}

variable "s3_bucket_name" {
  description = "Private S3 bucket for Veris media uploads."
  type        = string
}

variable "force_destroy_s3_bucket" {
  description = "Whether Terraform can destroy the S3 bucket even if it contains objects. Keep false in production."
  type        = bool
  default     = false
}
