import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { MdOutlineEditNote } from "react-icons/md";

import { Course, Hole } from "../../utils/courses";
import { ScorecardMode } from "../../utils/rounds";

interface ScorecardTableProps {
  scorecardMode: ScorecardMode;
  course: Course;
  teeBoxIndex: number;
  scores: Record<string, string>;
  onScoreChange: (key: string, value: string) => void;
  openTeeBoxSelectionModal: () => void;
}

function ScorecardTable({
  scorecardMode,
  course,
  teeBoxIndex,
  scores,
  onScoreChange,
  openTeeBoxSelectionModal,
}: ScorecardTableProps) {
  const teeBoxDisplayName = course?.tee_boxes?.[teeBoxIndex]?.tee
    ? `${course.tee_boxes[teeBoxIndex].tee} ${
        course.length_format === "Y" ? "(Yards)" : "(Meters)"
      }`
    : null;

  if (scorecardMode === "all-holes") {
    return (
      <Table responsive bordered size="sm">
        <thead>
          <tr>
            <th className="align-middle">Hole</th>
            {course.scorecard.map((hole: Hole) => (
              <th key={hole.hole_number} className="text-center align-middle">
                {hole.hole_number}
              </th>
            ))}
            <th className="text-center align-middle px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">Par</td>
              {course.scorecard.map((hole) => (
                <td key={hole.hole_number} className="text-center align-middle">
                  {hole.par}
                </td>
              ))}
              <td className="text-center align-middle">{course.par}</td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            // TODO: Display dropdown to select tee box
            <tr>
              <td className="align-middle">
                <div className="d-flex align-items-center justify-content-between">
                  {teeBoxDisplayName ?? (
                    <p className="text-muted m-0">No tee box selected</p>
                  )}
                  <Button
                    onClick={openTeeBoxSelectionModal}
                    variant="transparant"
                    className="p-0 ms-2"
                  >
                    <MdOutlineEditNote size={25} />
                  </Button>
                </div>
              </td>
              {course.scorecard.map((hole) => (
                <td key={hole.hole_number} className="text-center align-middle">
                  {teeBoxIndex !== -1
                    ? hole.tees[`teeBox${teeBoxIndex + 1}`].yards
                    : " "}
                </td>
              ))}

              <td className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? course.tee_boxes[teeBoxIndex].total_yards
                  : " "}
              </td>
            </tr>
          )}
          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">Handicap</td>
              {course.scorecard.map((hole, index) => (
                <td key={index + 1} className="text-center">
                  {hole.handicap}
                </td>
              ))}
              <td></td>
            </tr>
          )}
          <tr className="table-active">
            <td className="align-middle">Score</td>
            {course.scorecard.map((hole: Hole) => (
              <td
                key={hole.hole_number}
                style={{ width: "40px" }}
                className="text-center align-middle"
              >
                <Form.Control
                  min="0"
                  value={scores[hole.hole_number.toString()]}
                  onChange={(e) =>
                    onScoreChange(hole.hole_number.toString(), e.target.value)
                  }
                  className="p-1 text-center"
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
    );
  } else if (scorecardMode === "front-and-back") {
    return (
      <Table responsive bordered size="sm" className="w-auto">
        <thead>
          <tr>
            <th className="align-middle"></th>
            <th key="front" className="text-center align-middle">
              OUT
            </th>
            <th key="back" className="text-center align-middle">
              IN
            </th>
            <th className="text-center align-middle px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">Par</td>
              <td key="front" className="text-center align-middle">
                {course.scorecard
                  .slice(0, 9)
                  .reduce((acc, hole) => acc + hole.par, 0)}
              </td>
              <td key="back" className="text-center align-middle">
                {course.scorecard
                  .slice(9, 18)
                  .reduce((acc, hole) => acc + hole.par, 0)}
              </td>
              <td className="text-center align-middle">{course.par}</td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">
                <div className="d-flex align-items-center justify-content-between">
                  {teeBoxDisplayName ?? (
                    <p className="text-muted m-0">No tee box selected</p>
                  )}
                  <Button
                    onClick={openTeeBoxSelectionModal}
                    variant="transparant"
                    className="p-0 ms-2"
                  >
                    <MdOutlineEditNote size={25} />
                  </Button>
                </div>
              </td>
              <td key="front" className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? course.scorecard
                      .slice(0, 9)
                      .reduce(
                        (acc, hole) =>
                          acc + hole.tees[`teeBox${teeBoxIndex + 1}`].yards,
                        0
                      )
                  : " "}
              </td>
              <td key="back" className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? course.scorecard
                      .slice(9, 18)
                      .reduce(
                        (acc, hole) =>
                          acc + hole.tees[`teeBox${teeBoxIndex + 1}`].yards,
                        0
                      )
                  : " "}
              </td>

              <td className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? course.tee_boxes[teeBoxIndex].total_yards
                  : " "}
              </td>
            </tr>
          )}
          <tr className="table-active">
            <td className="align-middle">Score</td>
            <td
              key="front"
              style={{ width: "40px" }}
              className="text-center align-middle"
            >
              <Form.Control
                min="0"
                value={scores["front"]}
                onChange={(e) => onScoreChange("front", e.target.value)}
                className="p-1 text-center"
              />
            </td>
            <td
              key="back"
              style={{ width: "40px" }}
              className="text-center align-middle"
            >
              <Form.Control
                min="0"
                value={scores["back"]}
                onChange={(e) => onScoreChange("back", e.target.value)}
                className="p-1 text-center"
              />
            </td>

            <td className="text-center align-middle">
              {Object.values(scores).reduce(
                (acc, score) => acc + Number(score),
                0
              )}
            </td>
          </tr>
        </tbody>
      </Table>
    );
  } else if (scorecardMode === "total-score") {
    return (
      <Table responsive bordered size="sm" className="w-auto">
        <thead>
          <tr>
            <th className="align-middle"></th>
            <th className="text-center align-middle px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">Par</td>
              <td className="text-center align-middle">{course.par}</td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">
                <div className="d-flex align-items-center justify-content-between">
                  {teeBoxDisplayName ?? (
                    <p className="text-muted m-0">No tee box selected</p>
                  )}
                  <Button
                    onClick={openTeeBoxSelectionModal}
                    variant="transparant"
                    className="p-0 ms-2"
                  >
                    <MdOutlineEditNote size={25} />
                  </Button>
                </div>
              </td>

              <td className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? course.tee_boxes[teeBoxIndex].total_yards
                  : " "}
              </td>
            </tr>
          )}
          <tr className="table-active">
            <td className="align-middle">Score</td>
            <td
              key="front"
              style={{ width: "40px" }}
              className="text-center align-middle"
            >
              <Form.Control
                min="0"
                value={scores["total"]}
                onChange={(e) => onScoreChange("total", e.target.value)}
                className="p-1 text-center"
              />
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }
  return (
    <Table responsive bordered size="sm">
      <thead>
        <tr>
          <th className="align-middle">Hole</th>
          {course.scorecard.map((hole: Hole) => (
            <th key={hole.hole_number} className="text-center align-middle">
              {hole.hole_number}
            </th>
          ))}
          <th className="text-center align-middle px-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {course.tee_boxes.length > 0 && (
          <tr>
            <td className="align-middle">Par</td>
            {course.scorecard.map((hole) => (
              <td key={hole.hole_number} className="text-center align-middle">
                {hole.par}
              </td>
            ))}
            <td className="text-center align-middle">{course.par}</td>
          </tr>
        )}

        {course.tee_boxes.length > 0 && (
          // TODO: Display dropdown to select tee box
          <tr>
            <td className="align-middle">
              <div className="d-flex align-items-center justify-content-between">
                {teeBoxDisplayName ?? (
                  <p className="text-muted m-0">No tee box selected</p>
                )}
                <Button
                  onClick={openTeeBoxSelectionModal}
                  variant="transparant"
                  className="p-0 ms-2"
                >
                  <MdOutlineEditNote size={25} />
                </Button>
              </div>
            </td>
            {course.scorecard.map((hole) => (
              <td key={hole.hole_number} className="text-center align-middle">
                {teeBoxIndex !== -1
                  ? hole.tees[`teeBox${teeBoxIndex + 1}`].yards
                  : " "}
              </td>
            ))}

            <td className="text-center align-middle">
              {teeBoxIndex !== -1
                ? course.tee_boxes[teeBoxIndex].total_yards
                : " "}
            </td>
          </tr>
        )}
        {course.tee_boxes.length > 0 && (
          <tr>
            <td className="align-middle">Handicap</td>
            {course.scorecard.map((hole, index) => (
              <td key={index + 1} className="text-center">
                {hole.handicap}
              </td>
            ))}
            <td></td>
          </tr>
        )}
        <tr className="table-active">
          <td className="align-middle">Score</td>
          {course.scorecard.map((hole: Hole) => (
            <td
              key={hole.hole_number}
              style={{ width: "40px" }}
              className="text-center align-middle"
            >
              <Form.Control
                min="0"
                value={scores[hole.hole_number.toString()]}
                onChange={(e) =>
                  onScoreChange(hole.hole_number.toString(), e.target.value)
                }
                className="p-1 text-center"
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
  );
}
export default ScorecardTable;
