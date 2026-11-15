import sqlite3
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.config import HISTORY_DIR


class HistoryService:
    """
    Manages persistent SQLite storage of real processing runs,
    enabling history tracking, auditing, and output retrieval.
    """

    def __init__(self):
        self.db_path = HISTORY_DIR / "history.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS processing_history (
                    id TEXT PRIMARY KEY,
                    timestamp REAL,
                    file_name TEXT,
                    module TEXT,
                    model_name TEXT,
                    input_resolution TEXT,
                    output_resolution TEXT,
                    device TEXT,
                    duration_sec REAL,
                    status TEXT,
                    output_url TEXT,
                    download_url TEXT,
                    metrics_json TEXT
                )
                """
            )
            conn.commit()

    def add_record(
        self,
        record_id: str,
        file_name: str,
        module: str,
        model_name: str,
        input_resolution: str,
        output_resolution: str,
        device: str,
        duration_sec: float,
        status: str,
        output_url: str,
        download_url: str,
        metrics: Optional[Dict[str, Any]] = None,
    ):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO processing_history (
                    id, timestamp, file_name, module, model_name,
                    input_resolution, output_resolution, device,
                    duration_sec, status, output_url, download_url, metrics_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    time.time(),
                    file_name,
                    module,
                    model_name,
                    input_resolution,
                    output_resolution,
                    device,
                    duration_sec,
                    status,
                    output_url,
                    download_url,
                    json.dumps(metrics or {}),
                ),
            )
            conn.commit()

    def list_records(self, limit: int = 50) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM processing_history ORDER BY timestamp DESC LIMIT ?", (limit,)
            )
            rows = cursor.fetchall()
            records = []
            for r in rows:
                rec = dict(r)
                rec["metrics"] = json.loads(rec.get("metrics_json") or "{}")
                records.append(rec)
            return records

    def delete_record(self, record_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM processing_history WHERE id = ?", (record_id,))
            conn.commit()
            return cursor.rowcount > 0

    def clear_all(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM processing_history")
            conn.commit()

    def export_csv(self) -> str:
        """
        Exports the entire processing history as RFC 4180 compliant CSV format.
        """
        import io
        import csv
        from datetime import datetime

        records = self.list_records(limit=1000)
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "ID",
            "Date_Time_UTC",
            "File_Name",
            "Module",
            "Model_Name",
            "Input_Resolution",
            "Output_Resolution",
            "Device",
            "Duration_Seconds",
            "Status",
            "Output_URL",
            "Download_URL"
        ])

        for r in records:
            dt_str = datetime.utcfromtimestamp(r["timestamp"]).strftime("%Y-%m-%d %H:%M:%S") if r.get("timestamp") else ""
            writer.writerow([
                r.get("id", ""),
                dt_str,
                r.get("file_name", ""),
                r.get("module", ""),
                r.get("model_name", ""),
                r.get("input_resolution", ""),
                r.get("output_resolution", ""),
                r.get("device", ""),
                r.get("duration_sec", 0.0),
                r.get("status", ""),
                r.get("output_url", ""),
                r.get("download_url", "")
            ])

        return output.getvalue()


history_service = HistoryService()

