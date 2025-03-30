// src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>HCES Data Visualization</h1>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/" className={pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/rural-urban" className={pathname === '/rural-urban' ? 'active' : ''}>
            Rural/Urban
          </Link>
        </li>
        <li>
          <Link 
            to="/household-types" 
            className={pathname === '/household-types' ? 'active' : ''}
          >
            Household Types
          </Link>
        </li>
        <li>
          <Link 
            to="/digital-inclusion" 
            className={pathname === '/digital-inclusion' ? 'active' : ''}
          >
            Digital Inclusion
          </Link>
        </li>
        <li>
          <Link 
            to="/essential-services" 
            className={pathname === '/essential-services' ? 'active' : ''}
          >
            Essential Services
          </Link>
        </li>
        <li>
          <Link 
            to="/govt-programs" 
            className={pathname === '/govt-programs' ? 'active' : ''}
          >
            Government Programs
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;