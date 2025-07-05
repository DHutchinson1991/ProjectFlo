"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  ManageAccounts as ManageAccountsIcon,
} from "@mui/icons-material";
import Link from "next/link";

const studioNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    title: "Designer",
    href: "/designer",
    icon: <PaletteIcon />,
    subItems: [
      { title: "Scenes Library", href: "/designer/scenes" },
      { title: "Film Manager", href: "/designer/films" },
    ],
  },
  {
    title: "Manager",
    href: "/manager",
    icon: <ManageAccountsIcon />,
    subItems: [
      { title: "Roles", href: "/manager/roles" },
      { title: "Users", href: "/manager/users" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <SettingsIcon />,
  },
];

export default function StudioSidebar() {
  const pathname = usePathname();

  const isActiveItem = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (href === "/designer") {
      return pathname.startsWith("/designer");
    }
    if (href === "/manager") {
      return pathname.startsWith("/manager");
    }
    return pathname.startsWith(href);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 280,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        overflowY: "auto",
        borderRadius: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        paddingTop: "64px", // Account for fixed header
        bgcolor: "background.paper",
        backgroundImage: "none",
        zIndex: 1200,
      }}
    >
      <List sx={{ px: 1, pt: 2, pb: 2 }}>
        {studioNavItems.map((item) => (
          <Box key={item.title}>
            <ListItem
              component={Link}
              href={item.href}
              sx={{
                color: "inherit",
                textDecoration: "none",
                backgroundColor: isActiveItem(item.href)
                  ? "rgba(33, 150, 243, 0.12)"
                  : "transparent",
                borderRadius: 1,
                mb: 0.5,
                mx: 1,
                "&:hover": {
                  backgroundColor: isActiveItem(item.href)
                    ? "rgba(33, 150, 243, 0.16)"
                    : "rgba(255, 255, 255, 0.04)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActiveItem(item.href)
                    ? "primary.main"
                    : "text.secondary",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: isActiveItem(item.href) ? 600 : 500,
                  color: isActiveItem(item.href)
                    ? "primary.main"
                    : "text.primary",
                  fontSize: "0.875rem",
                }}
              />
            </ListItem>
            {item.subItems && isActiveItem(item.href) && (
              <List sx={{ pl: 3, pr: 1 }}>
                {item.subItems.map((subItem) => (
                  <ListItem
                    key={subItem.title}
                    component={Link}
                    href={subItem.href}
                    sx={{
                      color: "inherit",
                      textDecoration: "none",
                      backgroundColor:
                        pathname === subItem.href
                          ? "rgba(33, 150, 243, 0.08)"
                          : "transparent",
                      borderRadius: 1,
                      mb: 0.25,
                      py: 0.75,
                      "&:hover": {
                        backgroundColor:
                          pathname === subItem.href
                            ? "rgba(33, 150, 243, 0.12)"
                            : "rgba(255, 255, 255, 0.04)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ListItemText
                      primary={subItem.title}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: pathname === subItem.href ? 600 : 400,
                        color:
                          pathname === subItem.href
                            ? "primary.main"
                            : "text.secondary",
                        fontSize: "0.8125rem",
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </Paper>
  );
}
