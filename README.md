# HEMP Foundation

BOLT — PHASE 1: FOUNDATION, MOCK AUTHENTICATION & APPLICATION SHELL

You are building the initial frontend foundation for an enterprise Healthcare Engineering Management System called HEMP — Healthcare Engineering Management Platform.

VERY IMPORTANT

This is an internal enterprise application, NOT a marketing website.

The goal of this phase is to establish:

 The visual design foundation

 The application shell

 Mock authentication

 A minimal dashboard

 Reusable UI primitives

 Clean routing

Do not build the actual business modules yet.

Do not invent business workflows.

Do not create fake engineering records, equipment data, maintenance data, inventory data, quality records, charts, statistics or analytics.

The application should feel like a real premium enterprise product, but the business functionality will be added later.

1. TECHNOLOGY

Use:

 React

 Vite

 TypeScript

 Tailwind CSS

Keep the code clean and modular.

The future architecture will be:

React + Vite + TypeScript
          ↓
     Laravel REST API
          ↓
         MySQL

The Laravel backend does NOT need to be built now.

Authentication is MOCKED for this phase.

2. PRODUCT CHARACTER

HEMP is a professional healthcare engineering operations platform.

The visual identity should communicate:

Clinical precision + engineering precision + modern enterprise software.

The interface should feel:

 Premium

 Modern

 Professional

 Calm

 Precise

 Clean

 Technical

 Trustworthy

 Efficient

It should NOT feel:

 Like a generic admin template

 Like a hospital website

 Like a marketing SaaS

 Like a cryptocurrency dashboard

 Like a futuristic cyberpunk application

 Overly colorful

 Overly animated

 Cartoonish

Use whitespace, typography, hierarchy and subtle contrast to create the premium appearance.

3. COLOR PALETTE

Use this palette exactly.

LIGHT MODE

--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--text-main: #1E293B;
--text-muted: #64748B;
--primary: #00B4D8;
--secondary: #06D6A0;
--accent: #FF5A5F;
--border: #E2E8F0;

DARK MODE

--bg-primary: #0F172A;
--bg-secondary: #1E293B;
--text-main: #F8FAFC;
--text-muted: #94A3B8;
--primary: #00E5FF;
--secondary: #00F5D4;
--accent: #FF5A5F;
--border: #334155;

IMPORTANT COLOR RULE

Do NOT make the entire application navy blue.

The primary visual experience should be light mode.

Use:

 white

 soft cool gray

 charcoal text

 subtle borders

as the dominant visual foundation.

The cyan should be used selectively for:

 active navigation

 primary buttons

 focus states

 important interactive elements

 subtle brand accents

The mint should be used sparingly.

The coral should be reserved for important attention/error/critical actions.

Do not create a colorful interface.

4. TYPOGRAPHY

Use Inter.

Create a consistent typography system for:

 Page titles

 Section headings

 Body text

 Labels

 Captions

 Buttons

 Navigation

 Tables

Typography should carry much of the visual hierarchy.

5. VISUAL STYLE

Use subtle modern UI effects.

Include small amounts of animation, but keep them professional.

Appropriate animations include:

 subtle page transitions

 sidebar transitions

 hover transitions

 button feedback

 modal entrance/exit

 dropdown entrance

 login form entrance

 subtle dashboard content appearance

Animations should generally be fast and understated.

Avoid:

 excessive bouncing

 large movement

 distracting animations

 constant motion

 flashy gradients

 unnecessary parallax

 animation everywhere

The application should still feel fast and serious.

Respect prefers-reduced-motion.

6. NO LANDING PAGE

There must be NO landing page.

There must be NO marketing homepage.

There must be:

 no hero section

 no pricing

 no testimonials

 no promotional content

 no marketing copy

When the application opens and the user is unauthenticated:

Login

is the first screen.

7. MOCK AUTHENTICATION

Implement a simple frontend-only mocked authentication system.

This is NOT production authentication.

Create a mock user such as:

First name: John
Last name: Doe
Username: johndoe
Role: Engineering Manager

The exact demo credentials can be clearly displayed or documented inside the development environment.

The login flow should work:

Application opens
        ↓
Not authenticated
        ↓
Login screen
        ↓
Enter credentials
        ↓
Mock authentication succeeds
        ↓
Dashboard

Also support:

Dashboard
   ↓
User menu
   ↓
Logout
   ↓
Login

The mock authentication must be isolated so it can later be replaced by Laravel authentication without restructuring the application.

8. LOGIN SCREEN

The login screen is part of this phase.

Make it premium and minimal.

Do not use stock hospital imagery.

Do not create a marketing-style illustration.

Use strong typography, spacing and subtle visual details.

The login screen should contain:

 HEMP branding

 Product name/subtitle

 Username/email field

 Password field

 Show/hide password

 Remember me

 Sign In button

 Validation/error state

Example structure:

                    HEMP
          Healthcare Engineering
                 Management

             Sign in to HEMP

        Username / Email
        ┌──────────────────────┐
        │                      │
        └──────────────────────┘

        Password
        ┌──────────────────────┐
        │                 👁   │
        └──────────────────────┘

        □ Remember me

        ┌──────────────────────┐
        │       Sign In        │
        └──────────────────────┘

