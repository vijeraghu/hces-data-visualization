// File: src/pages/EssentialServices.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import StateSelector from '../components/StateSelector';
import './EssentialServices.css';

function EssentialServices() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedState, setSelectedState] = useState('All India');
  const [selectedService, setSelectedService] = useState('electricity');

  
  // Part of EssentialServices.js - update the useEffect to depend on selectedState
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      // Add the state parameter to the API call
      const url = selectedState === 'All India' 
        ? '/api/essential-services' 
        : `/api/essential-services?state=${selectedState}`;
      
      const response = await fetch(url);
      
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
}, [selectedState]); // Add selectedState as a dependency

  const handleStateChange = (state) => {
    setSelectedState(state);
  };

  const handleServiceChange = (service) => {
    setSelectedService(service);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!data) return <div className="error-message">No data available</div>;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Filter data for selected state if needed
  const stateSpecificData = selectedState === 'All India' 
    ? data 
    : {
        ...data,
        servicesByState: data.servicesByState.filter(item => item.state === selectedState)
      };
  
  // Prepare data for the radar chart
  const radarData = [
    { service: 'Electricity', rural: data.servicesBySector.find(item => item.sector === 'Rural')?.electricity_access_rate * 100 || 0, urban: data.servicesBySector.find(item => item.sector === 'Urban')?.electricity_access_rate * 100 || 0 },
    { service: 'Piped Water', rural: data.servicesBySector.find(item => item.sector === 'Rural')?.piped_water_access_rate * 100 || 0, urban: data.servicesBySector.find(item => item.sector === 'Urban')?.piped_water_access_rate * 100 || 0 },
    { service: 'Toilet', rural: data.servicesBySector.find(item => item.sector === 'Rural')?.toilet_access_rate * 100 || 0, urban: data.servicesBySector.find(item => item.sector === 'Urban')?.toilet_access_rate * 100 || 0 }
  ];

  // Prepare data for services vs expenditure chart
  const servicesExpData = data.servicesVsExpenditure.map(item => ({
    score: `${item.service_access_score} Services`,
    avgExp: item.avg_monthly_exp,
    medianExp: item.median_monthly_exp,
    sampleSize: item.sample_size
  }));

  // Get top and bottom 5 states for each service
  const getTopBottomStates = (serviceName) => {
    const serviceData = data.servicesByState.filter(item => item.service === serviceName);
    
    // Sort by access rate descending
    const sortedData = [...serviceData].sort((a, b) => b.access_rate - a.access_rate);
    
    return {
      top5: sortedData.slice(0, 5),
      bottom5: sortedData.slice(-5)
    };
  };

  // Get data for the selected service
  const selectedServiceData = getTopBottomStates(selectedService);
  
  // Service names mapping for display
  const serviceDisplayNames = {
    'electricity': 'Electricity',
    'piped_water': 'Piped Water',
    'toilet': 'Toilet'
  };

  return (
    <div className="essential-services">
      <div className="page-header">
        <h1>Essential Services Access</h1>
        <p className="subtitle">Analyzing access to electricity, water and sanitation</p>
        <StateSelector 
          selectedState={selectedState} 
          onStateChange={handleStateChange} 
        />
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Electricity Access</h3>
          <div className="stat-value">{Math.round(data.servicesBySector.find(item => item.sector === 'Rural')?.electricity_access_rate * 100 + data.servicesBySector.find(item => item.sector === 'Urban')?.electricity_access_rate * 100) / 2}%</div>
          <p>average</p>
        </div>
        <div className="stat-card">
          <h3>Piped Water Access</h3>
          <div className="stat-value">{Math.round(data.servicesBySector.find(item => item.sector === 'Rural')?.piped_water_access_rate * 100 + data.servicesBySector.find(item => item.sector === 'Urban')?.piped_water_access_rate * 100) / 2}%</div>
          <p>average</p>
        </div>
        <div className="stat-card">
          <h3>Toilet Access</h3>
          <div className="stat-value">{Math.round(data.servicesBySector.find(item => item.sector === 'Rural')?.toilet_access_rate * 100 + data.servicesBySector.find(item => item.sector === 'Urban')?.toilet_access_rate * 100) / 2}%</div>
          <p>average</p>
        </div>
      </div>

      <section className="comparison-section">
        <h2>Rural vs Urban Service Access</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="service" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Rural" dataKey="rural" stroke="#0088FE" fill="#0088FE" fillOpacity={0.5} />
              <Radar name="Urban" dataKey="urban" stroke="#00C49F" fill="#00C49F" fillOpacity={0.5} />
              <Legend />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Urban-Rural Service Gap</h3>
          <ul>
            <li>Urban areas consistently have better access to all essential services compared to rural areas.</li>
            <li>Electricity has the highest access rates and smallest urban-rural gap.</li>
            <li>Piped water shows the largest disparity between urban and rural areas.</li>
          </ul>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Service Access by Social Group</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data.servicesBySocialGroup.map(item => ({
                ...item,
                electricity_access_rate: item.electricity_access_rate * 100,
                piped_water_access_rate: item.piped_water_access_rate * 100,
                toilet_access_rate: item.toilet_access_rate * 100,
                
              }))}
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="social_group" 
                angle={-45} 
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Access Rate (%)', angle: -90, position: 'Left', dx : -10 }} 
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="electricity_access_rate" name="Electricity" fill="#0088FE" />
              <Bar dataKey="piped_water_access_rate" name="Piped Water" fill="#00C49F" />
              <Bar dataKey="toilet_access_rate" name="Toilet" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Social Disparities in Service Access</h3>
          <ul>
            <li>Access to essential services varies significantly across social groups.</li>
            <li>These disparities reflect broader socioeconomic inequalities in Indian society.</li>
            <li>Electricity shows the smallest gap between social groups.</li>
          </ul>
        </div>
      </section>

