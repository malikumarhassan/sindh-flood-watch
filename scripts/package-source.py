"""Create a source-only deployment archive without local data or secrets."""

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os

root = Path(__file__).resolve().parents[1]
output = root / "artifacts" / "sindh-flood-watch-source.zip"
roots = ["apps", "packages", "services", "tests", "docs", "scripts", "deploy"]
root_files = [
    "package.json",
    "package-lock.json",
    "requirements.txt",
    "requirements.lock.txt",
    "Dockerfile",
    "compose.yaml",
    "compose.production.yaml",
    "render.yaml",
    "alembic.ini",
    "pyproject.toml",
    "eslint.config.mjs",
    ".env.example",
    ".gitignore",
    ".dockerignore",
    "README.md",
]
excluded = {"node_modules", ".next", ".expo", "dist", "__pycache__", ".pytest_cache", ".ruff_cache", ".git"}
files = [root / p for p in root_files]
for folder in roots:
    for directory, directories, names in os.walk(root / folder):
        directories[:] = [d for d in directories if d not in excluded]
        for name in names:
            if name.startswith(".env") and not name.endswith(".example"):
                continue
            if name.endswith((".db", ".log", ".tsbuildinfo", ".jpg", ".zip")):
                continue
            files.append(Path(directory) / name)
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for file in sorted(files):
        if file.is_file():
            archive.write(file, file.relative_to(root).as_posix())
with ZipFile(output) as archive:
    for name in archive.namelist():
        if Path(name).name.startswith(".env") and not name.endswith(".example"):
            raise RuntimeError("Unexpected environment credential file in package")
    count = len(archive.namelist())
print(f"Created source-only archive: {output} ({count} files, {output.stat().st_size} bytes)")
