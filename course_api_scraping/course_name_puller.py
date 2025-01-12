import string

import requests
from bs4 import BeautifulSoup


# Returns a list of all strings within <a> tags within <td> tags on the given URL
def extract_text_from_a_tags(url: str) -> list[str]:
    try:
        # Fetch the content of the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Parse the content with BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Find all <td> tags
        td_tags = soup.find_all("td")

        # Extract text from <a> tags within <td> tags
        a_tag_texts = []
        for td in td_tags:
            a_tags = td.find_all("a")  # Find all <a> tags within this <td>
            for a in a_tags:
                if a.string:  # Ensure the <a> tag contains text
                    a_tag_texts.append(
                        a.string.strip().lower()
                    )  # Trim whitespace and convert to lowercase

        return a_tag_texts

    except requests.RequestException as e:
        print(f"Error fetching the URL: {e}")
        return []


OUTPUT_FILE = "course_names.txt"


def main() -> None:
    lowercase_letters = list(string.ascii_lowercase)

    course_names = []

    # Loop through each letter of the alphabet
    for letter in lowercase_letters:

        print(f"Current letter: {letter}")  # Log progress

        # Construct the URL that contains the list of course names starting with the current letter
        url = f"https://freegolftracker.com/courses/findgolfcourses.php?slet={letter}"

        # Get those course names
        a_tag_texts = extract_text_from_a_tags(url)

        course_names.extend(a_tag_texts)

    # Remove duplicates and sort the list
    course_names_unique_sorted = sorted(set(course_names))

    # Write to output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as txt_file:
        for course_name in course_names_unique_sorted:
            txt_file.write(course_name + "\n")


if __name__ == "__main__":
    main()
