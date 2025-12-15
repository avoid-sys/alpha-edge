# Настройка Google OAuth для Alpha Edge

## 1. Создание проекта Google Cloud

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Google+ API" и включите его

## 2. Настройка OAuth 2.0

1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите "Web application"
4. Настройте параметры:
   - **Name**: Alpha Edge
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для разработки)
     - `https://your-domain.vercel.app` (для продакшена)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (для разработки)
     - `https://your-domain.vercel.app` (для продакшена)

## 3. Получение Client ID

1. После создания OAuth клиента скопируйте **Client ID**
2. Вставьте его в файл `src/services/googleAuthService.js`:

```javascript
this.CLIENT_ID = 'your-actual-client-id.apps.googleusercontent.com';
```

## 4. Настройка для продакшена

### Vercel Environment Variables

Добавьте переменную окружения в Vercel:

```bash
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

### Обновление кода

Измените `googleAuthService.js`:

```javascript
this.CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-dev-client-id.apps.googleusercontent.com';
```

## 5. Консоль разработчика Google

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в "APIs & Services" > "Credentials"
4. Выберите ваш OAuth клиент
5. Добавьте тестовых пользователей (если нужно):
   - В разделе "Test users" добавьте email адреса для тестирования

## 6. Проверка работы

1. Запустите приложение: `npm run dev`
2. Попробуйте войти через Google
3. Проверьте консоль браузера на ошибки

## Важные замечания

- **Client ID** должен быть разным для разработки и продакшена
- Убедитесь, что OAuth клиент настроен для правильных доменов
- Для продакшена обязательно добавьте HTTPS URL
- Google OAuth требует HTTPS в продакшене (кроме localhost)

## Устранение неполадок

### Ошибка "redirect_uri_mismatch"
- Проверьте Authorized redirect URIs в Google Console
- Убедитесь, что URL совпадает точно

### Ошибка "invalid_client"
- Проверьте Client ID
- Убедитесь, что OAuth клиент создан для Web application

### Ошибка "access_denied"
- Проверьте Test users в Google Console
- Убедитесь, что аккаунт добавлен в тестовые пользователи
