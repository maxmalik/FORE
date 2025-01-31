import InputGroup from "react-bootstrap/InputGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { IoMdClose } from "react-icons/io";

interface ClearCourseSelectionButtonProps {
  onClick: () => void;
}

function ClearCourseSelectionButton({
  onClick,
}: ClearCourseSelectionButtonProps) {
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>Clear Selection</Tooltip>}
    >
      <InputGroup.Text
        className="px-2"
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <IoMdClose size={25} />
      </InputGroup.Text>
    </OverlayTrigger>
  );
}

export default ClearCourseSelectionButton;
