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
        {handicapData[handicapData.length - 1].handicap.toFixed(2)}
      </h2>
      <Col md={6}>
        {handicapData.length >= 2 ? (
          <HandicapChart handicapData={handicapData} />
        ) : (
          <p>Post more rounds to have a proper handicap chart</p>
        )}
      </Col>
    </>
  );
}
export default Handicap;
