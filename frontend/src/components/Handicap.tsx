import { Round } from "../utils/rounds";
import { callGetUserApi } from "../utils/users/users";

interface HandicapProps {
  rounds: Round[];
}

function Handicap() {
  return <h2>Your Handicap: 7</h2>;
}
export default Handicap;
