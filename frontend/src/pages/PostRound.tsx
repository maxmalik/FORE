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
import { callSearchApi, Course, Hole, TeeBox } from "../utils/courses";

function PostRound() {
  const [selectedResult, setSelectedResult] = useState<Course | null>(null);
  const [selectedTeeBoxNumber, setSelectedTeeBoxNumber] = useState<
    number | null
  >(null);
  const [scores, setScores] = useState<Record<string, string>>({});

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
    setScores({});
    setSelectedTeeBoxNumber(null);
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

  // useEffect(() => {
  //   console.log(selectedTeeBoxNumber);
  // }, [selectedTeeBoxNumber]);

  function handleScoreChange(holeNumber: number, score: string) {
    if ((score !== "" && isNaN(Number(score))) || score.length > 2) {
      return;
    }
    const updatedScores = { ...scores };
    updatedScores[holeNumber.toString()] = score;
    setScores(updatedScores);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("submitted");
  }

  function handleTeeBoxSelection(teeBoxNumber: number) {
    setSelectedTeeBoxNumber(teeBoxNumber);
    setShowTeeBoxSelectionModal(false);
  }

  return (
    <>
      <ForeNavbar pageName="Post Round" />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Post Round</h1>
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
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Clear Selection</Tooltip>}
            >
              <InputGroup.Text
                className="px-2"
                onClick={handleClearSelection}
                style={{ cursor: "pointer" }}
              >
                <IoMdClose size={25} />
              </InputGroup.Text>
            </OverlayTrigger>
          </InputGroup>
        )}
        {selectedResult && (
          <Modal show={showTeeBoxSelectionModal}>
            <Modal.Header>
              <Modal.Title>Select Tee Box</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-wrap justify-content-center align-items-center">
              {selectedResult.tee_boxes.map((teeBox, index) => (
                <Button
                  onClick={() => handleTeeBoxSelection(index + 1)}
                  className="m-1"
                  variant="outline-light"
                >
                  {teeBox.tee}, {teeBox.total_yards} yards
                </Button>
              ))}
            </Modal.Body>
          </Modal>
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
            {results.map((result) => (
              <Dropdown.Item
                key={result._id}
                onMouseDown={() => handleSelectResult(result)}
              >
                <div className="fw-bold">{result["name"]}</div>
                <div className="text-muted">{constructLocation(result)}</div>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        )}
      </Container>
      <Container className="my-5 col-sm-12 col-md-12 col-lg-10 col-xl-8 col-xxl-6">
        {selectedResult && selectedTeeBoxNumber && (
          <Form onSubmit={handleSubmit}>
            <h3>Scorecard</h3>
            <Table responsive bordered striped size="sm">
              <thead>
                <tr>
                  <th>Hole</th>
                  {selectedResult.scorecard.map((hole, index) => (
                    <th key={index + 1} className="text-center">
                      {hole.Hole}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th>Par</th>
                  {selectedResult.scorecard.map((hole, index) => (
                    <th key={index + 1} className="text-center">
                      {hole.Par}
                    </th>
                  ))}
                </tr>

                <tr>
                  <th>
                    {selectedResult.tee_boxes[selectedTeeBoxNumber - 1].tee}{" "}
                    {selectedResult.length_format === "Y"
                      ? "(Yards)"
                      : "(Meters)"}
                  </th>
                  {selectedResult.scorecard.map((hole, index) => (
                    <th key={index + 1} className="text-center">
                      {hole.tees["teeBox" + selectedTeeBoxNumber].yards}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th>Handicap</th>
                  {selectedResult.scorecard.map((hole, index) => (
                    <th key={index + 1} className="text-center">
                      {hole.Handicap}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Score</td>
                  {selectedResult.scorecard.map((hole) => (
                    <td style={{ width: "40px" }} className="text-center">
                      <Form.Control
                        min="0"
                        value={scores[hole.Hole.toString()]}
                        onChange={(e) =>
                          handleScoreChange(hole.Hole, e.target.value)
                        }
                        className="p-1"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </Form>
        )}
      </Container>
    </>
  );
}

export default PostRound;
