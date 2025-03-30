import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ExpenditureBreakdown.css';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 15) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 15) * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#333" textAnchor="middle" fontSize="12">
      <tspan x={x} dy="0">{name}</tspan>
      <tspan x={x} dy="14">{(percent * 100).toFixed(1)}%</tspan>
    </text>
  );
};
function ExpenditureBreakdown({ data }) {
  

  return (
    <div className="expenditure-breakdown">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={120}  // Balanced pie radius
              fill="#8884d8"
              dataKey="value"
              nameKey="category"
              label={renderCustomLabel}  // Custom label for better positioning
              labelLine={false}  // Removes default label lines for a cleaner look
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="info-container">
        <h3>Understanding Expenditure Categories</h3>
        <ul>
          <li><strong>Food</strong>: Includes cereals, pulses, milk products, vegetables, fruits, etc.</li>
          <li><strong>Housing</strong>: Rent, imputed rent, and home maintenance</li>
          <li><strong>Fuel & Light</strong>: Cooking fuel, electricity, and other lighting</li>
          <li><strong>Clothing & Footwear</strong>: All apparel and footwear purchases</li>
          <li><strong>Education</strong>: School/college fees, books, and related expenses</li>
          <li><strong>Healthcare</strong>: Medical hospitalization and non-hospitalization expenses</li>
          <li><strong>Transport</strong>: Conveyance and vehicle maintenance</li>
          <li><strong>Others</strong>: Includes recreation, personal care, and miscellaneous items</li>
        </ul>
      </div>
    </div>
  );
}

export default ExpenditureBreakdown;
