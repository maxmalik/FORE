import { Round } from "../utils/rounds";

interface RoundCardProps {
  round: Round;
}

function RoundCard({ round }: RoundCardProps) {
  return <div>{round.id}</div>;
}
export default RoundCard;
