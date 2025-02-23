import { Round } from "../utils/rounds";
import RoundCard from "./RoundCard";

interface RoundsFeedProps {
  rounds: Round[];
}

function RoundsFeed({ rounds }: RoundsFeedProps) {
  return (
    <>
      {rounds.map((round) => (
        <RoundCard key={round.id} round={round} />
      ))}
    </>
  );
}

export default RoundsFeed;
