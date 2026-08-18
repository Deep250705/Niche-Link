import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: [true, 'Cover letter/pitch message is required']
  },
  proposedBudget: {
    type: Number,
    required: [true, 'Proposed budget is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;
