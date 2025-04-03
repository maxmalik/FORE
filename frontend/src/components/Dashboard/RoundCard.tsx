import Card from "react-bootstrap/Card";

import { Round } from "../../utils/rounds";
import RoundFeedScorecardTable from "./RoundFeedScorecardTable";

interface RoundCardProps {
  round: Round;
}

function RoundCard({ round }: RoundCardProps) {
  return (
    <Card className="my-3">
      <Card.Body>
        <Card.Title>
          You played <strong>{round.course!.name}</strong> on{" "}
          {new Date(round.date_posted).toLocaleDateString()}
        </Card.Title>
        {round.caption && (
          <p>
            <strong>Caption:</strong> {round.caption}
          </p>
        )}
        <Card.Text as="h6">Scorecard</Card.Text>

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
