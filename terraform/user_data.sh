#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker git make --allowerasing

systemctl enable docker
systemctl start docker

fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

usermod -aG docker ec2-user

mkdir -p /usr/local/lib/docker/cli-plugins /usr/libexec/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/libexec/docker/cli-plugins/docker-compose

mkdir -p /home/ec2-user/veris
chown ec2-user:ec2-user /home/ec2-user/veris

cat >/etc/motd <<'EOF'
Veris application server
Repo: ${repo_url}
Directory: /home/ec2-user/veris
EOF
