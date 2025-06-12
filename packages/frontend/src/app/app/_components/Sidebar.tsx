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

// Icons (examples)
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

// Theme
import { useTheme } from "../../providers/ThemeProvider";

interface SidebarProps {
  drawerWidth: number;
}

const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/app" },
  { text: "Contacts", icon: <PeopleIcon />, path: "/app/contacts" },
  // Add more primary navigation items here
];

const settingsNavItems = [
  { text: "Services", icon: <SettingsIcon />, path: "/app/settings/services" },
  { text: "Team", icon: <PeopleIcon />, path: "/app/settings/team" },
  // Add more settings navigation items here
];

export default function Sidebar({ drawerWidth }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, toggleTheme } = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar /> {/* Ensures content is below app bar if one is added later */}
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link
              href={item.path}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                width: "100%",
              }}
            >
              <ListItemButton onClick={() => setMobileOpen(false)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {settingsNavItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link
              href={item.path}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                width: "100%",
              }}
            >
              <ListItemButton onClick={() => setMobileOpen(false)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
      {/* Example of other items - can be removed */}
      <Divider />
      <List>
        {["All mail", "Trash", "Spam"].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton onClick={() => setMobileOpen(false)}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* Theme Toggle */}
      <Divider />
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <Button
          onClick={toggleTheme}
          startIcon={
            mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />
          }
          variant="outlined"
          size="small"
        >
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </Box>
    </div>
  );

  return (
    <>
      {/* Mobile App Bar with menu icon */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation drawer"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
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
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/* Mobile App Bar with hamburger menu */}
      <Box
        component="div"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          padding: 1,
          backgroundColor: "background.paper",
          zIndex: 1100,
          boxShadow: 1,
        }}
      >
        <Button
          onClick={handleDrawerToggle}
          sx={{ display: { xs: "block", sm: "none" }, marginRight: 2 }}
        >
          ☰
        </Button>
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
