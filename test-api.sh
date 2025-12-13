#!/bin/bash

# Скрипт для тестирования API и просмотра данных с бекенда

API_BASE="http://localhost:3000"

echo "=========================================="
echo "Тестирование API бекенда"
echo "=========================================="
echo ""

echo "1. Проверка доступности бекенда..."
if curl -s -f "$API_BASE" > /dev/null 2>&1; then
    echo "✅ Бекенд доступен"
else
    echo "❌ Бекенд недоступен. Убедитесь, что сервер запущен на порту 3000"
    exit 1
fi
echo ""

echo "2. GET /news - Получить все новости"
echo "-----------------------------------"
curl -s "$API_BASE/news" | jq '.' 2>/dev/null || curl -s "$API_BASE/news"
echo ""
echo ""

echo "3. GET /persons - Получить всех персон"
echo "-----------------------------------"
curl -s "$API_BASE/persons" | jq '.' 2>/dev/null || curl -s "$API_BASE/persons"
echo ""
echo ""

echo "4. GET /auth/profile - Профиль (без токена - должна быть ошибка)"
echo "-----------------------------------"
curl -s "$API_BASE/auth/profile" | jq '.' 2>/dev/null || curl -s "$API_BASE/auth/profile"
echo ""
echo ""

echo "5. Структура одной новости (если есть данные)"
echo "-----------------------------------"
FIRST_NEWS_ID=$(curl -s "$API_BASE/news" | jq -r '.[0].id' 2>/dev/null)
if [ ! -z "$FIRST_NEWS_ID" ] && [ "$FIRST_NEWS_ID" != "null" ]; then
    echo "Получение новости с ID: $FIRST_NEWS_ID"
    curl -s "$API_BASE/news/$FIRST_NEWS_ID" | jq '.' 2>/dev/null || curl -s "$API_BASE/news/$FIRST_NEWS_ID"
else
    echo "Нет новостей в базе данных"
fi
echo ""
echo ""

echo "6. Структура одной персоны (если есть данные)"
echo "-----------------------------------"
FIRST_PERSON_ID=$(curl -s "$API_BASE/persons" | jq -r '.[0].id' 2>/dev/null)
if [ ! -z "$FIRST_PERSON_ID" ] && [ "$FIRST_PERSON_ID" != "null" ]; then
    echo "Получение персоны с ID: $FIRST_PERSON_ID"
    curl -s "$API_BASE/persons/$FIRST_PERSON_ID" | jq '.' 2>/dev/null || curl -s "$API_BASE/persons/$FIRST_PERSON_ID"
else
    echo "Нет персон в базе данных"
fi
echo ""
echo ""

echo "=========================================="
echo "Тестирование завершено"
echo "=========================================="

