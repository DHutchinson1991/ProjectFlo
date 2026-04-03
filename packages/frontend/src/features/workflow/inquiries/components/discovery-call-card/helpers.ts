import { keyframes } from '@mui/material/styles';

/* -- Animations -- */
export const chipBounce = keyframes`
    0%   { transform: scale(1); }
    40%  { transform: scale(1.07); }
    100% { transform: scale(1); }
`;

/* -- Types -- */
export type SlotInfo = { time: string; available: boolean; operator_id?: number };
