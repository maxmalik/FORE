import { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useNavigate } from "react-router-dom";

import { getUserData, logout } from "../utils/users/users";

interface ForeNavbarProps {
  pageName: string;
}

function ForeNavbar({ pageName }: ForeNavbarProps) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${pageName} - FORE!`;
  });

  // If a user is logged in, save their name to display in the navbar
  const userData = getUserData();
  let userName: string;
  if (Object.keys(userData).length === 0) {
    userName = "";
  } else {
    userName = userData["name"];
  }

  function getRemainingNavbarContent() {
    // If a user is logged in, display their utilities
    if (userName !== "") {
      return (
        <>
          <Button
            variant="outline-light"
            className="me-2"
            onClick={() => navigate("/post-round")}
          >
            Post Round
          </Button>
          <NavDropdown className="ms-2" title={userName}>
            <NavDropdown.Item onClick={() => navigate("/profile")}>
              Profile
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={() => logout(navigate)}>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </>
      );
    }
    // Otherwise, if no user is logged in, display Register and Login buttons
    return (
      <>
        <Button
          variant="primary"
          className="me-1"
          onClick={() => navigate("/register")}
        >
          Register
        </Button>
        <Button
          variant="light"
          className="ms-1"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </>
    );
  }

  return (
    <Navbar className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/">FORE!</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          {getRemainingNavbarContent()}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default ForeNavbar;
