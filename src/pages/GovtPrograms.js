// File: src/pages/GovtPrograms.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis,
  ComposedChart, Area
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import StateSelector from '../components/StateSelector';
import './GovtPrograms.css';

function GovtPrograms() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedState, setSelectedState] = useState('All India');
  const [selectedProgram, setSelectedProgram] = useState('PMGKY');

  // Part of GovtPrograms.js - update the useEffect to depend on selectedState
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Add the state parameter to the API call
        const url = selectedState === 'All India' 
          ? '/api/govt-programs' 
          : `/api/govt-programs?state=${selectedState}`;
        
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

  const handleProgramChange = (program) => {
    setSelectedProgram(program);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!data) return <div className="error-message">No data available</div>;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Prepare data for Rural vs Urban chart
  const ruralUrbanData = [];
  data.programParticipation.forEach(program => {
    // Find rural and urban data for this program
    const ruralRate = data.rationUsage && program.program === 'PMGKY' 
      ? data.rationUsage.find(item => item.sector === 'Rural')?.ration_usage_rate * 100 || 0 
      : 0;
      
    const urbanRate = data.rationUsage && program.program === 'PMGKY'
      ? data.rationUsage.find(item => item.sector === 'Urban')?.ration_usage_rate * 100 || 0
      : 0;
      
    ruralUrbanData.push({
      program: program.program,
      Rural: ruralRate,
      Urban: urbanRate
    });
  });

  // Check if programsBySector exists and has data
  if (data.programsBySector && data.programsBySector.length > 0) {
    // Group by program name
    const programGroups = {};
    data.programsBySector.forEach(item => {
      if (!programGroups[item.program]) {
        programGroups[item.program] = {};
      }
      programGroups[item.program][item.sector] = item.participation_rate * 100;
    });
    
    // Update ruralUrbanData with real values
    ruralUrbanData.forEach(item => {
      if (programGroups[item.program]) {
        if (programGroups[item.program]['Rural'] !== undefined) {
          item.Rural = programGroups[item.program]['Rural'];
        }
        if (programGroups[item.program]['Urban'] !== undefined) {
          item.Urban = programGroups[item.program]['Urban'];
        }
      }
    });
  }
  
  // Filter data for selected state if needed
  const stateData = data && data.programsByState 
  ? (selectedState === 'All India' 
    ? data.programsByState 
    : data.programsByState.filter(item => item.state === selectedState))
  : [];
  
  // Filter program data based on selected program
  const programStateData = stateData.filter(item => item.program === selectedProgram)
    .sort((a, b) => b.participation_rate - a.participation_rate);
    
  // Top and bottom 5 states for the selected program
  const top5States = programStateData.slice(0, Math.min(5, programStateData.length));
  const bottom5States = programStateData.length > 5 
    ? programStateData.slice(-5).reverse() 
    : programStateData.slice(0, Math.min(5, programStateData.length)).reverse();

  // Prepare social group data for the selected program
  const socialGroupData = (data.programsBySocialGroup || [])
    .filter(item => item.program === selectedProgram)
    .map(item => ({
      ...item,
      participation_rate: item.participation_rate * 100
    }));

  // Program explanations for the info boxes
  const programExplanations = {
    'PMGKY': {
      fullName: 'Pradhan Mantri Garib Kalyan Yojana',
      description: 'A scheme providing free food grains to the poor during the COVID-19 pandemic. It includes provision of free food grains (5 kg per person per month) to around 80 crore individuals.',
      benefits: [
        'Free food grains distribution',
        'Direct benefit transfers to vulnerable groups',
        'Financial support to farmers',
        'Support to construction workers'
      ]
    },
    'PMJAY': {
      fullName: 'Pradhan Mantri Jan Arogya Yojana',
      description: 'A health insurance scheme providing coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization to over 10.74 crore poor and vulnerable families.',
      benefits: [
        'Cashless and paperless access to healthcare services',
        'Coverage for pre-existing diseases',
        'No cap on family size or age',
        'Transportation allowance for hospitalization'
      ]
    },
    'LPG Subsidy': {
      fullName: 'Pradhan Mantri Ujjwala Yojana',
      description: 'A scheme to provide LPG connections to women from Below Poverty Line (BPL) households to reduce health risks associated with cooking based on fossil fuels.',
      benefits: [
        'Free LPG connection to BPL households',
        'Financial assistance for purchasing cooking gas',
        'Improved health outcomes for women and children',
        'Reduction in indoor air pollution'
      ]
    },
    'Free Electricity': {
      fullName: 'Various State Government Schemes',
      description: 'Various state-level schemes providing free or subsidized electricity to certain households, particularly for agricultural use or to households below the poverty line.',
      benefits: [
        'Reduced energy costs for vulnerable households',
        'Support for agricultural activities',
        'Improved quality of life',
        'Enhanced productivity and economic activities'
      ]
    }
  };

  return (
    <div className="govt-programs">
      <div className="page-header">
        <h1>Government Program Participation</h1>
        <p className="subtitle">Analyzing enrollment and impact of key welfare schemes across India</p>
        <StateSelector 
          selectedState={selectedState} 
          onStateChange={handleStateChange} 
        />
      </div>
      
      <div className="dashboard-stats">
        {data.programParticipation.map((program, index) => (
          <div className="stat-card" key={program.program}>
            <h3>{program.program}</h3>
            <div className="stat-value">{Math.round(program.participation_rate * 100)}%</div>
            <p>participation rate</p>
          </div>
        ))}
      </div>

      <section className="comparison-section">
        <h2>Program Participation Overview</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.programParticipation.map(item => ({
                ...item,
                participation_rate: item.participation_rate * 100
              }))}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="program" />
              <YAxis 
                label={{ value: 'Participation Rate (%)', angle: -90, position: 'Left' ,dx:-10}} 
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="participation_rate" name="Participation Rate" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="info-box">
          <h3>Program Reach</h3>
          <ul>
            <li>Government welfare programs show varying levels of penetration across Indian households.</li>
            <li>The LPG subsidy program (Ujjwala Yojana) shows the highest participation rate, reflecting its widespread implementation.</li>
            <li>Health insurance coverage through PMJAY still has significant room for expansion.</li>
            <li>Free electricity schemes primarily operate at the state level and show regional variations.</li>
          </ul>
        </div>
      </section>


      {socialGroupData.length > 0 && (
        <section className="comparison-section">
          <h2>Program Participation by Social Group</h2>
          <div className="program-selector">
            <p>Select program to view by social group:</p>
            <div className="program-buttons">
              <button 
                className={selectedProgram === 'PMGKY' ? 'active' : ''}
                onClick={() => handleProgramChange('PMGKY')}
              >
                PMGKY
              </button>
              <button 
                className={selectedProgram === 'PMJAY' ? 'active' : ''}
                onClick={() => handleProgramChange('PMJAY')}
              >
                PMJAY
              </button>
              <button 
                className={selectedProgram === 'LPG Subsidy' ? 'active' : ''}
                onClick={() => handleProgramChange('LPG Subsidy')}
              >
                LPG Subsidy
              </button>
              <button 
                className={selectedProgram === 'Free Electricity' ? 'active' : ''}
                onClick={() => handleProgramChange('Free Electricity')}
              >
                Free Electricity
              </button>
            </div>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={socialGroupData}
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
                  label={{ value: 'Participation Rate (%)', angle: -90, position: 'Left', dx:-10 }} 
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="participation_rate" name={`${selectedProgram} Participation`} fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="info-box">
            <h3>Social Group Access</h3>
            <ul>
              <li>Government programs show varying effectiveness in reaching different social groups.</li>
              <li>Some programs show higher participation among scheduled tribes and scheduled castes, indicating successful targeting of marginalized communities.</li>
              <li>Others show more uniform participation across social groups.</li>
              <li>These patterns reflect both program design priorities and implementation effectiveness.</li>
            </ul>
          </div>
        </section>
      )}

      {programStateData.length > 0 && (
        // In the State-wise section where we display top/bottom states
<section className="comparison-section">
  <h2>State-wise {selectedProgram} Participation</h2>
  <div className="program-info">
    <h3>{programExplanations[selectedProgram].fullName}</h3>
    <p>{programExplanations[selectedProgram].description}</p>
    <div className="benefits-list">
      <h4>Key Benefits:</h4>
      <ul>
        {programExplanations[selectedProgram].benefits.map((benefit, index) => (
          <li key={index}>{benefit}</li>
        ))}
      </ul>
    </div>
  </div>
  
  {/* Use the topBottomStates data from the API */}
  {data.topBottomStates && data.topBottomStates[selectedProgram] && (
    <>
      <h3>Top 5 States - {selectedProgram} Participation</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.topBottomStates[selectedProgram].top.map(item => ({
              ...item,
              participation_rate: item.participation_rate * 100
            }))}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" />
            <YAxis 
              label={{ value: 'Participation Rate (%)', angle: -90, position: 'Left', dx:-10 }} 
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="participation_rate" name={`${selectedProgram} Participation`} fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <h3>Bottom 5 States - {selectedProgram} Participation</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.topBottomStates[selectedProgram].bottom.map(item => ({
              ...item,
              participation_rate: item.participation_rate * 100
            }))}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" />
            <YAxis 
              label={{ value: 'Participation Rate (%)', angle: -90, position: 'Left' , dx:-10}} 
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="participation_rate" name={`${selectedProgram} Participation`} fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )}
  
  <div className="info-box">
    <h3>Regional Disparities</h3>
    <p>The significant gap between the highest and lowest participating states highlights implementation challenges and the need for targeted efforts in low-performing regions.</p>
  </div>
