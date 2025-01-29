import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

import { TeeBox } from "../utils/courses";

interface TeesSelectionModalProps {
  teeBoxes: Array<TeeBox>;
  setSelectedTeeBox: (teeBox: TeeBox | null) => void;
  showTeeBoxSelectionModal: boolean;
  setShowTeeBoxSelectionModal: (show: boolean) => void;
}

function TeeBoxSelectionModal({
  teeBoxes,
  setSelectedTeeBox,
  showTeeBoxSelectionModal,
  setShowTeeBoxSelectionModal,
}: TeesSelectionModalProps) {
  function handleTeeBoxSelection(teeBox: TeeBox) {
    setSelectedTeeBox(teeBox);
    setShowTeeBoxSelectionModal(false);
  }

  return (
    <>
      <Modal show={showTeeBoxSelectionModal}>
        <Modal.Header>
          <Modal.Title>Select Tee Box</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-wrap justify-content-center align-items-center">
          {teeBoxes.map((teeBox) => (
            <Button
              onClick={() => handleTeeBoxSelection(teeBox)}
              className="m-1"
              variant="outline-light"
            >
              {teeBox.tee}
            </Button>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TeeBoxSelectionModal;
