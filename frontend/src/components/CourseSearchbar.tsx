import { useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import { callSearchApi, Course } from "../utils/courses";
import ClearSelectedCourseResultButton from "./ClearSelectedCourseResultButton";

interface CourseSearchbarProps {
  selectedResult: Course | null;
  setSelectedResult: (course: Course | null) => void;
}

function CourseSearchbar({
  selectedResult,
  setSelectedResult,
}: CourseSearchbarProps) {
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleEnterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      handleSearchSubmit(currentSearchTerm);
    }
  };

  async function searchCourses(courseName: string): Promise<Course[]> {
    const response = await callSearchApi(courseName);
    const results = await response.json();
    return results as Course[];
  }

  async function handleSearchSubmit(term: string): Promise<void> {
    if (term.trim() === "") {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const results = await searchCourses(term);
    setResults(results);
    setSubmittedSearchTerm(term);
    setShowDropdown(true);
  }

  const handleSelectResult = (result: Course) => {
    console.log("hi");
    setSelectedResult(result);
    setCurrentSearchTerm("");
    setShowDropdown(false);
  };
  const handleClearSelection = () => {
    setSelectedResult(null);
    setCurrentSearchTerm("");
    setResults([]);
  };
  return (
    <>
      {!selectedResult ? (
        <Form.Control
          type="text"
          placeholder="Search for a course..."
          value={currentSearchTerm}
          onChange={(e) => setCurrentSearchTerm(e.target.value)}
          onKeyDown={handleEnterKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => results.length > 0 && setShowDropdown(false)}
        />
      ) : (
        <InputGroup>
          <Form.Control type="text" value={selectedResult["name"]} readOnly />
          <ClearSelectedCourseResultButton
            handleClearSelection={handleClearSelection}
          />
        </InputGroup>
      )}
      {showDropdown && results.length > 0 && (
        <Dropdown.Menu
          show
          style={{ position: "relative", width: "100%", zIndex: 1 }}
        >
          <Dropdown.Header>
            <p className="text-muted">
              Showing results for <strong>{submittedSearchTerm}</strong>
            </p>
          </Dropdown.Header>
          {results.map((result, index) => (
            <Dropdown.Item
              key={index}
              onMouseDown={() => handleSelectResult(result)}
            >
              {result["name"]}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      )}
    </>
  );
}

export default CourseSearchbar;
