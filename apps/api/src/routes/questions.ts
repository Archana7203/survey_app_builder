import express from 'express';
import { QuestionService } from '../services/question.service';
import log from '../logger'; 

const router = express.Router();
const service = new QuestionService();

// GET /api/questions/types
router.get('/types', (req, res) => {
  try {
    log.info('Fetching question types', 'GET_QUESTION_TYPES');
    
    const types = service.getAllQuestionTypes();
    const categories = service.getCategories();
    
    log.httpResponse(req, res, { types, categories }, 'GET_QUESTION_TYPES');
    res.json({ types, categories });
  } catch (error) {
    log.error('Failed to fetch question types', 'GET_QUESTION_TYPES', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;