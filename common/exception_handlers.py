"""
Global exception handler for DRF.
Ensures all errors return a consistent JSON structure:
{
    "error": {
        "code": "error_code",
        "message": "Human readable message",
        "details": { ... }
    }
}
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Call REST framework's default exception handler first,
    to get the standard error response.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize DRF exceptions (ValidationError, PermissionDenied, etc.)
        status_code = response.status_code
        data = response.data
        
        # Determine a rough 'code' string based on status
        code = "error"
        if status_code == status.HTTP_400_BAD_REQUEST:
            code = "validation_error"
        elif status_code == status.HTTP_401_UNAUTHORIZED:
            code = "unauthorized"
        elif status_code == status.HTTP_403_FORBIDDEN:
            code = "permission_denied"
        elif status_code == status.HTTP_404_NOT_FOUND:
            code = "not_found"
            
        message = "An error occurred."
        details = data

        # Extract message if simple dict with 'detail'
        if isinstance(data, dict) and "detail" in data:
            message = str(data.pop("detail"))
            details = data if data else None
        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], str):
            message = str(data[0])
        elif isinstance(data, dict):
            # For ValidationErrors that are dicts of field errors
            message = "Validation failed."
            details = data
            
        # Reformat response
        response.data = {
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        }
    else:
        # Unhandled exceptions (500s)
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        response = Response(
            {
                "error": {
                    "code": "server_error",
                    "message": "An unexpected server error occurred.",
                    "details": str(exc) if str(exc) else None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
