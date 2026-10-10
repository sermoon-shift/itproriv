const AppState = {
  data: {
    userName: 'Юный Инженер',
    xp: 0,
    streak: 0,
    currentLesson: 1,
    completedLessons: [],
    unlockedBadges: [],
    attempts: { lesson1: 0, lesson2: 0, lesson3: 0 }
  },

  BADGES_CONFIG: {
    first_push: {
      id: 'first_push',
      title: 'Первый PUSH',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><path d="M4 17h16M4 21h16M12 3v10M8 7l4-4 4 4" stroke="#2d3748" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
      desc: 'Положил первый чип памяти на вершину стека'
    },
    no_errors: {
      id: 'no_errors',
      title: 'Чистый Код',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#2d3748" stroke-width="2" fill="none"/><path d="M8 12l3 3 5-5" stroke="#2d3748" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
      desc: 'Завершил практическое задание с первой попытки без ошибок'
    },
    undo_master: {
      id: 'undo_master',
      title: 'Мастер Ctrl+Z',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><path d="M3 9h11a5 5 0 0 1 5 5 5 5 0 0 1-5 5H7M3 9l4-4M3 9l4 4" stroke="#2d3748" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
      desc: 'Успешно распутал стек истории и отменил действия'
    },
    bracket_ninja: {
      id: 'bracket_ninja',
      title: 'Парсер Скобок',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><path d="M8 4C6 4 5 5.5 5 7.5v2c0 1.5-1.5 2.5-2 2.5 0.5 0 2 1 2 2.5v2C5 18.5 6 20 8 20M16 4c2 0 3 1.5 3 3.5v2c0 1.5 1.5 2.5 2 2.5-0.5 0-2 1-2 2.5v2c0 2-1 3.5-3 3.5" stroke="#2d3748" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
      desc: 'Разгадал синтаксическую загадку компилятора'
    },
    graduate: {
      id: 'graduate',
      title: 'Диплом LIFO',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 2 3 3 6 3s6-1 6-3v-5" stroke="#2d3748" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
      desc: 'Успешно освоил все 3 урока и получил диплом'
    },
    bot_friend: {
      id: 'bot_friend',
      title: 'Друг Байта',
      svg: '<svg class="svg-icon lg" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="#2d3748" stroke-width="2" fill="none"/><line x1="12" y1="2" x2="12" y2="6" stroke="#2d3748" stroke-width="2"/><circle cx="9" cy="11" r="1.5" fill="#2d3748"/><circle cx="15" cy="11" r="1.5" fill="#2d3748"/><line x1="9" y1="15" x2="15" y2="15" stroke="#2d3748" stroke-width="2"/></svg>',
      desc: 'Задал вопрос бортовому ассистенту роботу Байту'
    }
  },

  init() {
    this.load();
    this.updateHUD();
  },

  load() {
    try {
      const saved = localStorage.getItem('cyberstack_state');
      if (saved) {
        this.data = { ...this.data, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn(e);
    }
  },

  save() {
    try {
      localStorage.setItem('cyberstack_state', JSON.stringify(this.data));
    } catch (e) {
      console.warn(e);
    }
    this.updateHUD();
  },

  resetProgress() {
    this.data.xp = 0;
    this.data.streak = 0;
    this.data.currentLesson = 1;
    this.data.completedLessons = [];
    this.data.unlockedBadges = [];
    this.data.attempts = { lesson1: 0, lesson2: 0, lesson3: 0 };
    this.save();
    window.location.reload();
  },

  getRank() {
    const xp = this.data.xp;
    if (xp >= 220) return { title: 'Мастер LIFO', level: 3 };
    if (xp >= 100) return { title: 'Оператор Стека', level: 2 };
    return { title: 'Стажёр Блокнота', level: 1 };
  },

  addXP(amount) {
    this.data.xp += amount;
    this.save();
    if (window.SoundSystem) window.SoundSystem.playSuccess();
    this.showToast(`+${amount} XP получено`);
  },

  unlockBadge(badgeId) {
    if (!this.data.unlockedBadges.includes(badgeId)) {
      this.data.unlockedBadges.push(badgeId);
      this.save();
      const badge = this.BADGES_CONFIG[badgeId];
      if (badge) {
        if (window.SoundSystem) window.SoundSystem.playBadge();
        this.showToast(`Открыт бейдж: "${badge.title}"`);
      }
    }
  },

  completeLesson(lessonId) {
    if (!this.data.completedLessons.includes(lessonId)) {
      this.data.completedLessons.push(lessonId);
    }
    if (this.data.completedLessons.length >= 3) {
      this.unlockBadge('graduate');
    }
    this.save();
  },

  isLessonUnlocked(lessonId) {
    if (lessonId === 1) return true;
    return this.data.completedLessons.includes(lessonId - 1);
  },

  updateHUD() {
    const xpEl = document.getElementById('hud-xp-val');
    if (xpEl) xpEl.textContent = this.data.xp;

    const rank = this.getRank();
    const rankEl = document.getElementById('hud-rank-val');
    if (rankEl) rankEl.textContent = rank.title;

    const progressBar = document.getElementById('module-progress-bar');
    const progressText = document.getElementById('module-progress-text');
    if (progressBar && progressText) {
      const count = this.data.completedLessons.length;
      const pct = Math.round((count / 3) * 100);
      progressBar.style.width = `${pct}%`;
      progressText.textContent = `${count} из 3 уроков (${pct}%)`;
    }
  },

  showToast(text) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fef08a;
        color: #744210;
        border: 2px solid #b45309;
        box-shadow: 4px 6px 0 rgba(0,0,0,0.2);
        padding: 10px 18px;
        border-radius: 20px;
        font-family: 'Patrick Hand', cursive;
        font-size: 1.15rem;
        font-weight: 700;
        z-index: 9999;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2800);
  }
};

window.AppState = AppState;
