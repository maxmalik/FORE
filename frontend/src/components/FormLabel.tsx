import Form from 'react-bootstrap/Form';

import InfoPopover from './InfoPopover';

interface FormLabelProps {
  formLabel: string;
  popoverTitle?: string;
  popoverMessage?: JSX.Element;
}

function FormLabel({
  formLabel,
  popoverTitle,
  popoverMessage,
}: FormLabelProps) {
  return (
    <Form.Label>
      <div className="d-flex align-items-center">
        {formLabel}
        {popoverTitle && popoverMessage ? (
          <InfoPopover title={popoverTitle} message={popoverMessage} />
        ) : null}
      </div>
    </Form.Label>
  );
}

export default FormLabel;
