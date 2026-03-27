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
    alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    Inventory as PackagesIcon,
    Folder as ProjectIcon,
    ContactMail as InquiriesIcon,
    Category as ResourcesIcon,
    People as CustomersIcon,
    Assignment as TasksIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { ProjectSelector } from "@/features/workflow/projects";

const studioNavItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: <DashboardIcon />,
    },
    {
        title: "Inquiries",
        href: "/inquiries",
        icon: <InquiriesIcon />,
    },
    {
        title: "Customers",
        href: "/clients",
        icon: <CustomersIcon />,
    },
    {
        title: "Projects",
        href: "/projects",
        icon: <ProjectIcon />,
        subItems: [
            { title: "Project Management", href: "/projects" },
        ],
    },
    {
        title: "Packages",
        href: "/packages",
        icon: <PackagesIcon />,
        subItems: [
            { title: "Package Library", href: "/packages" },
            { title: "All Packages", href: "/packages/list" },
            { title: "Event Type Templates", href: "/event-type-templates" },
        ],
    },
    {
        title: "Tasks",
        href: "/tasks",
        icon: <TasksIcon />,
        subItems: [
            { title: "Active Tasks", href: "/tasks" },
            { title: "Task Library", href: "/task-library" },
        ],
    },
    {
        title: "Assets",
        href: "/crew",
        icon: <ResourcesIcon />,
        subItems: [
            { title: "Crew", href: "/crew" },
            { title: "Locations", href: "/locations" },
            { title: "Equipment Library", href: "/equipment" },
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
    const theme = useTheme();

    const isActiveItem = (item: { href: string; subItems?: { href: string }[] }) => {
        if (item.href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/";
        }
        if (item.href === "/packages") {
            return pathname.startsWith("/packages") || pathname.startsWith("/event-type-templates");
        }
        if (item.subItems) {
            return item.subItems.some((sub) => pathname.startsWith(sub.href));
        }
        return pathname.startsWith(item.href);
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
            {/* Project Selector at the top */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 1, pb: 0.5 }}>
                <ProjectSelector />
            </Box>

            <List sx={{ px: 1, pt: 0, pb: 2 }}>
                {studioNavItems.map((item) => (
                    <Box key={item.title}>
                        <ListItem
                            component={Link}
                            href={item.href}
                            sx={{
                                color: "inherit",
                                textDecoration: "none",
                                backgroundColor: isActiveItem(item)
                                    ? alpha(theme.palette.primary.main, 0.12)
                                    : "transparent",
                                borderRadius: 1,
                                mb: 0.5,
                                mx: 1,
                                "&:hover": {
                                    backgroundColor: isActiveItem(item)
                                        ? alpha(theme.palette.primary.main, 0.16)
                                        : "action.hover",
                                },
                                transition: "all 0.2s ease",
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: isActiveItem(item)
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
                                    fontWeight: isActiveItem(item) ? 600 : 500,
                                    color: isActiveItem(item)
                                        ? "primary.main"
                                        : "text.primary",
                                    fontSize: "0.875rem",
                                }}
                            />
                        </ListItem>
                        {item.subItems && isActiveItem(item) && (
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
                                                    ? alpha(theme.palette.primary.main, 0.08)
                                                    : "transparent",
                                            borderRadius: 1,
                                            mb: 0.25,
                                            py: 0.75,
                                            "&:hover": {
                                                backgroundColor:
                                                    pathname === subItem.href
                                                        ? alpha(theme.palette.primary.main, 0.12)
                                                        : "action.hover",
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
