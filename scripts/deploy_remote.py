#!/usr/bin/env python3
"""Deploy IV Medicatie Verdeler naar Next-server via SSH (git pull of eerste upload)."""
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
BRANCH = os.environ.get("DEPLOY_BRANCH", "main")
REPO = os.environ.get(
    "DEPLOY_REPO", "https://github.com/boerdb/med-icu.git"
)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".cursor",
    "__pycache__",
}
SKIP_FILES = {".env", ".env.local"}

ENV_CONTENT = """NEXT_PUBLIC_APP_NAME=IV Medicatie Verdeler
NODE_ENV=production
"""


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


def ensure_env(ssh: paramiko.SSHClient) -> None:
    run(
        ssh,
        f"cat > {REMOTE_DIR}/.env.local << 'ENVEOF'\n{ENV_CONTENT}ENVEOF",
    )
    run(ssh, f"cp {REMOTE_DIR}/.env.local {REMOTE_DIR}/.env")


def deploy_via_git(ssh: paramiko.SSHClient) -> None:
    """Server bijwerken met git pull — geen lokale wijzigingen meer na tarball."""
    run(ssh, f"mkdir -p {REMOTE_DIR}")
    code, _, _ = run(ssh, f"test -d {REMOTE_DIR}/.git", check=False)
    if code != 0:
        run(ssh, f"git clone --branch {BRANCH} {REPO} {REMOTE_DIR}")
    run(ssh, f"cd {REMOTE_DIR} && git fetch origin {BRANCH}")
    run(ssh, f"cd {REMOTE_DIR} && git checkout {BRANCH}")
    run(ssh, f"cd {REMOTE_DIR} && git reset --hard origin/{BRANCH}")
    run(ssh, f"cd {REMOTE_DIR} && git clean -fd")
    _, out, _ = run(ssh, f"cd {REMOTE_DIR} && git log -1 --oneline")
    print(f"Server commit: {out.strip()}")


def deploy_via_tarball(ssh: paramiko.SSHClient) -> None:
    """Eerste installatie zonder git-repo op de server."""
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

    # Initialiseer git zodat volgende deploys via pull kunnen
    run(ssh, f"cd {REMOTE_DIR} && git init -q", check=False)
    run(ssh, f"cd {REMOTE_DIR} && git remote add origin {REPO}", check=False)
    run(ssh, f"cd {REMOTE_DIR} && git fetch origin {BRANCH}", check=False)
    run(ssh, f"cd {REMOTE_DIR} && git checkout -B {BRANCH} origin/{BRANCH}", check=False)


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, "mkdir -p /var/www")
    code, _, _ = run(ssh, f"test -d {REMOTE_DIR}/.git", check=False)
    if code == 0:
        print("==> Deploy via git (origin/main)")
        deploy_via_git(ssh)
    else:
        print("==> Eerste deploy via tarball + git init")
        deploy_via_tarball(ssh)
        deploy_via_git(ssh)

    ensure_env(ssh)

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
    print("Cloudflare Tunnel: icu-med.clvs.nl -> http://127.0.0.1:3013")
    print("\nOp de server: git pull werkt weer na deploy_via_git (reset --hard).")
    ssh.close()


if __name__ == "__main__":
    main()
