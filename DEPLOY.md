# Veris deployment guide

This is the end-to-end runbook for getting Veris live on AWS using:
- Terraform for infrastructure
- EC2 + Docker Compose for runtime
- Caddy for HTTPS
- S3 for private media
- SES for outgoing mail
- GitHub Actions for deployments

## Architecture

Runtime:
- Caddy
- frontend
- backend
- ai_engine
- postgres

AWS resources:
- EC2 instance
- Elastic IP
- security group
- S3 media bucket
- IAM role for EC2 -> S3 access
- SES domain identity + DKIM
- optional Route53 DNS records
- Terraform remote state bucket + lock table

## 0. Prerequisites

You need:
- an AWS account
- an existing EC2 key pair
- a domain name only if you want custom DNS, HTTPS on your own hostname, or SES domain email
- Route53 hosted zone only if you want Terraform-managed DNS
- GitHub repo access
- Terraform installed locally
- Docker installed locally

## 1. Bootstrap Terraform remote state

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
```

Fill in:
- `state_bucket_name`
- `lock_table_name`
- `aws_region`

Then run:

```bash
terraform init
terraform plan
terraform apply
```

Take the outputs and create `terraform/backend.tf` from `terraform/backend.tf.example`.

Example:

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

## 2. Provision Veris AWS infrastructure

```bash
cd ../
cp terraform.tfvars.example terraform.tfvars
```

Fill in:
- `key_name`
- `ssh_ingress_cidr_blocks`
- `s3_bucket_name`

No-domain staging mode:
- set `app_domain = null`
- set `zone_id = null`
- set `create_route53_records = false`
- set `manage_ses_dns = false`
- set `ses_domain = null`
- set `notification_email = null`

Custom-domain mode:
- fill `app_domain`
- fill `zone_id`
- set `create_route53_records = true`
- set `manage_ses_dns = true` if you also want Terraform to write SES DNS records
- fill `ses_domain`
- fill `notification_email`

Then run:

```bash
terraform init
terraform plan
terraform apply
```

Important outputs:
- `app_public_ip`
- `app_public_dns`
- `app_domain`
- `s3_bucket_name`
- `ec2_role_name`
- `ses_verification_token`
- `ses_dkim_tokens`

## 3. DNS and Route53

If `create_route53_records=true` and `zone_id` is set:
- Terraform will create the A record for the app domain
- Terraform will create SES verification/DKIM/SPF/DMARC records

If Route53 is not managed here:
- for no-domain staging, use `app_public_dns` or `app_public_ip` directly and skip DNS work entirely
- if you do have an external DNS provider, manually create an A record pointing to the EC2 Elastic IP
- manually add SES verification and DKIM records only if you are actually setting up SES with a real domain

## 4. SES mail setup

Terraform creates SES resources only when `ses_domain` is set.

If you are in no-domain staging mode, skip this section for now.

When enabled, Terraform creates:
- SES domain identity
- DKIM tokens
- SPF and DMARC records when DNS is managed via Route53

You still need to:
- verify domain identity status in SES
- request SES production access if the account is in sandbox
- create SMTP credentials for Django

Django uses SMTP, so keep these values for `.env.production` / GitHub secrets:
- `EMAIL_HOST=email-smtp.us-east-1.amazonaws.com`
- `EMAIL_PORT=587`
- `EMAIL_HOST_USER=<ses smtp username>`
- `EMAIL_HOST_PASSWORD=<ses smtp password>`
- `EMAIL_USE_TLS=True`
- `DEFAULT_FROM_EMAIL=noreply@your-domain`
- `SERVER_EMAIL=noreply@your-domain`

## 5. S3 media setup

Terraform creates a private S3 bucket with:
- versioning
- encryption
- public access blocked

Preferred setup:
- let the EC2 IAM role access S3
- avoid putting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in app secrets

For the current Django config, set:
- `USE_S3=true`
- `AWS_STORAGE_BUCKET_NAME=<bucket name>`
- `AWS_S3_REGION_NAME=<region>`
- `AWS_S3_CUSTOM_DOMAIN=` only if using CloudFront later

Note:
- the app code should use instance-role credentials in production
- if explicit AWS keys are still required anywhere, treat that as temporary

## 6. GitHub secrets

Set these repo secrets for `.github/workflows/deploy.yml`:
- `AWS_ACCESS_KEY_ID` -> IAM access key for a deploy user/role bridge with SSM permissions
- `AWS_SECRET_ACCESS_KEY` -> matching secret access key
- `AWS_REGION` -> usually `us-east-1`
- `EC2_INSTANCE_ID` -> target instance ID (for this staging box: `i-07b1e4c5f5aa78709`)
- `EC2_USER` -> usually `ec2-user`
- `PROD_ENV_FILE` -> full contents of `.env.production`

Recommended `PROD_ENV_FILE` values:
- `CADDY_SITE_ADDRESS`
- `SITE_URL`
- `AI_PUBLIC_URL`
- `TLS_EMAIL`
- `SESSION_SECRET`
- `DJANGO_SECRET_KEY`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `USE_S3=true`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_REGION_NAME`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `EMAIL_USE_TLS`
- `DEFAULT_FROM_EMAIL`
- `SERVER_EMAIL`
- AI provider keys as needed

