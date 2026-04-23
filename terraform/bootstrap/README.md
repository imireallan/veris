# Terraform bootstrap

This stack creates the shared Terraform backend resources for Veris:
- one private S3 bucket for remote state
- one DynamoDB table for state locking

Use this stack once before using the main `terraform/` stack.

## Files
- `versions.tf`
- `provider.tf`
- `variables.tf`
- `main.tf`
- `outputs.tf`
- `terraform.tfvars.example`

## Usage

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

After apply, take the output values and copy them into:
- `../backend.tf`

Example `../backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "veris-terraform-state-prod"
    key            = "veris/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "veris-terraform-locks"
    encrypt        = true
  }
}
```

Then initialize the main stack:

```bash
cd ..
cp backend.tf.example backend.tf
terraform init
terraform plan
```
