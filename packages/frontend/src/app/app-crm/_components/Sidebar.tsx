// packages/frontend/src/app/crm/_components/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

// Theme Provider
import { useTheme } from "../../providers/ThemeProvider";

interface SidebarProps {
  drawerWidth: number;
}

// These items appear in the main navigation section.
const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/app-crm" },
  // Deliverables will be added here in Phase 2
];

// These items appear under the "Settings" section.
const settingsNavItems = [
  // This path matches the roadmap location for team management.
  // Ensure the TeamPage component we created is at `app/crm/settings/team/page.tsx`
  { text: "Team", icon: <PeopleIcon />, path: "/app-crm/settings/team" },
  {
    text: "Services",
    icon: <BusinessCenterIcon />,
    path: "/app-crm/settings/services",
  },
];

export default function Sidebar({ drawerWidth }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, toggleTheme } = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <div>
      {/* The Toolbar adds space at the top, aligning content below any potential AppBar */}
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ProjectFlo
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          // REFACTORED: Using component={Link} on ListItemButton is the preferred MUI pattern.
          // It's cleaner than wrapping the component in a <Link> tag.
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Typography variant="overline" sx={{ pl: 2, color: "text.secondary" }}>
        Settings
      </Typography>
      <List>
        {settingsNavItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* This box pushes the theme toggle to the bottom of the drawer */}
      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <Button
          onClick={toggleTheme}
          startIcon={
            mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />
          }
          variant="outlined"
          size="small"
          fullWidth
        >
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </Box>
    </div>
  );

  return (
    <>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation drawer"
      >
        {/* Mobile Drawer: temporary, appears on top of content */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer: permanent, sits on the side */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              display: "flex",
              flexDirection: "column",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Mobile App Bar: only visible on small screens */}
      <Box
        component="div"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          p: 1,
          backgroundColor: "background.paper",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 1,
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: "none" } }}
        >
          {/* Using a standard menu icon character */}☰
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          ProjectFlo
        </Typography>
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </>
  );
}
