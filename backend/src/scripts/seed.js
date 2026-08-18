import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Subscription from '../models/Subscription.js';
import Project from '../models/Project.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nichelink';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database. Cleaning up collections...');

    // Clear existing data
    await User.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Subscription.deleteMany({});
    await Project.deleteMany({});

    console.log('Collections cleared.');

    // 1. Create Users
    console.log('Creating users...');
    const admin = await User.create({
      name: 'System Admin',
      username: 'admin',
      email: 'admin@nichelink.com',
      password: 'adminpassword123',
      role: 'Admin',
      profession: 'System Administrator',
      skills: ['Infrastructure', 'Security', 'Database Tuning'],
      location: 'San Francisco, CA'
    });

    const freeMember = await User.create({
      name: 'Jane Doe',
      username: 'janedoe',
      email: 'jane@nichelink.com',
      password: 'userpassword123',
      role: 'FreeMember',
      profession: 'UI/UX Designer',
      skills: ['Figma', 'Sketch', 'Wireframing'],
      location: 'Austin, TX'
    });

    const proMember = await User.create({
      name: 'John Dev',
      username: 'johndev',
      email: 'john@nichelink.com',
      password: 'propassword123',
      role: 'ProMember',
      profession: 'Full Stack Engineer',
      skills: ['Node.js', 'React.js', 'MongoDB', 'Docker'],
      location: 'Berlin, DE'
    });

    console.log(`Users created: admin (${admin._id}), freeMember (${freeMember._id}), proMember (${proMember._id})`);

    // 2. Create Subscriptions
    console.log('Creating subscription states...');
    await Subscription.create({
      user: proMember._id,
      plan: 'Pro',
      provider: 'stripe',
      providerCustomerId: 'cus_H123456789',
      providerSubscriptionId: 'sub_I123456789',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // 3. Create Communities
    console.log('Creating communities...');
    const saasCommunity = await Community.create({
      name: 'SaaS Developers',
      description: 'A community for developers building Software as a Service products.',
      category: 'Software Engineering',
      owner: proMember._id,
      members: [proMember._id, freeMember._id],
      memberCount: 2,
      rules: ['No spamming', 'Be respectful to other indie creators']
    });

    const reactCommunity = await Community.create({
      name: 'React Developers',
      description: 'Exclusive hub for advanced React and frontend engineers.',
      category: 'Web Development',
      owner: admin._id,
      members: [admin._id, proMember._id],
      memberCount: 2,
      isPro: true,
      rules: ['No basic syntax questions', 'Focus on architecture and optimizations']
    });

    // Add communities back to users
    proMember.communities.push(saasCommunity._id, reactCommunity._id);
    await proMember.save();
    freeMember.communities.push(saasCommunity._id);
    await freeMember.save();

    console.log(`Communities created: SaaS Devs (${saasCommunity._id}), React Devs (${reactCommunity._id})`);

    // 4. Create Posts
    console.log('Creating posts...');
    const post1 = await Post.create({
      title: 'How to scale Express and Socket.io to 10k CCU',
      content: 'Here is a complete blueprint showing how to leverage Redis adapter for clustering Express & Socket.io instances...',
      contentFormat: 'markdown',
      author: proMember._id,
      community: saasCommunity._id,
      likes: [freeMember._id]
    });

    const post2 = await Post.create({
      title: 'Advanced Server-Components optimization tips',
      content: 'React Server Components can be tricky. Here is what we learned after moving our entire SaaS portal...',
      contentFormat: 'text',
      author: admin._id,
      community: reactCommunity._id,
      likes: [proMember._id]
    });

    console.log(`Posts created: post1 (${post1._id}), post2 (${post2._id})`);

    // 5. Create Comments (and nested comment replies)
    console.log('Creating comments and replies...');
    const parentComment = await Comment.create({
      post: post1._id,
      author: freeMember._id,
      content: 'This is an outstanding writeup! What Redis configuration settings did you use?'
    });

    const replyComment = await Comment.create({
      post: post1._id,
      author: proMember._id,
      content: 'Thanks Jane! We configured the maxmemory-policy to volatile-lru for better connection caching.',
      parentComment: parentComment._id
    });

    // Link reply to parent comment replies array
    parentComment.replies.push(replyComment._id);
    await parentComment.save();

    // Increment post's comment counter
    post1.commentsCount = 2;
    await post1.save();

    console.log(`Comments populated: Parent (${parentComment._id}) -> Reply (${replyComment._id})`);

    // 6. Create Projects
    console.log('Creating projects...');
    await Project.create({
      title: 'Need Node/React dev to build a scheduling dashboard',
      description: 'Looking for a full stack engineer to build an interactive client calendar scheduling dashboard. Long term contract.',
      creator: freeMember._id,
      requiredSkills: ['React.js', 'Node.js', 'Mongoose'],
      budget: 3500,
      projectType: 'contract',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // +14 days
    });

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Seeding database failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seedDatabase();
