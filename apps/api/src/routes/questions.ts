import express from 'express';
import { QuestionService } from '../services/question.service';

const router = express.Router();
const service = new QuestionService();

// GET /api/questions/types
router.get('/types', (req, res) => {
  try {
    const types = service.getAllQuestionTypes();
    const categories = service.getCategories();
    res.json({ types, categories });
  } catch (error) {
    console.error('Error fetching question types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
