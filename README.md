# Настройка

Для корректной работы необходимо указать параметры для подключения к postgresql в .env

Затем добавить в базу необходимые таблицы при помощи sql запросов из папки migrations, в порядке:

1. createLibrariesTable - реестр библиотек
2. createVersionsTable - реестр версий
3. createDependenciesTable - реестр зависимостей (хранит id библиотек и версий)
4. createLogTable - реестр логов/действий пользователя

## Запуск

dev режим:

```bash
  run npm dev
```
