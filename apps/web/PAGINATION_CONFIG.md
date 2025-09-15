# Pagination Configuration Guide

This document explains how to configure pagination limits for surveys and respondent progress in the survey app builder.

## Configuration File

The pagination settings are configured in `apps/web/public/config.json`:

```json
{
  "autoSaveInterval": 60000,
  "pagination": {
    "surveys": {
      "defaultLimit": 5,
      "maxLimit": 5,
      "pageSize": 5
    },
    "respondentProgress": {
      "defaultLimit": 5,
      "maxLimit": 5,
      "pageSize": 5
    }
  }
}
```

## Configuration Options

### Surveys Pagination
- **defaultLimit**: Number of surveys to show per page by default (default: 5)
- **maxLimit**: Maximum number of surveys that can be shown per page (default: 5)
- **pageSize**: Suggested page size increments for the dropdown (default: 5)

### Respondent Progress Pagination
- **defaultLimit**: Number of respondents to show per page by default (default: 5)
- **maxLimit**: Maximum number of respondents that can be shown per page (default: 5)
- **pageSize**: Suggested page size increments for the dropdown (default: 5)

## API Endpoints

### Surveys Endpoint
```
GET /api/surveys?page={page}&limit={limit}
```

**Query Parameters:**
- `page`: Page number (starts from 1)
- `limit`: Number of surveys per page (max: 5)

**Response:**
```json
{
  "surveys": [...],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Respondent Progress Endpoint
```
GET /api/surveys/{surveyId}/respondent-progress?page={page}&limit={limit}
```

**Query Parameters:**
- `page`: Page number (starts from 1)
- `limit`: Number of respondents per page (max: 5)

**Response:**
```json
{
  "survey": {...},
  "respondentProgress": [...],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 45,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Frontend Usage

### Loading Configuration
```typescript
import { loadConfig, getSurveyPaginationConfig, getRespondentProgressPaginationConfig } from '../utils/config';

// Load config on component mount
useEffect(() => {
  loadConfig().then(() => {
    const surveyConfig = getSurveyPaginationConfig();
    const progressConfig = getRespondentProgressPaginationConfig();
    
    // Use config values
    setPageSize(surveyConfig?.defaultLimit || 5);
  });
}, []);
```

### Making Paginated Requests
```typescript
const fetchSurveys = async (page: number = 1, limit: number = 5) => {
  const response = await fetch(`/api/surveys?page=${page}&limit=${limit}`);
  const data = await response.json();
  
  setSurveys(data.surveys);
  setPagination(data.pagination);
};
```

## Features

### Automatic Page Size Limits
- The frontend automatically enforces maximum limits from the config
- Users cannot exceed the configured `maxLimit` values

### Smart Page Navigation
- Shows up to 5 page numbers at a time
- Automatically adjusts visible page numbers based on current position
- Previous/Next buttons are disabled when appropriate

### Page Size Selection
- Dropdown menus allow users to change items per page
- Automatically resets to page 1 when changing page size
- Respects maximum limits from configuration

### Responsive Design
- Pagination controls adapt to different screen sizes
- Mobile-friendly navigation

## Customization

### Changing Default Values
To change the default pagination behavior, modify the values in `config.json`:

```json
{
  "pagination": {
    "surveys": {
      "defaultLimit": 10,    // Show 10 surveys by default
      "maxLimit": 10,        // Allow up to 10 surveys per page
      "pageSize": 10         // Suggest 10 as a page size option
    }
  }
}
```

### Adding New Pagination Types
To add pagination for new data types:

1. Add configuration to `config.json`
2. Update the `PaginationConfig` interface in `utils/config.ts`
3. Add new getter functions
4. Implement pagination in the corresponding API endpoint
5. Add pagination controls to the frontend component

## Performance Considerations

- **Database Queries**: Pagination reduces memory usage and improves query performance
- **Network Transfer**: Smaller payloads improve loading times
- **UI Responsiveness**: Limited data rendering keeps the interface snappy
- **Memory Usage**: Prevents large datasets from overwhelming the browser

## Error Handling

- If the config file fails to load, the system falls back to hardcoded defaults
- API endpoints gracefully handle invalid pagination parameters
- Frontend components show appropriate loading and error states