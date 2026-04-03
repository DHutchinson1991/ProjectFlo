"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/* ─── SVG Payment Logos ─── */

function VisaLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#1A1F71" />
            <path d="M20.3 20.5h-2.8l1.8-10.8h2.8l-1.8 10.8zm11.7-10.5c-.6-.2-1.4-.4-2.5-.4-2.8 0-4.7 1.5-4.7 3.6 0 1.6 1.4 2.5 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.8-.2-2.7-.6l-.4-.2-.4 2.5c.7.3 1.9.6 3.2.6 2.9 0 4.9-1.5 4.9-3.7 0-1.2-.7-2.2-2.4-3-.9-.5-1.5-.8-1.5-1.4 0-.5.5-1 1.5-1 .9 0 1.5.2 2 .4l.2.1.5-2.4zm7.2-.3h-2.2c-.7 0-1.2.2-1.5.9l-4.2 10.2h2.9l.6-1.6h3.6l.3 1.6h2.6l-2.1-11.1zm-3.5 7.2l1.5-4.1.2.9.6 3.2h-2.3zM17.4 9.7l-2.6 7.4-.3-1.4c-.5-1.7-2-3.5-3.7-4.4l2.5 9.3h3l4.4-10.9h-3.3z" fill="#fff" />
            <path d="M12.4 9.7H8l0 .2c3.5.9 5.8 3.1 6.8 5.7l-1-5c-.2-.7-.7-.9-1.4-.9z" fill="#F9A51A" />
        </svg>
    );
}

function MastercardLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#252525" />
            <circle cx="19" cy="15.5" r="8" fill="#EB001B" />
            <circle cx="29" cy="15.5" r="8" fill="#F79E1B" />
            <path d="M24 9.14a8 8 0 0 1 0 12.72 8 8 0 0 1 0-12.72z" fill="#FF5F00" />
        </svg>
    );
}

function AmexLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#006FCF" />
            <text x="24" y="18" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif">AMEX</text>
        </svg>
    );
}

function ApplePayLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#000" />
            <text x="24" y="18" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">Pay</text>
            <path d="M14.5 11.5c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.4.5-.8 1.4-.7 2.2.8.1 1.6-.4 2.1-1.1z" fill="#fff" />
            <path d="M15.2 12.7c-1.2-.1-2.1.7-2.7.7-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.8 1.7-1.2 2-.3 5 .8 6.7.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.4-.8 2-1.7.6-.9.9-1.8.9-1.8-.1 0-1.7-.6-1.7-2.5 0-1.6 1.3-2.3 1.4-2.4-.8-1.2-2-1.3-2.2-1.3z" fill="#fff" />
        </svg>
    );
}

function GooglePayLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#fff" stroke="#ddd" strokeWidth="0.5" />
            <text x="24" y="18.5" textAnchor="middle" fill="#5F6368" fontSize="8" fontWeight="500" fontFamily="Arial, sans-serif">G Pay</text>
        </svg>
    );
}

function KlarnaLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#FFB3C7" />
            <text x="24" y="18.5" textAnchor="middle" fill="#0A0B09" fontSize="9" fontWeight="800" fontFamily="Arial, sans-serif">Klarna</text>
        </svg>
    );
}

function LinkLogo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size * 0.64} viewBox="0 0 48 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="31" rx="4" fill="#00D66F" />
            <text x="24" y="18.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">Link</text>
        </svg>
    );
}

/* ─── Exported component ─── */

interface AcceptedPaymentMethodsProps {
    /** Color for the label text */
    labelColor?: string;
    /** Size of each logo (px width) */
    size?: number;
}

export function AcceptedPaymentMethods({ labelColor, size = 28 }: AcceptedPaymentMethodsProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography sx={{
                fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: labelColor || alpha("#fff", 0.4),
            }}>
                Accepted payment methods
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                <VisaLogo size={size} />
                <MastercardLogo size={size} />
                <AmexLogo size={size} />
                <ApplePayLogo size={size} />
                <GooglePayLogo size={size} />
                <KlarnaLogo size={size} />
                <LinkLogo size={size} />
            </Box>
        </Box>
    );
}
