import express from 'express';
import { AzureGraphService } from '../services/azureGraph.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';

const router = express.Router();

// GET /api/azure-users - Fetch users from Azure AD / O365
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 100;
    const search = req.query.search as string;

    log.info('Fetching Azure users', 'GET_AZURE_USERS', {
      userId: req.user._id.toString(),
      page,
      limit,
      hasSearch: !!search,
    });

    const service = new AzureGraphService();

    // If search query provided, use search endpoint
    if (search) {
      const users = await service.searchAzureUsers(search);
      
      log.info('Azure users search completed', 'GET_AZURE_USERS', {
        userId: req.user._id.toString(),
        count: users.length,
      });

      return res.json({
        users,
        pagination: {
          page: 1,
          limit: users.length,
          total: users.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    // Otherwise, use paginated fetch
    const result = await service.fetchAzureUsersPaginated(limit);

    log.info('Azure users fetched successfully', 'GET_AZURE_USERS', {
      userId: req.user._id.toString(),
      count: result.users.length,
      hasMore: result.hasMore,
    });

    res.json({
      users: result.users,
      pagination: {
        page,
        limit,
        hasNext: result.hasMore,
        nextLink: result.nextLink,
      },
    });
  } catch (error: any) {
    log.error('Error fetching Azure users', 'GET_AZURE_USERS', {
      userId: req.user?._id?.toString(),
      error: error.message,
      stack: error.stack,
    });

    // Provide specific error messages based on error type
    if (error.message.includes('configuration') || error.message.includes('credentials')) {
      res.status(503).json({ 
        error: 'Azure AD service not configured or credentials invalid',
        details: error.message,
      });
    } else if (error.message.includes('Unauthorized')) {
      res.status(403).json({ 
        error: 'Not authorized to access Azure AD',
        details: error.message,
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch Azure users',
        details: error.message,
      });
    }
  }
});

// GET /api/azure-users/:id - Fetch single user from Azure AD
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    log.info('Fetching Azure user by ID', 'GET_AZURE_USER', {
      userId: req.user._id.toString(),
      azureId: id,
    });

    const service = new AzureGraphService();
    const user = await service.getAzureUserById(id);

    log.info('Azure user fetched successfully', 'GET_AZURE_USER', {
      userId: req.user._id.toString(),
      azureId: id,
    });

    res.json(user);
  } catch (error: any) {
    log.error('Error fetching Azure user', 'GET_AZURE_USER', {
      userId: req.user?._id?.toString(),
      azureId: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Unauthorized')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch Azure user',
        details: error.message,
      });
    }
  }
});

export default router;

