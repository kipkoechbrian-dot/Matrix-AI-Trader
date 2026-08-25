"""SPA-aware static file serving.

Serves the built React app and falls back to index.html for unknown
paths so client-side routes (/dashboard, /login) work on hard refresh,
deep links and shared URLs — exactly like any production website.
"""

from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.staticfiles import StaticFiles


class SpaStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise
