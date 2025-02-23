import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";

import ForeNavbar from "../components/ForeNavbar";
import CourseSearchBar from "../components/PostRound/CourseSearchBar";
import ResultsDropdown from "../components/PostRound/ResultsDropdown";
import ScorecardModeDropdown from "../components/PostRound/ScorecardModeDropdown";
import ScorecardTable from "../components/PostRound/ScorecardTable";
import SelectedCourseDisplay from "../components/PostRound/SelectedCourseDisplay";
import TeeBoxSelectionModal from "../components/PostRound/TeeBoxSelectionModal";
import { Course, searchCourses } from "../utils/courses";
import { postRound, ScorecardMode } from "../utils/rounds";
import { getUserData } from "../utils/users/users";

export type Status = "none" | "loading-results" | "busy" | "post-complete";

function PostRound() {
  const [status, setStatus] = useState<Status>("none");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showTeeBoxSelectionModal, setShowTeeBoxSelectionModal] =
    useState(false);
  const [selectedTeeBoxIndex, setSelectedTeeBoxIndex] = useState<number | null>(
    null
  );
  const [caption, setCaption] = useState<string>("");
  const [scorecardMode, setScorecardMode] =
    useState<ScorecardMode>("all-holes");
  useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [redirectCountdown, setRedirectCountdown] = useState(3); // Countdown in seconds
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (status === "post-complete") {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);

      // Redirect when countdown reaches 0
      if (redirectCountdown === 0) {
        navigate("/dashboard");
      }

      return () => clearInterval(timer); // Cleanup interval
    }
  }, [status, redirectCountdown, navigate]);

  function handleSelectResult(result: Course) {
    setSelectedCourse(result);
    if (result.tee_boxes.length === 0) {
      setSelectedTeeBoxIndex(null);
    } else {
      setShowTeeBoxSelectionModal(true);
    }
    setScores(getInitialScores(result.num_holes, scorecardMode));
  }

  function handleClearSelection() {
    setSelectedCourse(null);
    setScores({});
    setSelectedTeeBoxIndex(null);
  }

  function handleScorecardModeChange(newMode: ScorecardMode): void {
    setScorecardMode(newMode);
    setScores(getInitialScores(selectedCourse!.num_holes, newMode));
    console.log(newMode);
  }

  function handleScoreChange(key: string, score: string) {
    if (
      (score !== "" && isNaN(Number(score))) ||
      (score.length > 2 && scorecardMode !== "total-score")
    ) {
      return;
    }
    const updatedScores = { ...scores };
    updatedScores[key] = score;
    setScores(updatedScores);
  }

  async function handleSubmit() {
    setStatus("busy");
    const userData = getUserData();
    let userId;
    try {
      userId = userData.id;
    } catch (error) {
      alert("Error: no user logged in");
      return;
    }

    const courseId = selectedCourse!.id;

    let scorecard: Record<string, number> = {};

    for (const [holeNumber, score] of Object.entries(scores)) {
      if (score === "") {
        setShowAlert(true);
        setStatus("none");
        return;
      } else {
        scorecard[holeNumber] = Number(score);
      }
    }

    const response = await postRound(
      userId,
      courseId!,
      selectedTeeBoxIndex,
      caption,
      scorecardMode,
      scorecard
    );

    // Post round was successful
    if (response.ok) {
      setStatus("post-complete");
    } else {
      const body = await response.json();
      alert("unsuccessful post");
      console.log(body);
      setStatus("none");
    }
  }

  function getInitialScores(
    numHoles: number,
    mode: ScorecardMode
  ): { [key: string]: string } {
    switch (mode) {
      case "all-holes":
        return Object.fromEntries(
          Array.from({ length: numHoles }, (_, i) => [(i + 1).toString(), ""])
        );
      case "front-and-back":
        return {
          front: "",
          back: "",
        };
      case "total-score":
        return { total: "" };
    }
  }

  function handleTeeBoxSelection(teeBoxIndex: number) {
    setSelectedTeeBoxIndex(teeBoxIndex);
    setShowTeeBoxSelectionModal(false);
  }

  return (
    <>
      <ForeNavbar pageName="Post Round" />
      <h1 className="my-5 text-center">Post Round</h1>
      {!selectedCourse ? (
        // If no result is selected, display the search bar and results dropdown
        <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
          <CourseSearchBar
            status={status}
            setStatus={setStatus}
            handleSelectResult={handleSelectResult}
          />
        </Container>
      ) : (
        // Otherwise display the selected course and the form
        <>
          <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
            <SelectedCourseDisplay
              course={selectedCourse}
              onClearSelection={handleClearSelection}
            />
          </Container>
          <Container fluid className="my-5 col-lg-12 col-xl-10 col-xxl-8">
            <TeeBoxSelectionModal
              show={showTeeBoxSelectionModal}
              course={selectedCourse}
              onTeeBoxSelection={handleTeeBoxSelection}
            />

            {selectedTeeBoxIndex !== null && (
              <Form>
                <h5> Add a caption (optional)</h5>

                <Form.Control
                  placeholder="Caption"
                  onChange={(e) => setCaption(e.target.value)}
                  className="mb-3"
                />

                <div className="d-flex vertical-align-center align-items-center mb-1">
                  <h4 className="d-inline-block m-0">Scorecard</h4>
                  <ScorecardModeDropdown
                    num_holes={selectedCourse.num_holes}
                    handleScorecardModeChange={handleScorecardModeChange}
                    scores={scores}
                    scorecardMode={scorecardMode}
                  />
                  <Alert variant="danger" show={showAlert} className="m-0 p-2">
                    <div className="d-flex">
                      Please complete the scorecard.
                      <CloseButton
                        onClick={() => setShowAlert(false)}
                        className="ms-2"
                      />
                    </div>
                  </Alert>
                </div>
                <ScorecardTable
                  scorecardMode={scorecardMode}
                  course={selectedCourse}
                  teeBoxIndex={selectedTeeBoxIndex}
                  scores={scores}
                  onScoreChange={handleScoreChange}
                  openTeeBoxSelectionModal={() =>
                    setShowTeeBoxSelectionModal(true)
                  }
                />
                <Button
                  disabled={status === "busy"}
                  variant="success"
                  onClick={handleSubmit}
                >
                  Post
                </Button>

                {status === "post-complete" && (
                  // TODO: Make this actually show at the correct time
                  <h5 className="text-center">
                    Post success! Redirecting in {redirectCountdown} seconds...
                    If you are not redirected, click{" "}
                    <a href="/dashboard">here</a>
                  </h5>
                )}
              </Form>
            )}
          </Container>
        </>
      )}
    </>
  );
}

export default PostRound;
