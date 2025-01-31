import { constructLocation, Course } from "../../utils/courses";

interface CourseCardProps {
  course: Course;
}

function CourseCard({ course }: CourseCardProps) {
  return (
    <>
      <div className="fw-bold">{course.name}</div>
      <div className="text-muted">{constructLocation(course)}</div>
    </>
  );
}

export default CourseCard;
