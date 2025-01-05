import * as formik from 'formik';
import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import ForeNavbar from '../components/ForeNavbar';
import FormLabel from '../components/FormLabel';
import HidePasswordButton from '../components/HidePasswordButton';
import { callRegisterApi, registerSchema, RegisterUser } from '../utils/users/register';
import { updateIfNotSpace, User } from '../utils/users/users';

const USERNAME_REQUIREMENTS = (
  <ul>
    <li>3-20 characters</li>
    <li>Contains only alphanumeric characters, underscore, and dot.</li>
    <li>
      Underscores and dots can't be at the start or end of a username, next to
      each other, or used multiple times in a row.
    </li>
  </ul>
);

const PASSWORD_REQUIREMENTS = (
  <ul>
    <li>8-20 characters</li>
    <li>At least 1 lowercase letter</li>
    <li>At least 1 uppercase letter</li>
    <li>At least 1 digit</li>
    <li>At least 1 of the following special symbols: #?!@$%^&*-</li>
  </ul>
);

function Register() {
  const [alertMessage, setAlertMessage] = useState("");
  const [validateOnChange, setValidateOnChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const { Formik } = formik;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register - FORE!";
  });

  async function handleSubmit(values: RegisterUser): Promise<void> {
    // First validate the form field values
    let validatedValues;
    try {
      validatedValues = await registerSchema.validate(values);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // If validation failed, set the alert message to the error messages
        let alertMessage: string = "Validation failed:\n";
        error.errors.forEach((errorMessage) => {
          alertMessage += `- ${errorMessage}\n`;
        });
        setAlertMessage(alertMessage);
      } else {
        setAlertMessage(
          "An unexpected error occurred during validation: " + error
        );
      }
      return;
    }

    // If validation passed, attempt to register the user by calling the register API
    let response: Response;
    try {
      response = await callRegisterApi(validatedValues);
    } catch (error) {
      setAlertMessage(
        `The following internal error occurred while registering: ${
          error as string
        }`
      );
      return;
    }

    const responseBody = await response.json();

    // Handle error response code 422 (Pydantic validation error on backend)
    if (response.status === 422) {
      setAlertMessage("Validation error occurred on backend.");
      return;
    }
    // Handle error response code 409 (username and/or email is taken)
    else if (response.status === 409) {
      // Attempt to present the user with the detail
      if (responseBody != null && "detail" in responseBody) {
        setAlertMessage(responseBody["detail"]);
      } else {
        setAlertMessage("Error: Server returned code 409 with no detail");
      }
      return;
    }
    // Other (unexpected) error code
    else if (!response.ok) {
      setAlertMessage("Unexpected error occurred. Please try again later.");
      return;
    }

    // Save the user's data (log them in) and redirect to main page
    const user = responseBody as User;
    localStorage.setItem("userData", JSON.stringify(user));
    navigate("/main");
  }

  return (
    <>
      <ForeNavbar />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Register</h1>
        <Alert
          dismissible
          variant="danger"
          show={alertMessage != ""}
          onClose={() => setAlertMessage("")}
        >
          {alertMessage}
        </Alert>
        <Formik<RegisterUser>
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
          initialValues={{
            name: "",
            username: "",
            email: "",
            password: "",
            passwordConfirmation: "",
          }}
          validateOnChange={validateOnChange}
        >
          {({ handleSubmit, handleChange, values, touched, errors }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="validationFormikName">
                  <FormLabel formLabel="Name" />
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Tiger Woods"
                    value={values.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="validationFormikUsername">
                  <FormLabel
                    formLabel="Username"
                    popoverTitle="Username requirements"
                    popoverMessage={USERNAME_REQUIREMENTS}
                  />
                  <InputGroup hasValidation>
                    <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="tiger_woods1975"
                      value={values.username}
                      // Don't allow spaces in username input
                      onChange={(event) =>
                        updateIfNotSpace(
                          event as React.ChangeEvent<HTMLInputElement>,
                          handleChange
                        )
                      }
                      isInvalid={!!errors.username}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="validationFormikEmail">
                  <FormLabel formLabel="Email" />
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="tigerwoods@gmail.com"
                    value={values.email}
                    // Don't allow spaces in email input
                    onChange={(event) =>
                      updateIfNotSpace(
                        event as React.ChangeEvent<HTMLInputElement>,
                        handleChange
                      )
                    }
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="validationFormikPassword">
                  <FormLabel
                    formLabel="Password"
                    popoverTitle="Password requirements"
                    popoverMessage={PASSWORD_REQUIREMENTS}
                  />
                  <InputGroup hasValidation>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={values.password}
                      // Don't allow spaces in password input
                      onChange={(event) =>
                        updateIfNotSpace(
                          event as React.ChangeEvent<HTMLInputElement>,
                          handleChange
                        )
                      }
                      isInvalid={!!errors.password}
                    />
                    <HidePasswordButton
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group
                  as={Col}
                  controlId="validationFormikPasswordConfirmation"
                >
                  <FormLabel formLabel="Confirm Password" />
                  <InputGroup hasValidation>
                    <Form.Control
                      type={showPasswordConfirmation ? "text" : "password"}
                      name="passwordConfirmation"
                      placeholder="Confirm Password"
                      value={values.passwordConfirmation}
                      // Don't allow spaces in password confirmation input
                      onChange={(event) =>
                        updateIfNotSpace(
                          event as React.ChangeEvent<HTMLInputElement>,
                          handleChange
                        )
                      }
                      isInvalid={!!errors.passwordConfirmation}
                    />
                    <HidePasswordButton
                      showPassword={showPasswordConfirmation}
                      setShowPassword={setShowPasswordConfirmation}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.passwordConfirmation}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Button
                type="submit"
                className="w-100"
                onClick={() => setValidateOnChange(true)}
              >
                Register
              </Button>
            </Form>
          )}
        </Formik>
        <div className="d-flex mt-3 align-items-center">
          Already have an account?
          <Button
            variant="link"
            className="p-0 px-2"
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
        </div>
      </Container>
    </>
  );
}

export default Register;
