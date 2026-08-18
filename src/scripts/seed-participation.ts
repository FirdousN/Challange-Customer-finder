import { connectDB } from '../lib/db/mongoose';
import { Customer } from '../models/Customer';
import { CampaignParticipation } from '../models/CampaignParticipation';
import { Campaign } from '../models/Campaign';

async function seedParticipation() {
  try {
    await connectDB();
    
    // Find active campaign
    const campaign = await Campaign.findOne({ status: 'STARTED' });
    if (!campaign) {
      console.log('❌ No active campaign found. Run seed-campaign.ts first, or ensure a campaign is STARTED.');
      process.exit(1);
    }
    
    // 1. You must scan the QR code first using the Scanner UI to create a Customer.
    // 2. We'll find the most recently created Customer.
    const customer = await Customer.findOne().sort({ createdAt: -1 });
    
    if (!customer) {
      console.log('❌ No customer found. Please scan an Instagram QR code first via the Staff Scanner UI.');
      process.exit(1);
    }
    
    const existingParticipation = await CampaignParticipation.findOne({
      campaignId: campaign._id,
      instagramIdentityKey: customer.instagramIdentityKey,
    });
    
    if (existingParticipation) {
      console.log(`✅ Participation already exists for ${customer.instagramUsername}. It's in ALREADY_PLAYED state.`);
      process.exit(0);
    }
    
    // Create participation
    await CampaignParticipation.create({
      campaignId: campaign._id,
      customerId: customer._id,
      instagramIdentityKey: customer.instagramIdentityKey,
      instagramUsername: customer.instagramUsername,
      chancesEarned: 1,
      chancesUsed: 1,
      status: 'PLAYED',
      playedAt: new Date(),
    });
    
    // Update customer participation count
    await Customer.updateOne(
      { _id: customer._id },
      {
        $set: { 
          firstParticipationAt: new Date(),
          lastParticipationAt: new Date(),
        },
        $inc: { participationCount: 1 }
      }
    );
    
    console.log(`✅ Success! Seeded participation for @${customer.instagramUsername}`);
    console.log(`Scanning their QR code again will now show ALREADY PLAYED.`);
    
  } catch (err) {
    console.error('❌ Error seeding participation:', err);
  } finally {
    process.exit(0);
  }
}

seedParticipation();
