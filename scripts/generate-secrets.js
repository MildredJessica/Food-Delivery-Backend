import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync }  from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';



// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// console.log('🔐 Generating Secure JWT Secrets\n');
// console.log('='.repeat(50));

// Generate different types of secure secrets
const secrets = {
    // Main JWT secret (32+ chars recommended)
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    
    // Access token secret (different from main)
    //   JWT_ACCESS_SECRET: crypto.randomBytes(32).toString('hex'),
    
    // Refresh token secret (should be different)
    //   JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
    
    // Session secret
    //   SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
    
    // API key example
    API_SECRET: crypto.randomBytes(64).toString('hex'),
};

// Display generated secrets
// Object.entries(secrets).forEach(([key, value]) => {
//   console.log(`${key}:`);
//   console.log(`${value}`);
//   console.log(`Length: ${value.length} characters`);
//   console.log('-'.repeat(50));
// });

// Check if .env file exists
const envPath = join(__dirname, '..', '.env');
let envContent = '';

if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf8');
  
  // Update or add secrets
  Object.entries(secrets).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // Replace existing
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new
      envContent += `\n${key}=${value}`;
    }
  });
  
  writeFileSync(envPath, envContent);
  console.log('\n✅ Secrets have been updated in .env file');
} else {
  console.log('\n⚠️  No .env file found. Here are your secrets:');
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  console.log('\n📝 Copy these into your .env file');
}

console.log('\n🚨 IMPORTANT SECURITY NOTES:');
console.log('1. Never commit .env file to version control');
console.log('2. Use different secrets in production');
console.log('3. Rotate secrets periodically');
console.log('4. Store production secrets in secure vault');