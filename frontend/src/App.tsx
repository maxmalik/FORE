import "bootstrap/dist/css/bootstrap.min.css";

import Container from "react-bootstrap/Container";

import ForeNavbar from "./components/ForeNavbar";

function App() {
  return (
    <>
      <ForeNavbar pageName="App" />
      <Container className="my-5">
        <h1>FORE!</h1>
      </Container>
    </>
  );
}

export default App;
