import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple
from app.config import settings


class SSRFValidationError(Exception):
    pass


# Prohibited private and special IP ranges
PROHIBITED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private network
    ipaddress.ip_network("172.16.0.0/12"),     # Private network
    ipaddress.ip_network("192.168.0.0/16"),    # Private network
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local & cloud metadata (e.g. AWS 169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),         # Broadcast / current network
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
]


def validate_jenkins_url(url: str) -> Tuple[bool, str]:
    """
    Validates a user-submitted Jenkins URL against SSRF threats.
    Returns (True, resolved_ip) or raises SSRFValidationError.
    """
    if not url:
        raise SSRFValidationError("URL cannot be empty.")

    parsed = urlparse(url)

    # 1. Scheme validation
    if parsed.scheme.lower() not in ["http", "https"]:
        raise SSRFValidationError(f"Invalid URL scheme '{parsed.scheme}'. Only http and https are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFValidationError("URL must include a valid hostname.")

    # 2. Prevent localhost / loopback names explicitly
    if hostname.lower() in ["localhost", "127.0.0.1", "::1", "metadata.google.internal"]:
        if not settings.ALLOW_PRIVATE_IPS_FOR_JENKINS:
            raise SSRFValidationError(f"Access to localhost/internal address '{hostname}' is blocked.")

    # 3. DNS resolution & IP address validation
    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
        resolved_ips = [ai[4][0] for ai in addr_info]
    except socket.gaierror as e:
        raise SSRFValidationError(f"Unable to resolve hostname '{hostname}': {str(e)}")

    if not resolved_ips:
        raise SSRFValidationError(f"No IP addresses found for hostname '{hostname}'.")

    # 4. Check each resolved IP against prohibited blocks
    for ip_str in resolved_ips:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFValidationError(f"Invalid resolved IP '{ip_str}'.")

        if not settings.ALLOW_PRIVATE_IPS_FOR_JENKINS:
            for net in PROHIBITED_NETWORKS:
                if ip_obj in net:
                    raise SSRFValidationError(
                        f"Destination IP '{ip_str}' is within a prohibited private or link-local address range."
                    )

    return True, resolved_ips[0]
