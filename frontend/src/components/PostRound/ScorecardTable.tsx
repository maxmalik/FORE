import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";

import { Course } from "../../utils/courses";

interface ScorecardTableProps {
  course: Course;
  teeBoxIndex: number;
  scores: Record<string, string>;
  onScoreChange: (holeNumber: number, value: string) => void;
}

// Returns a list of numbers from 1 (inclusive) to n (inclusive)
function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function ScorecardTable({
  course,
  teeBoxIndex,
  scores,
  onScoreChange,
}: ScorecardTableProps) {
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
            {course.scorecard.map((hole) => (
              <td key={hole.hole_number} className="text-center align-middle">
                {hole.par}
              </td>
            ))}
            <td className="text-center align-middle">
              {course.scorecard.reduce((acc, hole) => acc + hole.par, 0)}
            </td>
          </tr>
        )}

        {course.tee_boxes.length > 0 && (
          <tr>
            <td className="align-middle">
              {course.tee_boxes[teeBoxIndex].tee}{" "}
              {course.length_format === "Y" ? "(Yards)" : "(Meters)"}
            </td>
            {course.scorecard.map((hole) => (
              <td key={hole.hole_number} className="text-center align-middle">
                {hole.tees[`teeBox${teeBoxIndex + 1}`].yards}
              </td>
            ))}
            <td className="text-center align-middle">
              {course.tee_boxes[teeBoxIndex].total_yards}
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
          {range(course.num_holes).map((holeNumber) => (
            <td
              key={holeNumber}
              style={{ width: "40px" }}
              className="text-center align-middle"
            >
              <Form.Control
                min="0"
                value={scores[holeNumber.toString()]}
                onChange={(e) => onScoreChange(holeNumber, e.target.value)}
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
