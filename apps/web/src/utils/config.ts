interface PaginationConfig {
  surveys: {
    defaultLimit: number;
    maxLimit: number;
    pageSize: number;
  };
  respondentProgress: {
    defaultLimit: number;
    maxLimit: number;
    pageSize: number;
  };
}

interface AppConfig {
  autoSaveInterval: number;
  pagination: PaginationConfig;
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (config) {
    return config;
  }

  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    
    const loadedConfig = await response.json();
    
    // Set defaults if config is missing
    if (!loadedConfig.pagination) {
      loadedConfig.pagination = {
        surveys: {
          defaultLimit: 10,
          maxLimit: 100,
          pageSize: 10
        },
        respondentProgress: {
          defaultLimit: 20,
          maxLimit: 200,
          pageSize: 20
        }
      };
    }
    
    config = loadedConfig;
    return config!;
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error);
    
    // Return default config if loading fails
    const defaultConfig: AppConfig = {
      autoSaveInterval: 60000,
      pagination: {
        surveys: {
          defaultLimit: 10,
          maxLimit: 100,
          pageSize: 10
        },
        respondentProgress: {
          defaultLimit: 20,
          maxLimit: 200,
          pageSize: 20
        }
      }
    };
    
    config = defaultConfig;
    return config!;
  }
}

export function getConfig(): AppConfig | null {
  return config;
}

export function getPaginationConfig(type: 'surveys' | 'respondentProgress') {
  return config?.pagination[type];
}

export function getSurveyPaginationConfig() {
  return getPaginationConfig('surveys');
}

export function getRespondentProgressPaginationConfig() {
  return getPaginationConfig('respondentProgress');
}
