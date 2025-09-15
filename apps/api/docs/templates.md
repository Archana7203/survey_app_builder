# Survey Templates API

The Survey Templates feature provides pre-built survey templates that users can instantiate to quickly create new surveys.

## Endpoints

### GET /api/templates
Returns a list of all available survey templates.

**Response:**
```json
[
  {
    "id": "customer-satisfaction",
    "title": "Customer Satisfaction Survey",
    "description": "Measure customer satisfaction and gather feedback",
    "category": "Customer Feedback",
    "thumbnail": "📊",
    "estimatedTime": "5-7 minutes"
  }
]
```

### GET /api/templates/:id
Returns detailed information about a specific template, including all pages and questions.

**Response:**
```json
{
  "id": "customer-satisfaction",
  "title": "Customer Satisfaction Survey",
  "description": "Measure customer satisfaction and gather feedback",
  "category": "Customer Feedback",
  "thumbnail": "📊",
  "estimatedTime": "5-7 minutes",
  "pages": [
    {
      "questions": [...],
      "branching": [...]
    }
  ]
}
```

### POST /api/templates/:id/instantiate
Creates a new survey based on the specified template.

**Authentication:** Required

**Response:**
```json
{
  "id": "survey_id",
  "title": "Customer Satisfaction Survey",
  "description": "Measure customer satisfaction and gather feedback",
  "slug": "customer-satisfaction-survey",
  "theme": "default",
  "status": "draft",
  "pages": [...],
  "templateId": "customer-satisfaction"
}
```

## Templates Data

Templates are stored in `/apps/api/data/templates.json` and automatically seeded to the database on startup.

### Available Templates

1. **Customer Satisfaction Survey** - Comprehensive customer feedback collection
2. **Employee Engagement Survey** - Workplace satisfaction and culture assessment  
3. **Net Promoter Score (NPS) Survey** - Customer loyalty measurement
4. **Event Feedback Survey** - Post-event attendee feedback
5. **Product Feedback Survey** - Product feature and usability feedback

### Template Structure

Each template includes:
- Basic metadata (title, description, category, etc.)
- Survey pages with questions
- Question types: rating stars, numbers, text, multiple choice, etc.
- Branching logic (optional)

## Frontend Integration

The templates are accessible via:
- `/dashboard/templates` - Template gallery page
- Template cards with thumbnails and descriptions
- "Use This Template" button that calls the instantiate endpoint
- Category filtering
- Automatic redirect to Survey Builder after instantiation

## Development

### Adding New Templates

1. Add template data to `/apps/api/data/templates.json`
2. Restart the API server to re-seed templates
3. Or use the `reseedTemplates()` utility function

### Template Categories

Current categories:
- Customer Feedback
- HR & Workplace  
- Events
- Product Development

### Question Types Supported

All question types from the core survey system:
- `ratingStar`, `ratingNumber`, `ratingSmiley`
- `singleChoice`, `multiChoice`, `dropdown`
- `textShort`, `textLong`
- `slider`, `datePicker`, `email`
- `matrixTable`




