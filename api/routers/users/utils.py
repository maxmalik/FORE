import bcrypt


def get_password_hash(password: str) -> str:
    # Convert password to an array of bytes
    bytes = password.encode("utf-8")

    # Generate the salt
    salt = bcrypt.gensalt()

    # Hash the password
    password_hash = bcrypt.hashpw(bytes, salt)

    return password_hash.decode("utf-8")


def verify_password(stored_hash: str, entered_password: str) -> bool:
    # Convert entered password to an array of bytes
    entered_bytes = entered_password.encode("utf-8")

    # Convert stored password hash to an array of bytes
    stored_bytes = stored_hash.encode("utf-8")

    return bcrypt.checkpw(entered_bytes, stored_bytes)
