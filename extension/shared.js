globalThis.CF = (() => {
  const KEY = "contextflow-v1";
  const COLORS = ["#5b8def", "#3dbe8b", "#b08cff", "#e4a04a", "#e26d6d", "#e38bb4"];
  const VAR_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

  const folders = [
    { id: "folder-1", name: "Разработка", color: "#5b8def" },
    { id: "folder-2", name: "Копирайтинг", color: "#3dbe8b" },
    { id: "folder-3", name: "Аналитика", color: "#b08cff" },
    { id: "folder-4", name: "Общее", color: "#e4a04a" },
  ];

  const profiles = [
    {
      id: "profile-1",
      name: "Python-бэкенд",
      text: "Ты — senior Python-разработчик с 10+ годами опыта. Твой стек: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL, Redis, Docker.\n\nПравила:\n- Пиши код в соответствии с PEP 8\n- Используй type hints везде\n- Предпочитай async/await\n- Давай краткие пояснения к коду\n- Предлагай тесты для критичных функций\n- Отвечай на русском языке",
      createdAt: 1,
    },
    {
      id: "profile-2",
      name: "Посты для Telegram",
      text: "Ты — опытный SMM-специалист и копирайтер, пишущий для Telegram-каналов.\n\nПравила:\n- Пиши живым, разговорным языком\n- Используй эмодзи умеренно (2-4 на пост)\n- Структурируй текст: заголовок → тело → CTA\n- Длина поста: 200-500 символов\n- Избегай канцеляризмов и штампов\n- Добавляй хэштеги в конце (3-5 штук)\n- Тон: дружелюбный, экспертный",
      createdAt: 2,
    },
  ];

  const prompts = [
    ["prompt-1", "Рефакторинг кода", "folder-1", "refactor", "Проведи рефакторинг следующего кода. Улучши читаемость, производительность и следование best practices. Код:\n\n```\n{{код}}\n```\n\nУкажи, что именно изменилось и почему.", ["код", "рефакторинг"], 12],
    ["prompt-2", "Написание unit-тестов", "folder-1", "tests", "Напиши unit-тесты для следующего кода, используя {{фреймворк}}. Покрой основные сценарии, edge cases и ошибки.\n\nКод:\n```\n{{код}}\n```", ["тесты", "код"], 11],
    ["prompt-3", "Ревью кода", "folder-1", "review", "Проведи code review следующего фрагмента. Оцени:\n1. Корректность логики\n2. Потенциальные баги\n3. Безопасность\n4. Производительность\n5. Читаемость\n\nКод:\n```\n{{код}}\n```", ["ревью", "код"], 10],
    ["prompt-4", "Создание API endpoint", "folder-1", "api", "Создай REST API endpoint для {{описание}}. Используй {{фреймворк}}. Включи:\n- Валидацию входных данных\n- Обработку ошибок\n- Документацию (Swagger/OpenAPI)\n- Примеры запросов и ответов", ["api", "backend"], 9],
    ["prompt-5", "Пост-анонс", "folder-2", "announce", "Напиши пост-анонс для Telegram-канала о {{событие}}. Тон: {{тон}}. Целевая аудитория: {{аудитория}}. Включи CTA и хэштеги.", ["пост", "анонс"], 8],
    ["prompt-6", "Рерайт текста", "folder-2", "rewrite", "Перепиши следующий текст, сохранив смысл, но полностью изменив формулировки. Стиль: {{стиль}}. Аудитория: {{аудитория}}.\n\nОригинал:\n{{текст}}", ["рерайт", "текст"], 7],
    ["prompt-7", "Заголовки для статьи", "folder-2", "headlines", "Предложи 10 вариантов заголовков для статьи на тему \"{{тема}}\". Для каждого укажи тип заголовка и оцени цепляющую силу от 1 до 10.", ["заголовки"], 6],
    ["prompt-8", "SWOT-анализ", "folder-3", "swot", "Проведи SWOT-анализ для {{объект}}. Контекст: {{контекст}}. Для каждого элемента приведи 3-5 пунктов с кратким пояснением.", ["анализ"], 5],
    ["prompt-9", "Анализ конкурентов", "folder-3", "competitors", "Проведи анализ конкурентов для {{продукт}}. Рынок: {{рынок}}. Для каждого конкурента оцени:\n- Сильные стороны\n- Слабые стороны\n- Ценообразование\n- Уникальное предложение", ["конкуренты"], 4],
    ["prompt-10", "Объясни простыми словами", "folder-4", "explain", "Объясни простыми словами, как для {{аудитория}}, что такое {{концепция}}. Используй аналогии из повседневной жизни. Максимум 200 слов.", ["объяснение"], 3],
    ["prompt-11", "Составить план", "folder-4", "plan", "Составь детальный план действий для {{задача}}. Дедлайн: {{дедлайн}}. Ресурсы: {{ресурсы}}. Включи:\n- Этапы с дедлайнами\n- Необходимые действия\n- Потенциальные риски\n- Критерии успеха", ["план"], 2],
    ["prompt-12", "SQL-запрос", "folder-1", "sql", "Напиши SQL-запрос для {{задача}}. Схема таблицы:\n```\n{{схема}}\n```\nОптимизируй для производительности. Добавь комментарии к сложным частям.", ["sql"], 1],
  ].map(([id, name, folder, slug, text, tags, createdAt]) => ({ id, name, folder, slug, text, tags, createdAt }));

  function freshState() {
    return {
      version: 1,
      contextProfiles: profiles.map((item) => ({ ...item })),
      prompts: prompts.map((item) => ({ ...item, tags: [...item.tags] })),
      folders: folders.map((item) => ({ ...item })),
      activeProfileId: "profile-1",
      settings: { attachProfile: true, showLauncher: true },
    };
  }

  function extractVariables(text) {
    const seen = new Set();
    const out = [];
    for (const match of String(text).matchAll(VAR_RE)) {
      const key = match[1].trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
    return out;
  }

  function substitute(text, values) {
    return String(text).replace(VAR_RE, (_, raw) => {
      const key = raw.trim();
      return values[key] ? values[key] : `{{${key}}}`;
    });
  }

  function assemble(promptText, profileText, attach, values) {
    const body = substitute(promptText, values || {});
    if (attach && profileText && profileText.trim()) return `${profileText.trim()}\n\n${body}`;
    return body;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function storageOn() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  }

  function load() {
    if (!storageOn()) return Promise.resolve(freshState());
    return new Promise((resolve) => {
      chrome.storage.local.get(KEY, (res) => {
        resolve(res[KEY] || freshState());
      });
    });
  }

  function save(state) {
    if (!storageOn()) return Promise.resolve(state);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [KEY]: state }, () => resolve(state));
    });
  }

  function activeProfile(state) {
    return state.contextProfiles.find((item) => item.id === state.activeProfileId) || null;
  }

  function parseImport(json) {
    const data = JSON.parse(json);
    if (!data || !Array.isArray(data.prompts) || !Array.isArray(data.contextProfiles) || !Array.isArray(data.folders)) {
      return null;
    }
    return data;
  }

  // Export to global scope
window.CF = { 
  KEY, 
  COLORS, 
  freshState, 
  extractVariables, 
  substitute, 
  assemble, 
  uid, 
  load, 
  save, 
  activeProfile, 
  parseImport 
};
})();
