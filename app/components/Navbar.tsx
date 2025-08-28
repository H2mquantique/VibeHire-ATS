import React from "react";
import { Link } from "react-router";

const Navbar = () => {
  return (
    <nav className="navbar flex items-center justify-between px-8 shadow-md bg-white h-20">
      {/* Logo cliquable uniquement */}
      <Link to="/" className="flex items-center h-full">
        <img
          src="/images/vibehire.png"
          alt="VibeHire Logo"
          className="h-45 w-auto object-contain" // 👈 logo plus grand mais contenu dans h-20
        />
      </Link>

      {/* Bouton upload */}
      <Link
        to="/upload"
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
      >
        Upload Applicant Resume
      </Link>
    </nav>
  );
};

export default Navbar;
