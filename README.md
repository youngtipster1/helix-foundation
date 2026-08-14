# Helix Foundation

Helix Foundation is an enterprise application for managing engineering, quality, operational, and supporting workflows.

The application is designed with a modular architecture so that each business module can evolve independently while sharing a consistent application shell, design system, authentication model, permissions, and service layer.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture Principles](#architecture-principles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architectural Layers](#architectural-layers)
- [Application Structure](#application-structure)
- [Modules](#modules)
- [Routing](#routing)
- [Authentication & Permissions](#authentication--permissions)
- [Services & API Layer](#services--api-layer)
- [Mock Data](#mock-data)
- [Shared Components](#shared-components)
- [Design System](#design-system)
- [Responsive Design](#responsive-design)
- [Data Flow](#data-flow)
- [Backend Integration Strategy](#backend-integration-strategy)
- [Development Rules](#development-rules)
- [Adding a New Module](#adding-a-new-module)
- [Adding a New Feature](#adding-a-new-feature)
- [What Not To Do](#what-not-to-do)
- [Current Development Status](#current-development-status)

---

# Project Overview

Helix Foundation is structured as a modular enterprise application.

The goal of the architecture is to provide:

- Clear separation of responsibilities
- Consistent development patterns
- Reusable UI components
- Centralized application configuration
- Module-level business logic
- Module-level permissions
- Replaceable data/service implementations
- Responsive interfaces
- Long-term maintainability

The frontend currently operates with mocked data and services where backend functionality has not yet been implemented.

The architecture must therefore be treated as a real application architecture rather than a temporary collection of prototype pages.

---

# Architecture Principles

The following principles are mandatory for the project.

## 1. Consistency Over Convenience

New functionality must follow existing architectural patterns.

Do not introduce a new pattern simply because it is faster for one feature.

If a reusable pattern already exists, use it.

---

## 2. Modules Own Their Business Logic

Business logic specific to a module belongs inside that module.

Example:

```text
src/modules/quality/