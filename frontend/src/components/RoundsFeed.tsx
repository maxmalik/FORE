import { Round } from "../utils/rounds";
import RoundCard from "./RoundCard";

interface RoundsFeedProps {
  rounds: Round[];
}

function RoundsFeed({ rounds }: RoundsFeedProps) {
  if (!rounds || rounds.length === 0) {
    return <h4>No rounds posted</h4>;
  }

  return (
    <>
      {rounds.map((round) => (
        <RoundCard key={round.id} round={round} />
      ))}
    </>
  );
}

export default RoundsFeed;
