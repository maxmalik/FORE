import Dropdown from "react-bootstrap/Dropdown";

import { Course } from "../../utils/courses";
import CourseCard from "./CourseCard";

interface ResultsDropdownProps {
  show: boolean;
  results: Course[];
  showingResultsFor: string;
  onSelectResult: (resultId: string) => void;
}

function ResultsDropdown({
  show,
  results,
  showingResultsFor,
  onSelectResult,
}: ResultsDropdownProps) {
  return (
    <Dropdown.Menu
      show={show}
      style={{ position: "relative", width: "100%", zIndex: 1 }}
    >
      <Dropdown.Header>
        <p className="text-muted">
          Showing results for <strong>{showingResultsFor}</strong>
        </p>
      </Dropdown.Header>
      {results.map((result) => (
        <Dropdown.Item
          key={result._id}
          onMouseDown={() => onSelectResult(result._id)}
        >
          <CourseCard course={result} />
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  );
}
export default ResultsDropdown;
