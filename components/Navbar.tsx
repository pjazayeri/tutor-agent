// components/Navbar.tsx
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="logo-wrapper">
          <div className="logo-container">
            <svg className="diamond" viewBox="0 0 70 70">
              <defs>
                <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#32cd32" />
                  <stop offset="50%" stopColor="#0047ab" />
                  <stop offset="100%" stopColor="#ff00ff" />
                </linearGradient>
              </defs>
              <polygon
                points="35,0 70,35 35,70 0,35"
                fill="url(#diamondGradient)"
                stroke="#0047ab"
                strokeWidth="2"
              />
            </svg>
            <div className="brand-text">
              <p className="brand-name">Cognify</p>
              <p className="tagline">Your Intelligent Study Agent</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .navbar {
          background: linear-gradient(270deg, #32cd32, #0047ab, #ff00ff);
          background-size: 800% 800%;
          animation: gradientAnimation 15s ease infinite;
          padding: 2rem 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-wrapper {
          display: flex;
          justify-content: left;
          width: 100%;
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: -1rem; /* Adjust this value to shift the logo left */
        }
        .diamond {
          width: 70px; /* Increased width */
          height: 70px; /* Increased height */
        }
        .brand-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .brand-name {
          font-size: 2.5rem;
          font-weight: 900;
          color: rgba(17, 12, 173, 0.8);
          -webkit-text-stroke: 0.5px black;
          margin: 0;
          line-height: 1;
        }
        .tagline {
          font-size: 1.25rem;
          color: white;
          -webkit-text-stroke: 0.5px black;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          line-height: 2;
        }
        @media (max-width: 768px) {
          .diamond {
            width: 50px; /* Adjusted for smaller screens */
            height: 50px; /* Adjusted for smaller screens */
          }
          .brand-name {
            font-size: 2rem;
          }
          .tagline {
            font-size: 1rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;