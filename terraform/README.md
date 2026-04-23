# Veris Terraform

This directory provisions the minimum AWS infrastructure for a fast Veris production setup.
It follows the same EC2 + Elastic IP bootstrap shape used in ApplyFlow_AI, but adds the missing AWS pieces Veris needs for production:

- EC2 application server
- Elastic IP
- hardened security group (80/443 + optional restricted SSH)
- private S3 media bucket
- IAM role for EC2 to access the S3 media bucket
- SES domain identity + DKIM
- optional Route53 records for app routing and SES verification

What Terraform manages
- AWS infrastructure only

What Terraform does not manage
- Docker Compose releases
- application deploys
- database migrations
- runtime secrets content

Those stay in GitHub Actions and `.env.production`.

## Files
- `versions.tf` — Terraform and provider constraints
- `provider.tf` — AWS provider with default tags
- `backend.tf.example` — sample remote-state backend config
- `variables.tf` — configurable inputs
- `main.tf` — core resources
- `outputs.tf` — useful outputs after apply
- `user_data.sh` — EC2 bootstrap script
- `terraform.tfvars.example` — example input values

## Recommended remote state
Do not keep Terraform state local.
This repo now includes a dedicated bootstrap stack at `terraform/bootstrap/` for:
- S3 bucket for state
- DynamoDB table for locks

Run that stack first, then copy `backend.tf.example` to `backend.tf` and replace placeholders with the bootstrap outputs.

## Usage
1. Copy the vars file

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

2. Fill in real values
- `key_name`
- `ssh_ingress_cidr_blocks`
- `s3_bucket_name`

Optional when using a real custom domain:
- `app_domain`
- `zone_id`
- `ses_domain`
- `notification_email`

3. Bootstrap remote state

```bash
cd bootstrap
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
cd ..
```

4. Configure remote state

```bash
cp backend.tf.example backend.tf
```

5. Initialize Terraform

```bash
terraform init
```

6. Review the plan

```bash
terraform plan
```

7. Apply

```bash
terraform apply
```

## Important notes
- Leave `ssh_ingress_cidr_blocks` restricted to your IP(s). Do not open SSH to the world.
- `create_route53_records=true` only works when the hosted zone lives in Route53 and `zone_id` is set.
- `manage_ses_dns=true` only works when Route53 DNS is also managed here.
- For staging without a purchased domain, leave `app_domain`, `zone_id`, `ses_domain`, and `notification_email` as `null`, then use the Terraform outputs `app_public_dns` or `app_public_ip` as your temporary host.
- The EC2 instance gets an IAM role for S3 access. Prefer that over long-lived AWS access keys in `.env.production`.
- SES SMTP credentials are still separate from the IAM role. Store those in GitHub secrets or SSM/Secrets Manager.
- This stack keeps Postgres inside Docker for MVP. Move to RDS later when reliability matters more than speed.

## Suggested next step after apply
Use the GitHub Actions deploy workflow already added in the repo to:
- write `.env.production`
- ssh into EC2
- run `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build`
