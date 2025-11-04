# Cash No Pix - Static Website

## Overview
This is a static HTML/JavaScript website called "Cash No Pix" (Portuguese language). The site appears to be a sales funnel with multiple pages including login, profile, wallet, bonus sections, and upsells.

## Project Structure
The project contains exported static files from what appears to be a Next.js application:

- `login/` - Main login and entry pages
  - `index.html` - Main login page
  - `profile/` - User profile section
  - `wallet/` - Wallet section
  - `bonus/` - Bonus section
  - `default.php` - Hostinger default page (not used)
  
- `funil-2/` - Sales funnel pages
  - `login/` - Login page for funnel
  - `acesso/` - Access page
  - `funil-2/` - Main funnel page
  - `upsell1/`, `upsell2/`, `upsell3/` - Upsell pages
  - `back1/`, `back2/`, `dws1/` - Additional funnel pages
  - `lotties/` - Animation files
  - `sound/` - Audio files

- `server.py` - Simple Python HTTP server serving on port 5000

## Technology Stack
- **Frontend**: Static HTML/CSS/JavaScript (Next.js export)
- **Server**: Python 3.11 HTTP server
- **Port**: 5000 (required for Replit webview)

## How It Works
1. The Python server serves static files from the project root
2. Default route (/) redirects to `/login/index.html`
3. All files are served with cache-control headers disabled for development
4. The server binds to 0.0.0.0:5000 to work with Replit's proxy

## Running the Project
The project runs automatically via the configured workflow:
- Command: `python3 server.py`
- Access the site through Replit's webview
- Default route redirects to `/funil-2/upsell1/` which displays the main login page

### Available Pages
- `/funil-2/upsell1/` - Main login page (default)
- `/funil-2/upsell2/` - Upsell page 2
- `/funil-2/upsell3/` - Upsell page 3
- `/funil-2/acesso/` - Access page
- `/funil-2/funil-2/` - Main funnel page
- `/login/` - Alternate login page (has some React hydration warnings)
- `/login/profile/` - Profile section
- `/login/wallet/` - Wallet section
- `/login/bonus/` - Bonus section

## Recent Changes
- 2025-11-04: Initial project setup in Replit environment
  - Extracted files from public_html.zip archive
  - Created Python HTTP server with cache-control headers for development
  - Configured server with HTTP redirects (not path rewriting) for proper asset loading
  - Added SO_REUSEADDR to server to prevent port binding issues
  - Created symlink for `_next` directory to serve Next.js static assets
  - Configured workflow for port 5000 (required for Replit webview)
  - Set up deployment configuration for autoscale deployment
  - Added .gitignore for Python and Replit files
  - Default route set to `/funil-2/upsell1/` which works without errors

## User Preferences
None specified yet.

## Project Architecture
- **Static File Server**: Simple Python HTTP server without any backend logic
- **No Database**: This is a purely frontend application
- **No API**: All functionality is client-side JavaScript
- **Multi-page Structure**: Multiple HTML entry points for different funnel stages