No-domain staging example:
- `CADDY_SITE_ADDRESS=:80`
- `SITE_URL=http://<app_public_dns>`
- `AI_PUBLIC_URL=http://<app_public_dns>/ai`
- `ALLOWED_HOSTS=<app_public_dns>,<app_public_ip>`
- `CORS_ALLOWED_ORIGINS=http://<app_public_dns>`
- `CSRF_TRUSTED_ORIGINS=http://<app_public_dns>`

Custom-domain example:
- `CADDY_SITE_ADDRESS=veris.example.com`
- `SITE_URL=https://veris.example.com`
- `AI_PUBLIC_URL=https://veris.example.com/ai`

## 7. First server check

After Terraform apply, verify the box is reachable through SSM first:

```bash
aws ssm describe-instance-information \
  --region us-east-1 \
  --filters Key=InstanceIds,Values=<instance-id>
```

Optional direct SSH check if your current IP is whitelisted:

```bash
ssh -i /path/to/key ec2-user@<app_public_ip>
```

Verify bootstrap worked:

```bash
docker --version
docker compose version
id ec2-user
ls -la /home/ec2-user/veris
```

Expected:
- Docker installed
- docker compose plugin installed
- `/home/ec2-user/veris` exists

## 8. First deploy

Push your branch or merge to main, then trigger the deploy workflow.

What the workflow does:
- authenticate to AWS from GitHub Actions
- verify the EC2 instance is online in SSM
- dispatch an SSM Run Command to the instance
- clone/pull the repo into `/home/ec2-user/veris`
- write `.env.production`
- run `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans`

Manual equivalent on the server:

```bash
cd /home/ec2-user/veris
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Important:
- In no-domain staging mode, keep `CADDY_SITE_ADDRESS=:80` so Caddy serves plain HTTP on port 80.
- Do not assume automatic HTTPS is available on the AWS default public DNS name or raw IP.
- Add custom-domain TLS later once you attach a real domain.

## 9. First deploy checklist

Infra
- [ ] bootstrap Terraform stack applied
- [ ] main Terraform stack applied
- [ ] Elastic IP assigned
- [ ] SSH restricted to your current IP (only needed for emergency/manual shell access)
- [ ] app is reachable via public DNS/IP or custom domain

Email
- [ ] SES domain identity verified (only if using a real domain)
- [ ] DKIM verified (only if using a real domain)
- [ ] SES out of sandbox or recipients verified (only if using SES now)
- [ ] SMTP credentials generated (only if using email now)

App secrets
- [ ] GitHub deploy secrets set
- [ ] `.env.production` content reviewed
- [ ] Django secret keys are strong/random
- [ ] DB password is strong/random

Runtime
- [ ] deploy workflow succeeds
- [ ] `docker compose ps` shows healthy services
- [ ] app loads over HTTP or HTTPS, matching your host setup
- [ ] backend health endpoint works
- [ ] invitation email sends successfully if email is enabled
- [ ] file upload reaches S3

## 10. Post-deploy smoke tests

Check in browser:
- landing page loads
- login works
- authenticated dashboard loads
- API requests succeed
- AI endpoint responds if enabled

Check on server:

```bash
cd /home/ec2-user/veris
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 frontend
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 caddy
```

## 11. Known MVP limitations

Current deployment is intentionally simple:
- Postgres runs in Docker on the same EC2 host
- deploys use GitHub Actions + AWS SSM Run Command
- no RDS yet
- no CloudFront yet
- no Secrets Manager / SSM parameter-store env injection yet
- single-node runtime

This is fine for MVP speed.
Upgrade later to:
- RDS
- CloudFront
- SSM/Secrets Manager
- ECR image pipeline
- CloudWatch alarms / backups

## 12. Recommended next hardening steps

After first stable deploy:
1. move DB to RDS
2. remove explicit AWS keys from runtime env if still present
3. add CloudWatch alarms
4. add off-box backups
5. add a staging environment
