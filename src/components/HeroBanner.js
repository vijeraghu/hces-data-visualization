// src/components/HeroBanner.js
import React from 'react';
import './HeroBanner.css';
import bannerImage from '../assets/expenditure-banner.jpg'; // You'll need to add this image to your assets folder

function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="banner-content">
        <h2>Understanding India's Household Expenditure</h2>
        <p>Explore patterns and insights from India's most comprehensive household expenditure survey</p>
      </div>
      <div className="banner-image">
        <img src={bannerImage} alt="Indian household expenditure visualization" />
      </div>
    </div>
  );
}

export default HeroBanner;