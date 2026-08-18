import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberCount: {
    type: Number,
    default: 1
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  isPro: {
    type: Boolean,
    default: false
  },
  rules: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Auto slug generation from name
communitySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

communitySchema.index({ name: 'text', description: 'text', category: 'text' });

const Community = mongoose.model('Community', communitySchema);
export default Community;
