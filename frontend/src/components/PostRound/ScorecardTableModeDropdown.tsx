import Dropdown from "react-bootstrap/Dropdown";

import { TableMode } from "../../pages/PostRound";

interface ScorecardTableModeDropdownProps {
  num_holes: number;
  selectMode: (mode: TableMode) => void;
}

function ScorecardTableModeDropdown({
  num_holes,
  selectMode,
}: ScorecardTableModeDropdownProps) {
  return (
    <Dropdown className="d-inline-block mx-3">
      <Dropdown.Toggle variant="dark">Mode</Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => selectMode("all-holes")}>
          All holes
        </Dropdown.Item>
        {num_holes === 18 && (
          <Dropdown.Item onClick={() => selectMode("front-and-back")}>
            Front and back 9 only
          </Dropdown.Item>
        )}
        <Dropdown.Item onClick={() => selectMode("total")}>
          Total score only
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default ScorecardTableModeDropdown;
