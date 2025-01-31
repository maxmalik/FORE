import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import ForeNavbar from "../components/ForeNavbar";
import ClearCourseSelectionButton from "../components/PostRound/ClearCourseSelectionButton";
import CourseCard from "../components/PostRound/CourseCard";
import ResultsDropdown from "../components/PostRound/ResultsDropdown";
import ScorecardTable from "../components/PostRound/ScorecardTable";
import TeeBoxSelectionModal from "../components/PostRound/TeeBoxSelectionModal";
import { callSearchApi, Course } from "../utils/courses";

function PostRound() {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedTeeBoxIndex, setSelectedTeeBoxIndex] = useState<
    number | -1 | null
  >(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState<string>("");

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

  function handleSelectResult(resultId: string) {
    setSelectedResultId(resultId);
    setCurrentSearchTerm("");
    setShowDropdown(false);
    const selectedResult = results.find((result) => result._id === resultId)!;
    if (selectedResult.tee_boxes.length === 0) {
      setSelectedTeeBoxIndex(-1);
      setScores(getInitialScores(selectedResult.num_holes));
    } else {
      setShowTeeBoxSelectionModal(true);
    }
  }
  function handleClearSelection() {
    setSelectedResultId(null);
    setCurrentSearchTerm("");
    setResults([]);
    setScores({});
    setSelectedTeeBoxIndex(null);
  }

  function handleScoreChange(holeNumber: number, score: string) {
    if ((score !== "" && isNaN(Number(score))) || score.length > 2) {
      return;
    }
    const updatedScores = { ...scores };
    updatedScores[holeNumber.toString()] = score;
    setScores(updatedScores);
  }

  function handleSubmit() {
    // if (selectedResultId !== null) {
    //   console.log(`course: ${selectedResult.name}`);
    //   console.table(scores);
    //   console.log(caption);
    // }
  }

  function getInitialScores(numHoles: number): { [key: string]: string } {
    return Object.fromEntries(
      Array.from({ length: numHoles }, (_, i) => [(i + 1).toString(), ""])
    );
  }

  function handleTeeBoxSelection(teeBoxIndex: number) {
    setSelectedTeeBoxIndex(teeBoxIndex);
    setShowTeeBoxSelectionModal(false);
    const selectedResult = results.find(
      (result) => result._id === selectedResultId
    )!;
    setScores(getInitialScores(selectedResult.num_holes));
  }

  return (
    <>
      <ForeNavbar pageName="Post Round" />
      <h1 className="my-5 text-center">Post Round</h1>
      {!selectedResultId ? (
        // If no result is selected, display the search bar and dropdown
        <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
          <Form.Control
            type="text"
            placeholder="Search for a course..."
            value={currentSearchTerm}
            onChange={(e) => setCurrentSearchTerm(e.target.value)}
            onKeyDown={handleEnterKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => results.length > 0 && setShowDropdown(false)}
          />
          <ResultsDropdown
            show={showDropdown && results.length > 0}
            results={results}
            showingResultsFor={submittedSearchTerm}
            onSelectResult={handleSelectResult}
          />
        </Container>
      ) : (
        // Otherwise display the selected course and the form

        <>
          <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
            <InputGroup>
              <Card.Text className="form-control readonly-text m-0">
                <CourseCard
                  course={
                    results.find((result) => result._id === selectedResultId)!
                  }
                />
              </Card.Text>
              <ClearCourseSelectionButton onClick={handleClearSelection} />
            </InputGroup>
          </Container>
          <Container className="my-5 col-sm-12 col-md-12 col-lg-10 col-xl-8 col-xxl-6">
            <TeeBoxSelectionModal
              show={showTeeBoxSelectionModal}
              course={
                results.find((result) => result._id === selectedResultId)!
              }
              onTeeBoxSelection={handleTeeBoxSelection}
            />

            {selectedTeeBoxIndex !== null && (
              <Form>
                <h5> Add a caption (optional)</h5>
                <Form.Group className="mb-3">
                  <Form.Control
                    placeholder="Caption"
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </Form.Group>

                <h5>Scorecard</h5>
                <ScorecardTable
                  course={
                    results.find((result) => result._id === selectedResultId)!
                  }
                  teeBoxIndex={selectedTeeBoxIndex}
                  scores={scores}
                  onScoreChange={handleScoreChange}
                />
                <div className="text-end">
                  <Button variant="success" onClick={handleSubmit}>
                    Post
                  </Button>
                </div>
              </Form>
            )}
          </Container>
        </>
      )}
    </>
  );
}

export default PostRound;
