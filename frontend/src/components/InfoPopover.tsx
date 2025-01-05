import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { RiInformation2Line } from 'react-icons/ri';

interface InfoPopoverProps {
  title: string;
  message: JSX.Element;
}

function InfoPopover({ message, title }: InfoPopoverProps) {
  return (
    <OverlayTrigger
      placement="right"
      overlay={
        <Popover>
          <Popover.Header>{title}</Popover.Header>
          <Popover.Body>{message}</Popover.Body>
        </Popover>
      }
    >
      <Button className="p-0 ps-2 d-flex" variant="transparent">
        <RiInformation2Line size="20px" />
      </Button>
    </OverlayTrigger>
  );
}

export default InfoPopover;
