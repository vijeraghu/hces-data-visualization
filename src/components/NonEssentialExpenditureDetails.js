import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './NonEssentialExpenditureDetails.css';

function NonEssentialExpenditureDetails({ data }) {
  return (
    <div className="non-essential-expenditure">
      <div className="chart-container">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
            <YAxis label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left' , dx: -20}} />
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="value" name="Monthly Expenditure" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="info-box">
        <h3>Non-Essential Categories</h3>
        <p>These items, while common in household expenditure, are often considered non-essential:</p>
        <ul>
          <li><strong>Pan</strong>: Betel leaves and areca nuts</li>
          <li><strong>Tobacco</strong>: Cigarettes, bidis, and other tobacco products</li>
          <li><strong>Intoxicants</strong>: Alcoholic beverages and other intoxicants</li>
          <li><strong>Entertainment</strong>: Cinema, theater, and other recreational activities</li>
        </ul>
        <p className="note">Note: Government policies often target reduction in consumption of these items through taxation and awareness campaigns due to their health implications.</p>
      </div>
    </div>
  );
}

export default NonEssentialExpenditureDetails;