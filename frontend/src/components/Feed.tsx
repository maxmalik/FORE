import { useEffect, useState } from 'react';

import RoundCard from './RoundCard';

const SAMPLE_DATA = [
  {
    courseInfo: {
      club: "Eagle Creek Golf Club",
      course: "Eagle Creek",
      numHoles: 18,
      location: "Orlando, FL",
    },
    userInfo: {
      name: "Max Malik",
      id: "xxx",
    },
    roundInfo: {
      id: "xxxx",
      datePlayed: "December 9th, 2024",
      scores: {
        1: 4,
        2: 5,
        3: 5,
        4: 5,
        5: 4,
        6: 5,
        7: 4,
        8: 3,
        9: 4,
        10: 4,
        11: 4,
        12: 5,
        13: 4,
        14: 4,
        15: 5,
        16: 4,
        17: 3,
        18: 6,
      },
    },
  },
  // {
  //   courseInfo: {
  //     club: "Royal Saint Cloud Golf Links",
  //   },
  // },
];
function Feed() {
  useEffect(() => {
    document.title = "Feed - FORE!";
  });

  return (
    <>
      {SAMPLE_DATA.map((round) => (
        <RoundCard
          key={round["roundInfo"]["id"]}
          userName={round["userInfo"]["name"]}
          club={round["courseInfo"]["club"]}
          course={round["courseInfo"]["course"]}
          date={round["roundInfo"]["datePlayed"]}
          scores={round["roundInfo"]["scores"]}
        />
      ))}
    </>
  );
}

export default Feed;
