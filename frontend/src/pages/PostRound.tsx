import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Table from "react-bootstrap/Table";
import Tooltip from "react-bootstrap/Tooltip";
import { IoMdClose } from "react-icons/io";

import CourseSearchbar from "../components/CourseSearchbar";
import ForeNavbar from "../components/ForeNavbar";
import ClearCourseSelectionButton from "../components/PostRound/ClearCourseSelectionButton";
import CourseCard from "../components/PostRound/CourseCard";
import ResultsDropdown from "../components/PostRound/ResultsDropdown";
import TeeBoxSelectionModal from "../components/PostRound/TeeBoxSelectionModal";
import { callSearchApi, Course, Hole, TeeBox } from "../utils/courses";

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
    for (let i = 1; i <= selectedResult.num_holes; i++) {
      setScores((prevScores) => ({
        ...prevScores,
        [i.toString()]: "",
      }));
    }
  }

  // Returns a list of numbers from 1 (inclusive) to n (inclusive)
  function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  return (
    <>
      <ForeNavbar pageName="Post Round" />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Post Round</h1>
        {!selectedResultId ? (
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
            <Card.Text className="form-control readonly-text m-0">
              <CourseCard
                course={
                  results.find((result) => result._id === selectedResultId)!
                }
              />
            </Card.Text>
            <ClearCourseSelectionButton onClick={handleClearSelection} />
          </InputGroup>
        )}
        <ResultsDropdown
          show={showDropdown && results.length > 0}
          results={results}
          showingResultsFor={submittedSearchTerm}
          onSelectResult={handleSelectResult}
        />
        {selectedResultId && (
          <TeeBoxSelectionModal
            show={showTeeBoxSelectionModal}
            course={results.find((result) => result._id === selectedResultId)!}
            onTeeBoxSelection={handleTeeBoxSelection}
          />
        )}
      </Container>
      <Container className="my-5 col-sm-12 col-md-12 col-lg-10 col-xl-8 col-xxl-6">
        {selectedResultId && selectedTeeBoxIndex !== null && (
          <Form onSubmit={handleSubmit}>
            <h5> Add a caption (optional)</h5>
            <Form.Group className="mb-3">
              <Form.Control
                placeholder="Caption"
                onChange={(e) => setCaption(e.target.value)}
              />
            </Form.Group>

            <h5>Scorecard</h5>
            <Table responsive bordered size="sm">
              <thead>
                <tr>
                  <th className="align-middle">Hole</th>
                  {range(
                    results.find((result) => result._id === selectedResultId)!
                      .num_holes
                  ).map((holeNumber) => (
                    <th key={holeNumber} className="text-center align-middle">
                      {holeNumber}
                    </th>
                  ))}
                  <th className="text-center align-middle px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {results.find((result) => result._id === selectedResultId)!
                  .tee_boxes.length > 0 && (
                  <tr>
                    <td className="align-middle">Par</td>
                    {results
                      .find((result) => result._id === selectedResultId)!
                      .scorecard.map((hole) => (
                        <td
                          key={hole.Hole}
                          className="text-center align-middle"
                        >
                          {hole.Par}
                        </td>
                      ))}
                    <td className="text-center align-middle">
                      {results
                        .find((result) => result._id === selectedResultId)!
                        .scorecard.reduce((acc, hole) => acc + hole.Par, 0)}
                    </td>
                  </tr>
                )}

                {results.find((result) => result._id === selectedResultId)!
                  .tee_boxes.length > 0 && (
                  <tr>
                    <td className="align-middle">
                      {
                        results.find(
                          (result) => result._id === selectedResultId
                        )!.tee_boxes[selectedTeeBoxIndex].tee
                      }{" "}
                      {results.find(
                        (result) => result._id === selectedResultId
                      )!.length_format === "Y"
                        ? "(Yards)"
                        : "(Meters)"}
                    </td>
                    {results
                      .find((result) => result._id === selectedResultId)!
                      .scorecard.map((hole) => (
                        <td
                          key={hole.Hole}
                          className="text-center align-middle"
                        >
                          {hole.tees[`teeBox${selectedTeeBoxIndex + 1}`].yards}
                        </td>
                      ))}
                    <td className="text-center align-middle">
                      {
                        results.find(
                          (result) => result._id === selectedResultId
                        )!.tee_boxes[selectedTeeBoxIndex].total_yards
                      }
                    </td>
                  </tr>
                )}
                {results.find((result) => result._id === selectedResultId)!
                  .tee_boxes.length > 0 && (
                  <tr>
                    <td className="align-middle">Handicap</td>
                    {results
                      .find((result) => result._id === selectedResultId)!
                      .scorecard.map((hole, index) => (
                        <td key={index + 1} className="text-center">
                          {hole.Handicap}
                        </td>
                      ))}
                    <td></td>
                  </tr>
                )}
                <tr className="table-active">
                  <td className="align-middle">Score</td>
                  {range(
                    results.find((result) => result._id === selectedResultId)!
                      .num_holes
                  ).map((holeNumber) => (
                    <td
                      key={holeNumber}
                      style={{ width: "40px" }}
                      className="text-center align-middle"
                    >
                      <Form.Control
                        min="0"
                        value={scores[holeNumber.toString()]}
                        onChange={(e) =>
                          handleScoreChange(holeNumber, e.target.value)
                        }
                        className="p-1"
                      />
                    </td>
                  ))}
                  <td className="text-center align-middle">
                    {Object.values(scores).reduce(
                      (acc, score) => acc + Number(score),
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </Table>
            <div className="text-end">
              <Button variant="success" onClick={handleSubmit}>
                Post
              </Button>
            </div>
          </Form>
        )}
      </Container>
    </>
  );
}

export default PostRound;
