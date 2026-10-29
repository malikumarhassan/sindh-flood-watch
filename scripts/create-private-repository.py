"""Create/reuse the deployment repo using Git's configured credential helper.

Credentials stay in process memory and are never printed or written to files.
"""

import json
import os
import subprocess
import urllib.error
import urllib.request

owner, name = "malikumarhassan", "sindh-flood-watch"
environment = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"}
result = subprocess.run(
    ["git", "-c", "credential.interactive=false", "credential", "fill"],
    input=f"protocol=https\nhost=github.com\nusername={owner}\n\n",
    text=True,
    capture_output=True,
    env=environment,
)
credentials = dict(line.split("=", 1) for line in result.stdout.splitlines() if "=" in line)
token = credentials.get("password")
if result.returncode or not token:
    raise SystemExit("GitHub authentication is unavailable; sign in through Git Credential Manager")


def request(path, data=None):
    req = urllib.request.Request(
        "https://api.github.com" + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
            "User-Agent": "sindh-flood-watch-deployment",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


try:
    profile = request("/user")
    if profile.get("login", "").lower() != owner:
        raise SystemExit("Authenticated GitHub account does not match the intended repository owner")
    try:
        repository = request(f"/repos/{owner}/{name}")
        created = False
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise
        repository = request(
            "/user/repos",
            {
                "name": name,
                "private": True,
                "description": "Sindh Flood Watch: independent district flood information, reviewed bulletins and a local-first demo.",
                "auto_init": False,
            },
        )
        created = True
    if not repository.get("private"):
        raise SystemExit("Existing repository is public; source was not uploaded")
    print(
        json.dumps(
            {
                "created": created,
                "private": True,
                "url": repository["html_url"],
                "default_branch": repository["default_branch"],
            }
        )
    )
except urllib.error.HTTPError as error:
    raise SystemExit(f"GitHub API returned HTTP {error.code}; no credentials were logged") from None
