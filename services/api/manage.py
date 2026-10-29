import argparse
import getpass
import hashlib
import secrets

from services.api.core import seed
from services.api.db import Admin, Session


def hash_password(password):
    salt = secrets.token_hex(16)
    return salt + ":" + hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()


def verify(password, stored):
    salt, expected = stored.split(":")
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return secrets.compare_digest(actual, expected)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["create-admin", "seed"])
    parser.add_argument("--username", default="admin")
    args = parser.parse_args()
    with Session() as db:
        if args.command == "seed":
            seed(db)
            print("Demo fixtures seeded. DEMO — NOT A REAL WARNING")
        else:
            password = getpass.getpass("New administrator password (at least 14 characters): ")
            if len(password) < 14 or password != getpass.getpass("Repeat password: "):
                raise SystemExit("Passwords must match and contain at least 14 characters")
            if db.get(Admin, args.username):
                raise SystemExit("Administrator already exists")
            db.add(Admin(id=args.username, password=hash_password(password)))
            db.commit()
            print("Administrator created")
