import { useState } from "react";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import { callSearchApi, Course, TeeBox } from "../utils/courses";
import ClearSelectedCourseResultButton from "./PostRound/ClearCourseSelectionButton";
import TeeBoxSelectionModal from "./TeeBoxSelectionModal";

interface CourseSearchbarProps {
  selectedResult: Course | null;
  setSelectedResult: (course: Course | null) => void;
  setSelectedTeeBox: (teeBox: TeeBox | null) => void;
}

function CourseSearchbar({
  selectedResult,
  setSelectedResult,
  setSelectedTeeBox,
}: CourseSearchbarProps) {
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTeeBoxSelectionModal, setShowTeeBoxSelectionModal] =
    useState(false);

  function handleEnterKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      handleSearchSubmit(currentSearchTerm);
    }
  }

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

  function handleSelectResult(result: Course) {
    setSelectedResult(result);
    setCurrentSearchTerm("");
    setShowDropdown(false);
    setShowTeeBoxSelectionModal(true);
  }
  function handleClearSelection() {
    setSelectedResult(null);
    setCurrentSearchTerm("");
    setResults([]);
  }

  function constructLocation(course: Course): string {
    let location: string = "";

    if (course.city !== "" && course.city != null) {
      location += course.city;
    }
    if (course.state !== "" && course.state != null) {
      location += ", " + course.state;
    }
    if (course.country !== "" && course.country != null) {
      location += ", " + course.country;
    }
    location = location.replace(/^,/, "").trim();

    return location;
  }

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
          {/* <Form.Control type="text" value={selectedResult["name"]} readOnly /> */}
          <Card.Text className="form-control readonly-text m-0">
            <div className="fw-bold">{selectedResult["name"]}</div>
            <div className="text-muted">
              {constructLocation(selectedResult)}
            </div>
          </Card.Text>
          <ClearSelectedCourseResultButton
            handleClearSelection={handleClearSelection}
          />
        </InputGroup>
      )}
      {showTeeBoxSelectionModal && (
        <TeeBoxSelectionModal
          teeBoxes={selectedResult ? selectedResult.tee_boxes : []}
          setSelectedTeeBox={setSelectedTeeBox}
          showTeeBoxSelectionModal={showTeeBoxSelectionModal}
          setShowTeeBoxSelectionModal={setShowTeeBoxSelectionModal}
        />
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
              <div className="fw-bold">{result["name"]}</div>
              <div className="text-muted">{constructLocation(result)}</div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      )}
    </>
  );
}

export default CourseSearchbar;
