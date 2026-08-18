import express from 'express';
import { requireAuth } from '../middleware/authz.middleware.js';
import Project from '../models/Project.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const checkProSubscription = async (user) => {
  if (user.role === 'Admin') return true;
  if (user.role !== 'ProMember') return false;
  const sub = await Subscription.findOne({ user: user._id });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// GET /api/projects
// Browse/search/filter projects
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { search, skill, projectType, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (skill) {
      query.requiredSkills = skill;
    }

    if (projectType) {
      query.projectType = projectType;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = 'open';
    }

    const projects = await Project.find(query)
      .populate('creator', 'name username avatar profession')
      .sort({ createdAt: -1 });

    // Adapt to owner naming convention if frontend maps creator to owner
    const mappedProjects = projects.map(p => {
      const obj = p.toObject();
      obj.owner = obj.creator;
      return obj;
    });

    res.status(200).json({
      success: true,
      projects: mappedProjects
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId
// Get project details + applications if owner
router.get('/:projectId', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('creator', 'name username avatar profession');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const projectObj = project.toObject();
    projectObj.owner = projectObj.creator;

    // If request user is owner or Admin, load applications
    const isOwner = project.creator && project.creator._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (isOwner || isAdmin) {
      const applications = await Application.find({ project: project._id })
        .populate('applicant', 'name username avatar profession');
      projectObj.applications = applications;
    }

    res.status(200).json({
      success: true,
      project: projectObj
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
// Create a project listing
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const isPro = await checkProSubscription(req.user);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only ProMembers or Admins can post projects.'
      });
    }

    const { title, description, requiredSkills, projectType, budget, deadline } = req.body;

    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, budget, and deadline.'
      });
    }

    const project = await Project.create({
      title,
      description,
      requiredSkills,
      projectType,
      budget,
      deadline,
      creator: req.user._id
    });

    const populatedProject = await Project.findById(project._id).populate('creator', 'name username avatar');

    res.status(201).json({
      success: true,
      project: populatedProject
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/apply
// Apply for a project
router.post('/:projectId/apply', requireAuth, async (req, res, next) => {
  try {
    const isPro = await checkProSubscription(req.user);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only ProMembers or Admins can apply to projects.'
      });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This project is closed or no longer accepting applications.'
      });
    }

    if (project.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own project.'
      });
    }

    // Check duplicate application
    const existingApp = await Application.findOne({
      project: project._id,
      applicant: req.user._id
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project.'
      });
    }

    const { coverLetter, proposedBudget } = req.body;

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      message: coverLetter || 'No cover letter provided.',
      proposedBudget: proposedBudget || project.budget
    });

    // Notify project creator
    await Notification.create({
      recipient: project.creator,
      sender: req.user._id,
      type: 'project',
      title: 'New Project Applicant',
      message: `${req.user.name} applied for your project: "${project.title}"`,
      link: `/projects`
    });

    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/applications/:applicationId
// Accept or reject an application
router.patch('/:projectId/applications/:applicationId', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can manage applications.'
      });
    }

    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Accepted or Rejected.'
      });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    // Notify applicant
    await Notification.create({
      recipient: application.applicant,
      sender: req.user._id,
      type: 'project',
      title: `Application ${status}`,
      message: `Your application to "${project.title}" was ${status.toLowerCase()}.`,
      link: `/projects`
    });

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/close
// Close project
router.patch('/:projectId/close', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can close the project.'
      });
    }

    project.status = 'completed';
    await project.save();

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
});

export default router;
