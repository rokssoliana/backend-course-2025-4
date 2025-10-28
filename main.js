#!/usr/bin/env node

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const { XMLBuilder } = require('fast-xml-parser');

const program = new Command();

program
  .requiredOption('-i, --input <file>', 'Path to input JSON file')
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port');

program.parse(process.argv);
const options = program.opts();

// Перевірка існування файлу
const filePath = path.resolve(options.input);
fs.access(filePath).catch(() => {
  console.error('Cannot find input file');
  process.exit(1);
});

// Створюємо HTTP-сервер
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${options.host}:${options.port}`);
    const furnished = url.searchParams.get('furnished');
    const maxPrice = url.searchParams.get('max_price');

    let data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    // Фільтрація
    if (furnished === 'true') {
      data = data.filter(house => house.furnishingstatus === 'furnished');
    }
    if (maxPrice) {
      data = data.filter(house => house.price < Number(maxPrice));
    }

    // Формування XML
    const builder = new XMLBuilder({ format: true });
    const xmlData = builder.build({ houses: { house: data } });

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlData);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error: ' + err.message);
  }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

