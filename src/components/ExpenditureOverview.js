import React from 'react';
import './ExpenditureOverview.css';

function ExpenditureOverview({ data }) {
  return (
    <div className="expenditure-overview">
      <div className="overview-card">
        <div className="overview-value">₹{Math.round(data.overall_monthly_exp).toLocaleString()}</div>
        <div className="overview-label">Average Monthly Expenditure</div>
      </div>
      
      <div className="overview-card">
        <div className="overview-value">₹{Math.round(data.rural_monthly_exp).toLocaleString()}</div>
        <div className="overview-label">Rural Monthly Expenditure</div>
      </div>
      
      <div className="overview-card">
        <div className="overview-value">₹{Math.round(data.urban_monthly_exp).toLocaleString()}</div>
        <div className="overview-label">Urban Monthly Expenditure</div>
      </div>
      
      <div className="overview-card">
        <div className="overview-value">{data.sample_size.toLocaleString()}</div>
        <div className="overview-label">Households Surveyed</div>
      </div>
    </div>
  );
}

export default ExpenditureOverview;