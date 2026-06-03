#!/usr/bin/env python3
"""Zet server-repo gelijk met origin/main (lost git pull-conflicten op)."""
import os
import sys

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
REMOTE_DIR = os.environ.get("DEPLOY_DIR", "/var/www/med-icu")
BRANCH = os.environ.get("DEPLOY_BRANCH", "main")


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 900) -> None:
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
    if code != 0:
        if err.strip():
            print(err.rstrip(), file=sys.stderr)
        raise RuntimeError(f"Command failed ({code}): {cmd}")


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, f"test -d {REMOTE_DIR}/.git || (echo 'Geen git repo in {REMOTE_DIR}' && exit 1)")
    run(ssh, f"cd {REMOTE_DIR} && git status -sb")
    run(ssh, f"cd {REMOTE_DIR} && git fetch origin {BRANCH}")
    run(ssh, f"cd {REMOTE_DIR} && git reset --hard origin/{BRANCH}")
    run(ssh, f"cd {REMOTE_DIR} && git clean -fd")
    run(ssh, f"cd {REMOTE_DIR} && git log -1 --oneline")

    env_content = """NEXT_PUBLIC_APP_NAME=IV Medicatie Verdeler
NODE_ENV=production
"""
    run(
        ssh,
        f"cat > {REMOTE_DIR}/.env.local << 'ENVEOF'\n{env_content}ENVEOF",
    )
    run(ssh, f"cp {REMOTE_DIR}/.env.local {REMOTE_DIR}/.env")
    run(ssh, f"cd {REMOTE_DIR} && npm ci", timeout=900)
    run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=900)
    try:
        run(ssh, f"cd {REMOTE_DIR} && pm2 restart med-icu")
    except RuntimeError:
        run(ssh, f"cd {REMOTE_DIR} && pm2 startOrReload ecosystem.config.cjs && pm2 save")

    _, stdout, _ = ssh.exec_command(
        "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3013/",
        timeout=30,
    )
    print(f"\nHTTP check 3013: {stdout.read().decode().strip()}")
    ssh.close()
    print("\n=== Server gesynchroniseerd met GitHub ===")


if __name__ == "__main__":
    main()
