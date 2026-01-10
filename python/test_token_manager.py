"""
Unit tests for token_manager.py
"""

import pytest
import json
from token_manager import TokenManager, FileChange, CompressedDiff


def test_token_counting():
    """Test exact token counting"""
    tm = TokenManager(model="gpt-4o")
    
    # Simple text
    text = "Hello, world!"
    tokens = tm.count_tokens(text)
    assert tokens > 0
    assert tokens < 10  # Should be 3-4 tokens
    
    # Code
    code = "def calculate(x):\n    return x * 2"
    tokens = tm.count_tokens(code)
    assert tokens > 5


def test_remove_deletion_hunks():
    """Test deletion hunk removal"""
    tm = TokenManager()
    
    # File with additions (keep)
    file_with_additions = FileChange(
        filename="test.py",
        status="modified",
        patch="""@@ -1,3 +1,4 @@
 def calculate(x):
-    return x * 2
+    return x * 3
+    # Comment
""",
        additions=2,
        deletions=1
    )
    
    result = tm._remove_deletion_hunks(file_with_additions)
    assert result is not None
    assert "return x * 3" in result.patch
    
    # File with only deletions (remove)
    file_only_deletions = FileChange(
        filename="test.py",
        status="modified",
        patch="""@@ -1,3 +1,1 @@
-def calculate(x):
-    return x * 2
""",
        additions=0,
        deletions=2
    )
    
    result = tm._remove_deletion_hunks(file_only_deletions)
    assert result is None
    
    # Deleted file (remove)
    deleted_file = FileChange(
        filename="test.py",
        status="removed",
        patch="...",
        additions=0,
        deletions=10
    )
    
    result = tm._remove_deletion_hunks(deleted_file)
    assert result is None


def test_greedy_packing():
    """Test greedy packing algorithm"""
    tm = TokenManager(max_tokens=1000)
    
    files = [
        FileChange("a.py", "modified", "patch1", 10, 0, 300),
        FileChange("b.py", "modified", "patch2", 20, 0, 400),
        FileChange("c.py", "modified", "patch3", 5, 0, 200),
        FileChange("d.py", "modified", "patch4", 15, 0, 500),
    ]
    
    fitted, excluded = tm._greedy_pack(files, max_tokens=800)
    
    assert len(fitted) == 2  # Should fit a.py (300) + b.py (400) = 700
    assert len(excluded) == 2  # c.py and d.py excluded
    assert fitted[0].filename == "a.py"
    assert fitted[1].filename == "b.py"


def test_split_into_chunks():
    """Test chunking for large PRs"""
    tm = TokenManager()
    
    files = [
        FileChange(f"file{i}.py", "modified", f"patch{i}", 10, 0, 300)
        for i in range(10)
    ]
    
    chunks = tm._split_into_chunks(files, max_tokens_per_chunk=800)
    
    # Should create multiple chunks (300 * 3 = 900 > 800)
    assert len(chunks) >= 3
    
    # Each chunk should not exceed max tokens
    for chunk in chunks:
        total = sum(f.tokens for f in chunk)
        assert total <= 900  # Allow slight overflow for last file


def test_compress_diff_small_pr():
    """Test compression for small PR (fits in one chunk)"""
    tm = TokenManager(model="gpt-4o", max_tokens=8000)
    
    files = [
        {
            "filename": "test.py",
            "status": "modified",
            "patch": "@@ -1,2 +1,3 @@\n def test():\n-    pass\n+    return True\n+    # Added",
            "additions": 2,
            "deletions": 1
        }
    ]
    
    result = tm.compress_diff(files, prompt_tokens=100)
    
    assert len(result.chunks) == 1
    assert result.files_included == 1
    assert result.files_excluded == 0
    assert result.total_tokens > 100  # Should include prompt tokens
    assert result.compression_stats["chunks"] == 1


def test_compress_diff_large_pr():
    """Test compression for large PR (multiple chunks)"""
    tm = TokenManager(model="gpt-4o", max_tokens=2000)
    
    # Create many files
    files = [
        {
            "filename": f"file{i}.py",
            "status": "modified",
            "patch": f"@@ -1,10 +1,20 @@\n" + "\n".join([f"+line {j}" for j in range(50)]),
            "additions": 50,
            "deletions": 0
        }
        for i in range(20)
    ]
    
    result = tm.compress_diff(files, prompt_tokens=200)
    
    # Should create multiple chunks or exclude files
    assert len(result.chunks) >= 1
    assert result.files_included < len(files)  # Some files excluded
    assert result.files_excluded > 0
    assert len(result.excluded_files) > 0


def test_json_serialization():
    """Test that result can be serialized to JSON"""
    tm = TokenManager()
    
    files = [
        {
            "filename": "test.py",
            "status": "modified",
            "patch": "@@ -1,1 +1,2 @@\n+new line",
            "additions": 1,
            "deletions": 0
        }
    ]
    
    result = tm.compress_diff(files)
    
    # Should be serializable
    json_str = json.dumps({
        "chunks": result.chunks,
        "total_tokens": result.total_tokens,
        "files_included": result.files_included,
        "files_excluded": result.files_excluded,
        "excluded_files": result.excluded_files,
        "compression_stats": result.compression_stats
    })
    
    assert json_str is not None
    
    # Should be deserializable
    parsed = json.loads(json_str)
    assert parsed["files_included"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
