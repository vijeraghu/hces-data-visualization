// src/components/StateRanking.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StateRanking.css';

function StateRanking({ data }) {
  // Filter out UTs if needed - you can adjust this list as needed
  const UTs = ['Chandigarh', 'Puducherry', 'Andaman and Nicobar Islands', 'Lakshadweep', 
               'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Ladakh'];
  
  // Filter data to get only states (excluding UTs)
  const getOnlyStates = (dataArray) => {
    return dataArray.filter(item => !UTs.includes(item.state)).slice(0, 5);
  };
  
  const topStates = getOnlyStates(data.top);
  const bottomStates = getOnlyStates(data.bottom);
  
  // Prepare data for charts
  const topStateData = topStates.map(state => ({
    state: state.state,
    expenditure: Math.round(state.avg_monthly_exp)
  })).reverse(); // Reverse for horizontal bar chart
  
  const bottomStateData = bottomStates.map(state => ({
    state: state.state,
    expenditure: Math.round(state.avg_monthly_exp)
  }));
  
  return (
    <div className="state-ranking">
      <div className="ranking-grid">
        <div className="ranking-card top-states">
          <h3>Top 5 States by Expenditure</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={topStateData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                <YAxis dataKey="state" type="category" width={100} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="expenditure" fill="#0088FE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="ranking-note">
            <p>States with highest average monthly household expenditure</p>
          </div>
        </div>
        
        <div className="ranking-card bottom-states">
          <h3>Bottom 5 States by Expenditure</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={bottomStateData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                <YAxis dataKey="state" type="category" width={100} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="expenditure" fill="#FF8042" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="ranking-note">
            <p>States with lowest average monthly household expenditure</p>
          </div>
        </div>
      </div>
      
      <div className="spending-gap">
        <div className="gap-highlight">
          <span className="gap-value">
            ₹{Math.round(topStates[0]?.avg_monthly_exp - bottomStates[bottomStates.length-1]?.avg_monthly_exp).toLocaleString()}
          </span>
          <span className="gap-label">Spending gap between highest and lowest states</span>
        </div>
      </div>
    </div>
  );
}

export default StateRanking;