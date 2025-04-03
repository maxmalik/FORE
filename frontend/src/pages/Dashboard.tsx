import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";

import Handicap from "../components/Dashboard/Handicap";
import RoundsFeed from "../components/Dashboard/RoundsFeed";
import ForeNavbar from "../components/ForeNavbar";
import { callGetRoundsApi, Round } from "../utils/rounds";
import {
  callGetUserApi,
  getUserData,
  HandicapData,
  User,
} from "../utils/users/users";

function Dashboard() {
  const [handicapData, setHandicapData] = useState<HandicapData[] | null>(null);

  const [rounds, setRounds] = useState<Round[]>([]);

  // TODO: use something better than useEffect for fetching
  useEffect(() => {
    const fetchUser = async (userId: string): Promise<User> => {
      return await callGetUserApi(userId);
    };

    const fetchUserRounds = async (roundIds: string[]): Promise<Round[]> => {
      if (!roundIds || roundIds.length === 0) {
        return [];
      }
      return await callGetRoundsApi(roundIds, true);
    };

    const fetchData = async (): Promise<void> => {
      const userId = getUserData().id;

      const user = await fetchUser(userId);

      setHandicapData(user.handicap_data);

      const rounds = await fetchUserRounds(user.rounds);
      setRounds(rounds);
    };

    fetchData();
  }, []);

  return (
    <>
      <ForeNavbar pageName="Main" />
      <Container className="my-3">
        <h1 className="mb-3">Dashboard</h1>
        {handicapData && (
          <>
            <Handicap handicapData={handicapData} numRounds={rounds.length} />{" "}
            <RoundsFeed rounds={rounds} />
          </>
        )}
      </Container>
    </>
  );
}

export default Dashboard;
