import { useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";

import { ScorecardMode } from "../../utils/rounds";

interface ScorecardModeDropdownProps {
  num_holes: number;
  scores: Record<string, string>;
  scorecardMode: ScorecardMode;
  handleScorecardModeChange: (mode: ScorecardMode) => void;
}

function ScorecardModeDropdown({
  num_holes,
  scores,
  scorecardMode,
  handleScorecardModeChange,
}: ScorecardModeDropdownProps) {
  const [pendingMode, setPendingMode] = useState<ScorecardMode | null>(null);

  function onModeSelect(newMode: ScorecardMode) {
    // If the selected mode is already the current mode
    if (newMode === scorecardMode) {
      // Don't do anything
      return;
    }
    // If the user has not entered anything in the scorecard table
    if (Object.values(scores).every((value) => value === "")) {
      // Don't warn them about them losing their entries, just switch the mode
      handleScorecardModeChange(newMode);
    } else {
      // Mode will be pending until the user accepts
      setPendingMode(newMode);
    }
  }

  function acceptScorecardModeChange() {
    handleScorecardModeChange(pendingMode!);
    setPendingMode(null);
  }

  function declineScorecardModeChange() {
    setPendingMode(null);
  }

  return (
    <>
      <Dropdown className="d-inline-block mx-4">
        <Dropdown.Toggle variant="dark" className="p-1 py-0">
          Mode
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            active={scorecardMode == "all-holes"}
            onClick={() => onModeSelect("all-holes")}
          >
            All holes
          </Dropdown.Item>
          {num_holes === 18 && (
            <Dropdown.Item
              active={scorecardMode == "front-and-back"}
              onClick={() => onModeSelect("front-and-back")}
            >
              Front and back 9 only
            </Dropdown.Item>
          )}
          <Dropdown.Item
            active={scorecardMode == "total-score"}
            onClick={() => onModeSelect("total-score")}
          >
            Total score only
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Modal show={pendingMode !== null}>
        <Modal.Header>
          <Modal.Title>Confirm Mode Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to change the scorecard mode? This will erase
          any previously entered scores.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={declineScorecardModeChange}>
            No
          </Button>
          <Button variant="primary" onClick={acceptScorecardModeChange}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ScorecardModeDropdown;
