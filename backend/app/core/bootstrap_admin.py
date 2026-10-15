import argparse
import secrets
import sys
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.api.v1.users import ensure_default_roles
from app.core.security import hash_password


def bootstrap_admin(email: str, password: str = None, display_name: str = "Platform Admin"):
    """Idempotently bootstrap the initial Platform Administrator account."""
    db = SessionLocal()
    try:
        ensure_default_roles(db)

        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            if password:
                print(f"[*] User with email '{email}' already exists. Updating password and activating account...")
                existing.password_hash = hash_password(password)
                existing.status = "ACTIVE"
                existing.failed_login_attempts = 0
                existing.locked_until = None
                db.commit()
                print("==================================================================")
                print("  ✓ Platform Administrator Password Updated Successfully         ")
                print("==================================================================")
                print(f"  Email    : {email}")
                print("  Password : [configured]")
                print("==================================================================")
            else:
                print(f"[!] User with email '{email}' already exists. Skipping bootstrap.")
            return

        if not password:
            password = secrets.token_urlsafe(16)
            generated = True
        else:
            generated = False

        admin_role = db.execute(select(Role).where(Role.name == "Platform Administrator")).scalar_one()

        hashed_pw = hash_password(password)
        admin_user = User(
            email=email,
            display_name=display_name,
            password_hash=hashed_pw,
            status="ACTIVE",
            is_bootstrap_admin=True,
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()

        print("==================================================================")
        print("  ✓ Platform Administrator Bootstrapped Successfully             ")
        print("==================================================================")
        print(f"  Email    : {email}")
        if generated:
            print(f"  Password : {password}")
            print("  [!] Please record this password now. It will not be shown again.")
        else:
            print("  Password : [configured]")
        print("==================================================================")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap initial Platform Admin account")
    parser.add_argument("--email", default="admin@company.local", help="Admin email address")
    parser.add_argument("--password", default=None, help="Admin password (generated if omitted)")
    parser.add_argument("--name", default="Platform Admin", help="Display name")
    args = parser.parse_args()

    bootstrap_admin(email=args.email, password=args.password, display_name=args.name)
