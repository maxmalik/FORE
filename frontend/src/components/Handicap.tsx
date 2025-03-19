import { Round } from "../utils/rounds";
import { callGetUserApi } from "../utils/users/users";

interface HandicapProps {
  rounds: Round[];
}

function Handicap({ rounds }: HandicapProps) {
  return <h2>Your Handicap: 7</h2>;
}
export default Handicap;
