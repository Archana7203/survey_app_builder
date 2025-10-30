import express from 'express';
import { RespondentService } from '../services/respondent.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';

const router = express.Router();
const service = new RespondentService();

// GET /api/respondents - List all respondents for authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    
    const filters: any = {};
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    if (req.query.gender) {
      filters.gender = req.query.gender as 'male' | 'female' | 'other';
    }
    
    if (req.query.isArchived !== undefined) {
      filters.isArchived = req.query.isArchived === 'true';
    }

    log.info('Listing respondents', 'GET_RESPONDENTS', {
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
    log.error('Error listing respondents', 'GET_RESPONDENTS', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to fetch respondents' });
  }
});

// GET /api/respondents/:id - Get single respondent
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    log.info('Fetching respondent', 'GET_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: id,
    });

    const respondent = await service.getById(id, req.user._id.toString());

    res.json(respondent);
  } catch (error: any) {
    log.error('Error fetching respondent', 'GET_RESPONDENT', {
      userId: req.user?._id?.toString(),
      respondentId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch respondent' });
    }
  }
});

// POST /api/respondents - Create new respondent
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { azureId, name, mail, gender, userPrincipalName, accountEnabled, employeeId } = req.body;

    log.info('Creating respondent', 'POST_RESPONDENT', {
      userId: req.user._id.toString(),
      mail,
    });

    const respondent = await service.create(req.user._id.toString(), {
      azureId,
      name,
      mail,
      gender,
      userPrincipalName,
      accountEnabled,
      employeeId,
    });

    log.info('Respondent created successfully', 'POST_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: respondent._id,
    });

    res.status(201).json(respondent);
  } catch (error: any) {
    log.error('Error creating respondent', 'POST_RESPONDENT', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    
    if (error.message.includes('required') || error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create respondent' });
    }
  }
});

// PATCH /api/respondents/:id - Update respondent
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    log.info('Updating respondent', 'PATCH_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: id,
    });

    const respondent = await service.update(
      id,
      req.user._id.toString(),
      updateData
    );

    log.info('Respondent updated successfully', 'PATCH_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: id,
    });

    res.json(respondent);
  } catch (error: any) {
    log.error('Error updating respondent', 'PATCH_RESPONDENT', {
      userId: req.user?._id?.toString(),
      respondentId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update respondent' });
    }
  }
});

// DELETE /api/respondents/:id - Soft delete respondent
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    log.info('Soft deleting respondent', 'DELETE_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: id,
    });

    await service.softDelete(id, req.user._id.toString());

    log.info('Respondent soft deleted successfully', 'DELETE_RESPONDENT', {
      userId: req.user._id.toString(),
      respondentId: id,
    });

    res.json({ message: 'Respondent archived successfully' });
  } catch (error: any) {
    log.error('Error deleting respondent', 'DELETE_RESPONDENT', {
      userId: req.user?._id?.toString(),
      respondentId: req.params.id,
      error: error.message,
    });
    
    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete respondent' });
    }
  }
});

// POST /api/respondents/import/azure - Bulk import from Azure
router.post('/import/azure', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { profiles } = req.body;

    if (!profiles || !Array.isArray(profiles)) {
      return res.status(400).json({ error: 'Profiles array is required' });
    }

    log.info('Importing Azure profiles', 'IMPORT_AZURE_RESPONDENTS', {
      userId: req.user._id.toString(),
      count: profiles.length,
    });

    const result = await service.upsertManyAzure(
      req.user._id.toString(),
      profiles
    );

    log.info('Azure profiles imported successfully', 'IMPORT_AZURE_RESPONDENTS', {
      userId: req.user._id.toString(),
      result,
    });

    res.json(result);
  } catch (error: any) {
    log.error('Error importing Azure profiles', 'IMPORT_AZURE_RESPONDENTS', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to import Azure profiles' });
  }
});

export default router;

