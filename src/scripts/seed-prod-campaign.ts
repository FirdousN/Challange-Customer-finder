import { connectDB } from '../lib/db/mongoose';
import { Campaign } from '../models/Campaign';

async function seedCampaign() {
  try {
    await connectDB();
    
    // Check if an active campaign already exists
    const existing = await Campaign.findOne({ status: 'STARTED' });
    if (existing) {
      console.log('✅ An active campaign already exists in production.');
      process.exit(0);
    }
    
    const campaignData = {
      name: 'YB Posing Challenge Phase 1',
      description: 'Official production campaign for YB Find Customer challenge',
      status: 'STARTED',
      instagramAccountsToFollow: [
        {
          username: 'yesbharathweddingcollections',
          url: 'https://www.instagram.com/yesbharathweddingcollections',
          isRequired: true,
        },
        // We can add other standard accounts if needed, based on Phase requirements.
      ],
      startDate: new Date(),
    };
    
    await Campaign.create(campaignData);
    
    console.log('✅ Successfully created and STARTED the production campaign.');
    
  } catch (err) {
    console.error('❌ Error creating production campaign:', err);
  } finally {
    process.exit(0);
  }
}

seedCampaign();
