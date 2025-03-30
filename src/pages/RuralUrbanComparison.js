// File: src/pages/RuralUrbanComparison.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart, Area
} from 'recharts';
import StateSelector from '../components/StateSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import './RuralUrbanComparison.css';

function RuralUrbanComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('expenditure');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rural-urban-comparison');
        
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

  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Prepare data for expenditure chart
  const expenditureData = data.expenditure.map(item => ({
    sector: item.sector,
    average: item.mean,
    median: item.median
  }));

  // Prepare category expenditure data
  const categories = [...new Set(data.categoryExpenditure.map(item => item.category))];
  const categoryPercentageData = categories.map(category => {
    const ruralItem = data.categoryExpenditure.find(item => item.category === category && item.sector === 'Rural');
    const urbanItem = data.categoryExpenditure.find(item => item.category === category && item.sector === 'Urban');
    
    return {
      category,
      Rural: ruralItem ? ruralItem.percentage : 0,
      Urban: urbanItem ? urbanItem.percentage : 0
    };
  }).sort((a, b) => (b.Rural + b.Urban) / 2 - (a.Rural + a.Urban) / 2);

  // Prepare meals data
  const mealsData = data.meals.map(item => ({
    sector: item.sector,
    home: item.total_meals_home,
    school: item.total_meals_school,
    employer: item.total_meals_employer,
    diversity: item.meal_diversity
  }));

  // Prepare transport data
  const transportModes = [...new Set(data.transportData.map(item => item.transport_mode))];
  const transportData = transportModes.map(mode => {
    const ruralItem = data.transportData.find(item => item.transport_mode === mode && item.sector === 'Rural');
    const urbanItem = data.transportData.find(item => item.transport_mode === mode && item.sector === 'Urban');
    
    return {
      mode,
      Rural: ruralItem ? ruralItem.ownership_rate : 0,
      Urban: urbanItem ? urbanItem.ownership_rate : 0
    };
  });

  return (
    <div className="rural-urban-comparison">
      <div className="page-header">
        <h1>Rural vs Urban Comparison</h1>
        <p className="subtitle">Exploring the differences in expenditure patterns and living standards</p>
        
        <div className="tab-navigation">
          <button 
            className={activeTab === 'expenditure' ? 'active' : ''}
            onClick={() => setActiveTab('expenditure')}
          >
            Expenditure
          </button>
          <button 
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            Expenditure Categories
          </button>
          <button 
            className={activeTab === 'food' ? 'active' : ''}
            onClick={() => setActiveTab('food')}
          >
            Food & Meals
          </button>
          <button 
            className={activeTab === 'services' ? 'active' : ''}
            onClick={() => setActiveTab('services')}
          >
            Essential Services
          </button>
          <button 
            className={activeTab === 'transport' ? 'active' : ''}
            onClick={() => setActiveTab('transport')}
          >
            Transport
          </button>
          <button 
            className={activeTab === 'digital' ? 'active' : ''}
            onClick={() => setActiveTab('digital')}
          >
            Digital Access
          </button>
          <button 
            className={activeTab === 'welfare' ? 'active' : ''}
            onClick={() => setActiveTab('welfare')}
          >
            Welfare Programs
          </button>
        </div>
      </div>

      {/* Expenditure Tab */}
      {activeTab === 'expenditure' && (
        <>
          <section className="comparison-section">
            <h2>Monthly Expenditure Comparison</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={expenditureData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left', dx:-20 }} />
                  <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="average" name="Average Expenditure" fill="#0088FE" />
                  <Bar dataKey="median" name="Median Expenditure" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Key Insights</h3>
              <ul>
                <li>Urban households typically have higher monthly expenditures compared to rural households.</li>
                <li>The gap between average and median expenditure indicates income inequality within each sector.</li>
                <li>Urban areas show greater variance in expenditure patterns.</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Expenditure Categories Tab */}
{activeTab === 'categories' && (
  <>
    <section className="comparison-section">
      <h2>Expenditure Categories as Percentage of Total</h2>
      <div className="chart-container">
        {data.categoryExpenditure && data.categoryExpenditure.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={categories.map(category => {
                // Find Rural and Urban data for this category
                const ruralData = data.categoryExpenditure.find(
                  item => item.category === category && item.sector === 'Rural'
                );
                const urbanData = data.categoryExpenditure.find(
                  item => item.category === category && item.sector === 'Urban'
                );
                
                return {
                  category: category,
                  Rural: ruralData ? ruralData.percentage || 0 : 0,
                  Urban: urbanData ? urbanData.percentage || 0 : 0
                };
              })}
              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[0, 60]} // Adjust based on your data
                label={{ value: 'Percentage (%)', position: 'Bottom', dy:20}} 
              />
              <YAxis dataKey="category" type="category" width={120} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend horizontalAlign="center"
              verticalAlign='top'
              />
              <Bar dataKey="Rural" name="Rural" fill="#0088FE" />
              <Bar dataKey="Urban" name="Urban" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            <p>No expenditure category data available.</p>
            <p>Check the console for error details.</p>
          </div>
        )}
      </div>
      <div className="info-box">
        <h3>Spending Priorities</h3>
        <p>These percentages show how household budgets are allocated across major spending categories.</p>
        <ul>
          <li>Rural households typically spend a larger percentage of their budget on food and essentials.</li>
          <li>Urban households allocate more towards housing, education, and discretionary spending.</li>
          <li>The difference in category allocation follows Engel's Law - as income rises, the proportion spent on necessities falls.</li>
        </ul>
      </div>
    </section>
  </>
)}

      {/* Food & Meals Tab */}
      {activeTab === 'food' && (
        <>
          <section className="comparison-section">
            <h2>Food Expenditure as Percentage of Total</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={data.categoryExpenditure.filter(item => item.category === 'Food')}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis 
                    label={{ value: 'Percentage (%)', angle: -90, position: 'Left' , dx :-10}} 
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="percentage" name="Food Expenditure %" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Food Expenditure Insights</h3>
              <ul>
                <li>Rural households typically spend a larger percentage of their total expenditure on food compared to urban households.</li>
                <li>This follows Engel's Law, which states that as income rises, the proportion spent on food falls.</li>
                <li>The difference in food expenditure percentage is a key indicator of economic well-being.</li>
              </ul>
            </div>
          </section>

          <section className="comparison-section">
            <h2>Meals Source Analysis</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={mealsData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis label={{ value: 'Number of Meals', angle: -90, position: 'Left', dx:-10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="home" name="Meals at Home" fill="#0088FE" stackId="a" />
                  <Bar dataKey="school" name="Meals at School" fill="#00C49F" stackId="a" />
                  <Bar dataKey="employer" name="Meals at Employer" fill="#FFBB28" stackId="a" />
                  
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={mealsData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis label={{ value: 'Meal Diversity Score', angle: -90, position: 'left' , dx :-10}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="diversity" name="Meal Diversity Score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Meal Patterns</h3>
              <ul>
                <li>Rural households consume more meals at home, while urban households have greater access to meals outside.</li>
                <li>School meals play an important role in both sectors but may be more critical in rural areas.</li>
                <li>Urban areas show higher meal diversity, indicating greater food variety and choice.</li>
                <li>These patterns reflect both economic circumstances and lifestyle differences.</li>
              </ul>
            </div>
          </section>

          <section className="comparison-section">
            <h2>Processed Food Consumption</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={data.processedFood}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis label={{ value: 'Monthly Value (₹)', angle: -90, position: 'Left' , dx :-10}} />
                  <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="served_processed_food_monthly_total_value" name="Restaurant/Served Food" fill="#0088FE" />
                  <Bar dataKey="packaged_processed_food_monthly_total_value" name="Packaged Food" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Processed Food Trends</h3>
              <ul>
                <li>Urban households spend significantly more on both restaurant meals and packaged foods.</li>
                <li>This reflects greater availability, higher incomes, and different lifestyles in urban areas.</li>
                <li>The shift toward processed foods is a key indicator of dietary transition across India.</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Transport Tab */}
      {activeTab === 'transport' && (
        <>
          <section className="comparison-section">
            <h2>Vehicle Ownership Rates</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={transportData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mode" />
                  <YAxis 
                    label={{ value: 'Ownership Rate (%)', angle: -90, position: 'Left', dx : -10 }} 
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="Rural" name="Rural" fill="#0088FE" />
                  <Bar dataKey="Urban" name="Urban" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Transport Patterns</h3>
              <ul>
                <li>Two-wheelers (bikes) are the most common motorized transport in both rural and urban areas.</li>
                <li>Urban areas show higher car ownership, reflecting higher incomes and different transportation needs.</li>
                <li>Rural areas have higher ownership of bicycles and animal carts, reflecting both economic circumstances and practical needs.</li>
                <li>Transportation choices are influenced by income, infrastructure, distances traveled, and cultural factors.</li>
              </ul>
            </div>
          </section>

          <section className="comparison-section">
            <h2>Monthly Transport Expenditure</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={data.categoryExpenditure.filter(item => item.category === 'Transport')}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis yAxisId="left" label={{ value: 'Value (₹)', angle: -90, position: 'Left' , dx:-10}} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value, name) => name === 'Value' ? `₹${Math.round(value).toLocaleString()}` : `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" name="Value" fill="#0088FE" />
                  <Line yAxisId="right" type="monotone" dataKey="percentage" name="Percentage of Total" stroke="#FF8042" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Transport Expenditure</h3>
              <ul>
                <li>Urban households spend more on transportation in absolute terms.</li>
                <li>However, as a percentage of total expenditure, transportation costs may be comparable or even higher in rural areas due to longer distances and less efficient transport systems.</li>
                <li>This highlights the importance of affordable and accessible transportation across all regions.</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Essential Services Tab */}
      {activeTab === 'services' && (
        <>
          <section className="comparison-section">
            <h2>Access to Essential Services</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart outerRadius={150} data={[
                  {
                    service: 'Electricity',
                    rural: data.essentialServices.find(item => item.sector === 'Rural')?.electricity_access_rate * 100 || 0,
                    urban: data.essentialServices.find(item => item.sector === 'Urban')?.electricity_access_rate * 100 || 0
                  },
                  {
                    service: 'Piped Water',
                    rural: data.essentialServices.find(item => item.sector === 'Rural')?.piped_water_access_rate * 100 || 0,
                    urban: data.essentialServices.find(item => item.sector === 'Urban')?.piped_water_access_rate * 100 || 0
                  },
                  {
                    service: 'Toilet',
                    rural: data.essentialServices.find(item => item.sector === 'Rural')?.toilet_access_rate * 100 || 0,
                    urban: data.essentialServices.find(item => item.sector === 'Urban')?.toilet_access_rate * 100 || 0
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="service" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Rural" dataKey="rural" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                  <Radar name="Urban" dataKey="urban" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="info-box">
              <h3>Essential Services Gap</h3>
              <ul>
                <li>Urban areas have significantly better access to basic amenities like electricity, piped water, and toilets.</li>
                <li>Access to electricity is the most widespread essential service in both urban and rural areas.</li>
                <li>Piped water access shows the largest urban-rural gap.</li>
                <li>Toilet access improvement is a key focus of government schemes like Swachh Bharat.</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Digital Access Tab */}
      {activeTab === 'digital' && (
        <>
          <section className="comparison-section">
            <h2>Digital Access Comparison</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    {
                      name: 'Internet Access',
                      Rural: data.digitalAccess.find(item => item.sector === 'Rural')?.internet_access_rate * 100 || 0,
                      Urban: data.digitalAccess.find(item => item.sector === 'Urban')?.internet_access_rate * 100 || 0
                    },
                    {
                      name: 'Mobile Ownership',
                      Rural: data.digitalAccess.find(item => item.sector === 'Rural')?.mobile_ownership_rate * 100 || 0,
                      Urban: data.digitalAccess.find(item => item.sector === 'Urban')?.mobile_ownership_rate * 100 || 0
                    },
                    {
                      name: 'Computer/Laptop',
                      Rural: data.digitalAccess.find(item => item.sector === 'Rural')?.laptop_ownership_rate * 100 || 0,
                      Urban: data.digitalAccess.find(item => item.sector === 'Urban')?.laptop_ownership_rate * 100 || 0
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
  label={{ value: 'Percentage (%)', angle: -90, position: 'Left', dx:-10 }} 
  domain={[0, 100]}
/>
<Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
<Legend />
<Bar dataKey="Rural" name="Rural" fill="#0088FE" />
<Bar dataKey="Urban" name="Urban" fill="#00C49F" />
</BarChart>
</ResponsiveContainer>
</div>
<div className="info-box">
<h3>Digital Divide</h3>
<ul>
  <li>A clear urban-rural digital divide exists across all digital technologies.</li>
  <li>Mobile phone ownership shows the highest penetration in both sectors.</li>
  <li>Internet access and computer/laptop ownership show significant disparities between urban and rural areas.</li>
  <li>The digital divide impacts access to information, services, and economic opportunities.</li>
</ul>
</div>
</section>

<section className="comparison-section">
<h2>Online Shopping Behavior</h2>
<div className="chart-container">
<ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={[
      {
        category: 'Online Shopping Expenditure',
        Rural: data.digitalAccess.find(item => item.sector === 'Rural')?.avg_online_expenditure || 0,
        Urban: data.digitalAccess.find(item => item.sector === 'Urban')?.avg_online_expenditure || 0
      }
    ]}
    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis label={{ value: 'Average Monthly Value (₹)', angle: -90, position: 'Left' , dx:-10}} />
    <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
    <Legend />
    <Bar dataKey="Rural" name="Rural" fill="#0088FE" />
    <Bar dataKey="Urban" name="Urban" fill="#00C49F" />
  </BarChart>
</ResponsiveContainer>
</div>
<div className="info-box">
<h3>E-Commerce Adoption</h3>
<ul>
  <li>Urban households spend significantly more on online shopping compared to rural households.</li>
  <li>This gap reflects differences in internet access, digital literacy, and availability of delivery services.</li>
  <li>E-commerce adoption is likely to grow across both sectors but at different rates.</li>
</ul>
</div>
</section>
</>
)}
{/* Welfare Programs Tab */}
{activeTab === 'welfare' && (
<>
<section className="comparison-section">
<h2>Government Program Participation</h2>
<div className="chart-container">
<ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={data.govtPrograms.map(item => ({
      sector: item.sector,
      PMGKY: item.pmgky_participation_rate * 100,
      PMJAY: item.pmjay_participation_rate * 100,
      'LPG Subsidy': item.lpg_subsidy_rate * 100,
      'Free Electricity': item.free_electricity_rate * 100
    }))}
    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="sector" />
    <YAxis 
      label={{ value: 'Participation Rate (%)', angle: -90, position: 'Left', dx:-10 }} 
      domain={[0, 100]}
    />
    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
    <Legend />
    <Bar dataKey="PMGKY" name="PMGKY" fill="#0088FE" />
    <Bar dataKey="PMJAY" name="PMJAY" fill="#00C49F" />
    <Bar dataKey="LPG Subsidy" name="LPG Subsidy" fill="#FFBB28" />
    <Bar dataKey="Free Electricity" name="Free Electricity" fill="#FF8042" />
  </BarChart>
</ResponsiveContainer>
</div>
<div className="info-box">
<h3>Program Reach</h3>
<ul>
  <li>Government program participation varies between rural and urban areas.</li>
  <li>Rural areas typically show higher participation in subsidy programs.</li>
  <li>PMJAY (health insurance) has better urban penetration in some cases.</li>
  <li>LPG subsidy shows high penetration across both sectors due to the Ujjwala scheme.</li>
</ul>
</div>
</section>

{/* Ration Card Distribution */}
<section className="comparison-section">
  <h2>Ration Card Distribution</h2>
  <div className="chart-container">
    {data.rationData && data.rationData.length > 0 ? (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={
            // Restructure data to group by ration_type instead of sector
            [...new Set(data.rationData.map(item => item.ration_type))].map(type => {
              const ruralItem = data.rationData.find(item => 
                item.ration_type === type && item.sector === 'Rural'
              );
              const urbanItem = data.rationData.find(item => 
                item.ration_type === type && item.sector === 'Urban'
              );
              return {
                ration_type: type,
                Rural: ruralItem ? ruralItem.percentage : 0,
                Urban: urbanItem ? urbanItem.percentage : 0
              };
            })
          }
          margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="ration_type" 
            angle={-45} 
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Percentage (%)', angle: -90, position: 'Left', dx:-10 }} 
            domain={[0, 100]}
          />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="Rural" name="Rural" fill="#0088FE" />
          <Bar dataKey="Urban" name="Urban" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="no-data-message">
        No ration card data available or data structure not as expected.
      </div>
    )}
  </div>
  <div className="info-box">
  <h3>Public Distribution System</h3>
<ul>
  <li><strong>AAY</strong> (Antyodaya Anna Yojana): For the poorest of the poor</li>
  <li><strong>BPL</strong> (Below Poverty Line): For economically disadvantaged households</li>
  <li><strong>APL</strong> (Above Poverty Line): For households above the poverty threshold</li>
  <li><strong>PHH</strong> (Priority Household): Under National Food Security Act</li>
  <li><strong>SFSS</strong> (State Food Security Scheme): State-specific food security programs</li>
  <li>The distribution of ration card types reflects both economic conditions and targeting of welfare programs.</li>
</ul>
  </div>
</section>
</>
)}

<div className="conclusion-section">
<h2>Key Takeaways: Rural-Urban Divide</h2>
<div className="takeaways-grid">
<div className="takeaway-card">
<h3>Expenditure Gap</h3>
<p>Urban households spend significantly more than rural households, but also have higher costs of living.</p>
</div>
<div className="takeaway-card">
<h3>Food Priority</h3>
<p>Rural households allocate a larger share of their budget to food, indicating lower disposable income for other expenses.</p>
</div>
<div className="takeaway-card">
<h3>Digital Divide</h3>
<p>The urban-rural digital divide remains substantial and impacts access to services and economic opportunities.</p>
</div>
<div className="takeaway-card">
<h3>Infrastructure Gap</h3>
<p>Essential services like piped water and sanitation still show significant urban-rural disparities.</p>
</div>
</div>
</div>
</div>
);
}

export default RuralUrbanComparison;