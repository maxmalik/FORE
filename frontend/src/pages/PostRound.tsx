import { useEffect } from 'react';
import Container from 'react-bootstrap/Container';

import ForeNavbar from '../components/ForeNavbar';

function PostRound() {
  useEffect(() => {
    document.title = "Post Round - FORE!";
  });

  return (
    <>
      <ForeNavbar />
      <Container className="my-3">
        <h1>Post Round</h1>
      </Container>
    </>
  );
}

export default PostRound;
