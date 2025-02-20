import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

import { Course } from "../../utils/courses";

interface TeeBoxSelectionModalProps {
  show: boolean;
  course: Course;
  onTeeBoxSelection: (teeBoxIndex: number) => void;
}

function TeeBoxSelectionModal({
  show,
  course,
  onTeeBoxSelection,
}: TeeBoxSelectionModalProps) {
  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title>Select Tee Box</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-wrap justify-content-center align-items-center">
        {course.tee_boxes.map((teeBox, index) => (
          <Button
            key={index}
            onClick={() => onTeeBoxSelection(index)}
            className="m-1"
            variant="outline-light"
          >
            <div className="fw-bold">{teeBox.tee}</div>
            <div>
              {teeBox.total_yards}{" "}
              {course.length_format === "Y" ? "yards" : "meters"}
            </div>
          </Button>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="link"
          style={{ color: "lightgrey" }}
          onClick={() => onTeeBoxSelection(-1)}
        >
          No thanks, I'll proceed without one
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
export default TeeBoxSelectionModal;