</section>
      )}

      {data.programsVsExpenditure && data.programsVsExpenditure.length > 0 && (
        <section className="comparison-section">
          <h2>Program Participation vs. Monthly Expenditure</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.programsVsExpenditure.map(item => ({
                  score: `${item.program_participation_score} Programs`,
                  avgExp: item.avg_monthly_exp,
                  medianExp: item.median_monthly_exp,
                  sampleSize: item.sample_size
                }))}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score" />
                <YAxis 
                  label={{ value: 'Monthly Expenditure (₹)', angle: -90, position: 'Left' , dx : -20}} 
                />
                <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="avgExp" name="Average Monthly Expenditure" fill="#0088FE" />
                <Bar dataKey="medianExp" name="Median Monthly Expenditure" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="info-box">
            <h3>Economic Impact of Program Participation</h3>
            <ul>
              <li>The relationship between program participation and household expenditure is complex.</li>
              <li>Households enrolled in multiple programs often show lower monthly expenditure, consistent with targeting of lower-income groups.</li>
              <li>The gap between mean and median expenditure is smaller for households with higher program participation, suggesting less income inequality within this group.</li>
              <li>These patterns indicate that government programs are generally reaching their intended beneficiaries.</li>
            </ul>
          </div>
        </section>
      )}

      <div className="conclusion-section">
        <h2>Government Programs: Key Takeaways</h2>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <h3>Targeted Reach</h3>
            <p>Government welfare programs are generally reaching their intended beneficiaries, with higher participation among lower-income and marginalized groups.</p>
          </div>
          <div className="takeaway-card">
            <h3>Rural Focus</h3>
            <p>Most programs show higher participation in rural areas, consistent with the higher poverty rates and greater need in these regions.</p>
          </div>
          <div className="takeaway-card">
            <h3>Regional Disparities</h3>
            <p>Significant state-wise variations in program implementation highlight the need for focused efforts in underperforming regions.</p>
          </div>
          <div className="takeaway-card">
            <h3>Economic Impact</h3>
            <p>While the causal relationship is complex, participation in government programs is associated with changes in household expenditure patterns, suggesting potential welfare impacts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GovtPrograms;