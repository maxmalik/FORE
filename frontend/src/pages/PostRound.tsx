import { useState } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";

import CourseSearchbar from "../components/CourseSearchbar";
import ForeNavbar from "../components/ForeNavbar";
import { Course } from "../utils/courses";

function PostRound() {
  const [selectedResult, setSelectedResult] = useState<Course | null>(null);

  return (
    <>
      <ForeNavbar pageName="Post Round" />
      <Container className="my-5 col-sm-7 col-md-5 col-lg-4 col-xxl-3">
        <h1 className="mb-4 text-center">Post Round</h1>
        <CourseSearchbar
          selectedResult={selectedResult}
          setSelectedResult={setSelectedResult}
        />
        {selectedResult && (
          <Form>
            <h2>scorecard</h2>
            <h2>add a caption</h2>
          </Form>
        )}
      </Container>
    </>
  );
}

export default PostRound;
