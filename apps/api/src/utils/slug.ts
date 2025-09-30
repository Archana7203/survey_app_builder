import { Survey } from '../models/Survey';

export const generateSlug = (title: string): string => {
  // Handle null, undefined, or non-string inputs
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
  .toLowerCase()
  .replace(/[^\w]+/g, '-')         // Replace sequences of non-word characters with single hyphen
  .replace(/(^-+)|(-+$)/g, '');    // Remove leading/trailing hyphens
}

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





