// src/utils/dateUtils.js
export const convertExcelDateToJSDate = (value) => {
    if (!value) return null;
  
    // If the value is already in 'YYYY-MM-DD' format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
  
    // If the value is a JavaScript Date object
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  
    // If the value is a number (Excel serial date)
    if (typeof value === 'number') {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  
    // If the value is a string in another format
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date)) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  
    // If none of the above, return null or throw an error
    return null;
  };
  