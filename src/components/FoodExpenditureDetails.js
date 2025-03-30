import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './FoodExpenditureDetails.css';

function FoodExpenditureDetails({ data }) {
  const [chartType, setChartType] = useState('value'); // 'value' or 'percentage'
  
  const chartData = chartType === 'value' ? data.valueData : data.percentageData;
  
  return (
    <div className="food-expenditure-details">
      <div className="controls">
        <button 
          className={chartType === 'value' ? 'active' : ''} 
          onClick={() => setChartType('value')}
        >
          Absolute Value (₹)
        </button>
        <button 
          className={chartType === 'percentage' ? 'active' : ''} 
          onClick={() => setChartType('percentage')}
        >
          Percentage of Food Expenditure
        </button>
      </div>
      
      <div className="expenditure-breakdown">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis 
                label={{ 
                  value: chartType === 'value' ? 'Monthly Expenditure (₹)' : 'Percentage (%)', 
                  angle: -90, 
                  position: 'Left',
                  dx: -20
                }} 
              />
              <Tooltip 
                formatter={(value) => [
                  chartType === 'value' ? `₹${value.toFixed(2)}` : `${value.toFixed(1)}%`,
                  'Expenditure'
                ]} 
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name={chartType === 'value' ? 'Monthly Expenditure' : 'Percentage'} 
                fill="#8884d8" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="info-container">
          <h3>Food Categories Explained</h3>
          <ul>
            <li><strong>Cereals</strong>: Rice, wheat, jowar, bajra, maize, and other cereals</li>
            <li><strong>Pulses</strong>: All types of dals, beans, and legumes</li>
            <li><strong>Milk Products</strong>: Milk, curd, cheese, and other dairy items</li>
            <li><strong>Vegetables</strong>: Fresh vegetables including potatoes and onions</li>
            <li><strong>Fresh Fruits</strong>: Seasonal fruits like bananas, apples, oranges</li>
            <li><strong>Dry Fruits</strong>: Nuts, raisins, dates, and other preserved fruits</li>
            <li><strong>Edible Oils</strong>: All cooking oils used for food preparation</li>
            <li><strong>Meat/Fish/Eggs</strong>: All non-vegetarian food items</li>
            <li><strong>Spices</strong>: Salt, spices, and other condiments</li>
            <li><strong>Sugar & Salt</strong>: Basic flavor enhancers</li>
            <li><strong>Beverages</strong>: Tea, coffee, and other non-alcoholic drinks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FoodExpenditureDetails;