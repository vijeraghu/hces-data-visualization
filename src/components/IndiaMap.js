// File: src/components/IndiaMap.js
import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import ReactTooltip from 'react-tooltip';
import './IndiaMap.css';

// India TopoJSON file path
const INDIA_TOPO_JSON = '/india.topo.json';

// Color range for the map
const COLOR_RANGE = [
  '#edf8fb',
  '#ccece6',
  '#99d8c9',
  '#66c2a4',
  '#41ae76',
  '#238b45',
  '#005824',
];

const DEFAULT_COLOR = '#EEE';

const IndiaMap = ({ data }) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [stateGeographies, setStateGeographies] = useState([]);

  // Find min and max expenditure values
  const minValue = Math.min(...data.map((d) => d.avg_monthly_exp));
  const maxValue = Math.max(...data.map((d) => d.avg_monthly_exp));

  // Create a map for quick lookup of data by state name
  const dataMap = {};
  data.forEach((item) => {
    dataMap[item.state] = item;
  });

  // Create color scale
  const colorScale = scaleQuantile()
    .domain(data.map((d) => d.avg_monthly_exp))
    .range(COLOR_RANGE);

  // Function to map TopoJSON state names to dataset state names
  const getDatasetStateName = (topoJsonStateName) => {
    // Define mappings for states with different naming
    const stateNameMap = {
      "Andaman and Nicobar Islands": "A and N Islands (U.T.)",
      "NCT of Delhi": "Delhi",
      "Dadra and Nagar Haveli": "Dadra & Nagar Haveli and Daman & Diu",
      "Daman and Diu": "Dadra & Nagar Haveli and Daman & Diu",
      "Jammu and Kashmir": "Jammu & Kashmir",
      "Pondicherry": "Puducherry (U.T.)",
      "Tamil Nadu": "Tamilnadu",
      "Uttarakhand": "Uttrakhand",
      "Uttar Pradesh": "Uttar Prdesh",
      "Chhattisgarh": "Chattisgarh",
      "The Dadra and Nagar Haveli": "Dadra & Nagar Haveli and Daman & Diu",
      "The Daman and Diu": "Dadra & Nagar Haveli and Daman & Diu",
      "Orissa": "Odisha",
      "Lakshadweep": "Lakshadweep (U.T.)",
      "Chandigarh": "Chandigarh(U.T.)"
    };
    
    return stateNameMap[topoJsonStateName] || topoJsonStateName;
  };

  // Debug state names
  useEffect(() => {
    fetch(INDIA_TOPO_JSON)
      .then(response => response.json())
      .then(geoData => {
        // Extract all unique state names from the TopoJSON
        const topoJsonStates = new Set();
        const features = geoData.objects.india.geometries || [];
        features.forEach(feature => {
          if (feature.properties && feature.properties.st_nm) {
            topoJsonStates.add(feature.properties.st_nm);
          }
        });
        
        console.log("TopoJSON state names:", Array.from(topoJsonStates).sort());
        console.log("Dataset state names:", Object.keys(dataMap).sort());
        
        // Check for unmapped states
        const unmapped = [];
        Array.from(topoJsonStates).forEach(stateName => {
          const mappedName = getDatasetStateName(stateName);
          if (!dataMap[mappedName]) {
            unmapped.push({ original: stateName, mapped: mappedName });
          }
        });
        
        if (unmapped.length > 0) {
          console.warn("Unmapped states:", unmapped);
        }
      })
      .catch(error => console.error("Error loading TopoJSON:", error));
  }, [dataMap]);

  const onMouseEnter = (geo) => {
    return () => {
      const stateName = geo.properties.st_nm;
      const datasetStateName = getDatasetStateName(stateName);
      
      const currentState = dataMap[datasetStateName];
      if (currentState) {
        setTooltipContent(`
          <div class="tooltip-content">
            <h3>${stateName}</h3>
            <p>Average Monthly Expenditure: ₹${Math.round(currentState.avg_monthly_exp).toLocaleString()}</p>
            <p>Median Monthly Expenditure: ₹${Math.round(currentState.median_monthly_exp).toLocaleString()}</p>
            <p>Sample Size: ${currentState.sample_size.toLocaleString()}</p>
          </div>
        `);
      } else {
        setTooltipContent(`
          <div class="tooltip-content">
            <h3>${stateName}</h3>
            <p>No data available</p>
          </div>
        `);
      }
    };
  };

  const onMouseLeave = () => {
    setTooltipContent('');
  };

  const onStateClick = (geo) => {
    const stateName = geo.properties.st_nm;
    setSelectedState(stateName);
    // You could also trigger some action here, like passing the selected state up to a parent component
  };

  return (
    <div className="india-map-container">
      <ReactTooltip html={true}>{tooltipContent}</ReactTooltip>
      
      <div className="map-legend">
        <h3>Monthly Expenditure (₹)</h3>
        <div className="legend-items">
          {COLOR_RANGE.map((color, i) => {
            const step = (maxValue - minValue) / COLOR_RANGE.length;
            const min = Math.round(minValue + step * i);
            const max = Math.round(minValue + step * (i + 1));
            
            return (
              <div key={i} className="legend-item">
                <div 
                  className="legend-color-box" 
                  style={{ backgroundColor: color }}
                ></div>
                <span>₹{min.toLocaleString()} - ₹{max.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <ComposableMap
        projectionConfig={{
          scale: 450,
          center: [82, 22]
        }}
        projection="geoMercator"
        data-tip=""
        width={600}
        height={600}
        style={{
          width: "100%",
          height: "auto"
        }}
      >
        <ZoomableGroup zoom={1} center={[82, 22]}>
          <Geographies geography={INDIA_TOPO_JSON}>
            {({ geographies }) => {
              // Group geographies by state to display at state level
              const stateColorsMap = {};
              
              // First pass: determine colors for each state
              geographies.forEach(geo => {
                const stateName = geo.properties.st_nm;
                if (!stateName) return; // Skip if no state name
                
                const datasetStateName = getDatasetStateName(stateName);
                const currentState = dataMap[datasetStateName];
                
                // If we have data for this state, set its color
                if (currentState) {
                  stateColorsMap[stateName] = colorScale(currentState.avg_monthly_exp);
                } else {
                  stateColorsMap[stateName] = DEFAULT_COLOR;
                }
              });
              
              // Render each geography (district) but color by state
              return geographies.map(geo => {
                const stateName = geo.properties.st_nm;
                if (!stateName) return null; // Skip if no state name
                
                return (
                  <Geography
                    key={`${geo.rsmKey}`}
                    geography={geo}
                    fill={stateColorsMap[stateName] || DEFAULT_COLOR}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none'
                      },
                      hover: {
                        outline: 'none',
                        fill: '#FFD700',
                        transition: 'all 250ms'
                      },
                      pressed: {
                        outline: 'none',
                        stroke: '#E42',
                        strokeWidth: 1.5
                      }
                    }}
                    onMouseEnter={onMouseEnter(geo)}
                    onMouseLeave={onMouseLeave}
                    onClick={() => onStateClick(geo)}
                    className={selectedState === stateName ? 'selected-state' : ''}
                  />
                );
              });
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      <div className="map-note">
        <p>Note: Hover over states to see detailed expenditure information. Click on a state to select it.</p>
      </div>
    </div>
  );
};

export default IndiaMap;