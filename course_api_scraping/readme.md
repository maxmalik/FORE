This directory contains all files pertaining to the task of obtaining a source database of golf courses that FORE! can be built off of. \
[This website](https://freegolftracker.com/courses/findgolfcourses.php) contains a list of thousands of golf course names. \
I pulled all the course names from this website using `course_name_puller.py` which saves to `course_names.txt`. \
Then I uploaded the course names from `course_names.txt` to a `course_names` MongoDB index using `course_name_uploader.py`. \
I ran the Lambda function `lambda_function.py` every 30 minutes and it does the following:

1. Gets 200 course names from the `course_names` index
2. Fetches the corresponding course documents (if available) from the [Golf Course API RapidAPI](https://rapidapi.com/foshesco-65zCww9c1y0/api/golf-course-api) for these course names
3. Cleans up this data (converting the \_id string to an ObjectID, using snake_case convention, etc.)
4. Uploads these sanitized courses to the `courses` index
5. Deletes the original 200 course names from the `course_names` index to mark them as resolved.

The frequency and volume for fetching was chosen because the minimum paid plan for the golf course API has a rate limit of 300 per minute and 10,000 per day, so 200 will keep under the per-minute limit, and 200 requests twice per hour \* 24 hours per day = 9600 requests per day < 10,000.
