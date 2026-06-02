#!/usr/bin/env python3
"""Deploy IC Medicatie Verdeler naar Next-server (192.168.1.32) via SSH/SFTP."""
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
REMOTE_DIR = os.environ.get("DEPLOY_DIR", "/var/www/med-icu")
PROJECT_ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".cursor",
    "__pycache__",
}
SKIP_FILES = {".env", ".env.local"}


def run(
    ssh: paramiko.SSHClient,
    cmd: str,
    check: bool = True,
    timeout: int = 900,
) -> tuple[int, str, str]:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        safe = out.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
            sys.stdout.encoding or "utf-8",
            errors="replace",
        )
        print(safe.rstrip())
    if err.strip() and code != 0:
        print(err.rstrip(), file=sys.stderr)
    if check and code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd}\n{err}")
    return code, out, err


def main() -> None:
    env_content = """NEXT_PUBLIC_APP_NAME=IC Medicatie Verdeler
NODE_ENV=production
"""

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, "mkdir -p /var/www")
    run(ssh, f"mkdir -p {REMOTE_DIR}")

    tar_path = tempfile.mktemp(suffix=".tar.gz")
    try:
        with tarfile.open(tar_path, "w:gz") as tar:
            for path in PROJECT_ROOT.rglob("*"):
                rel = path.relative_to(PROJECT_ROOT)
                if rel.parts and rel.parts[0] in SKIP_DIRS:
                    continue
                if any(p in SKIP_DIRS for p in rel.parts):
                    continue
                if path.name in SKIP_FILES:
                    continue
                if path.is_file():
                    tar.add(path, arcname=str(rel).replace("\\", "/"))

        sftp = ssh.open_sftp()
        remote_tar = "/tmp/med-icu-deploy.tar.gz"
        print(f"Uploading {os.path.getsize(tar_path) // 1024} KB...")
        sftp.put(tar_path, remote_tar)
        run(ssh, f"tar -xzf {remote_tar} -C {REMOTE_DIR}")
        run(ssh, f"rm -f {remote_tar}")
        sftp.close()
    finally:
        if os.path.exists(tar_path):
            os.unlink(tar_path)

    run(
        ssh,
        f"cat > {REMOTE_DIR}/.env.local << 'ENVEOF'\n{env_content}ENVEOF",
    )
    run(ssh, f"cp {REMOTE_DIR}/.env.local {REMOTE_DIR}/.env")

    code, _, _ = run(ssh, "node -v", check=False)
    if code != 0:
        print("Installing Node.js 22...")
        run(ssh, "apt-get update -qq", timeout=600)
        run(ssh, "apt-get install -y -qq ca-certificates curl gnupg", timeout=600)
        run(ssh, "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -", timeout=600)
        run(ssh, "apt-get install -y -qq nodejs", timeout=600)

    run(ssh, "node -v && npm -v")
    run(ssh, f"chmod +x {REMOTE_DIR}/scripts/deploy.sh", check=False)
    run(ssh, f"cd {REMOTE_DIR} && npm ci", timeout=900)
    run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=900)

    run(ssh, "npm install -g pm2", check=False)
    run(ssh, f"cd {REMOTE_DIR} && pm2 startOrReload ecosystem.config.cjs && pm2 save")
    run(ssh, "pm2 startup systemd -u root --hp /root 2>/dev/null | grep -v PM2 | bash", check=False)

    _, out, _ = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3013/", check=False)
    print(f"\nHTTP check 3013: {out.strip()}")
    run(ssh, "pm2 list", check=False)
    print("\n=== Deploy klaar ===")
    print("App: http://192.168.1.32:3013")
    print("Cloudflare Tunnel: service http://127.0.0.1:3013 (hostname nog configureren)")
    ssh.close()


if __name__ == "__main__":
    main()
