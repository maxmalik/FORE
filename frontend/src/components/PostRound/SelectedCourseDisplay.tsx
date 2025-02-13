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
      <Card.Text className="form-control readonly-text m-0">
        <CourseCard course={course} />
      </Card.Text>
      <ClearCourseSelectionButton onClick={onClearSelection} />
    </InputGroup>
  );
}
export default SelectedCourseDisplay;
