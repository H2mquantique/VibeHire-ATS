import React from 'react'
import { Link } from 'react-router';

const Navbar = () => {
  return (
    <nav className="navbar">
    <Link to= "/">
      <p className="text-2xl fond bold text-gradient"> VibeHire </p>
    </Link>
    <Link to="/upload" className="primary-button w-fit">Upload Applicant Resume</Link>
    </nav>
  )
}

export default Navbar
