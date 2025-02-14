import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";

interface RoundCardProps {
  userName: string;
  club: string;
  course: string;
  date: string;
  scores: { [key: number]: number };
}

function RoundCard({ userName, club, course, date, scores }: RoundCardProps) {
  let dateExtension;

  if (date == null) {
    dateExtension = "";
  } else {
    dateExtension = " on " + date;
  }
  const titleString = (
    <>
      <strong>{userName}</strong>
      {" played "}
      <strong>{club}</strong>
      {" - "}
      <strong>{course}</strong>
      {dateExtension}
    </>
  );
  return (
    <Card style={{ border: "none" }} className="my-5">
      <Card.Body className="p-0">
        <h6>{titleString}</h6>
        <p>Scorecard:</p>
        <Col lg={8}>
          <Table responsive bordered striped size="sm">
            <thead>
              <tr>
                <th>Hole</th>
                {Object.keys(scores).map((holeNumber) => (
                  <th className="text-center">{holeNumber}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Score</td>
                {Object.values(scores).map((holeScore) => (
                  <td style={{ width: "40px" }} className="text-center">
                    {holeScore || "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </Table>
        </Col>
      </Card.Body>
    </Card>
  );
}

export default RoundCard;
