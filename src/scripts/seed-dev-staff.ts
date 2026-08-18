import { connectDB } from '../lib/db/mongoose';
import { User } from '../models/User';
import { hashPassword } from '../lib/auth/password';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load .env.local for local execution
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedDevStaff() {
  console.log('🌱 Starting DEV STAFF seeding...');
  
  try {
    await connectDB();
    
    const email = 'qrtest@yesbharath.com';
    const plainPassword = crypto.randomBytes(12).toString('base64');
    
    // Hash password using the centralized auth utility
    const passwordHash = await hashPassword(plainPassword);
    
    await User.updateOne(
      { email },
      { 
        $set: { 
          passwordHash,
          name: 'QR Test Staff',
          role: 'STAFF',
          isActive: true
        } 
      },
      { upsert: true }
    );
    
    console.log('✅ DEV STAFF created/updated successfully.');
    
    console.log(`
      ----------------------------------------
      DEVELOPMENT TEST CREDENTIALS (DO NOT USE IN PROD)
      Email:    ${email}
      Password: ${plainPassword}
      Role:     STAFF
      ----------------------------------------
    `);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedDevStaff();
