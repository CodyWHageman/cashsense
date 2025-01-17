/**
 * Convert JavaScript month (0-11) to database month (1-12)
 */
export const getDatabaseMonth = (jsMonth: number): number => jsMonth + 1;

/**
 * Convert database month (1-12) to JavaScript month (0-11)
 */
export const getJavaScriptMonth = (dbMonth: number): number => dbMonth - 1; 

export const getMonthName = (month: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

