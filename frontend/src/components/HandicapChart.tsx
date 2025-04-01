import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { HandicapData } from "../utils/users/users";

interface HandicapChartProps {
  handicapData: HandicapData[];
}

// Format timestamps into "MM/DD"
const formatTime = (time: number) => {
  return new Date(time).toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
  });
};

function HandicapChart({ handicapData }: HandicapChartProps) {
  // Convert timestamps to numbers for recharts
  const data = handicapData.map((entry) => {
    return {
      handicap: entry.handicap.toFixed(2),
      timestamp: new Date(entry.date).getTime(),
    };
  });

  return (
    <div className="my-5" style={{ width: "100%", height: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="white" />
          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTime}
            stroke="white"
          />
          <YAxis stroke="white" />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{
              backgroundColor: "#333", // Dark background for tooltip
              borderRadius: "4px", // Rounded corners
              border: "1px solid #888", // Light border color
            }}
            labelStyle={{
              color: "#FFF", // White text for the label
              fontWeight: "bold", // Bold label text
            }}
            itemStyle={{
              color: "lightgreen", // White color for item text
            }}
          />
          <Line type="monotone" dataKey="handicap" stroke="green" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HandicapChart;
