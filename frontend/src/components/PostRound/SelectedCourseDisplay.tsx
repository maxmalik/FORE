import Card from "react-bootstrap/Card";
import InputGroup from "react-bootstrap/InputGroup";

import { Course } from "../../utils/courses";
import ClearCourseSelectionButton from "./ClearCourseSelectionButton";
import CourseCard from "./CourseCard";

interface SelectedCourseDisplayProps {
  course: Course;
  onClearSelection: () => void;
}
function SelectedCourseDisplay({
  course,
  onClearSelection,
}: SelectedCourseDisplayProps) {
  return (
    <InputGroup>
      <Card.Body className="form-control readonly-text m-0 p-2">
        <CourseCard course={course} />
      </Card.Body>
      <ClearCourseSelectionButton onClick={onClearSelection} />
    </InputGroup>
  );
}
export default SelectedCourseDisplay;
