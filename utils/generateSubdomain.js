export const generateSubdomain = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")  // remove symbols/emojis
    .replace(/\s+/g, "");          // remove spaces completely
};