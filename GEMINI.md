# GEMINI.md

## Project Overview

This project is a website for the gospel music ministry **DJ Lee & Voices of Judah**. It's a modern, single-page application built with a powerful stack designed for performance and scalability.

*   **Frontend:** The user interface is built with **React** and **Vite**, providing a fast and interactive user experience. The UI is styled with CSS and includes animations using **Framer Motion**.
*   **Backend:** The backend is powered by a **Hono** server running on **Cloudflare Workers**. This provides a lightweight and efficient API.
*   **Architecture:** The project is structured as a full-stack application, with the React frontend and Hono backend developed and deployed together. The frontend is served as a static site from Cloudflare Workers, and the backend provides API endpoints.

## Building and Running

### Development

To run the application in a local development environment with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building

To build the application for production:

```bash
npm run build
```

This command will create a `dist` directory with the production-ready assets.

### Deployment

To deploy the application to Cloudflare Workers:

```bash
npm run deploy
```

This will deploy both the frontend and backend to Cloudflare's global network.

## Development Conventions

*   **Linting:** The project uses **ESLint** to enforce code quality and consistency. To run the linter, use the following command:

    ```bash
    npm run lint
    ```

*   **Type Checking:** The project uses **TypeScript** for static type checking. To check for type errors, run:

    ```bash
    tsc
    ```

*   **Component-Based Architecture:** The React application is built using a component-based architecture. Components are located in the `src/react-app/components` directory.
*   **API Routes:** The backend API routes are defined in `src/worker/index.ts` using Hono's routing system.
