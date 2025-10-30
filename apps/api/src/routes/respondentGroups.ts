import express from 'express';
import { RespondentGroupService } from '../services/respondentGroup.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';

const router = express.Router();
const service = new RespondentGroupService();

// GET /api/respondent-groups - List all groups for authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    
    const filters: any = {};
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    if (req.query.isArchived !== undefined) {
      filters.isArchived = req.query.isArchived === 'true';
    }

    log.info('Listing respondent groups', 'GET_GROUPS', {
      userId: req.user._id.toString(),
      page,
      limit,
      filters,
    });

    const result = await service.list(
      req.user._id.toString(),
      page,
      limit,
      filters
    );

    res.json(result);
  } catch (error: any) {
    log.error('Error listing groups', 'GET_GROUPS', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to fetch groups' });
  }
});

// GET /api/respondent-groups/:id - Get single group
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    log.info('Fetching group', 'GET_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    const group = await service.getById(id, req.user._id.toString());

    res.json(group);
  } catch (error: any) {
    log.error('Error fetching group', 'GET_GROUP', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch group' });
    }
  }
});

// POST /api/respondent-groups - Create new group
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, members } = req.body;

    log.info('Creating group', 'POST_GROUP', {
      userId: req.user._id.toString(),
      name,
    });

    const group = await service.create(req.user._id.toString(), {
      name,
      description,
      members,
    });

    log.info('Group created successfully', 'POST_GROUP', {
      userId: req.user._id.toString(),
      groupId: group._id,
    });

    res.status(201).json(group);
  } catch (error: any) {
    log.error('Error creating group', 'POST_GROUP', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    
    if (error.message.includes('required') || error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create group' });
    }
  }
});

// PATCH /api/respondent-groups/:id - Update group
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    log.info('Updating group', 'PATCH_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    const group = await service.update(
      id,
      req.user._id.toString(),
      updateData
    );

    log.info('Group updated successfully', 'PATCH_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    res.json(group);
  } catch (error: any) {
    log.error('Error updating group', 'PATCH_GROUP', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update group' });
    }
  }
});

// DELETE /api/respondent-groups/:id - Soft delete group
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    log.info('Soft deleting group', 'DELETE_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    await service.softDelete(id, req.user._id.toString());

    log.info('Group soft deleted successfully', 'DELETE_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    res.json({ message: 'Group archived successfully' });
  } catch (error: any) {
    log.error('Error deleting group', 'DELETE_GROUP', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete group' });
    }
  }
});

// POST /api/respondent-groups/:id/members - Add members to group
router.post('/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'memberIds array is required' });
    }

    log.info('Adding members to group', 'ADD_MEMBERS', {
      userId: req.user._id.toString(),
      groupId: id,
      count: memberIds.length,
    });

    const group = await service.addMembers(
      id,
      req.user._id.toString(),
      memberIds
    );

    log.info('Members added successfully', 'ADD_MEMBERS', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    res.json(group);
  } catch (error: any) {
    log.error('Error adding members', 'ADD_MEMBERS', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('required')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to add members' });
    }
  }
});

// DELETE /api/respondent-groups/:id/members - Remove members from group
router.delete('/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'memberIds array is required' });
    }

    log.info('Removing members from group', 'REMOVE_MEMBERS', {
      userId: req.user._id.toString(),
      groupId: id,
      count: memberIds.length,
    });

    const group = await service.removeMembers(
      id,
      req.user._id.toString(),
      memberIds
    );

    log.info('Members removed successfully', 'REMOVE_MEMBERS', {
      userId: req.user._id.toString(),
      groupId: id,
    });

    res.json(group);
  } catch (error: any) {
    log.error('Error removing members', 'REMOVE_MEMBERS', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('required')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to remove members' });
    }
  }
});

// POST /api/respondent-groups/:id/duplicate - Duplicate group
router.post('/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    log.info('Duplicating group', 'DUPLICATE_GROUP', {
      userId: req.user._id.toString(),
      groupId: id,
      newName,
    });

    const group = await service.duplicate(
      id,
      req.user._id.toString(),
      newName
    );

    log.info('Group duplicated successfully', 'DUPLICATE_GROUP', {
      userId: req.user._id.toString(),
      originalGroupId: id,
      newGroupId: group._id,
    });

    res.status(201).json(group);
  } catch (error: any) {
    log.error('Error duplicating group', 'DUPLICATE_GROUP', {
      userId: req.user?._id?.toString(),
      groupId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to duplicate group' });
    }
  }
});

export default router;

