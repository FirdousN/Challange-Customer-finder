import { connectDB } from '../lib/db/mongoose';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  await connectDB();
  const email = 'qrtest@yesbharath.com';
  
  const user = await User.findOne({ email }).select('+passwordHash');
  
  console.log(`Database user exists: ${user ? 'PASS' : 'FAIL'}`);
  if (!user) return;
  
  console.log(`Password hash exists: ${!!user.passwordHash ? 'PASS' : 'FAIL'}`);
  if (!user.passwordHash) return;
  
  console.log(`Hash prefix valid: ${/^\$2[aby]\$/.test(user.passwordHash) ? 'PASS' : 'FAIL'}`);
  
  const pw1 = 'YBQRTest@2026!';
  const pw2 = 'YB-Dev-Staff-Auth-Test-2026!';
  
  const match1 = await bcrypt.compare(pw1, user.passwordHash);
  const match2 = await bcrypt.compare(pw2, user.passwordHash);
  
  console.log(`bcrypt.compare against 'YBQRTest@2026!': ${match1 ? 'PASS' : 'FAIL'}`);
  console.log(`bcrypt.compare against 'YB-Dev-Staff-Auth-Test-2026!': ${match2 ? 'PASS' : 'FAIL'}`);
  
  process.exit(0);
}

verify();
