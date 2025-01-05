import InputGroup from 'react-bootstrap/InputGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface HiddenPasswordButtonProps {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

function HidePasswordButton({
  showPassword,
  setShowPassword,
}: HiddenPasswordButtonProps) {
  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip>{showPassword ? "Hide password" : "Show password"}</Tooltip>
      }
    >
      <InputGroup.Text
        onClick={() => setShowPassword(!showPassword)}
        style={{ cursor: "pointer" }}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </InputGroup.Text>
    </OverlayTrigger>
  );
}

export default HidePasswordButton;
