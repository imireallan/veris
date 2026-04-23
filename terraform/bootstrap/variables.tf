variable "project_name" {
  description = "Project slug used in names and tags."
  type        = string
  default     = "veris"
}

variable "environment" {
  description = "Environment name for the Terraform bootstrap resources."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region where the remote state infrastructure will live."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform remote state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name used for Terraform state locking."
  type        = string
  default     = "veris-terraform-locks"
}
