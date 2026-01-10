#!/usr/bin/env python3
"""
Token Manager for PR Reviewer

Handles token counting, diff compression, and chunking for large PRs.
Communicates with Bun via stdin/stdout JSON.
"""

import sys
import json
import tiktoken
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class FileChange:
    """Represents a single file change in a PR"""
    filename: str
    status: str
    patch: str
    additions: int
    deletions: int
    tokens: int = 0


@dataclass
class CompressedDiff:
    """Result of token management compression"""
    chunks: List[List[Dict[str, Any]]]
    total_tokens: int
    files_included: int
    files_excluded: int
    excluded_files: List[str]
    compression_stats: Dict[str, Any]


class TokenManager:
    """Manages token counting and diff compression"""
    
    def __init__(self, model: str = "gpt-4o", max_tokens: int = 8000):
        self.model = model
        self.max_tokens = max_tokens
        self.output_buffer = 1500  # Reserve tokens for model output
        
        # Initialize tiktoken encoder
        try:
            self.encoder = tiktoken.encoding_for_model(model)
        except KeyError:
            # Fallback to cl100k_base for unknown models
            self.encoder = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count exact tokens using tiktoken"""
        return len(self.encoder.encode(text, disallowed_special=()))
    
    def compress_diff(
        self, 
        files: List[Dict[str, Any]],
        prompt_tokens: int = 0
    ) -> CompressedDiff:
        """
        Compress diff to fit within token budget
        
        Steps:
        1. Count tokens per file
        2. Remove deletion-only hunks
        3. Sort by importance (language, size)
        4. Greedy packing to fit budget
        5. Split into chunks if needed
        """
        # Step 1: Parse files and count tokens
        file_changes = []
        for file_data in files:
            if not file_data.get("patch"):
                continue
                
            patch = file_data["patch"]
            tokens = self.count_tokens(patch)
            
            file_changes.append(FileChange(
                filename=file_data["filename"],
                status=file_data["status"],
                patch=patch,
                additions=file_data.get("additions", 0),
                deletions=file_data.get("deletions", 0),
                tokens=tokens
            ))
        
        total_input_tokens = sum(f.tokens for f in file_changes)
        
        # Step 2: Remove deletion hunks (reduces tokens by 20-30%)
        file_changes = [self._remove_deletion_hunks(f) for f in file_changes]
        file_changes = [f for f in file_changes if f is not None]  # Remove deleted files
        
        total_after_deletion_removal = sum(f.tokens for f in file_changes)
        
        # Step 3: Sort by priority (additions first, then by size)
        file_changes.sort(key=lambda f: (f.additions, f.tokens), reverse=True)
        
        # Step 4: Check if fits in single chunk
        available_tokens = self.max_tokens - self.output_buffer - prompt_tokens
        
        if total_after_deletion_removal <= available_tokens:
            # Fits in one chunk!
            return CompressedDiff(
                chunks=[[self._file_to_dict(f) for f in file_changes]],
                total_tokens=total_after_deletion_removal + prompt_tokens,
                files_included=len(file_changes),
                files_excluded=0,
                excluded_files=[],
                compression_stats={
                    "original_tokens": total_input_tokens,
                    "after_deletion_removal": total_after_deletion_removal,
                    "savings_percent": round((1 - total_after_deletion_removal / total_input_tokens) * 100, 1) if total_input_tokens > 0 else 0,
                    "chunks": 1
                }
            )
        
        # Step 5: Greedy packing (fit as many files as possible)
        fitted_files, excluded_files = self._greedy_pack(
            file_changes, 
            available_tokens
        )
        
        # Step 6: Split into chunks if still too large
        chunks = self._split_into_chunks(fitted_files, available_tokens)
        
        return CompressedDiff(
            chunks=[[self._file_to_dict(f) for f in chunk] for chunk in chunks],
            total_tokens=sum(f.tokens for chunk in chunks for f in chunk) + prompt_tokens,
            files_included=len(fitted_files),
            files_excluded=len(excluded_files),
            excluded_files=[f.filename for f in excluded_files],
            compression_stats={
                "original_tokens": total_input_tokens,
                "after_deletion_removal": total_after_deletion_removal,
                "after_packing": sum(f.tokens for f in fitted_files),
                "savings_percent": round((1 - sum(f.tokens for f in fitted_files) / total_input_tokens) * 100, 1) if total_input_tokens > 0 else 0,
                "chunks": len(chunks)
            }
        )
    
    def _remove_deletion_hunks(self, file: FileChange) -> Optional[FileChange]:
        """
        Remove hunks that only delete lines (no additions)
        
        Returns None if file is pure deletion
        """
        if file.status == "removed":
            return None  # Skip deleted files entirely
        
        if file.additions == 0:
            return None  # Pure deletion, skip
        
        # Parse patch and filter hunks
        lines = file.patch.split("\n")
        filtered_lines = []
        in_hunk = False
        hunk_additions = 0
        hunk_lines = []
        
        for line in lines:
            if line.startswith("@@"):
                # New hunk starting
                if in_hunk and hunk_additions > 0:
                    # Previous hunk had additions, keep it
                    filtered_lines.extend(hunk_lines)
                
                # Reset for new hunk
                in_hunk = True
                hunk_additions = 0
                hunk_lines = [line]
            elif in_hunk:
                hunk_lines.append(line)
                if line.startswith("+") and not line.startswith("+++"):
                    hunk_additions += 1
            else:
                # Header lines (---, +++, etc.)
                filtered_lines.append(line)
        
        # Handle last hunk
        if in_hunk and hunk_additions > 0:
            filtered_lines.extend(hunk_lines)
        
        if not filtered_lines or len(filtered_lines) < 3:
            return None  # No meaningful changes left
        
        # Rebuild patch
        new_patch = "\n".join(filtered_lines)
        new_tokens = self.count_tokens(new_patch)
        
        return FileChange(
            filename=file.filename,
            status=file.status,
            patch=new_patch,
            additions=file.additions,
            deletions=0,  # Removed deletions
            tokens=new_tokens
        )
    
    def _greedy_pack(
        self, 
        files: List[FileChange], 
        max_tokens: int
    ) -> Tuple[List[FileChange], List[FileChange]]:
        """
        Greedy packing: fit as many files as possible within token budget
        
        Returns: (fitted_files, excluded_files)
        """
        fitted = []
        excluded = []
        current_tokens = 0
        
        for file in files:
            if current_tokens + file.tokens <= max_tokens:
                fitted.append(file)
                current_tokens += file.tokens
            else:
                excluded.append(file)
        
        return fitted, excluded
    
    def _split_into_chunks(
        self, 
        files: List[FileChange], 
        max_tokens_per_chunk: int
    ) -> List[List[FileChange]]:
        """
        Split files into multiple chunks if needed
        
        Max 5 chunks (to avoid too many API calls)
        """
        MAX_CHUNKS = 5
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for file in files:
            if current_tokens + file.tokens > max_tokens_per_chunk and current_chunk:
                # Current chunk is full, start new chunk
                chunks.append(current_chunk)
                current_chunk = [file]
                current_tokens = file.tokens
                
                if len(chunks) >= MAX_CHUNKS - 1:
                    # Hit max chunks, stop
                    break
            else:
                # Add to current chunk
                current_chunk.append(file)
                current_tokens += file.tokens
        
        # Add final chunk
        if current_chunk and len(chunks) < MAX_CHUNKS:
            chunks.append(current_chunk)
        
        return chunks if chunks else [[]]  # Return at least one empty chunk
    
    def _file_to_dict(self, file: FileChange) -> Dict[str, Any]:
        """Convert FileChange to dict for JSON serialization"""
        return {
            "filename": file.filename,
            "status": file.status,
            "patch": file.patch,
            "additions": file.additions,
            "deletions": file.deletions,
            "tokens": file.tokens
        }


def main():
    """Main entry point - reads from stdin, writes to stdout"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract parameters
        files = input_data.get("files", [])
        model = input_data.get("model", "gpt-4o")
        max_tokens = input_data.get("max_tokens", 8000)
        prompt_tokens = input_data.get("prompt_tokens", 0)
        
        # Initialize token manager
        token_manager = TokenManager(model=model, max_tokens=max_tokens)
        
        # Compress diff
        result = token_manager.compress_diff(files, prompt_tokens)
        
        # Write result to stdout
        output = {
            "chunks": result.chunks,
            "total_tokens": result.total_tokens,
            "files_included": result.files_included,
            "files_excluded": result.files_excluded,
            "excluded_files": result.excluded_files,
            "compression_stats": result.compression_stats
        }
        
        print(json.dumps(output))
        sys.exit(0)
        
    except Exception as e:
        # Write error to stderr
        error = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
