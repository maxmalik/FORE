import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(dotenv_path="../.env")

client = MongoClient(os.environ["MONGODB_URL"])
db = client.get_database("fore_database")

if db.get_collection("courses_names") is None:
    db.create_collection("course_names")

course_names_collection = db.get_collection("course_names")


def get_file_lines_as_list(path: str) -> list[str]:
    try:
        with open(path, "r", encoding="utf-8") as file:
            return [line.strip().lower() for line in file if line.strip() != ""]
    except FileNotFoundError:
        print(f"Error: The file at {path} was not found.")
        raise
    except PermissionError:
        print(f"Error: Insufficient permissions to read the file at {path}.")
        raise


COURSE_NAMES_PATH = "course_names.txt"


def main():

    course_names = get_file_lines_as_list(COURSE_NAMES_PATH)

    documents = [{"_id": course_name} for course_name in course_names]

    try:
        result = course_names_collection.insert_many(documents)
        print(f"{len(result.inserted_ids)} documents were inserted.")
    except Exception as e:
        print("An error occurred:", e)
    finally:
        client.close()


if __name__ == "__main__":
    main()
