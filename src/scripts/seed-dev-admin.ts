import { connectDB } from '../lib/db/mongoose';
import { User } from '../models/User';
import { hashPassword } from '../lib/auth/password';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load .env.local for local execution
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedDevAdmin() {
  console.log('🌱 Starting DEV ADMIN seeding...');
  
  try {
    await connectDB();
    
    const email = 'admin@gmail.com';
    const plainPassword = 'admin@123';
    
    // Hash password using the centralized auth utility
    const passwordHash = await hashPassword(plainPassword);
    
    await User.updateOne(
      { email },
      { 
        $set: { 
          passwordHash,
          name: 'Super Admin',
          role: 'ADMIN',
          isActive: true
        } 
      },
      { upsert: true }
    );
    
    console.log('✅ DEV ADMIN created/updated successfully.');
    
    console.log(`
      ----------------------------------------
      DEVELOPMENT TEST CREDENTIALS (DO NOT USE IN PROD)
      Email:    ${email}
      Password: ${plainPassword}
      Role:     ADMIN
      ----------------------------------------
    `);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedDevAdmin();
