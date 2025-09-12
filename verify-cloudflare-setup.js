#!/usr/bin/env node

/**
 * Cloudflare Infrastructure Verification and Update Script
 * This script verifies and updates the Cloudflare Workers configuration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkWranglerInstalled() {
  try {
    const { stdout } = await execAsync('wrangler --version');
    log(`✅ Wrangler installed: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('❌ Wrangler not installed. Please install with: npm install -g wrangler', 'red');
    return false;
  }
}

async function checkAuthentication() {
  try {
    const { stdout } = await execAsync('wrangler whoami');
    log(`✅ Authenticated as: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('❌ Not authenticated. Please run: wrangler login', 'red');
    return false;
  }
}

async function verifyKVNamespaces() {
  log('\n📦 Verifying KV Namespaces...', 'cyan');
  
  try {
    const { stdout } = await execAsync('wrangler kv namespace list');
    const namespaces = JSON.parse(stdout);
    
    const sessionsNamespace = namespaces.find(ns => ns.id === 'b7654d69472c4e1b8eda8bbae8ee2776');
    
    if (sessionsNamespace) {
      log(`✅ SESSIONS namespace exists: ${sessionsNamespace.title}`, 'green');
    } else {
      log('⚠️ SESSIONS namespace not found in account. Creating...', 'yellow');
      await execAsync('wrangler kv namespace create SESSIONS');
      log('✅ SESSIONS namespace created', 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error verifying KV namespaces: ${error.message}`, 'red');
    return false;
  }
}

async function verifyD1Databases() {
  log('\n🗄️ Checking D1 Databases...', 'cyan');
  
  try {
    const { stdout } = await execAsync('wrangler d1 list');
    
    if (stdout.includes('No D1 databases')) {
      log('📝 No D1 databases found. Consider creating one for structured data:', 'yellow');
      log('   wrangler d1 create dj-judas-db', 'yellow');
      
      // Create D1 database
      const createD1 = await promptUser('Would you like to create a D1 database now? (y/n): ');
      if (createD1.toLowerCase() === 'y') {
        await execAsync('wrangler d1 create dj-judas-db');
        log('✅ D1 database created', 'green');
        
        // Update wrangler.toml
        await updateWranglerConfig('d1', {
          binding: 'DB',
          database_name: 'dj-judas-db',
          database_id: 'YOUR_DATABASE_ID' // This would be returned from the create command
        });
      }
    } else {
      log('✅ D1 databases found', 'green');
    }
    
    return true;
  } catch (error) {
    log(`⚠️ D1 not configured: ${error.message}`, 'yellow');
    return true; // Not critical
  }
}

async function verifyR2Buckets() {
  log('\n🪣 Checking R2 Buckets...', 'cyan');
  
  try {
    const { stdout } = await execAsync('wrangler r2 bucket list');
    
    if (!stdout.includes('media-bucket')) {
      log('📝 No media bucket found. Consider creating one for media storage:', 'yellow');
      
      const createR2 = await promptUser('Would you like to create an R2 bucket for media? (y/n): ');
      if (createR2.toLowerCase() === 'y') {
        await execAsync('wrangler r2 bucket create media-bucket');
        log('✅ R2 bucket created', 'green');
        
        // Update wrangler.toml
        await updateWranglerConfig('r2', {
          binding: 'MEDIA_BUCKET',
          bucket_name: 'media-bucket'
        });
      }
    } else {
      log('✅ R2 buckets configured', 'green');
    }
    
    return true;
  } catch (error) {
    log(`⚠️ R2 not configured: ${error.message}`, 'yellow');
    return true; // Not critical
  }
}

async function verifyQueues() {
  log('\n📨 Checking Queues...', 'cyan');
  
  try {
    const { stdout } = await execAsync('wrangler queues list');
    
    if (!stdout.includes('email-queue')) {
      log('📝 No email queue found. Consider creating one for background processing:', 'yellow');
      
      const createQueue = await promptUser('Would you like to create a Queue for email processing? (y/n): ');
      if (createQueue.toLowerCase() === 'y') {
        await execAsync('wrangler queues create email-queue');
        log('✅ Queue created', 'green');
        
        // Update wrangler.toml
        await updateWranglerConfig('queue', {
          binding: 'EMAIL_QUEUE',
          queue: 'email-queue'
        });
      }
    } else {
      log('✅ Queues configured', 'green');
    }
    
    return true;
  } catch (error) {
    log(`⚠️ Queues not configured: ${error.message}`, 'yellow');
    return true; // Not critical
  }
}

async function updateWranglerConfig(type, config) {
  const wranglerPath = './wrangler.toml';
  let content = await fs.readFile(wranglerPath, 'utf-8');
  
  switch (type) {
    case 'd1':
      if (!content.includes('[[d1_databases]]')) {
        content += `\n[[d1_databases]]\nbinding = "${config.binding}"\ndatabase_name = "${config.database_name}"\ndatabase_id = "${config.database_id}"\n`;
      }
      break;
      
    case 'r2':
      if (!content.includes('[[r2_buckets]]')) {
        content += `\n[[r2_buckets]]\nbinding = "${config.binding}"\nbucket_name = "${config.bucket_name}"\n`;
      }
      break;
      
    case 'queue':
      if (!content.includes('[[queues.producers]]')) {
        content += `\n[[queues.producers]]\nbinding = "${config.binding}"\nqueue = "${config.queue}"\n`;
      }
      break;
      
    case 'durable_objects':
      if (!content.includes('[[durable_objects.bindings]]')) {
        content += `\n[[durable_objects.bindings]]\nname = "${config.name}"\nclass_name = "${config.class_name}"\nscript_name = "${config.script_name}"\n`;
      }
      break;
  }
  
  await fs.writeFile(wranglerPath, content);
  log(`✅ Updated wrangler.toml with ${type} configuration`, 'green');
}

async function verifyDurableObjects() {
  log('\n🔄 Checking Durable Objects...', 'cyan');
  
  const wranglerContent = await fs.readFile('./wrangler.toml', 'utf-8');
  
  if (!wranglerContent.includes('durable_objects')) {
    log('📝 No Durable Objects configured. Consider adding for real-time features:', 'yellow');
    
    const createDO = await promptUser('Would you like to add Durable Objects for sessions? (y/n): ');
    if (createDO.toLowerCase() === 'y') {
      await updateWranglerConfig('durable_objects', {
        name: 'USER_SESSIONS',
        class_name: 'UserSession',
        script_name: 'dj-judas'
      });
      
      log('⚠️ Remember to export the UserSession class from your worker:', 'yellow');
      log('   export { UserSession } from "./durable-objects/user-session"', 'yellow');
    }
  } else {
    log('✅ Durable Objects configured', 'green');
  }
  
  return true;
}

async function verifyEnvironmentVariables() {
  log('\n🔐 Checking Environment Variables...', 'cyan');
  
  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'APPLE_TEAM_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY',
    'IG_OEMBED_TOKEN',
    'FB_PAGE_ID',
    'FB_PAGE_TOKEN',
    'RESEND_API_KEY',
    'MEDUSA_URL',
    'CF_IMAGES_ACCOUNT_ID',
    'CF_IMAGES_API_TOKEN'
  ];
  
  const devVarsPath = './.dev.vars';
  
  if (!existsSync(devVarsPath)) {
    log('⚠️ .dev.vars file not found. Creating from example...', 'yellow');
    await fs.copyFile('./.dev.vars.example', devVarsPath);
    log('✅ Created .dev.vars - Please update with your actual values', 'green');
  }
  
  const devVarsContent = await fs.readFile(devVarsPath, 'utf-8');
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!devVarsContent.includes(varName) || devVarsContent.includes(`${varName}=your_`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log('⚠️ Missing or placeholder environment variables:', 'yellow');
    missingVars.forEach(v => log(`   - ${v}`, 'yellow'));
    log('\n   Update .dev.vars with actual values', 'yellow');
  } else {
    log('✅ All environment variables configured', 'green');
  }
  
  return true;
}

async function deployWorker() {
  log('\n🚀 Deploying Worker...', 'cyan');
  
  const deploy = await promptUser('Would you like to deploy the worker now? (y/n): ');
  if (deploy.toLowerCase() === 'y') {
    try {
      const { stdout } = await execAsync('wrangler deploy');
      log('✅ Worker deployed successfully', 'green');
      console.log(stdout);
    } catch (error) {
      log(`❌ Deployment failed: ${error.message}`, 'red');
      return false;
    }
  }
  
  return true;
}

async function generateOptimizedConfig() {
  log('\n📝 Generating optimized wrangler.toml...', 'cyan');
  
  const optimizedConfig = `name = "dj-judas"
main = "./src/worker/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
account_id = "a77e479f6736120eadd99973dbeb705e"

# Performance optimizations
[placement]
mode = "smart"

[observability]
enabled = true

upload_source_maps = true

[assets]
directory = "./dist/client"
not_found_handling = "single-page-application"

# KV Namespace for sessions
[[kv_namespaces]]
binding = "SESSIONS"
id = "b7654d69472c4e1b8eda8bbae8ee2776"

# AI binding for product suggestions
[ai]
binding = "AI"

# Optional: D1 Database for structured data
# [[d1_databases]]
# binding = "DB"
# database_name = "dj-judas-db"
# database_id = "YOUR_DATABASE_ID"

# Optional: R2 for media storage
# [[r2_buckets]]
# binding = "MEDIA_BUCKET"
# bucket_name = "media-bucket"

# Optional: Queue for background processing
# [[queues.producers]]
# binding = "EMAIL_QUEUE"
# queue = "email-queue"

# Optional: Durable Objects for real-time features
# [[durable_objects.bindings]]
# name = "USER_SESSIONS"
# class_name = "UserSession"
# script_name = "dj-judas"
# 
# [[migrations]]
# tag = "v1"
# new_classes = ["UserSession"]

# Optional: Analytics Engine
# [[analytics_engine_datasets]]
# binding = "ANALYTICS"

# Rate limiting
# [[unsafe.bindings]]
# name = "RATE_LIMITER"
# type = "ratelimit"
# namespace_id = "1"
# simple = { limit = 10, period = 60 }

# Routes (if not using assets)
# route = "djlee.com/*"
# routes = [
#   { pattern = "djlee.com", custom_domain = true },
#   { pattern = "*.djlee.com", zone_name = "djlee.com" }
# ]

# Environment-specific overrides
# [env.production]
# vars = { ENVIRONMENT = "production" }
# 
# [env.staging]
# vars = { ENVIRONMENT = "staging" }
`;
  
  await fs.writeFile('./wrangler.toml.optimized', optimizedConfig);
  log('✅ Generated optimized configuration at wrangler.toml.optimized', 'green');
  log('   Review and replace your current wrangler.toml if desired', 'yellow');
  
  return true;
}

async function promptUser(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

async function main() {
  log('🔍 Cloudflare Infrastructure Verification\n', 'blue');
  
  // Check prerequisites
  if (!await checkWranglerInstalled()) return;
  if (!await checkAuthentication()) return;
  
  // Verify infrastructure
  await verifyKVNamespaces();
  await verifyD1Databases();
  await verifyR2Buckets();
  await verifyQueues();
  await verifyDurableObjects();
  await verifyEnvironmentVariables();
  
  // Generate optimized config
  await generateOptimizedConfig();
  
  // Optional deployment
  await deployWorker();
  
  log('\n✨ Verification complete!', 'green');
  log('\n📚 Recommendations:', 'cyan');
  log('1. Enable smart placement for better performance', 'yellow');
  log('2. Consider adding D1 for structured data (events, products)', 'yellow');
  log('3. Add R2 for media storage instead of external services', 'yellow');
  log('4. Implement Durable Objects for real-time session management', 'yellow');
  log('5. Use Queues for background email processing', 'yellow');
  log('6. Add Analytics Engine for better observability', 'yellow');
  log('7. Implement rate limiting at the edge', 'yellow');
  
  process.exit(0);
}

// Run the verification
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
