import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet
from app.config import settings

# Initialize Argon2id password hasher with secure enterprise parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def get_fernet_cipher() -> Fernet:
    """Returns a Fernet cipher instance initialized with the configured encryption key."""
    key = settings.SECRET_KEY_ENCRYPTION.encode()
    return Fernet(key)


def encrypt_secret(secret_text: str) -> str:
    """Encrypts a sensitive plaintext secret (e.g. Jenkins token) into an authenticated ciphertext."""
    if not secret_text:
        return ""
    cipher = get_fernet_cipher()
    return cipher.encrypt(secret_text.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    """Decrypts an authenticated ciphertext back into plaintext."""
    if not ciphertext:
        return ""
    cipher = get_fernet_cipher()
    return cipher.decrypt(ciphertext.encode()).decode()


def generate_session_token() -> str:
    """Generates a cryptographically strong random session identifier."""
    return secrets.token_urlsafe(48)
