import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { MdOutlineEditNote } from "react-icons/md";

import { Course, Hole } from "../utils/courses";
import { RoundScorecard, ScorecardMode } from "../utils/rounds";

interface RoundFeedScorecardTableProps {
  roundScorecard: RoundScorecard;
  scorecardMode: ScorecardMode;
  teeBoxIndex: number;
  course: Course;
}

// Returns a list of numbers from 1 (inclusive) to n (inclusive)
function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function RoundFeedScorecardTable({
  roundScorecard,
  scorecardMode,
  teeBoxIndex,
  course,
}: RoundFeedScorecardTableProps) {
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
            {range(course.num_holes).map((holeNumber) => (
              <th key={holeNumber} className="text-center align-middle">
                {holeNumber}
              </th>
            ))}
            <th className="text-center align-middle px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">Par</td>
              {course.scorecard.map((hole: Hole) => (
                <td key={hole.hole_number} className="text-center align-middle">
                  {hole.par}
                </td>
              ))}
              <td className="text-center align-middle">
                {course.scorecard.reduce(
                  (acc: number, hole: Hole) => acc + hole.par,
                  0
                )}
              </td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            // TODO: Display dropdown to select tee box
            <tr>
              <td className="align-middle">
                {teeBoxDisplayName ?? (
                  <p className="text-muted m-0">No tee box selected</p>
                )}
              </td>
              {course.scorecard.map((hole: Hole) => (
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
              {course.scorecard.map((hole: Hole, index: number) => (
                <td key={index + 1} className="text-center">
                  {hole.handicap}
                </td>
              ))}
              <td></td>
            </tr>
          )}
          <tr className="table-active">
            <td className="align-middle">Score</td>
            {range(course.num_holes).map((holeNumber) => (
              <td key={holeNumber} className="text-center">
                {roundScorecard[holeNumber.toString()]}
              </td>
            ))}
            <td className="text-center align-middle">
              {Object.values(roundScorecard).reduce(
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
              <td className="text-center align-middle">
                {course.scorecard.reduce((acc, hole) => acc + hole.par, 0)}
              </td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">
                {teeBoxDisplayName ?? (
                  <p className="text-muted m-0">No tee box selected</p>
                )}
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
            <td key="front" className="text-center">
              {roundScorecard["front"]}
            </td>
            <td key="back" className="text-center">
              {roundScorecard["back"]}
            </td>

            <td className="text-center align-middle">
              {Object.values(roundScorecard).reduce(
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
              <td className="text-center align-middle">
                {course.scorecard.reduce((acc, hole) => acc + hole.par, 0)}
              </td>
            </tr>
          )}

          {course.tee_boxes.length > 0 && (
            <tr>
              <td className="align-middle">
                {teeBoxDisplayName ?? (
                  <p className="text-muted m-0">No tee box selected</p>
                )}
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
            <td key="total" className="text-center">
              {roundScorecard["total"]}
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }
}
export default RoundFeedScorecardTable;
