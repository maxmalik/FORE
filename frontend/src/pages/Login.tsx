import * as formik from "formik";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

import ForeNavbar from "../components/ForeNavbar";
import HidePasswordButton from "../components/HidePasswordButton";
import { callLoginApi, loginSchema, LoginUser } from "../utils/users/login";
import { updateIfNotSpace, User } from "../utils/users/users";

function Login() {
  const [alertMessage, setAlertMessage] = useState("");
  const [validateOnChange, setValidateOnChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { Formik } = formik;
  const navigate = useNavigate();

  async function handleSubmit(values: LoginUser) {
    // First validate the form field values
    let validatedValues;
    try {
      validatedValues = await loginSchema.validate(values);
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

    // If validation passed, attempt to log the user in by calling the Login API
    let response: Response;
    try {
      response = await callLoginApi(validatedValues);
    } catch (error) {
      setAlertMessage(
        `The following internal error occurred while logging in: ${
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
    // Handle error response code 404 (User not found)
    else if (response.status === 404) {
      // Attempt to present the user with the detail
      if (responseBody != null && "detail" in responseBody) {
        setAlertMessage(responseBody["detail"]);
      } else {
        setAlertMessage("Error: Server returned code 404 with no detail");
      }
      return;
    }
    // Handle error response code 401 (Incorrect password)
    else if (response.status === 401) {
      // Attempt to present the user with the detail
      if (responseBody != null && "detail" in responseBody) {
        setAlertMessage(responseBody["detail"]);
      } else {
        setAlertMessage("Error: Server returned code 401 with no detail");
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
    navigate("/dashboard");
  }

  return (
    <>
      <ForeNavbar pageName="Login" />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Login</h1>
        <Alert
          dismissible
          variant="danger"
          show={alertMessage != ""}
          onClose={() => setAlertMessage("")}
        >
          {alertMessage}
        </Alert>
        <Formik<LoginUser>
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
          initialValues={{
            usernameOrEmail: "",
            password: "",
          }}
          validateOnChange={validateOnChange}
        >
          {({ handleSubmit, handleChange, values, touched, errors }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group
                  as={Col}
                  controlId="validationFormikUsernameOrEmail"
                >
                  <Form.Label>Username or Email</Form.Label>
                  <Form.Control
                    type="text"
                    name="usernameOrEmail"
                    placeholder="Username or Email"
                    value={values.usernameOrEmail}
                    onChange={(event) =>
                      updateIfNotSpace(
                        event as React.ChangeEvent<HTMLInputElement>,
                        handleChange
                      )
                    }
                    isInvalid={!!errors.usernameOrEmail}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.usernameOrEmail}
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="validationFormikPassword">
                  <Form.Label>Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={values.password}
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
              <Button
                type="submit"
                className="w-100"
                onClick={() => setValidateOnChange(true)}
              >
                Log in
              </Button>
            </Form>
          )}
        </Formik>
        <div className="d-flex mt-3 align-items-center">
          Don't have an account? &nbsp;
          <a href="/register"> Register</a>
        </div>
      </Container>
    </>
  );
}

export default Login;
