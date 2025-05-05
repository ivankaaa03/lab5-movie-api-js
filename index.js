// index.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Функція для завантаження конфігурації
async function loadConfig(filename = 'config.json') {
  try {
    const configPath = path.join(__dirname, filename);
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (!config.apiKey) {
      throw new Error('API ключ не знайдено в конфігураційному файлі');
    }
    
    return config;
  } catch (error) {
    console.error('Помилка завантаження конфігурації:', error.message);
    process.exit(1);
  }
}

// Функція для звернення до API
async function getDataFromApi(searchQuery, apiKey) {
  try {
    const baseUrl = 'https://api.themoviedb.org/3';
    const endpoint = '/search/movie';
    const url = `${baseUrl}${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}&language=uk-UA`;
    
    const response = await axios.get(url);
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Помилка API: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`Помилка API: ${error.response.status} - ${error.response.data.status_message}`);
    } else {
      throw new Error(`Помилка мережі: ${error.message}`);
    }
  }
}

// Функція для збереження даних у JSON файл
function saveDataToJson(data, filename = 'output.json') {
  try {
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Результати успішно збережено у файл ${filename}`);
  } catch (error) {
    console.error('Помилка збереження даних:', error.message);
  }
}

// Функція для виведення скороченої інформації в консоль
function displayMovieSummary(moviesData) {
  const movies = moviesData.results;
  
  if (movies.length === 0) {
    console.log('За вашим запитом не знайдено жодного фільму.');
    return;
  }
  
  console.log(`\nЗнайдено ${movies.length} результатів. Показано перші 5:`);
  console.log('----------------------------------------------');
  
  const moviesToShow = movies.slice(0, 5);
  
  moviesToShow.forEach((movie, index) => {
    console.log(`${index + 1}. Назва: ${movie.title}`);
    console.log(`   Дата виходу: ${movie.release_date || 'Невідомо'}`);
    console.log(`   Рейтинг: ${movie.vote_average}/10 (${movie.vote_count} голосів)`);
    console.log(`   Опис: ${movie.overview ? movie.overview.substring(0, 150) + '...' : 'Опис відсутній'}`);
    console.log('----------------------------------------------');
  });
  
  console.log(`\nЗагальна кількість знайдених фільмів: ${movies.length}`);
  console.log(`Повна інформація збережена у файлі output.json`);
}

// Функція для запиту параметру пошуку у користувача
function askUserForSearchQuery() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Введіть назву фільму для пошуку: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Основна функція програми
async function main() {
  try {
    console.log('Запуск програми для пошуку фільмів...');
    
    // Завантажуємо конфігурацію
    const config = await loadConfig();
    console.log('Конфігурацію успішно завантажено');
    
    // Запитуємо параметри пошуку у користувача
    const searchQuery = await askUserForSearchQuery();
    
    if (!searchQuery.trim()) {
      console.error('Пошуковий запит не може бути порожнім');
      process.exit(1);
    }
    
    console.log(`\nПошук фільмів за запитом: "${searchQuery}"`);
    
    // Отримуємо дані з API
    const moviesData = await getDataFromApi(searchQuery, config.apiKey);
    
    // Зберігаємо повну відповідь у файл
    saveDataToJson(moviesData);
    
    // Виводимо коротку інформацію в консоль
    displayMovieSummary(moviesData);
    
  } catch (error) {
    console.error('Помилка виконання програми:', error.message);
    process.exit(1);
  }
}

// Запуск програми
main();