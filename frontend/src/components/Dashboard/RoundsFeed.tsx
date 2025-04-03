import { Round } from "../../utils/rounds";
import RoundCard from "./RoundCard";

interface RoundsFeedProps {
  rounds: Round[];
}

function RoundsFeed({ rounds }: RoundsFeedProps) {
  if (!rounds || rounds.length === 0) {
    return <h4>No rounds posted</h4>;
  }

  return (
    <div className="my-3">
      <h4>Your Rounds</h4>
      {rounds.map((round) => (
        <RoundCard key={round.id} round={round} />
      ))}
    </div>
  );
}

export default RoundsFeed;
