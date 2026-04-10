# File Storage Configuration

Veris supports dual storage backends: **Local filesystem** for development and **AWS S3** for production.

## Overview

| Environment | Storage | Configuration |
|-------------|---------|---------------|
| Development | Local (`./media/`) | `USE_S3=false` |
| Production | AWS S3 | `USE_S3=true` |

## Setup

### Development (Local Storage)

```bash
# .env
USE_S3=false
```

Files are stored in `backend/media/evidence_documents/`

### Production (S3 Storage)

```bash
# .env
USE_S3=true
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=veris-media-prod
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=  # Optional: CloudFront domain
```

## AWS S3 Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://veris-media-prod --region us-east-1
```

### 2. Bucket Policy (Private Access)

Documents are kept private and accessed via signed URLs. Create an IAM user with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::veris-media-prod/*"
    }
  ]
}
```

### 3. Optional: CloudFront Distribution

For faster global access:

1. Create CloudFront distribution pointing to S3 bucket
2. Set `AWS_S3_CUSTOM_DOMAIN=d1234.cloudfront.net` in `.env`
3. Configure signed URLs for private content

## How It Works

### Upload Flow

```python
# Upload endpoint uses Django's default_storage
from django.core.files.storage import default_storage

file_path = default_storage.save("evidence_documents/file.pdf", uploaded_file)
file_url = default_storage.url(file_path)
```

- **Local**: Returns `/media/evidence_documents/file.pdf`
- **S3**: Returns `https://bucket.s3.amazonaws.com/media/evidence_documents/file.pdf` (or CloudFront URL)

### AI Processing Flow

The evidence pipeline automatically handles both storage types:

```python
# knowledge/services.py
def extract_text_from_file(file_path: str, file_type: str) -> str:
    if file_path.startswith("http"):
        # S3 URL: download to temp file
        response = requests.get(file_path)
        # Process temp file
    else:
        # Local path: read directly
        with open(file_path) as f:
            return f.read()
```

## Security

- **S3 ACL**: `private` (no public access)
- **Query String Auth**: `True` (signed URLs required)
- **Cache Control**: `max-age=86400` (24 hours)

## Testing

### Local Testing

```bash
# 1. Ensure USE_S3=false in .env
# 2. Upload a document
curl -X POST http://localhost:8000/api/upload-evidence/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# 3. Verify file exists
ls backend/media/evidence_documents/
```

### S3 Testing

```bash
# 1. Set USE_S3=true and AWS credentials in .env
# 2. Upload a document
# 3. Verify in S3 console or via CLI
aws s3 ls s3://veris-media-prod/media/evidence_documents/
```

## Files

- `backend/config/storage.py` — Storage backend classes
- `backend/config/settings/base.py` — Storage configuration
- `backend/config/settings/production.py` — Forces `USE_S3=true`
- `backend/assessments/views/upload_evidence.py` — Upload endpoint
- `backend/knowledge/services.py` — AI pipeline (handles S3 downloads)

## Troubleshooting

### "Missing AWS credentials"

Ensure all required settings are in `.env`:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
```

### "Access Denied" on S3

Check IAM user permissions and bucket policy.

### Slow Processing with S3

Files are downloaded to temp storage before AI processing. This is expected. Consider migrating to `ai_engine` service for async processing (see `docs/ai-architecture-decision.md`).
