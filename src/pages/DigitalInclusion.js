// File: src/pages/DigitalInclusion.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis,
  ComposedChart, Area
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import './DigitalInclusion.css';

function DigitalInclusion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/digital-inclusion');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        
        // Log data to help debugging
        console.log("Fetched digital inclusion data:", result);
        
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching digital inclusion data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!data) return <div className="error-message">No data available</div>;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Process data for state-level internet access
  const internetByStateData = [...data.internetByState];
  
  // Get unique state names
  const stateNames = [...new Set(internetByStateData.map(item => item.state))];
  
  // Create separate datasets for Rural and Urban
  const ruralInternetData = internetByStateData.filter(item => item.sector === 'Rural');
  const urbanInternetData = internetByStateData.filter(item => item.sector === 'Urban');
  
  // Sort states by rural internet access rate
  const sortedRuralStates = ruralInternetData
    .sort((a, b) => b.internet_access_rate - a.internet_access_rate)
    .map(item => item.state);
  
  // Process data for top 10 states chart
  const top10States = sortedRuralStates.slice(0, 10);
  const top10Data = [];
  
  // Prepare data structure for grouped bar chart
  top10States.forEach(state => {
    const stateData = {
      state: state,
      rural: ruralInternetData.find(item => item.state === state)?.internet_access_rate * 100 || 0,
      urban: urbanInternetData.find(item => item.state === state)?.internet_access_rate * 100 || 0
    };
    top10Data.push(stateData);
  });
  
  // Process data for bottom 10 states
  const bottom10States = sortedRuralStates.slice(-10).reverse();
  const bottom10Data = [];
  
  bottom10States.forEach(state => {
    const stateData = {
      state: state,
      rural: ruralInternetData.find(item => item.state === state)?.internet_access_rate * 100 || 0,
      urban: urbanInternetData.find(item => item.state === state)?.internet_access_rate * 100 || 0
    };
    bottom10Data.push(stateData);
  });

  return (
    <div className="digital-inclusion">
      <div className="page-header">
        <h1>Digital Inclusion Analysis</h1>
        <p className="subtitle">Investigating internet access, digital device ownership, and online behavior patterns</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Internet Access</h3>
          <div className="stat-value">{Math.round(
            (data.internetByState.find(item => item.sector === 'Rural')?.internet_access_rate * 100 || 0) +
            (data.internetByState.find(item => item.sector === 'Urban')?.internet_access_rate * 100 || 0)
          ) / 2}%</div>
          <p>of households have internet access</p>
        </div>
        <div className="stat-card">
          <h3>Mobile Ownership</h3>
          <div className="stat-value">{Math.round(data.digitalDeviceOwnership.find(item => item.device === 'Mobile Phone')?.ownership_rate * 100 || 0)}%</div>
          <p>of households own a mobile phone</p>
        </div>
        <div className="stat-card">
          <h3>Computer/Laptop</h3>
          <div className="stat-value">{Math.round(data.digitalDeviceOwnership.find(item => item.device === 'Computer/Laptop')?.ownership_rate * 100 || 0)}%</div>
          <p>of households own a computer</p>
        </div>
        <div className="stat-card">
          <h3>Digital Divide</h3>
          <div className="stat-value">{
            Math.round(
              (data.internetByState.find(item => item.sector === 'Urban')?.internet_access_rate * 100 || 0) - 
              (data.internetByState.find(item => item.sector === 'Rural')?.internet_access_rate * 100 || 0)
            )
          }%</div>
          <p>urban-rural internet gap</p>
        </div>
      </div>

      <section className="comparison-section">
        <h2>Internet Access by State (Top 10 States)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={top10Data}
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="state" 
                angle={-45} 
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Internet Access Rate (%)', angle: -90, position: 'Left', dx:-10,dy:20 }} 
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend verticalAlign='top'/>
              <Bar dataKey="rural" name="Rural" fill="#0088FE" />
              <Bar dataKey="urban" name="Urban" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>State-Level Digital Divide</h3>
          <ul>
            <li>Internet access varies significantly across states, reflecting regional economic disparities.</li>
            <li>Southern and western states typically show higher internet penetration rates.</li>
            <li>The urban-rural divide is present in all states but varies in magnitude.</li>
            <li>States with higher overall development indicators tend to have better internet access.</li>
          </ul>
        </div>
      </section>

      <section className="comparison-section">
        <h2>States with Lowest Internet Access</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={bottom10Data}
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="state" 
                angle={-45} 
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Internet Access Rate (%)', angle: -90, position: 'Left',dx :-10 }} 
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="rural" name="Rural" fill="#8884d8" />
              <Bar dataKey="urban" name="Urban" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Digital Access Challenges</h3>
          <ul>
            <li>These states face significant challenges in digital inclusion.</li>
            <li>The urban-rural divide is often more pronounced in these regions.</li>
            <li>Infrastructure limitations, economic factors, and geography contribute to lower internet penetration.</li>
            <li>Targeted policies and investments are needed to bridge the digital divide in these states.</li>
          </ul>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Internet Access by Social Group</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.internetBySocialGroup.map(item => ({
                ...item,
                internet_access_rate: item.internet_access_rate * 100
              }))}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="social_group" />
              <YAxis 
                label={{ value: 'Internet Access Rate (%)', angle: -90, position: 'Left', dx :-10 }} 
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="internet_access_rate" name="Internet Access Rate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Social Group Digital Divide</h3>
          <ul>
            <li>Significant disparities exist in internet access across different social groups.</li>
            <li>These differences reflect broader socioeconomic inequalities in Indian society.</li>
            <li>General category households have the highest internet access rates.</li>
            <li>Targeted digital inclusion policies may be needed to address these disparities.</li>
          </ul>
        </div>
      </section>

      {data.onlineShoppingByState && data.onlineShoppingByState.length > 0 && (
        <section className="comparison-section">
          <h2>Online Shopping by State (Top States)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={data.onlineShoppingByState.slice(0, 10).map(item => ({
                  ...item,
                  online_shopping_rate: item.online_shopping_rate * 100
                }))}
                margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="state" 
                  angle={-45} 
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Online Shopping Rate (%)', angle: -90, position: 'Left', dx:-10 }} 
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="online_shopping_rate" name="Online Shopping Rate" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>E-Commerce Hotspots</h3>
            <ul>
              <li>States with higher internet penetration typically show higher online shopping activity.</li>
              <li>Urban-dominated states lead in e-commerce adoption.</li>
              <li>Metropolitan areas drive much of the online retail growth.</li>
              <li>Infrastructure, logistics, and economic factors all influence e-commerce adoption rates.</li>
            </ul>
          </div>
        </section>
      )}

      {data.onlineShoppingVsExpenditure && data.onlineShoppingVsExpenditure.length > 0 && (
        <section className="comparison-section">
          <h2>Online Shopping vs Monthly Expenditure</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={data.onlineShoppingVsExpenditure}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="expenditure_group" label={{ value: 'Monthly Expenditure Group', position: 'insideBottom', offset: -10 }} />
                <YAxis 
                  label={{ value: 'Online Shopping Rate (%)', angle: -90, position: 'Left' }} 
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="online_shopping_rate" 
                  name="Online Shopping Rate" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Income and Digital Commerce</h3>
            <ul>
              <li>There's a strong positive correlation between household income/expenditure and online shopping behavior.</li>
              <li>Higher income households are more likely to shop online, reflecting both internet access and disposable income.</li>
              <li>The steepness of the curve indicates how quickly e-commerce adoption grows with income.</li>
              <li>This relationship has important implications for e-commerce businesses targeting different income segments.</li>
            </ul>
          </div>
        </section>
      )}

      <section className="comparison-section">
        <h2>Online Shopping Categories</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data.onlineShoppingCategories.map(item => ({
                ...item,
                usage_rate: item.usage_rate * 100
              }))}
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} label={{ value: 'Usage Rate (%)', position: 'Bottom', dy: 20 }} />
              <YAxis 
                dataKey="category" 
                type="category" 
                width={150}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="usage_rate" name="Online Shopping Rate" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>E-Commerce Patterns</h3>
          <ul>
            <li>Clothing and footwear are the most common items purchased online.</li>
            <li>Mobile phones and other electronics also show significant online purchase rates.</li>
            <li>Essential items like groceries and household goods have lower online purchase rates.</li>
            <li>These patterns reflect both e-commerce availability and consumer preferences.</li>
          </ul>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Digital Device Ownership</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data.digitalDeviceOwnership.map(item => ({
                  ...item,
                  ownership_rate: item.ownership_rate * 100
                }))}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="ownership_rate"
                nameKey="device"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {data.digitalDeviceOwnership.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Device Ownership Hierarchy</h3>
          <ul>
            <li>Mobile phones have achieved the highest penetration among digital devices.</li>
            <li>Television ownership is widespread but still not universal.</li>
            <li>Computer/laptop ownership lags significantly behind other devices.</li>
            <li>This hierarchy reflects both affordability and perceived utility of different devices.</li>
          </ul>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Internet Access vs. Monthly Expenditure</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.internetVsExpenditure.map(item => ({
                has_internet: item.has_internet ? 'Has Internet' : 'No Internet',
                avg_monthly_exp: item.avg_monthly_exp,
                median_monthly_exp: item.median_monthly_exp,
                sample_size: item.sample_size
              }))}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="has_internet" />
              <YAxis 
                label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left', dx :-20 }} 
              />
              <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="avg_monthly_exp" name="Average Monthly Expenditure" fill="#0088FE" />
              <Bar dataKey="median_monthly_exp" name="Median Monthly Expenditure" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Economic Digital Divide</h3>
          <ul>
            <li>Households with internet access have significantly higher expenditure levels.</li>
            <li>This correlation highlights how digital access and economic status are interconnected.</li>
            <li>The gap between mean and median expenditure is larger for internet-connected households, suggesting greater inequality within this group.</li>
            <li>Internet access can be viewed both as a result of economic advantage and as a potential enabler of economic opportunity.</li>
          </ul>
        </div>
      </section>

      <div className="conclusion-section">
        <h2>Digital Inclusion: Key Takeaways</h2>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <h3>Urban-Rural Divide</h3>
            <p>A significant urban-rural digital divide persists across India, with urban areas having substantially higher internet penetration rates.</p>
          </div>
          <div className="takeaway-card">
            <h3>Economic Correlation</h3>
            <p>Digital access strongly correlates with economic status, with higher-income households more likely to have internet access and digital devices.</p>
          </div>
          <div className="takeaway-card">
            <h3>Mobile First</h3>
            <p>Mobile phones have achieved the highest penetration among digital devices, making them the primary gateway to digital inclusion for many households.</p>
          </div>
          <div className="takeaway-card">
            <h3>Regional Variation</h3>
            <p>Significant regional variations exist in digital access, reflecting broader patterns of economic development across Indian states.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalInclusion;