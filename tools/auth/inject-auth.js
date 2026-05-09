#!/usr/bin/env node

require("dotenv").config();

const { ScriptAuthService, environments } = require("./auth-service.js");

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        env: "development",
        help: false,
        verbose: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case "--env":
            case "-e":
                options.env = args[++i];
                break;
            case "--help":
            case "-h":
                options.help = true;
                break;
            case "--verbose":
            case "-v":
                options.verbose = true;
                break;
            default:
                if (arg.startsWith("--env=")) {
                    options.env = arg.split("=")[1];
                } else {
                    console.error(`Unknown option: ${arg}`);
                    process.exit(1);
                }
        }
    }

    return options;
}

function showHelp() {
    console.log(`
ProjectFlo Auth Inject CLI

USAGE:
    node tools/auth/inject-auth.js [options]

OPTIONS:
    -e, --env <env>    Target environment (development, staging, production) [default: development]
    -v, --verbose      Verbose output
    -h, --help         Show this help message

ENVIRONMENT VARIABLES:
    ADMIN_EMAIL            Admin email (required)
    ADMIN_PASSWORD         Preferred login password
    ADMIN_SEED_PASSWORD    Fallback login password
    API_BASE_URL           Override API URL

OUTPUT:
    Prints a single JavaScript snippet you can evaluate in a browser session.
`);
}

function resolveCredentials() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD;

    if (!email || !password) {
        throw new Error("Missing ADMIN_EMAIL and either ADMIN_PASSWORD or ADMIN_SEED_PASSWORD in .env");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid ADMIN_EMAIL format");
    }
    if (password.length < 6) {
        throw new Error("Password must be >= 6 characters");
    }

    return { email, password };
}

function normalizeBrands(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.brands)) return payload.brands;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

async function fetchMoonriseBrandId(baseURL, accessToken) {
    const brandEndpoints = ["/api/brands"];

    for (const endpoint of brandEndpoints) {
        const response = await fetch(`${baseURL}${endpoint}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            continue;
        }

        const payload = await response.json();
        const brands = normalizeBrands(payload);
        const moonrise =
            brands.find(
                (brand) => typeof brand?.name === "string" && brand.name.trim().toLowerCase() === "moonrise films"
            ) ||
            brands.find(
                (brand) => typeof brand?.name === "string" && brand.name.trim().toLowerCase().startsWith("moonrise")
            );

        if (moonrise?.id !== undefined && moonrise?.id !== null) {
            return moonrise.id;
        }
    }

    throw new Error("Could not resolve Moonrise brand id from /brands or /api/brands");
}

function escapeSingleQuoted(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildInjectionSnippet(tokens, brandId) {
    const access = escapeSingleQuoted(tokens.access_token);
    const refresh = escapeSingleQuoted(tokens.refresh_token || "");
    const brand = escapeSingleQuoted(brandId);

    return [
        `localStorage.setItem('authToken','${access}');`,
        `localStorage.setItem('refreshToken','${refresh}');`,
        `localStorage.setItem('projectflo_current_brand','${brand}');`,
        "location.reload();",
    ].join(" ");
}

async function main() {
    const options = parseArgs();
    if (options.help) {
        showHelp();
        return;
    }

    if (!environments[options.env]) {
        throw new Error(`Unknown environment: ${options.env}. Available: ${Object.keys(environments).join(", ")}`);
    }

    const envConfig = environments[options.env];
    const { email, password } = resolveCredentials();
    const authService = new ScriptAuthService({ environment: options.env });

    console.log(`Target environment: ${envConfig.name}`);
    if (options.verbose) {
        console.log(`API URL: ${authService.getBaseURL()}`);
    }

    const authData = await authService.login({ email, password });
    const moonriseBrandId = await fetchMoonriseBrandId(authService.getBaseURL(), authData.access_token);
    const snippet = buildInjectionSnippet(authData, moonriseBrandId);

    console.log("\nBrowser injection snippet:\n");
    console.log(snippet);
    console.log("\nUse this in the current browser session, then continue on protected pages.");
}

main().catch((error) => {
    console.error("Auth inject failed:", error.message);
    process.exit(1);
});