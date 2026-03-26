import { keyframes } from "@mui/material/styles";

export const slideInRight = keyframes`
    from { opacity: 0; transform: translateX(50px); }
    to   { opacity: 1; transform: translateX(0); }
`;
export const slideInLeft = keyframes`
    from { opacity: 0; transform: translateX(-50px); }
    to   { opacity: 1; transform: translateX(0); }
`;
export const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
`;
export const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;
export const chipBounce = keyframes`
    0%   { transform: scale(1); }
    40%  { transform: scale(1.07); }
    100% { transform: scale(1); }
`;
export const checkPop = keyframes`
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.25); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
`;
export const selectPulse = keyframes`
    0%   { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.4); }
    50%  { box-shadow: 0 0 0 12px rgba(124, 77, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0); }
`;
export const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;
export const subtleFloat = keyframes`
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
`;
export const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
`;
export const pulseRing = keyframes`
    0%   { transform: scale(0.85); opacity: 0.7; }
    50%  { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(0.85); opacity: 0; }
`;
export const drift1 = keyframes`
    0%, 100% { transform: translate(0, 0) scale(1); }
    25%      { transform: translate(40px, -25px) scale(1.06); }
    50%      { transform: translate(-20px, 20px) scale(0.94); }
    75%      { transform: translate(-35px, -15px) scale(1.04); }
`;
export const drift2 = keyframes`
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%      { transform: translate(-25px, 30px) scale(1.08); }
    66%      { transform: translate(30px, -20px) scale(0.93); }
`;
export const drift3 = keyframes`
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%      { transform: translate(25px, 15px) scale(1.1); }
    80%      { transform: translate(-18px, -22px) scale(0.95); }
`;
export const glowPulse = keyframes`
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
`;
export const filmStagger = keyframes`
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;
