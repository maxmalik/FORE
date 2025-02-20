import { useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

import { Status } from "../../pages/PostRound";
import { Course, searchCourses } from "../../utils/courses";
import ResultsDropdown from "./ResultsDropdown";

interface CourseSearchBarProps {
  status: Status;
  setStatus: (newStatus: Status) => void;
  handleSelectResult: (course: Course) => void;
}

function CourseSearchBar({
  status,
  setStatus,
  handleSelectResult,
}: CourseSearchBarProps) {
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [results, setResults] = useState<Course[] | null>(null);
  const [showResultsDropdown, setShowResultsDropdown] =
    useState<boolean>(false);
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState<string>("");

  async function handleSearchSubmit(term: string): Promise<void> {
    if (term.trim() === "") {
      setResults(null);
      setShowResultsDropdown(false);
      return;
    }
    setStatus("loading-results");
    const results = await searchCourses(term);
    setStatus("none");
    setResults(results);
    setSubmittedSearchTerm(term);
    setShowResultsDropdown(true);
  }

  function handleEnterKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      setSubmittedSearchTerm(currentSearchTerm);
      handleSearchSubmit(currentSearchTerm);
    }
  }

  function onSelectResult(result: Course) {
    setCurrentSearchTerm("");
    setShowResultsDropdown(false);
    handleSelectResult(result);
    console.log(result);
  }

  return (
    <>
      <Form.Control
        type="text"
        placeholder="Search for a course..."
        value={currentSearchTerm}
        onChange={(e) => setCurrentSearchTerm(e.target.value)}
        onKeyDown={handleEnterKeyDown}
        onFocus={() => results !== null && setShowResultsDropdown(true)}
        onBlur={() => results !== null && setShowResultsDropdown(false)}
      />
      {status === "loading-results" ? (
        <div className="d-flex justify-content-center m-3">
          <Spinner animation="border" />
        </div>
      ) : (
        <ResultsDropdown
          show={showResultsDropdown}
          results={results!}
          submittedSearchTerm={submittedSearchTerm}
          onSelectResult={onSelectResult}
        />
      )}
    </>
  );
}
export default CourseSearchBar;
