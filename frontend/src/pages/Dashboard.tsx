import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";

import ForeNavbar from "../components/ForeNavbar";
import Handicap from "../components/Handicap";
import RoundsFeed from "../components/RoundsFeed";
import { callGetRoundsApi, Round } from "../utils/rounds";
import { callGetUserApi, getUserData, User } from "../utils/users/users";

function Dashboard() {
  const [userRounds, setUserRounds] = useState<Round[] | null>(null);

  // TODO: use something better than useEffect for fetching
  useEffect(() => {
    const fetchUser = async (userId: string): Promise<User> => {
      return await callGetUserApi(userId);
    };

    const fetchUserRounds = async (roundIds: string[]): Promise<Round[]> => {
      return await callGetRoundsApi(roundIds);
    };

    const fetchData = async (): Promise<void> => {
      const userId = getUserData().id;

      const user = await fetchUser(userId);

      const rounds = await fetchUserRounds(user.rounds);

      setUserRounds(rounds);
    };

    fetchData();
  }, []);

  return (
    <>
      <ForeNavbar pageName="Main" />
      <Container className="my-3">
        <h1 className="mb-3">Dashboard</h1>
        {userRounds && (
          <>
            <Handicap rounds={userRounds} /> <RoundsFeed rounds={userRounds} />
          </>
        )}
      </Container>
    </>
  );
}

export default Dashboard;
