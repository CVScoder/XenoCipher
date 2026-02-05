# Overview

This is the **XenoCipher Secure Health Dashboard**, a real-time cryptography and cybersecurity monitoring system for health data. The application provides a comprehensive dashboard that displays live health metrics from connected IoT devices (like ESP32), visualizes a custom encryption pipeline (LFSR → Chaotic Map → Transposition → HMAC), and monitors security events in real-time. The system is designed to showcase advanced cryptographic techniques applied to sensitive health data transmission and storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and **Vite** as the build tool. It uses a modern component-based architecture with:
- **shadcn/ui** component library for consistent, accessible UI components
- **TailwindCSS** for utility-first styling with a custom dark theme optimized for cybersecurity dashboards
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and data fetching with automatic refetching intervals
- **Recharts** for interactive data visualizations and real-time charts
- **WebSocket integration** for live data streaming from the backend

## Backend Architecture
The backend uses **Express.js** with **TypeScript** running in ESM mode. Key architectural decisions include:
- **WebSocket server** integrated with HTTP server for real-time data broadcasting to connected clients
- **RESTful API endpoints** for CRUD operations on devices, health metrics, encryption pipeline data, and security alerts
- **Modular route structure** with separation of concerns between HTTP routes and WebSocket handling
- **Storage abstraction layer** with interface-based design for easy database swapping

## Data Storage Solutions
The application uses **Drizzle ORM** with **PostgreSQL** as the primary database:
- **Schema-first approach** with TypeScript type generation from database schema
- **Neon Database** integration for serverless PostgreSQL hosting
- **Database migrations** managed through Drizzle Kit
- **Zod validation** integrated with Drizzle for runtime type safety
- Comprehensive schema covering users, devices, health metrics, encryption pipeline state, security alerts, key evolution, and system performance

## Real-time Communication
- **WebSocket connections** for bidirectional real-time communication
- **Message broadcasting** to all connected clients when new data arrives
- **Automatic reconnection logic** with exponential backoff
- **Typed message system** for different data types (health metrics, security alerts, encryption updates)

## Authentication and Authorization
The application includes infrastructure for user management with:
- **User authentication** schema with username/password storage
- **Session management** capabilities (though specific auth implementation may be added later)
- **Device association** with user accounts for multi-tenant support

# External Dependencies

## Database Services
- **Neon Database** - Serverless PostgreSQL database hosting
- **PostgreSQL** - Primary relational database for all application data

## Development and Deployment
- **Replit** - Development environment with specialized Vite plugins for runtime error handling and development banners
- **Vite** - Frontend build tool and development server with HMR support
- **ESBuild** - Backend bundling for production deployment

## UI and Visualization Libraries
- **Radix UI** - Headless component primitives for accessibility
- **shadcn/ui** - Pre-built component library built on Radix UI
- **Recharts** - React charting library for data visualization
- **Lucide React** - Icon library for consistent iconography
- **Embla Carousel** - Carousel component for data presentation

## Real-time and State Management
- **ws (WebSocket)** - WebSocket implementation for real-time communication
- **TanStack Query** - Server state management and caching
- **Zod** - Runtime type validation and schema definition

## Styling and Theming
- **TailwindCSS** - Utility-first CSS framework
- **CSS Variables** - Dynamic theming system with dark mode optimization
- **PostCSS** - CSS processing with Autoprefixer

The architecture is designed to handle real-time cryptographic data processing and visualization, with emphasis on performance, security monitoring, and seamless user experience for cybersecurity professionals monitoring health data encryption systems.