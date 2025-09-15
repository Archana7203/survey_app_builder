import { Survey } from '../models/Survey';

export const generateSlug = (title: string): string => {
  // Handle null, undefined, or non-string inputs
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[_\s]+/g, '-') // Replace underscores and spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .trim();
};

export const generateUniqueSlug = async (title: string): Promise<string> => {
  // Handle null, undefined, or non-string inputs
  if (!title || typeof title !== 'string') {
    return '';
  }

  let baseSlug = generateSlug(title);
  
  // If baseSlug is empty, return empty string
  if (!baseSlug) {
    return '';
  }

  let slug = baseSlug;
  let counter = 1;

  while (await Survey.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};





