const fs = require('fs');
const path = require('path');

// Загружаем данные
const deputies = require('./public/persons_info/deputaty_vseh_sozyvov.json');
const laws = require('./public/persons_doc/zakony.json');
const resolutions = require('./public/persons_doc/postamovleniya_VH.json');

// Маппинг созывов
const convocationMap = {
  'Первый созыв (2010 - 2014 гг.)': { id: 'I', name: 'Первый созыв (2010 - 2014 гг.)', number: 'I', years: '2010-2014', isActive: false },
  'Второй созыв (2014 - 2019 гг.)': { id: 'II', name: 'Второй созыв (2014 - 2019 гг.)', number: 'II', years: '2014-2019', isActive: false },
  'Третий созыв (2019 - 2024 гг.)': { id: 'III', name: 'Третий созыв (2019 - 2024 гг.)', number: 'III', years: '2019-2024', isActive: false },
  'Четвертый созыв (2024 - по наст. вр)': { id: 'IV', name: 'Четвертый созыв (2024 - по наст. вр)', number: 'IV', years: '2024-н.в.', isActive: false },
};

// Текущий созыв - VII (это текущий действующий созыв с сайта)
const currentConvocation = { 
  id: 'VII', 
  name: 'Седьмой созыв', 
  number: 'VII', 
  years: '2024-н.в.', 
  isActive: true 
};

// Статистика по созывам
const stats = {};

// Подсчитываем депутатов
deputies.forEach(item => {
  const convName = item.IC_GROUP0 || '';
  if (!convName || convName.trim() === '') return;
  
  if (!stats[convName]) {
    stats[convName] = {
      deputies: new Set(),
      laws: 0,
      resolutions: 0,
    };
  }
  
  if (item.IE_ID) {
    stats[convName].deputies.add(item.IE_ID);
  }
});

// Подсчитываем законы (по дате)
laws.forEach(law => {
  const dateStr = law.IP_PROP27 || '';
  if (!dateStr) return;
  
  try {
    const [day, month, year] = dateStr.split('.');
    const lawYear = parseInt(year);
    
    // Распределяем по созывам по годам
    if (lawYear >= 2010 && lawYear < 2014) {
      const convName = 'Первый созыв (2010 - 2014 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].laws++;
    } else if (lawYear >= 2014 && lawYear < 2019) {
      const convName = 'Второй созыв (2014 - 2019 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].laws++;
    } else if (lawYear >= 2019 && lawYear < 2024) {
      const convName = 'Третий созыв (2019 - 2024 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].laws++;
    } else if (lawYear >= 2024) {
      const convName = 'Четвертый созыв (2024 - по наст. вр)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].laws++;
    }
  } catch (e) {
    // ignore invalid dates
  }
});

// Подсчитываем постановления (по дате)
resolutions.forEach(res => {
  const dateStr = res.IP_PROP58 || '';
  if (!dateStr) return;
  
  try {
    const [day, month, year] = dateStr.split('.');
    const resYear = parseInt(year);
    
    if (resYear >= 2010 && resYear < 2014) {
      const convName = 'Первый созыв (2010 - 2014 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].resolutions++;
    } else if (resYear >= 2014 && resYear < 2019) {
      const convName = 'Второй созыв (2014 - 2019 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].resolutions++;
    } else if (resYear >= 2019 && resYear < 2024) {
      const convName = 'Третий созыв (2019 - 2024 гг.)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].resolutions++;
    } else if (resYear >= 2024) {
      const convName = 'Четвертый созыв (2024 - по наст. вр)';
      if (!stats[convName]) stats[convName] = { deputies: new Set(), laws: 0, resolutions: 0 };
      stats[convName].resolutions++;
    }
  } catch (e) {
    // ignore invalid dates
  }
});

// Формируем итоговую статистику
console.log('\n📊 СТАТИСТИКА ПО СОЗЫВАМ:\n');
console.log('='.repeat(80));

Object.keys(stats).sort().forEach(convName => {
  const stat = stats[convName];
  const conv = convocationMap[convName];
  
  if (conv) {
    console.log(`\n${conv.name}`);
    console.log(`  Депутатов: ${stat.deputies.size}`);
    console.log(`  Законов: ${stat.laws}`);
    console.log(`  Постановлений: ${stat.resolutions}`);
  }
});

console.log('\n' + '='.repeat(80));

// Создаем JSON с описаниями для созывов
const convocationsData = Object.keys(convocationMap).map(convName => {
  const conv = convocationMap[convName];
  const stat = stats[convName] || { deputies: new Set(), laws: 0, resolutions: 0 };
  
  return {
    id: conv.id,
    name: conv.name,
    number: conv.number,
    years: conv.years,
    isActive: conv.isActive,
    description: `${stat.deputies.size} депутатов. Принято ${stat.laws} законов и ${stat.resolutions} постановлений.`,
    stats: {
      deputies: stat.deputies.size,
      laws: stat.laws,
      resolutions: stat.resolutions,
    }
  };
});

// Добавляем текущий VII созыв
convocationsData.push({
  id: currentConvocation.id,
  name: currentConvocation.name,
  number: currentConvocation.number,
  years: currentConvocation.years,
  isActive: currentConvocation.isActive,
  description: 'Действующий созыв Верховного Хурала (парламента) Республики Тыва.',
  stats: {
    deputies: 32,
    laws: 0,
    resolutions: 0,
  }
});

// Сохраняем в файл
const outputPath = path.join(__dirname, 'public', 'data', 'convocations.json');
fs.writeFileSync(outputPath, JSON.stringify(convocationsData, null, 2), 'utf8');

console.log(`\n✅ Данные сохранены в ${outputPath}`);
console.log(`\nВсего созывов: ${convocationsData.length}`);
