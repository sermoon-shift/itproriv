const ByteBot = {
  drawerEl: null,
  messagesEl: null,
  inputEl: null,

  KNOWLEDGE_BASE: [
    {
      keywords: ['что такое стек', 'стек это', 'объясни стек', 'понятие стека', 'структура данных стек'],
      reply: 'Стек — это структура данных, похожая на стопку тарелок. Новые элементы кладутся только наверх, и забрать можно только самый верхний элемент. Главный принцип стека: «Первым вошёл — последним вышел» (LIFO).'
    },
    {
      keywords: ['что такое lifo', 'лифо', 'lifo это', 'принцип lifo', 'как расшифровывается lifo'],
      reply: 'LIFO означает «Last In, First Out» (Последним вошёл — первым вышел). То, что положили в стек последним, лежит на вершине и будет извлечено самым первым.'
    },
    {
      keywords: ['push', 'пуш', 'что такое push', 'команда push'],
      reply: 'Операция PUSH — это добавление нового элемента на вершину стека.'
    },
    {
      keywords: ['pop', 'поп', 'что такое pop', 'команда pop'],
      reply: 'Операция POP — это снятие и удаление самого верхнего элемента из стека. Если сделать POP из пустого стека, произойдет ошибка опустошения (Stack Underflow).'
    },
    {
      keywords: ['ctrl+z', 'ctrl z', 'отмена', 'undo', 'как работает отмена', 'машина времени'],
      reply: 'Каждое действие пользователя помещается в стек истории через push(). При нажатии Ctrl+Z программа делает pop() последнего действия и восстанавливает прежнее состояние, соблюдая обратный порядок.'
    },
    {
      keywords: ['скобк', 'парсинг', 'компилятор', 'синтаксис', 'syntaxerror', 'bracket'],
      reply: 'Стек помогает компиляторам проверять парность скобок: открывающая кладется в стек, а закрывающая достает верхнюю и сравнивает тип. Если к концу строки стек пуст — скобки расставлены верно.'
    },
    {
      keywords: ['overflow', 'оверфлоу', 'переполнение', 'stack overflow'],
      reply: 'Stack Overflow (переполнение стека) происходит, когда в стек пытаются записать больше данных, чем выделено памяти. Например, при бесконечной рекурсии без условия выхода.'
    },
    {
      keywords: ['в играх', 'геймдев', 'игры', 'где применяется', 'зачем в реальной жизни'],
      reply: 'Стек применяется в меню игр (стек экранов интерфейса), в истории ходов шахмат и стратегий, а также в стеке вызовов функций (Call Stack).'
    },
    {
      keywords: ['подсказк', 'помоги', 'не понимаю', 'как решить', 'ответ', 'что делать', 'застрял'],
      contextual: true
    },
    {
      keywords: ['привет', 'здравствуй', 'хай', 'ку', 'добрый день'],
      reply: 'Привет! Я робот Байт. Помогу разобраться со стеком, операциями PUSH и POP и практикой.'
    },
    {
      keywords: ['кто ты', 'как тебя зовут', 'ты кто'],
      reply: 'Я Байт — бортовой помощник по алгоритмам и структурам данных.'
    },
    {
      keywords: ['пароль', 'телефон', 'имя', 'паспорт', 'данные', 'где живу'],
      reply: 'Я не запрашиваю и не сохраняю персональные данные. Давай сосредоточимся на изучении темы урока.'
    }
  ],

  OFFTOPIC_REPLIES: [
    'Я помощник по алгоритмам и структурам данных. Давай разберем тему урока.',
    'Моя база знаний посвящена программированию и стеку. Спроси меня про PUSH, POP или скобки в коде.',
    'Давай сосредоточимся на выполнении заданий текущего урока.'
  ],

  init() {
    this.drawerEl = document.getElementById('bot-drawer');
    this.messagesEl = document.getElementById('bot-messages');
    this.inputEl = document.getElementById('bot-input');

    const openBtn = document.getElementById('btn-open-bot');
    const closeBtn = document.getElementById('btn-close-bot');
    const sendBtn = document.getElementById('btn-send-bot');

    if (openBtn) openBtn.addEventListener('click', () => this.open());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (sendBtn) sendBtn.addEventListener('click', () => this.handleSend());

    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleSend();
      });
    }

    document.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-ask');
        if (text) {
          this.askQuestion(text);
        }
      });
    });
  },

  open() {
    if (this.drawerEl) {
      this.drawerEl.classList.add('open');
      if (window.AppState) {
        window.AppState.unlockBadge('bot_friend');
      }
      setTimeout(() => {
        if (this.inputEl) this.inputEl.focus();
      }, 300);
    }
  },

  close() {
    if (this.drawerEl) {
      this.drawerEl.classList.remove('open');
    }
  },

  askQuestion(text) {
    this.addMessage(text, 'user');
    setTimeout(() => {
      this.respond(text);
    }, 350);
  },

  handleSend() {
    if (!this.inputEl) return;
    const query = this.inputEl.value.trim();
    if (!query) return;

    this.inputEl.value = '';
    this.askQuestion(query);
  },

  addMessage(text, sender = 'bot') {
    if (!this.messagesEl) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${sender}`;
    msgDiv.innerHTML = text;
    this.messagesEl.appendChild(msgDiv);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    if (window.SoundSystem && sender === 'bot') {
      window.SoundSystem.playClick();
    }
  },

  respond(rawQuery) {
    const query = rawQuery.toLowerCase();
    const currentLesson = (window.AppState && window.AppState.data.currentLesson) || 1;

    if (query.includes('подсказ') || query.includes('помоги') || query.includes('как решить')) {
      const lesson = window.LessonsData.find((l) => l.id === currentLesson);
      if (lesson && lesson.task && lesson.task.hint) {
        this.addMessage(`<strong>Подсказка к уроку ${currentLesson}:</strong> ${lesson.task.hint}`);
        return;
      }
    }

    for (const item of this.KNOWLEDGE_BASE) {
      for (const kw of item.keywords) {
        if (query.includes(kw)) {
          this.addMessage(item.reply);
          return;
        }
      }
    }

    if (currentLesson === 1 && (query.includes('1') || query.includes('перв'))) {
      this.addMessage('В уроке 1 изучаются основы стека: сначала кладем Синий, затем Золотой, а сверху Зеленый.');
      return;
    }
    if (currentLesson === 2 && (query.includes('2') || query.includes('втор'))) {
      this.addMessage('В уроке 2 отменять шаги через Ctrl+Z нужно в строго обратном порядке (LIFO).');
      return;
    }
    if (currentLesson === 3 && (query.includes('3') || query.includes('трет'))) {
      this.addMessage('В уроке 3: на вершине стека осталась открытая скобка [, а закрыть её попытались через } — в этом причина ошибки.');
      return;
    }

    const randomOfftopic = this.OFFTOPIC_REPLIES[Math.floor(Math.random() * this.OFFTOPIC_REPLIES.length)];
    this.addMessage(randomOfftopic);
  }
};

window.ByteBot = ByteBot;
