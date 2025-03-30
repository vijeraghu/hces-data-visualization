// StateSelector.js
import React, { useState, useEffect } from 'react';
import './StateSelector.css';

function StateSelector({ selectedState, onStateChange }) {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/states');
        
        if (!response.ok) {
          throw new Error('Failed to fetch states');
        }
        
        const result = await response.json();
        // Add "All India" as the first option
        setStates(['All India', ...result.states]);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        // Fallback to a list of major states if API fails
        setStates([
          'All India',
          'Andhra Pradesh',
          'Assam',
          'Bihar',
          'Gujarat',
          'Haryana',
          'Karnataka',
          'Kerala',
          'Madhya Pradesh',
          'Maharashtra',
          'Odisha',
          'Punjab',
          'Rajasthan',
          'Tamil Nadu',
          'Telangana',
          'Uttar Pradesh',
          'West Bengal'
        ]);
      }
    };
    
    fetchStates();
  }, []);

  const handleChange = (e) => {
    console.log("State changed to:", e.target.value); // Add this for debugging
    onStateChange(e.target.value);
  };

  if (loading) return <div className="state-selector-loading">Loading states...</div>;
  if (error) return <div className="state-selector-error">Error: {error}</div>;

  return (
    <div className="state-selector">
      <label htmlFor="state-select">Select State/UT:</label>
      <select 
        id="state-select" 
        value={selectedState} 
        onChange={handleChange}
        className="state-dropdown"
      >
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </div>
  );
}

export default StateSelector;