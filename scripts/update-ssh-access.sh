#!/bin/bash
# Veris SSH Access Manager
# Updates the staging EC2 security group to allow SSH from your current IP

set -e

PROFILE="veris-staging"
INSTANCE_ID="i-07b1e4c5f5aa78709"
SECURITY_GROUP_ID="sg-042b0b6b74f1d6107"

echo "Veris SSH Access Manager"
echo "========================"

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)
echo "Your current IP: $CURRENT_IP"

# Get existing SSH rule
echo ""
echo "Checking existing SSH rules..."
EXISTING_RULE=$(aws ec2 describe-security-groups \
  --group-ids "$SECURITY_GROUP_ID" \
  --profile "$PROFILE" \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22` && ToPort==`22`].IpRanges[].CidrIp' \
  --output text)

if [ -n "$EXISTING_RULE" ]; then
  echo "Found existing SSH rule: $EXISTING_RULE"
  
  if [ "$EXISTING_RULE" != "$CURRENT_IP/32" ]; then
    echo "Revoking old rule: $EXISTING_RULE"
    aws ec2 revoke-security-group-ingress \
      --group-id "$SECURITY_GROUP_ID" \
      --profile "$PROFILE" \
      --protocol tcp \
      --port 22 \
      --cidr "$EXISTING_RULE"
    
    echo "Authorizing new rule: $CURRENT_IP/32"
    aws ec2 authorize-security-group-ingress \
      --group-id "$SECURITY_GROUP_ID" \
      --profile "$PROFILE" \
      --protocol tcp \
      --port 22 \
      --cidr "$CURRENT_IP/32"
    
    echo "✓ SSH access updated to $CURRENT_IP"
  else
    echo "✓ SSH access already set to $CURRENT_IP - no changes needed"
  fi
else
  echo "No existing SSH rule found, adding new rule..."
  aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --profile "$PROFILE" \
    --protocol tcp \
    --port 22 \
    --cidr "$CURRENT_IP/32"
  
  echo "✓ SSH access granted to $CURRENT_IP"
fi

echo ""
echo "You can now SSH to the instance:"
echo "  ssh -i ~/.ssh/veris-staging.pem ec2-user@18.232.192.212"
