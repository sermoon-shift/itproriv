const App = {
  activeScreen: 'screen-welcome',
  currentLessonId: 1,
  currentTaskStack: [],
  sandboxStack: [],
  task2SelectedOrder: [],

  init() {
    window.AppState.init();
    if (window.ByteBot) window.ByteBot.init();

    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.bindGlobalEvents();
    this.renderBadgesCollection();

    this.showScreen('screen-welcome');
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .catch((err) => console.log('SW error:', err));
      });
    }
  },

  setupInstallPrompt() {
    let deferredPrompt = null;
    const installBtn = document.getElementById('btn-pwa-install');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.addEventListener('click', () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
              deferredPrompt = null;
              installBtn.style.display = 'none';
            });
          }
        });
      }
    });
  },

  bindGlobalEvents() {
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      const updateIcon = () => {
        const isMuted = window.SoundSystem.isMuted();
        soundBtn.innerHTML = isMuted 
          ? '<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" stroke="#2d3748" stroke-width="2" stroke-linecap="round" fill="none"/></svg>'
          : '<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#2d3748" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
      };
      updateIcon();
      soundBtn.addEventListener('click', () => {
        window.SoundSystem.toggleMute();
        updateIcon();
        if (!window.SoundSystem.isMuted()) {
          window.SoundSystem.playClick();
        }
      });
    }

    const resetBtn = document.getElementById('btn-reset-progress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Сбросить весь прогресс и начать заново?')) {
          window.AppState.resetProgress();
        }
      });
    }

    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-goto');
        if (target) {
          if (window.SoundSystem) window.SoundSystem.playClick();
          this.showScreen(target);
        }
      });
    });
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.activeScreen = screenId;
      window.scrollTo(0, 0);

      if (screenId === 'screen-map') {
        this.renderLessonMap();
        this.renderBadgesCollection();
      }
    }
  },

  renderLessonMap() {
    const listEl = document.getElementById('lessons-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    window.LessonsData.forEach((lesson) => {
      const isCompleted = window.AppState.data.completedLessons.includes(lesson.id);
      const isUnlocked = window.AppState.isLessonUnlocked(lesson.id);

      const card = document.createElement('div');
      card.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isUnlocked && !isCompleted ? 'active' : ''}`;

      let badgeHtml = '<span class="badge">Закрыт</span>';
      if (isCompleted) {
        badgeHtml = '<span class="badge success">Пройден</span>';
      } else if (isUnlocked) {
        badgeHtml = '<span class="badge primary">Доступен</span>';
      }

      card.innerHTML = `
        <div class="lesson-badge">${badgeHtml}</div>
        <h3 style="margin-right: 80px;">${lesson.title}</h3>
        <p class="text-muted" style="margin-bottom: 6px;">${lesson.subtitle}</p>
        <div style="display: flex; gap: 12px; font-size: 0.95rem;">
          <span>Время: ${lesson.timeEst}</span>
          <span>Опыт: +${lesson.xpReward} XP</span>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          if (window.SoundSystem) window.SoundSystem.playClick();
          this.openLesson(lesson.id);
        });
      } else {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
      }

      listEl.appendChild(card);
    });

    window.AppState.updateHUD();
  },

  renderBadgesCollection() {
    const grid = document.getElementById('badges-collection-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const unlocked = window.AppState.data.unlockedBadges;

    Object.values(window.AppState.BADGES_CONFIG).forEach((b) => {
      const isUnlocked = unlocked.includes(b.id);
      const item = document.createElement('div');
      item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="badge-icon-wrap">${b.svg}</div>
        <div class="badge-name">${b.title}</div>
        <small class="text-muted" style="font-size: 0.75rem;">${isUnlocked ? b.desc : 'Не открыто'}</small>
      `;
      grid.appendChild(item);
    });
  },

  openLesson(lessonId) {
    this.currentLessonId = lessonId;
    window.AppState.data.currentLesson = lessonId;
    window.AppState.save();

    const lesson = window.LessonsData.find((l) => l.id === lessonId);
    if (!lesson) return;

    const numEl = document.getElementById('lesson-current-indicator');
    if (numEl) numEl.textContent = `Урок ${lesson.id} из 3`;

    const titleEl = document.getElementById('lesson-title');
    if (titleEl) titleEl.textContent = lesson.title;

    const contentEl = document.getElementById('lesson-theory-content');
    if (contentEl) contentEl.innerHTML = lesson.theoryHtml;

    const sandboxWrap = document.getElementById('lesson-sandbox-wrap');
    if (sandboxWrap) {
      if (lesson.hasSandbox) {
        sandboxWrap.style.display = 'block';
        this.initSandbox();
      } else {
        sandboxWrap.style.display = 'none';
      }
    }

    this.showScreen('screen-lesson');
  },

  initSandbox() {
    this.sandboxStack = [];
    this.renderStackToDom('sandbox-flask', this.sandboxStack);

    const btnPushBlue = document.getElementById('btn-sandbox-push-blue');
    const btnPushGold = document.getElementById('btn-sandbox-push-gold');
    const btnPop = document.getElementById('btn-sandbox-pop');

    if (btnPushBlue) {
      btnPushBlue.onclick = () => this.pushChipToSandbox('blue', 'Синий');
    }
    if (btnPushGold) {
      btnPushGold.onclick = () => this.pushChipToSandbox('gold', 'Золотой');
    }
    if (btnPop) {
      btnPop.onclick = () => this.popChipFromSandbox();
    }
  },

  pushChipToSandbox(color, name) {
    if (this.sandboxStack.length >= 4) {
      alert('Стек полон. Чтобы положить новый элемент, сначала выгрузите верхний командой POP.');
      return;
    }
    this.sandboxStack.push({ color, name });
    if (window.SoundSystem) window.SoundSystem.playPush();
    window.AppState.unlockBadge('first_push');
    this.renderStackToDom('sandbox-flask', this.sandboxStack);
  },

  popChipFromSandbox() {
    if (this.sandboxStack.length === 0) {
      alert('Стек пуст. Нечего извлекать.');
      return;
    }
    this.sandboxStack.pop();
    if (window.SoundSystem) window.SoundSystem.playPop();
    this.renderStackToDom('sandbox-flask', this.sandboxStack);
  },

  renderStackToDom(flaskId, stackArray) {
    const flask = document.getElementById(flaskId);
    if (!flask) return;

    flask.innerHTML = '';
    stackArray.forEach((item, index) => {
      const chip = document.createElement('div');
      chip.className = 'stack-item';
      chip.setAttribute('data-color', item.color);
      const isTop = index === stackArray.length - 1;
      chip.innerHTML = `
        <span class="chip-title">#${index + 1} ${item.name}</span>
        ${isTop ? '<span class="chip-badge">TOP</span>' : ''}
      `;
      flask.appendChild(chip);
    });
  },

  startLessonTask() {
    const lesson = window.LessonsData.find((l) => l.id === this.currentLessonId);
    if (!lesson) return;

    const taskTitleEl = document.getElementById('task-screen-title');
    if (taskTitleEl) taskTitleEl.textContent = lesson.task.title;

    const taskDescEl = document.getElementById('task-description');
    if (taskDescEl) taskDescEl.innerHTML = lesson.task.descriptionHtml;

    this.hideFeedback();
    this.hideHint();

    document.querySelectorAll('.task-view-format').forEach((f) => f.style.display = 'none');

    if (lesson.task.type === 'stack_builder') {
      this.setupTaskFormat1(lesson.task);
    } else if (lesson.task.type === 'sequence_order') {
      this.setupTaskFormat2(lesson.task);
    } else if (lesson.task.type === 'syntax_detective') {
      this.setupTaskFormat3(lesson.task);
    }

    const hintBtn = document.getElementById('btn-show-hint');
    if (hintBtn) {
      hintBtn.onclick = () => {
        if (window.SoundSystem) window.SoundSystem.playClick();
        this.showHint(lesson.task.hint);
      };
    }

    this.showScreen('screen-task');
  },

  setupTaskFormat1(task) {
    const container = document.getElementById('format-stack-builder');
    if (!container) return;
    container.style.display = 'block';

    this.currentTaskStack = [];
    this.renderStackToDom('task1-flask', this.currentTaskStack);

    document.getElementById('btn-task1-push-blue').onclick = () => {
      if (this.currentTaskStack.length < 4) {
        this.currentTaskStack.push({ color: 'blue', name: 'Синий' });
        if (window.SoundSystem) window.SoundSystem.playPush();
        this.renderStackToDom('task1-flask', this.currentTaskStack);
      }
    };
    document.getElementById('btn-task1-push-gold').onclick = () => {
      if (this.currentTaskStack.length < 4) {
        this.currentTaskStack.push({ color: 'gold', name: 'Золотой' });
        if (window.SoundSystem) window.SoundSystem.playPush();
        this.renderStackToDom('task1-flask', this.currentTaskStack);
      }
    };
    document.getElementById('btn-task1-push-green').onclick = () => {
      if (this.currentTaskStack.length < 4) {
        this.currentTaskStack.push({ color: 'green', name: 'Зеленый' });
        if (window.SoundSystem) window.SoundSystem.playPush();
        this.renderStackToDom('task1-flask', this.currentTaskStack);
      }
    };
    document.getElementById('btn-task1-pop').onclick = () => {
      if (this.currentTaskStack.length > 0) {
        this.currentTaskStack.pop();
        if (window.SoundSystem) window.SoundSystem.playPop();
        this.renderStackToDom('task1-flask', this.currentTaskStack);
      }
    };

    document.getElementById('btn-verify-task').onclick = () => {
      const currentColors = this.currentTaskStack.map((c) => c.color);
      const isCorrect = JSON.stringify(currentColors) === JSON.stringify(task.targetStack);

      if (isCorrect) {
        this.onTaskSuccess(1);
      } else {
        this.onTaskError('Последовательность не совпадает с целью. Проверь цвета чипов снизу вверх.');
      }
    };
  },

  setupTaskFormat2(task) {
    const container = document.getElementById('format-sequence-order');
    if (!container) return;
    container.style.display = 'block';

    const listEl = document.getElementById('task2-items-list');
    listEl.innerHTML = '';
    this.task2SelectedOrder = [];

    task.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'order-item';
      row.setAttribute('data-id', item.id);
      row.innerHTML = `
        <span>${item.text}</span>
        <span class="badge-step" id="step-badge-${item.id}">-</span>
      `;

      row.onclick = () => {
        if (window.SoundSystem) window.SoundSystem.playClick();
        const id = item.id;
        const idx = this.task2SelectedOrder.indexOf(id);

        if (idx > -1) {
          this.task2SelectedOrder.splice(idx, 1);
          row.classList.remove('selected');
        } else {
          this.task2SelectedOrder.push(id);
          row.classList.add('selected');
        }

        task.items.forEach((it) => {
          const b = document.getElementById(`step-badge-${it.id}`);
          const pos = this.task2SelectedOrder.indexOf(it.id);
          if (b) {
            b.textContent = pos > -1 ? `#${pos + 1}` : '-';
          }
        });
      };

      listEl.appendChild(row);
    });

    document.getElementById('btn-verify-task').onclick = () => {
      const isCorrect = JSON.stringify(this.task2SelectedOrder) === JSON.stringify(task.correctOrder);
      if (isCorrect) {
        window.AppState.unlockBadge('undo_master');
        this.onTaskSuccess(2);
      } else {
        this.onTaskError('Порядок отмены неверный. Отменять нужно в обратном порядке: от последнего к первому.');
      }
    };
  },

  setupTaskFormat3(task) {
    const container = document.getElementById('format-syntax-detective');
    if (!container) return;
    container.style.display = 'block';

    const optsEl = document.getElementById('task3-options-list');
    optsEl.innerHTML = '';
    let selectedOption = null;

    task.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'paper-btn btn-block';
      btn.style.textAlign = 'left';
      btn.style.marginBottom = '8px';
      btn.textContent = opt.text;

      btn.onclick = () => {
        if (window.SoundSystem) window.SoundSystem.playClick();
        selectedOption = opt;
        optsEl.querySelectorAll('button').forEach((b) => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
      };

      optsEl.appendChild(btn);
    });

    document.getElementById('btn-verify-task').onclick = () => {
      if (!selectedOption) {
        alert('Выберите вариант ответа');
        return;
      }
      if (selectedOption.isCorrect) {
        window.AppState.unlockBadge('bracket_ninja');
        this.onTaskSuccess(3);
      } else {
        this.onTaskError('Ответ неверный. На вершине стека осталась открытая скобка [, а закрыть её попытались через }.');
      }
    };
  },

  onTaskSuccess(lessonId) {
    const lesson = window.LessonsData.find((l) => l.id === lessonId);
    window.AppState.addXP(lesson.xpReward);
    window.AppState.completeLesson(lessonId);

    const feedbackBox = document.getElementById('task-feedback');
    feedbackBox.className = 'feedback-box success';
    feedbackBox.innerHTML = `
      <strong>Верно! Задание решено.</strong><br>
      Получено: +${lesson.xpReward} XP.
    `;

    document.getElementById('btn-verify-task').style.display = 'none';
    const nextBtn = document.getElementById('btn-task-next');
    nextBtn.style.display = 'inline-block';

    if (lessonId < 3) {
      nextBtn.textContent = 'Следующий урок';
      nextBtn.onclick = () => {
        if (window.SoundSystem) window.SoundSystem.playClick();
        this.openLesson(lessonId + 1);
      };
    } else {
      nextBtn.textContent = 'Завершить модуль';
      nextBtn.onclick = () => {
        if (window.SoundSystem) window.SoundSystem.playClick();
        this.showFinishScreen();
      };
    }
  },

  onTaskError(msg) {
    if (window.SoundSystem) window.SoundSystem.playError();
    const feedbackBox = document.getElementById('task-feedback');
    feedbackBox.className = 'feedback-box error';
    feedbackBox.innerHTML = msg;
  },

  hideFeedback() {
    const feedbackBox = document.getElementById('task-feedback');
    feedbackBox.className = 'feedback-box';
    feedbackBox.innerHTML = '';
    document.getElementById('btn-verify-task').style.display = 'inline-block';
    document.getElementById('btn-task-next').style.display = 'none';
  },

  showHint(hintText) {
    const box = document.getElementById('task-hint-box');
    box.innerHTML = `<strong>Подсказка:</strong> ${hintText}`;
    box.classList.add('visible');
  },

  hideHint() {
    const box = document.getElementById('task-hint-box');
    box.classList.remove('visible');
    box.innerHTML = '';
  },

  showFinishScreen() {
    const xpVal = document.getElementById('finish-xp-total');
    if (xpVal) xpVal.textContent = window.AppState.data.xp;

    const rank = window.AppState.getRank();
    const rankVal = document.getElementById('finish-rank-title');
    if (rankVal) rankVal.textContent = rank.title;

    const badgesEl = document.getElementById('finish-badges-list');
    if (badgesEl) {
      badgesEl.innerHTML = '';
      window.AppState.data.unlockedBadges.forEach((bId) => {
        const cfg = window.AppState.BADGES_CONFIG[bId];
        if (cfg) {
          const span = document.createElement('span');
          span.className = 'badge success';
          span.style.margin = '4px';
          span.style.fontSize = '1rem';
          span.textContent = cfg.title;
          badgesEl.appendChild(span);
        }
      });
    }

    if (window.SoundSystem) window.SoundSystem.playBadge();
    this.showScreen('screen-finish');
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
