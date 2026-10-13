from typing import Optional, Dict, Any, List
import httpx
from app.core.ssrf_guard import validate_jenkins_url


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

    def _get_auth(self):
        if self.username and self.token_or_password:
            return (self.username, self.token_or_password)
        return None

    async def test_connection(self) -> Dict[str, Any]:
        """Tests connectivity and authentication to the Jenkins controller."""
        validate_jenkins_url(self.base_url)

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            verify=self.verify_ssl,
            follow_redirects=False,
        ) as client:
            try:
                resp = await client.get(f"{self.base_url}/api/json", auth=self._get_auth())
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
                            "Authentication failed: Check your username and API token."
                            if resp.status_code == 401
                            else "Permission denied: Account lacks Overall/Read permissions."
                        ),
                    }
                else:
                    return {
                        "online": False,
                        "status": "DEGRADED",
                        "version": jenkins_version,
                        "message": f"Unexpected HTTP status {resp.status_code}",
                    }

            except httpx.ConnectTimeout:
                return {
                    "online": False,
                    "status": "OFFLINE",
                    "message": f"Connection timed out after {self.timeout_seconds}s",
                }
            except Exception as e:
                return {
                    "online": False,
                    "status": "OFFLINE",
                    "message": f"Connection check failed: {str(e)}",
                }

    async def fetch_jobs_and_builds(self) -> List[Dict[str, Any]]:
        """Fetch all jobs, folders, and recent build history from controller."""
        validate_jenkins_url(self.base_url)
        tree_query = "jobs[name,url,color,_class,buildable,lastBuild[number,result,timestamp,duration,url],lastSuccessfulBuild[number],lastFailedBuild[number]]"
        async with httpx.AsyncClient(timeout=self.timeout_seconds, verify=self.verify_ssl) as client:
            resp = await client.get(f"{self.base_url}/api/json?tree={tree_query}", auth=self._get_auth())
            if resp.status_code != 200:
                return []
            data = resp.json()
            return data.get("jobs", [])

    async def fetch_nodes(self) -> List[Dict[str, Any]]:
        """Fetch all computers/agents and executor loads."""
        validate_jenkins_url(self.base_url)
        tree_query = "computer[displayName,offline,offlineCauseReason,numExecutors,idle,assignedLabels[name],executors[idle]]"
        async with httpx.AsyncClient(timeout=self.timeout_seconds, verify=self.verify_ssl) as client:
            resp = await client.get(f"{self.base_url}/computer/api/json?tree={tree_query}", auth=self._get_auth())
            if resp.status_code != 200:
                return []
            data = resp.json()
            return data.get("computer", [])

    async def fetch_queue(self) -> List[Dict[str, Any]]:
        """Fetch current build queue."""
        validate_jenkins_url(self.base_url)
        async with httpx.AsyncClient(timeout=self.timeout_seconds, verify=self.verify_ssl) as client:
            resp = await client.get(f"{self.base_url}/queue/api/json", auth=self._get_auth())
            if resp.status_code != 200:
                return []
            data = resp.json()
            return data.get("items", [])

    async def fetch_console_log(self, job_name: str, build_number: int) -> str:
        """Fetch raw console log output for a given build."""
        validate_jenkins_url(self.base_url)
        async with httpx.AsyncClient(timeout=30, verify=self.verify_ssl) as client:
            resp = await client.get(
                f"{self.base_url}/job/{job_name}/{build_number}/consoleText",
                auth=self._get_auth(),
            )
            if resp.status_code == 200:
                return resp.text
            return f"Log unavailable (HTTP {resp.status_code})"

    async def trigger_build(self, job_name: str) -> bool:
        """Trigger a build execution on the controller, handling CSRF Crumb issuer if active."""
        validate_jenkins_url(self.base_url)
        headers = {}
        async with httpx.AsyncClient(timeout=self.timeout_seconds, verify=self.verify_ssl) as client:
            # Check for Crumb Issuer
            crumb_resp = await client.get(f"{self.base_url}/crumbIssuer/api/json", auth=self._get_auth())
            if crumb_resp.status_code == 200:
                crumb_data = crumb_resp.json()
                headers[crumb_data["crumbRequestField"]] = crumb_data["crumb"]

            post_resp = await client.post(
                f"{self.base_url}/job/{job_name}/build",
                auth=self._get_auth(),
                headers=headers,
            )
            return post_resp.status_code in (200, 201)
