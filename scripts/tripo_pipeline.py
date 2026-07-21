#!/usr/bin/env python3
"""Small, credential-safe Tripo API runner for the Birdee 3D pipeline.

The API key is read only from TRIPO_API_KEY. It is never written to disk or
included in the saved request/response manifests.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Any, Iterable


API_BASE = "https://api.tripo3d.ai/v2/openapi"
FINAL_STATUSES = {"success", "failed", "banned", "cancelled", "expired"}


class TripoError(RuntimeError):
    pass


def api_key() -> str:
    value = os.environ.get("TRIPO_API_KEY", "").strip()
    if not value:
        raise TripoError("TRIPO_API_KEY is not set")
    return value


def request_json(
    method: str,
    path: str,
    *,
    payload: dict[str, Any] | None = None,
    body: bytes | None = None,
    content_type: str | None = None,
    timeout: int = 120,
) -> dict[str, Any]:
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        content_type = "application/json"

    headers = {
        "Authorization": f"Bearer {api_key()}",
        "Accept": "application/json",
        "User-Agent": "little-birdee-tripo-pipeline/1.0",
    }
    if content_type:
        headers["Content-Type"] = content_type

    request = urllib.request.Request(
        f"{API_BASE}{path}", data=body, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise TripoError(f"Tripo HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise TripoError(f"Tripo request failed: {exc.reason}") from exc

    if result.get("code") not in (None, 0):
        raise TripoError(f"Tripo API error: {json.dumps(result, ensure_ascii=False)}")
    return result


def upload_image(path: Path) -> tuple[str, dict[str, Any]]:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    boundary = f"----LittleBirdee{uuid.uuid4().hex}"
    file_bytes = path.read_bytes()
    body = b"\r\n".join(
        [
            f"--{boundary}".encode(),
            (
                f'Content-Disposition: form-data; name="file"; filename="{path.name}"'
            ).encode(),
            f"Content-Type: {mime}".encode(),
            b"",
            file_bytes,
            f"--{boundary}--".encode(),
            b"",
        ]
    )
    result = request_json(
        "POST",
        "/upload/sts",
        body=body,
        content_type=f"multipart/form-data; boundary={boundary}",
    )
    token = result.get("data", {}).get("image_token")
    if not token:
        raise TripoError(f"Upload succeeded without image_token: {result}")
    return token, result


def submit_task(payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    result = request_json("POST", "/task", payload=payload)
    task_id = result.get("data", {}).get("task_id")
    if not task_id:
        raise TripoError(f"Task submission succeeded without task_id: {result}")
    return task_id, result


def get_task(task_id: str) -> dict[str, Any]:
    return request_json("GET", f"/task/{urllib.parse.quote(task_id)}")


def poll_task(task_id: str, timeout_seconds: int, interval_seconds: int) -> dict[str, Any]:
    deadline = time.monotonic() + timeout_seconds
    previous_status: str | None = None
    while True:
        result = get_task(task_id)
        status = str(result.get("data", {}).get("status", "unknown"))
        if status != previous_status:
            print(f"task {task_id}: {status}", file=sys.stderr, flush=True)
            previous_status = status
        if status in FINAL_STATUSES:
            return result
        if time.monotonic() >= deadline:
            raise TripoError(f"Timed out waiting for task {task_id}; last status: {status}")
        time.sleep(interval_seconds)


def iter_urls(value: Any, path: tuple[str, ...] = ()) -> Iterable[tuple[tuple[str, ...], str]]:
    if isinstance(value, dict):
        for key, item in value.items():
            yield from iter_urls(item, path + (str(key),))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from iter_urls(item, path + (str(index),))
    elif isinstance(value, str) and value.startswith(("https://", "http://")):
        yield path, value


def safe_name(parts: tuple[str, ...], url: str, index: int) -> str:
    parsed = urllib.parse.urlparse(url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix not in {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".glb",
        ".gltf",
        ".fbx",
        ".obj",
        ".zip",
        ".bin",
        ".json",
        ".mp4",
    }:
        suffix = ".bin"
    stem = "-".join(parts[-3:]) if parts else f"output-{index}"
    cleaned = "".join(char if char.isalnum() or char in "-_" else "-" for char in stem)
    return f"{index:02d}-{cleaned.strip('-') or 'output'}{suffix}"


def download_outputs(result: dict[str, Any], out_dir: Path) -> list[Path]:
    downloads_dir = out_dir / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []
    for index, (parts, url) in enumerate(iter_urls(result), start=1):
        destination = downloads_dir / safe_name(parts, url, index)
        request = urllib.request.Request(
            url, headers={"User-Agent": "little-birdee-tripo-pipeline/1.0"}
        )
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                destination.write_bytes(response.read())
        except urllib.error.URLError as exc:
            print(f"warning: download failed for {'/'.join(parts)}: {exc}", file=sys.stderr)
            continue
        saved.append(destination)
        print(f"downloaded {destination}", file=sys.stderr)
    return saved


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")


def run_task(payload: dict[str, Any], out_dir: Path, timeout_seconds: int) -> str:
    out_dir.mkdir(parents=True, exist_ok=True)
    write_json(out_dir / "request.json", payload)
    task_id, submit_result = submit_task(payload)
    write_json(out_dir / "submit.json", submit_result)
    final_result = poll_task(task_id, timeout_seconds, 3)
    write_json(out_dir / "result.json", final_result)
    download_outputs(final_result, out_dir)
    status = str(final_result.get("data", {}).get("status", "unknown"))
    if status != "success":
        raise TripoError(f"Task {task_id} finished with status {status}")
    print(task_id)
    return task_id


def command_multiview(args: argparse.Namespace) -> None:
    input_path = Path(args.input).resolve()
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    token, upload_result = upload_image(input_path)
    write_json(out_dir / "upload.json", upload_result)
    run_task(
        {
            "type": "generate_multiview_image",
            "file": {"type": input_path.suffix.lower().lstrip("."), "file_token": token},
        },
        out_dir,
        args.timeout,
    )


def command_payload(args: argparse.Namespace) -> None:
    payload_path = Path(args.payload).resolve()
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    run_task(payload, Path(args.out_dir).resolve(), args.timeout)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    multiview = subparsers.add_parser("multiview", help="Upload one image and generate four views")
    multiview.add_argument("--input", required=True)
    multiview.add_argument("--out-dir", required=True)
    multiview.add_argument("--timeout", type=int, default=900)
    multiview.set_defaults(func=command_multiview)

    payload = subparsers.add_parser("payload", help="Submit and download a JSON task payload")
    payload.add_argument("--payload", required=True)
    payload.add_argument("--out-dir", required=True)
    payload.add_argument("--timeout", type=int, default=1800)
    payload.set_defaults(func=command_payload)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        args.func(args)
        return 0
    except TripoError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
