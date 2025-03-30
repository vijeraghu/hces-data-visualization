import React, { useState, useEffect } from 'react';
import IndiaMap from '../components/IndiaMap';
import ExpenditureOverview from '../components/ExpenditureOverview';
import StateRanking from '../components/StateRanking';
import ExpenditureBreakdown from '../components/ExpenditureBreakdown';
import FoodExpenditureDetails from '../components/FoodExpenditureDetails';
import NonEssentialExpenditureDetails from '../components/NonEssentialExpenditureDetails';
import HouseholdSizeImpact from '../components/HouseholdSizeImpact';
import HeroBanner from '../components/HeroBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import StateSelector from '../components/StateSelector';
import './LandingPage.css';

function LandingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedState, setSelectedState] = useState('All India');

  // Sample data for household size impact - replace with actual API data when available
  const householdSizeData = [
    { size: '1', expenditure: 5820, perCapitaExpenditure: 5820 },
    { size: '2', expenditure: 8350, perCapitaExpenditure: 4175 },
    { size: '3', expenditure: 10240, perCapitaExpenditure: 3413 },
    { size: '4', expenditure: 11980, perCapitaExpenditure: 2995 },
    { size: '5', expenditure: 13420, perCapitaExpenditure: 2684 },
    { size: '6+', expenditure: 14980, perCapitaExpenditure: 2497 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // If selectedState is 'All India', don't include state param
        const stateParam = selectedState !== 'All India' ? `?state=${selectedState}` : '';
        const response = await fetch(`/api/expenditure-overview${stateParam}`);
        
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
  }, [selectedState]);

  const handleStateChange = (state) => {
    setSelectedState(state);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!data) return <div className="error-message">No data available</div>;

  return (
    <div className="landing-page">
      {/* HeroBanner moved to the top, before the header section */}
      <HeroBanner />
      
      <div className="header-section">
        <h1>Household Consumer Expenditure in India</h1>
        <p className="subtitle">Insights from the Household Consumer Expenditure Survey (HCES), 2022-23</p>
        <StateSelector 
          selectedState={selectedState} 
          onStateChange={handleStateChange} 
        />
      </div>

      <div className="overview-section">
        <ExpenditureOverview data={data.overview} />
      </div>

      <div className="section">
        <h2 className="section-title">Household Size Impact</h2>
        <HouseholdSizeImpact data={householdSizeData} />
      </div>

      <div className="section-divider"></div>
      
      <div className="section">
        <h2 className="section-title">State-wise Expenditure Rankings</h2>
        <div className="ranking-container">
          <StateRanking data={data.stateRankings} />
        </div>
      </div>

      <div className="section-divider"></div>
      
      <div className="section">
        <h2 className="section-title">Expenditure Breakdown</h2>
        <ExpenditureBreakdown data={data.expenditureBreakdown} />
      </div>

      <div className="section-divider"></div>
      
      <div className="section">
        <h2 className="section-title">Food Expenditure Details</h2>
        <FoodExpenditureDetails data={data.foodExpenditureDetails} />
      </div>

      <div className="section-divider"></div>
      
      <div className="section">
        <h2 className="section-title">Non-Essential Expenditure</h2>
        <NonEssentialExpenditureDetails data={data.nonEssentialDetails} />
      </div>
    </div>
  );
}

export default LandingPage;