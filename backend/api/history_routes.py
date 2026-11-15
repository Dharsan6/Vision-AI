from fastapi import APIRouter, HTTPException, Response
from backend.services.history_service import history_service

router = APIRouter(prefix="/history", tags=["Processing History"])


@router.get("/export")
def export_history_csv_endpoint():
    """
    Exports processing history records as a downloadable CSV file.
    """
    csv_content = history_service.export_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vision_ai_history.csv"},
    )


@router.get("")
def list_history_endpoint(limit: int = 50):
    """
    Lists historical media processing runs.
    """
    records = history_service.list_records(limit=limit)
    return {
        "count": len(records),
        "records": records,
    }


@router.delete("/{record_id}")
def delete_history_record_endpoint(record_id: str):
    """
    Deletes a specific history record.
    """
    deleted = history_service.delete_record(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True, "deleted_id": record_id}


@router.delete("")
def clear_history_endpoint():
    """
    Clears all processing history.
    """
    history_service.clear_all()
    return {"success": True, "message": "History cleared"}

