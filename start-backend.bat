@echo off
cd /d c:\notemitra1\server
echo Starting NoteMitra Backend Server...
echo.
echo Database: MongoDB (optional in dev mode)
echo ElasticSearch: Optional (will continue without it)
echo.
npm run dev
