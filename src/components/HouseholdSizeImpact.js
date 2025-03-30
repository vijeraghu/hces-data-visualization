// src/components/HouseholdSizeImpact.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './HouseholdSizeImpact.css';

function HouseholdSizeImpact({ data }) {
  return (
    <div className="household-size-impact">
      <h3 className="section-title">Impact of Household Size on Monthly Expenditure</h3>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="size" label={{ value: 'Household Size (Number of Members)', position: 'insideBottom', offset: -30 }} />
            <YAxis label={{ value: 'Average Monthly Expenditure (₹)', angle: -90, position: 'Left', dx: -30 }} />
            <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="expenditure" name="Monthly Expenditure" fill="#0088FE" />
            <Bar dataKey="perCapitaExpenditure" name="Per Capita Expenditure" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="insights">
        <p><strong>Key insights:</strong></p>
        <ul>
          <li>Total household expenditure increases with household size, but at a declining rate</li>
          <li>Per capita expenditure decreases with household size, suggesting economies of scale in consumption</li>
          <li>Larger households (6+ members) spend approximately 2.5x what single-person households spend</li>
        </ul>
      </div>
    </div>
  );
}

export default HouseholdSizeImpact;