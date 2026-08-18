import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  budget: {
    type: Number,
    required: [true, 'Budget is required']
  },
  projectType: {
    type: String,
    enum: ['contract', 'full-time', 'part-time'],
    default: 'contract'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  }
}, {
  timestamps: true
});

projectSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
