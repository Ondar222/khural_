/**
 * Форматирует дату и время для отображения новостей
 * @param {string|number|Date} date - Дата в формате ISO строки, timestamp (мс) или Date объект
 * @returns {string} Отформатированная дата и время в формате "дд.мм.гггг, чч:мм"
 */
export function formatNewsDateTime(date) {
  if (!date) return "";
  
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === "number") {
    // Если число, считаем это timestamp в миллисекундах
    dateObj = new Date(date);
  } else if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    return "";
  }
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  // Форматируем дату: "дд.мм.гггг, чч:мм"
  const dateStr = dateObj.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  const timeStr = dateObj.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return `${dateStr}, ${timeStr}`;
}

/**
 * Форматирует только дату для отображения
 * @param {string|number|Date} date - Дата в формате ISO строки, timestamp (мс) или Date объект
 * @returns {string} Отформатированная дата в формате "дд.мм.гггг"
 */
export function formatNewsDate(date) {
  if (!date) return "";
  
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === "number") {
    dateObj = new Date(date);
  } else if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    return "";
  }
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  return dateObj.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
