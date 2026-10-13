from typing import Optional, Dict, Any, Tuple
import httpx
from app.core.ssrf_guard import validate_jenkins_url, SSRFValidationError


class JenkinsClientError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class JenkinsClient:
    def __init__(
        self,
        base_url: str,
        username: str,
        token_or_password: str,
        auth_type: str = "TOKEN",
        timeout_seconds: int = 15,
        verify_ssl: bool = True,
    ):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.token_or_password = token_or_password
        self.auth_type = auth_type
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    async def test_connection(self) -> Dict[str, Any]:
        """
        Tests connectivity and authentication to the Jenkins controller.
        Returns system information including Jenkins version and status.
        """
        # 1. Validate destination URL against SSRF policy
        validate_jenkins_url(self.base_url)

        # 2. Build HTTP client with basic/token auth
        auth = (self.username, self.token_or_password) if self.username and self.token_or_password else None

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            verify=self.verify_ssl,
            follow_redirects=False,  # Prevent automated redirect jumping to internal IPs
        ) as client:
            try:
                # First attempt to retrieve Jenkins root API metadata
                resp = await client.get(f"{self.base_url}/api/json", auth=auth)

                jenkins_version = resp.headers.get("X-Jenkins", "Unknown")

                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "online": True,
                        "status": "ONLINE",
                        "version": jenkins_version,
                        "description": data.get("description", ""),
                        "node_name": data.get("nodeName", "master"),
                        "num_executors": data.get("numExecutors", 0),
                        "message": f"Successfully connected to Jenkins v{jenkins_version}",
                    }
                elif resp.status_code in (401, 403):
                    return {
                        "online": False,
                        "status": "AUTH_FAILED" if resp.status_code == 401 else "PERMISSION_DENIED",
                        "version": jenkins_version,
                        "message": (
                            "Authentication failed: Check your service account username and API token."
                            if resp.status_code == 401
                            else "Permission denied: Account lacks Overall/Read permissions."
                        ),
                    }
                else:
                    return {
                        "online": False,
                        "status": "DEGRADED",
                        "version": jenkins_version,
                        "message": f"Unexpected HTTP status {resp.status_code}: {resp.text[:200]}",
                    }

            except httpx.ConnectTimeout:
                return {
                    "online": False,
                    "status": "OFFLINE",
                    "message": f"Connection timed out after {self.timeout_seconds} seconds.",
                }
            except httpx.ConnectError as e:
                return {
                    "online": False,
                    "status": "OFFLINE",
                    "message": f"Unable to reach controller host: {str(e)}",
                }
            except Exception as e:
                return {
                    "online": False,
                    "status": "OFFLINE",
                    "message": f"Connection check failed: {str(e)}",
                }
