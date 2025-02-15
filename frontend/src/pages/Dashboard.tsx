import Container from "react-bootstrap/Container";

import Feed from "../components/Feed";
import ForeNavbar from "../components/ForeNavbar";

function Dashboard() {
  return (
    <>
      <ForeNavbar pageName="Main" />
      <Container className="my-3">
        <h2 className="mb-3">Feed</h2>
        <Feed />
      </Container>
    </>
  );
}

export default Dashboard;
