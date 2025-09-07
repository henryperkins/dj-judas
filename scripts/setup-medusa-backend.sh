#!/bin/bash

echo "🚀 Setting up Medusa Backend for DJ Judas"
echo "========================================="
echo ""

# Check if medusa directory already exists
if [ -d "medusa-backend" ]; then
    echo "✅ Medusa backend directory already exists"
    echo "Starting existing Medusa backend..."
    cd medusa-backend
    npm run dev &
    MEDUSA_PID=$!
    echo "Medusa backend started with PID: $MEDUSA_PID"
else
    echo "📦 Creating new Medusa backend..."
    npx create-medusa-app@latest medusa-backend --skip-db --db-url sqlite:///:memory: --no-browser
    
    cd medusa-backend
    
    # Configure CORS for your frontend
    echo "⚙️ Configuring CORS..."
    cat > medusa-config.js << 'EOF'
const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME });
} catch (e) {}

const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:5173,http://localhost:7000,http://localhost:7001";
const STORE_CORS = process.env.STORE_CORS || "http://localhost:5173,http://localhost:8000";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa-store";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
];

const modules = {
  eventBus: {
    resolve: "@medusajs/event-bus-local",
  },
  cacheService: {
    resolve: "@medusajs/cache-inmemory",
  },
};

module.exports = {
  projectConfig: {
    jwtSecret: process.env.JWT_SECRET || "supersecret",
    cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    store_cors: STORE_CORS,
    database_url: DATABASE_URL,
    admin_cors: ADMIN_CORS,
    redis_url: REDIS_URL,
  },
  plugins,
  modules,
};
EOF

    # Seed sample data
    echo "🌱 Seeding sample data..."
    npm run seed
    
    # Start Medusa
    echo "🚀 Starting Medusa backend..."
    npm run dev &
    MEDUSA_PID=$!
    echo "Medusa backend started with PID: $MEDUSA_PID"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Your Medusa backend is running at: http://localhost:9000"
echo "📝 Admin panel is at: http://localhost:7001"
echo ""
echo "🔑 Get your publishable key from the admin panel:"
echo "   1. Go to http://localhost:7001"
echo "   2. Login with admin@medusa-test.com / supersecret"
echo "   3. Go to Settings > Publishable API Keys"
echo "   4. Copy the key and update VITE_MEDUSA_PUBLISHABLE_KEY in .env"
echo ""
echo "To stop Medusa: kill $MEDUSA_PID"