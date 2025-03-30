import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import RuralUrbanComparison from './pages/RuralUrbanComparison';
import HouseholdTypeComparison from './pages/HouseholdTypeComparison';
import DigitalInclusion from './pages/DigitalInclusion';
import EssentialServices from './pages/EssentialServices';
import GovtPrograms from './pages/GovtPrograms';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/rural-urban" element={<RuralUrbanComparison />} />
            <Route path="/household-types" element={<HouseholdTypeComparison />} />
            <Route path="/digital-inclusion" element={<DigitalInclusion />} />
            <Route path="/essential-services" element={<EssentialServices />} />
            <Route path="/govt-programs" element={<GovtPrograms />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
