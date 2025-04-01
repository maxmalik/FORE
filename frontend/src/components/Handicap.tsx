import Col from "react-bootstrap/Col";

import { callGetUserApi, HandicapData } from "../utils/users/users";
import HandicapChart from "./HandicapChart";

interface HandicapProps {
  handicapData: HandicapData[];
}

function Handicap({ handicapData }: HandicapProps) {
  return (
    <>
      <h2>
        Your Handicap:{" "}
        {handicapData.length > 0
          ? handicapData[handicapData.length - 1].handicap.toFixed(2)
          : "N/A"}
      </h2>
      <Col md={6}>
        {handicapData.length >= 2 ? (
          <HandicapChart handicapData={handicapData} />
        ) : (
          <p>
            Post {3 - handicapData.length} more rounds to show the handicap
            chart!
          </p>
        )}
      </Col>
    </>
  );
}
export default Handicap;
