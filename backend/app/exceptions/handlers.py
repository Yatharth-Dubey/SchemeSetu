from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.custom import SchemeSetuException
from app.core.logger import logger

async def scheme_setu_exception_handler(
    request: Request,
    exc: SchemeSetuException,
):
    logger.exception(exc.message)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code" : exc.error_code,
                "message": exc.message,
            },
        },
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unexpected server error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong",
            },
        },
    )