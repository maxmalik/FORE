import Card from "react-bootstrap/Card";

import { Round } from "../utils/rounds";
import RoundFeedScorecardTable from "./RoundFeedScorecardTable";

interface RoundCardProps {
  round: Round;
}

function RoundCard({ round }: RoundCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Text>
          You played {round.course!.name} on{" "}
          {new Date(round.date_posted).toLocaleDateString()}
        </Card.Text>
      </Card.Header>
      <Card.Body>
        <Card.Text>Scorecard</Card.Text>

        <RoundFeedScorecardTable
          roundScorecard={round.scorecard}
          scorecardMode={round.scorecard_mode}
          teeBoxIndex={round.tee_box_index}
          course={round.course!}
        />
      </Card.Body>
    </Card>
  );
}
export default RoundCard;
