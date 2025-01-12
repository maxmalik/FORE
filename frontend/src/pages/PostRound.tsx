import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import ForeNavbar from "../components/ForeNavbar";

function PostRound() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const mockData = ["Apple", "Banana", "Orange", "Grape", "Peach", "Mango"];

  const handleSearch = (term: string) => {
    if (term.trim() === "") {
      setResults([]);
      setShowDropdown(false);
    } else {
      const filteredResults = mockData.filter((item) =>
        item.toLowerCase().includes(term.toLowerCase())
      );
      setResults(filteredResults);
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      handleSearch(searchTerm);
    }
  };

  const handleSelect = (result: string) => {
    setSelectedTerm(result);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedTerm(null);
    setSearchTerm("");
    setResults([]);
  };
  return (
    <>
      <ForeNavbar />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Post Round</h1>
        {!selectedTerm ? (
          <Form.Control
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
        ) : (
          <InputGroup>
            <Form.Control type="text" value={selectedTerm} readOnly />
            <Button variant="outline-danger" onClick={handleClearSelection}>
              X
            </Button>
          </InputGroup>
        )}
        {showDropdown && results.length > 0 && (
          <Dropdown.Menu
            show
            style={{ position: "relative", width: "100%", zIndex: 1 }}
          >
            {results.map((result, index) => (
              <Dropdown.Item key={index} onClick={() => handleSelect(result)}>
                {result}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        )}
      </Container>
    </>
  );
}

export default PostRound;
