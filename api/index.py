import os
import sys

# Ensure backend directory is in python path so server.py and other modules can be found
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.append(backend_path)

from server import app

class VercelPathMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            
            # Vercel proxy headers containing the original path
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
            
            print(f"[VercelPathMiddleware] Original path: {scope.get('path')} | matched_path: {matched_path} | forwarded_uri: {forwarded_uri}")
            
            # Override path so FastAPI router matches the original request path
            if matched_path:
                scope["path"] = matched_path
            elif forwarded_uri:
                scope["path"] = forwarded_uri.split("?")[0]
                
        return await self.app(scope, receive, send)

# Wrap FastAPI app with Vercel path correction middleware
app = VercelPathMiddleware(app)
