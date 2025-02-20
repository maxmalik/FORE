import Dropdown from "react-bootstrap/Dropdown";

import { Course } from "../../utils/courses";
import CourseCard from "./CourseCard";

interface ResultsDropdownProps {
  show: boolean;
  results: Course[] | null;
  submittedSearchTerm: string;
  onSelectResult: (result: Course) => void;
}

function ResultsDropdown({
  show,
  results,
  submittedSearchTerm,
  onSelectResult,
}: ResultsDropdownProps) {
  return (
    <Dropdown.Menu
      show={show}
      style={{ position: "relative", width: "100%", zIndex: 1 }}
    >
      <Dropdown.Header>
        <p className="mb-0 text-muted">
          Showing results for <strong>{submittedSearchTerm}</strong>
        </p>
      </Dropdown.Header>
      {results !== null && results.length > 0 ? (
        results.map((result) => (
          <Dropdown.Item
            key={result.id}
            onMouseDown={() => onSelectResult(result)}
          >
            <CourseCard course={result} />
          </Dropdown.Item>
        ))
      ) : (
        <div className="m-1 text-center text-muted">No results found</div>
      )}
    </Dropdown.Menu>
  );
}
export default ResultsDropdown;
