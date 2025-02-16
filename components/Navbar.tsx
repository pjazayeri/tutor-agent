// components/Navbar.tsx
import Link from "next/link";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoContainer}>
            <svg className={styles.diamond} viewBox="0 0 70 70">
              <defs>
                <linearGradient
                  id="diamondGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FF69B4" />
                  <stop offset="50%" stopColor="#FF0000" />
                  <stop offset="100%" stopColor="#FFB6C1" />
                </linearGradient>
              </defs>
              <polygon
                points="35,0 70,35 35,70 0,35"
                fill="url(#diamondGradient)"
                stroke="#FF1493"
                strokeWidth="2"
              />
            </svg>
            <div className={styles.brandText}>
              <p className={styles.brandName}>Cognify</p>
              <p className={styles.tagline}>Your Intelligent Study Agent</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
