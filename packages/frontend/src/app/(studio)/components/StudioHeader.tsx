"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Notifications as NotificationIcon,
  AccountCircle as AccountIcon,
} from "@mui/icons-material";

export default function StudioHeader() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        zIndex: 1300, // Higher than sidebar
        backdropFilter: "blur(20px)",
        background: "rgba(18, 18, 18, 0.8)",
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: "1.375rem",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
              }}
            >
              ProjectFlo
            </Box>
            <Box
              component="span"
              sx={{
                color: "text.secondary",
                fontWeight: 400,
                fontSize: "1.125rem",
              }}
            >
              Studio
            </Box>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="large"
            aria-label="notifications"
            color="inherit"
            sx={{ color: "text.secondary" }}
          >
            <NotificationIcon />
          </IconButton>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ color: "text.secondary" }}
          >
            <AccountIcon />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
