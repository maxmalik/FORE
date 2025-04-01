import Col from "react-bootstrap/Col";

import { callGetUserApi, HandicapData } from "../utils/users/users";
import HandicapChart from "./HandicapChart";

interface HandicapProps {
  handicapData: HandicapData[];
  numRounds: number;
}

function Handicap({ handicapData, numRounds }: HandicapProps) {
  const remainingRounds = 3 - numRounds;
  if (handicapData.length === 0) {
    return (
      <h6>
        Post {remainingRounds} more round{remainingRounds !== 1 && "s"} to have
        a handicap and handicap chart!
      </h6>
    );
  }

  return (
    <>
      <h2>
        Your handicap:{" "}
        {handicapData[handicapData.length - 1].handicap.toFixed(2)}
      </h2>
      <Col md={6}>
        <HandicapChart handicapData={handicapData} />
      </Col>
    </>
  );
}
export default Handicap;
