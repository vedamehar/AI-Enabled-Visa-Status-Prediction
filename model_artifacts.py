"""
Re-save model artifacts with the currently installed dependency versions.
This helps avoid pickle incompatibilities across deployment environments.
"""

from pathlib import Path
import os
import tempfile
import joblib
import numpy as np


def resave_artifact(path: Path) -> bool:
    """Load and re-save a single artifact atomically."""
    try:
        obj = joblib.load(path)
        fd, temp_path = tempfile.mkstemp(prefix=path.stem + "_", suffix=path.suffix, dir=str(path.parent))
        os.close(fd)
        temp_file = Path(temp_path)
        try:
            joblib.dump(obj, temp_file, compress=3)
            os.replace(temp_file, path)
        finally:
            if temp_file.exists():
                temp_file.unlink(missing_ok=True)
        print(f"RESAVED  {path}")
        return True
    except Exception as exc:
        print(f"FAILED   {path} -> {type(exc).__name__}: {exc}")
        return False


def main() -> int:
    models_dir = Path(__file__).resolve().parent / "models"
    artifacts = sorted(list(models_dir.glob("*.pkl")) + list(models_dir.glob("*.joblib")))

    print("Environment versions")
    print(f"numpy={np.__version__}")
    print(f"joblib={joblib.__version__}")
    print(f"models_dir={models_dir}")
    print(f"artifact_count={len(artifacts)}")

    if not artifacts:
        print("No artifacts found to re-save.")
        return 1

    success_count = 0
    for artifact in artifacts:
        if resave_artifact(artifact):
            success_count += 1

    print(f"\nCompleted: {success_count}/{len(artifacts)} artifacts re-saved.")
    return 0 if success_count == len(artifacts) else 2


if __name__ == "__main__":
    raise SystemExit(main())
