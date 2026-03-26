/* MUI module augmentation for custom variants registered in ThemeProvider */
export {};

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    glass: true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    status: true;
  }
}
