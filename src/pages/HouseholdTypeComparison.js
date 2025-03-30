// File: src/pages/HouseholdTypeComparison.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import './HouseholdTypeComparison.css';

function HouseholdTypeComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('expenditure');
  const [selectedAsset, setSelectedAsset] = useState('tv');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/household-type-comparison');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!data) return <div className="error-message">No data available</div>;

  // Define household type explanations for the info boxes
  const householdTypeExplanations = {
    'Self-employment (Agriculture)': 'Households whose primary income source is from agricultural activities they operate themselves.',
    'Self-employment (Non-Agriculture)': 'Households whose primary income comes from non-agricultural businesses they own or operate.',
    'Regular wage/salary': 'Households with members employed in regular jobs with steady salaries.',
    'Casual Labour (Agriculture)': 'Households dependent on daily/seasonal agricultural labor without permanent employment.',
    'Casual Labour (Non-Agriculture)': 'Households dependent on daily/casual labor in non-agricultural sectors.',
    'Others': 'Households with income from sources like pensions, remittances, or other miscellaneous sources.'
  };

  // Function to get household type explanation
  const getHouseholdTypeExplanation = (type) => {
    return householdTypeExplanations[type] || 'No explanation available';
  };

  // Prepare data for expenditure chart
  const expenditureData = data.expenditureByType.map(item => ({
    type: item.hh_type,
    average: item.avg_monthly_exp,
    count: item.sample_size
  }));

  // Prepare data for food percentage chart
  const foodPercentageData = data.foodExpenditureByType.map(item => ({
    type: item.hh_type,
    value: item.food_pct
  }));

  // Prepare asset ownership data
  const prepareAssetData = () => {
    // Get unique household types
    const householdTypes = [...new Set(data.assetOwnershipByType.map(item => item.hh_type))];
    
    // Get unique assets
    const assets = [...new Set(data.assetOwnershipByType.map(item => item.asset))];
    
    // Create formatted asset options for selection
    const assetOptions = assets.map(asset => ({
      value: asset,
      label: asset.charAt(0).toUpperCase() + asset.slice(1)
    }));
    
    // Create data for the selected asset
    const assetData = householdTypes.map(type => {
      const assetItem = data.assetOwnershipByType.find(
        item => item.hh_type === type && item.asset === selectedAsset
      );
      
      return {
        hh_type: type,
        ownership_rate: assetItem ? assetItem.ownership_rate * 100 : 0
      };
    });
    
    return { assetOptions, assetData };
  };

  const { assetOptions, assetData } = prepareAssetData();

  return (
    <div className="household-type-comparison">
      <div className="page-header">
        <h1>Household Type Comparison</h1>
        <p className="subtitle">Exploring economic indicators across different household categories</p>
      </div>

      <div className="view-selector">
        <button 
          className={selectedView === 'expenditure' ? 'active' : ''}
          onClick={() => setSelectedView('expenditure')}
        >
          Expenditure
        </button>
        <button 
          className={selectedView === 'food' ? 'active' : ''}
          onClick={() => setSelectedView('food')}
        >
          Food Expenditure
        </button>
        <button 
          className={selectedView === 'assets' ? 'active' : ''}
          onClick={() => setSelectedView('assets')}
        >
          Asset Ownership
        </button>
        <button 
          className={selectedView === 'education' ? 'active' : ''}
          onClick={() => setSelectedView('education')}
        >
          Education
        </button>
        <button 
          className={selectedView === 'nonessentials' ? 'active' : ''}
          onClick={() => setSelectedView('nonessentials')}
        >
          Non-Essentials
        </button>
      </div>

      {/* Expenditure View */}
      {selectedView === 'expenditure' && (
        <section className="comparison-section">
          <h2>Monthly Expenditure by Household Type</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={expenditureData}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left', dx: -10 }} />
                <Tooltip 
                  formatter={(value) => `₹${Math.round(value).toLocaleString()}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label"><strong>{label}</strong></p>
                          <p className="tooltip-desc">{getHouseholdTypeExplanation(label)}</p>
                          <p className="tooltip-value">Average Expenditure: ₹{Math.round(payload[0].value).toLocaleString()}</p>
                          <p className="tooltip-sample">Sample Size: {expenditureData.find(item => item.type === label)?.count.toLocaleString() || 'N/A'} households</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign='top'/>
                <Bar dataKey="average" name="Average Monthly Expenditure" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Expenditure Analysis</h3>
            <ul>
              <li>Regular wage/salary earners typically have the highest monthly expenditure.</li>
              <li>Casual laborers, especially in agriculture, have the lowest expenditure levels.</li>
              <li>Self-employed non-agricultural households often show higher expenditure than agricultural ones.</li>
              <li>Expenditure patterns reflect income levels and economic stability across different household types.</li>
            </ul>
          </div>
        </section>
      )}

      {/* Food Expenditure View */}
      {selectedView === 'food' && (
        <section className="comparison-section">
          <h2>Food Expenditure Percentage by Household Type</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={foodPercentageData}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Food Expenditure (%)', angle: -90, position: 'Left' , dx: -10}} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(1)}%`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label"><strong>{label}</strong></p>
                          <p className="tooltip-desc">{getHouseholdTypeExplanation(label)}</p>
                          <p className="tooltip-value">Food Expenditure: {payload[0].value.toFixed(1)}% of total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign='top'/>
                <Bar dataKey="value" name="Food Expenditure %" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Food Expenditure Insights</h3>
            <ul>
              <li>Following Engel's Law, lower-income household types spend a higher percentage of their budget on food.</li>
              <li>Casual laborers typically allocate the highest percentage of expenditure to food.</li>
              <li>Regular wage/salary households can afford to spend more on non-food items.</li>
              <li>The percentage of income spent on food is a key indicator of economic well-being.</li>
            </ul>
          </div>
        </section>
      )}

      {/* Asset Ownership View */}
      {selectedView === 'assets' && (
        <section className="comparison-section">
          <h2>Asset Ownership by Household Type</h2>
          
          <div className="asset-selector">
            <p>Select an asset to view ownership rates:</p>
            <div className="asset-buttons">
              {assetOptions.map(option => (
                <button
                  key={option.value}
                  className={selectedAsset === option.value ? 'active' : ''}
                  onClick={() => setSelectedAsset(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={assetData}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hh_type" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Ownership Rate (%)', angle: -90, position: 'Left', dx: -10 }} 
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend verticalAlign='top'/>
                <Bar 
                  dataKey="ownership_rate" 
                  name={`${selectedAsset.charAt(0).toUpperCase() + selectedAsset.slice(1)} Ownership`} 
                  fill="#0088FE" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="info-box">
            <h3>Asset Ownership Patterns</h3>
            <ul>
              <li>Regular wage/salary households have the highest ownership rates for most assets.</li>
              <li>Mobile phones have the highest penetration across all household types.</li>
              <li>Luxury items like ACs and cars show the widest ownership gap between household types.</li>
              <li>Asset ownership directly correlates with expenditure capacity and economic stability.</li>
            </ul>
          </div>
        </section>
      )}

      {/* Education View */}
      {selectedView === 'education' && (
        <section className="comparison-section">
          <h2>Average Education Years by Household Type</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={data.educationByType}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hh_type" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Average Education (Years)', angle: -90, position: 'Left', dx: -10 }} 
                  domain={[0, 15]}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(1)} years`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label"><strong>{label}</strong></p>
                          <p className="tooltip-desc">{getHouseholdTypeExplanation(label)}</p>
                          <p className="tooltip-value">Average Education: {payload[0].value.toFixed(1)} years</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign='top' />
                <Bar dataKey="avg_education_years" name="Average Education Years" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Education Level Insights</h3>
            <ul>
              <li>Regular wage/salary households typically have the highest education levels.</li>
              <li>Casual laborers, especially in agriculture, have the lowest average education.</li>
              <li>Education levels strongly correlate with household income and expenditure capacity.</li>
              <li>Higher education is associated with stable employment and better living standards.</li>
              <li>Self-employed non-agricultural households often show better education levels than agricultural ones.</li>
            </ul>
          </div>
        </section>
      )}

      {/* Non-Essentials View */}
      {selectedView === 'nonessentials' && (
        <section className="comparison-section">
          <h2>Non-Essential Expenditure by Household Type</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={data.nonEssentialByType}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hh_type" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Monthly Value (₹)', angle: -90, position: 'Left', dx: -10 }} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} 
                  domain={[0, 10]}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label"><strong>{label}</strong></p>
                          <p className="tooltip-desc">{getHouseholdTypeExplanation(label)}</p>
                          <p className="tooltip-value">Non-Essential Expenditure: ₹{Math.round(payload[0].value).toLocaleString()}</p>
                          <p className="tooltip-percent">Percentage of Total: {payload[1].value.toFixed(1)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign='top'/>
                <Bar 
                  dataKey="non_essential_monthly_value" 
                  name="Monthly Non-Essential Expenditure" 
                  fill="#FF8042" 
                  yAxisId="left"
                />
                <Bar 
                  dataKey="non_essential_pct" 
                  name="% of Total Expenditure" 
                  fill="#82ca9d" 
                  yAxisId="right"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Non-Essential Spending Patterns</h3>
            <p>Non-essential items include tobacco, pan, intoxicants, and entertainment.</p>
            <ul>
              <li>In absolute terms, higher-income households spend more on non-essentials.</li>
              <li>As a percentage of total expenditure, some lower-income groups spend proportionally more on these items.</li>
              <li>Regular wage/salary earners have the highest absolute spending on non-essentials.</li>
              <li>Non-essential spending patterns vary significantly across household types and reflect both cultural patterns and disposable income.</li>
            </ul>
          </div>
        </section>
      )}

      <div className="conclusion-section">
        <h2>Key Insights Across Household Types</h2>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <h3>Economic Stratification</h3>
            <p>Clear economic stratification exists across household types, with regular wage/salary earners at the top and casual agricultural laborers at the bottom.</p>
          </div>
          <div className="takeaway-card">
            <h3>Food Security</h3>
            <p>Lower-income household types spend a significantly higher proportion of their budget on food, indicating less flexibility for other expenditures.</p>
          </div>
          <div className="takeaway-card">
            <h3>Material Standard</h3>
            <p>Asset ownership shows stark differences, with digital assets (mobile phones) showing the best penetration across all household types.</p>
          </div>
          <div className="takeaway-card">
            <h3>Human Capital</h3>
            <p>Educational attainment varies dramatically by household type and strongly correlates with economic outcomes and expenditure patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HouseholdTypeComparison;