<section className="comparison-section">
  <h2>State-wise Service Comparison</h2>
  <div className="service-selector">
    <p>Select a service to view state rankings:</p>
    <div className="service-buttons">
      <button 
        className={selectedService === 'electricity' ? 'active' : ''}
        onClick={() => handleServiceChange('electricity')}
      >
        Electricity
      </button>
      <button 
        className={selectedService === 'piped_water' ? 'active' : ''}
        onClick={() => handleServiceChange('piped_water')}
      >
        Piped Water
      </button>
      <button 
        className={selectedService === 'toilet' ? 'active' : ''}
        onClick={() => handleServiceChange('toilet')}
      >
        Toilet
      </button>
    </div>
  </div>
  
  {/* Use the topBottomStates data from the API */}
  {data.topBottomStates && data.topBottomStates[selectedService] && (
    <>
      <h3>Top 5 States - {serviceDisplayNames[selectedService]} Access</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.topBottomStates[selectedService].top.map(item => ({
              ...item,
              access_rate: item.access_rate * 100
            }))}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" />
            <YAxis 
              label={{ value: 'Access Rate (%)', angle: -90, position: 'Left', dx:-10 }} 
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="access_rate" name={`${serviceDisplayNames[selectedService]} Access`} fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <h3>Bottom 5 States - {serviceDisplayNames[selectedService]} Access</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.topBottomStates[selectedService].bottom.map(item => ({
              ...item,
              access_rate: item.access_rate * 100
            }))}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" />
            <YAxis 
              label={{ value: 'Access Rate (%)', angle: -90, position: 'Left', dx: -10 }} 
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="access_rate" name={`${serviceDisplayNames[selectedService]} Access`} fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )}
  
  <div className="info-box">
    <h3>Regional Disparities</h3>
    <p>The gap between the best and worst-performing states highlights significant regional disparities in infrastructure development and service delivery.</p>
  </div>
</section>
      <section className="comparison-section">
        <h2>Service Access vs. Monthly Expenditure</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={servicesExpData}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score" />
              <YAxis 
                label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left' ,dx:-30}} 
              />
              <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="avgExp" name="Average Monthly Expenditure" fill="#0088FE" />
              <Bar dataKey="medianExp" name="Median Monthly Expenditure" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Economic Impact of Service Access</h3>
          <ul>
            <li>A clear positive correlation exists between access to essential services and household expenditure levels.</li>
            <li>Households with access to more services tend to have significantly higher expenditure capacity.</li>
            <li>This relationship can be interpreted in two ways: higher-income households can afford better services, and better services may enable greater economic activity.</li>
            <li>The gap between average and median expenditure increases with service access, suggesting greater income inequality among households with better service access.</li>
          </ul>
        </div>
      </section>


      <div className="conclusion-section">
        <h2>Essential Services: Key Takeaways</h2>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <h3>Urban Advantage</h3>
            <p>Urban areas have significantly better access to all essential services, with the largest gaps in piped water and clean cooking.</p>
          </div>
          <div className="takeaway-card">
            <h3>Social Disparities</h3>
            <p>Access to essential services varies across social groups, reflecting broader socioeconomic inequalities in Indian society.</p>
          </div>
          <div className="takeaway-card">
            <h3>Regional Variation</h3>
            <p>Significant regional disparities exist in service access, with some states consistently performing better than others across all services.</p>
          </div>
          <div className="takeaway-card">
            <h3>Economic Connection</h3>
            <p>There is a strong correlation between access to essential services and household expenditure capacity, highlighting the importance of infrastructure for economic well-being.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EssentialServices;

