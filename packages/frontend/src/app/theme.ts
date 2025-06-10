import { createTheme } from "@mui/material/styles";
import { Geist } from "next/font/google";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: geist.style.fontFamily,
  },
});

export default theme;