Keep it visually refined.

9. APPLICATION SHELL

After authentication, display the main application shell.

Structure:

┌────────────────────────────────────────────────────────────┐
│ HEMP                                  Notifications  User  │
├────────────────┬───────────────────────────────────────────┤
│                │                                           │
│    SIDEBAR     │              MAIN CONTENT                 │
│                │                                           │
│ Dashboard      │                                           │
│ Engineering    │                                           │
│ Quality        │                                           │
│ Operations     │                                           │
│ Management     │                                           │
│                │                                           │
│ Settings       │                                           │
│                │                                           │
└────────────────┴───────────────────────────────────────────┘

The shell should be the foundation for all future modules.

10. SIDEBAR

Keep the sidebar minimal and professional.

Use:

HEMP
Healthcare Engineering

WORKSPACE

Dashboard

Engineering
Quality
Operations
Management

SYSTEM

Settings

The active navigation item should use a subtle cyan visual indicator.

Do NOT use a large navy rectangle around the active item.

Do NOT use excessive colors.

The sidebar should feel elegant and restrained.

11. TOPBAR

Create a clean topbar containing:

 optional sidebar collapse control

 notification icon

 user avatar/initials

 user's first name

 user menu

Example:

                                   🔔   JD  John ▾

The user menu should contain:

Profile
Logout

Profile functionality does not need to be implemented yet.

Logout must work with the mock authentication.

12. NO BREADCRUMBS

Do NOT use breadcrumbs.

Do not display:

Home → Modules → Engineering

The sidebar already establishes navigation context.

Pages should use a clean page title and optional subtitle.

13. MINIMAL DASHBOARD

Create a minimal dashboard only to demonstrate the authenticated shell.

Do NOT create a business analytics dashboard.

Do NOT invent statistics.

Do NOT create fake engineering KPIs.

Do NOT create charts.

Do NOT create fake equipment counts.

Do NOT create fake maintenance records.

The dashboard should primarily demonstrate:

Welcome, John

or:

Welcome back, John

with a professional supporting message such as:

Here's your workspace overview.

The first name must come from the mocked authenticated user object rather than being hard-coded directly into the UI.

Example:

user.firstName

Then provide a small number of neutral structural elements if needed to demonstrate the UI system.

Do not pretend these are real business metrics.

14. DASHBOARD VISUAL HIERARCHY

The dashboard should feel spacious.

Example:

Dashboard

Welcome back, John
Here's your workspace overview.

────────────────────────────────────────

[ Future workspace area ]

Your operational modules will appear here.

It should look polished even though the actual business functionality has not been implemented.

15. RESPONSIVE SHELL

The desktop experience is the primary target.

Still implement:

 collapsible sidebar

 responsive content

 proper mobile overflow handling

 usable login screen on smaller screens

Do not create a separate mobile application.

16. REUSABLE UI FOUNDATION

Create only the basic reusable components required by this phase.

Examples:

Button
Input
PasswordInput
Avatar
Badge
Card
Dropdown
Modal
Toast
Tooltip
Loading
EmptyState

Do not create business-specific components.

17. ROUTING

Create only the routes required for this phase:

/login
/app
/app/dashboard

Unauthenticated users attempting to access /app or /app/dashboard should be redirected to /login.

Authenticated users visiting /login should be redirected to /app/dashboard.

18. MOCK USER MODEL

Create a clean user model that can later map to Laravel.

Example:

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
};

The dashboard and user menu should consume this user object.

Do not scatter hard-coded user names throughout the UI.

19. DO NOT BUILD BUSINESS MODULES

Absolutely do NOT implement:

 Engineering

 Equipment

 Maintenance

 Quality

 Inventory

 Training

 Debrief

 Management

 Settings

The sidebar may contain these as navigation placeholders, but clicking them should show a simple:

Coming in a future development phase.

or equivalent neutral placeholder.

No fake functionality.

20. DO NOT CREATE DOCUMENTATION FILES

Do not create:

docs/
ADR/
architecture.md
design-system.md

Documentation will be handled later.

For now, concentrate entirely on the frontend experience and foundation.

21. FINAL SCOPE

When finished, the application should demonstrate exactly this:

                    OPEN APPLICATION
                           │
                           ▼
                       LOGIN PAGE
                           │
                           │ Mock Login
                           ▼
                    AUTHENTICATED SHELL
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Sidebar                     Topbar
             │                           │
             └─────────────┬─────────────┘
                           ▼
                       DASHBOARD
                           │
                           ▼
                  "Welcome back, John"

That is the entire functional scope.

CRITICAL FINAL INSTRUCTION

Do not build beyond this scope.

If you find yourself creating:

 a business module

 analytics

 charts

 fake records

 equipment data

 quality workflows

 maintenance workflows

 inventory workflows

 a landing page

 marketing content

STOP.

This phase is successful only when the result is a beautiful, modern, restrained enterprise application shell with working mocked login/logout and a minimal personalized dashboard.

Do not add features simply to make the application look more complete.

The objective is to establish the foundation correctly before we build the actual system.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/56a99d91-4791-45cc-91db-4d4674eba564).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
