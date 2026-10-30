/* Murim Survival v4.8.0 - play-flow, background pause, and safe run checkpoint. */
(() => {
  'use strict';
  const SAVE_KEY = 'murim-survival-run-v480';
  const TUTORIAL_KEY = 'murim-survival-tutorial-v480';
  const byId = id => document.getElementById(id);
  const audio = () => window.MurimAudio;
  let restoring = false;
  let tutorialRun = false;
  let nextHint = 0;
  let guideStep = 0;
  let guideStartsRun = false;
  const hintTimes = [2, 24, 65, 155];
  const hintTips = [
    '🕹 왼쪽 조이스틱으로 움직이세요. 공격은 자동입니다.',
    '📦 보급 상자는 가까이 가서 공격으로 부수세요.',
    '✨ 경험치를 모으고 무공을 얻어 강해지세요.',
    '⚔️ 중간 보스와 최종 보스를 물리쳐 원정을 완수하세요.'
  ];

  const pauseButton = document.createElement('button');
  pauseButton.id = 'v480PauseButton';
  pauseButton.type = 'button';
  pauseButton.className = 'hidden';
  pauseButton.setAttribute('aria-label', '전투 일시정지');
  pauseButton.textContent = 'Ⅱ';
  document.body.appendChild(pauseButton);

  const pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'v480PauseOverlay';
  pauseOverlay.className = 'overlay hidden';
  pauseOverlay.innerHTML = '<div class="panel v480Panel" role="dialog" aria-modal="true" aria-labelledby="v480PauseTitle">' +
    '<div class="eyebrow">CAMPFIRE · 원정 기록</div><h2 id="v480PauseTitle">⏸ 원정 일시정지</h2>' +
    '<p class="subtitle" id="v480PauseDetails"></p>' +
    '<p class="v480SaveNote" id="v480SaveNote">현재 원정 상태가 기기에 저장됩니다.</p>' +
    '<button class="btn gold wide" id="v480Resume">▶ 원정 계속하기</button>' +
    '<button class="btn secondary wide mt8" id="v480HelpInGame">📜 조작법 다시 보기</button>' +
    '<button class="btn ghost wide mt8" id="v480Abandon">원정 포기하고 결과 보기</button></div>';
  document.body.appendChild(pauseOverlay);

  const guideOverlay = document.createElement('div');
  guideOverlay.id = 'v480GuideOverlay';
  guideOverlay.className = 'overlay hidden';
  guideOverlay.innerHTML = '<div class="panel v480Panel" role="dialog" aria-modal="true" aria-labelledby="v480GuideTitle">' +
    '<div class="eyebrow">청운문 입문 수련</div>' +
    '<div id="v480GuideCounter" class="v480GuideCounter"></div>' +
    '<h2 id="v480GuideTitle"></h2><p id="v480GuideText" class="v480GuideText"></p>' +
    '<div class="v480GuideButtons"><button class="btn ghost" id="v480GuideSkip">건너뛰기</button>' +
    '<button class="btn gold" id="v480GuideNext">다음</button></div></div>';
  document.body.appendChild(guideOverlay);

  const continueButton = document.createElement('button');
  continueButton.id = 'v480Continue';
  continueButton.type = 'button';
  continueButton.className = 'btn gold wide mt8 hidden';
  continueButton.textContent = '↩ 저장한 원정 이어하기';
  const homeHow = byId('howBtn');
  homeHow.insertAdjacentElement('afterend', continueButton);

  const guide = [
    {title: '① 강호에서 이동하기', text: '왼쪽 아래 가상 조이스틱을 움직여 적을 피하세요. 한 손으로 조작할 수 있으며 공격은 자동으로 이루어집니다.'},
    {title: '② 싸우고 강해지기', text: '적을 처치해 경험치를 모으면 전투 능력을 선택해 강화합니다. 원정 중 얻는 능력은 다음 원정에서 다시 시작됩니다.'},
    {title: '③ 보급 상자와 무공', text: '맵의 보급 상자를 공격해 부수세요. 장비·회복 단약·무공을 발견할 수 있으며 무공은 자동 발동하고 조건이 맞으면 융합됩니다.'},
    {title: '④ 원정과 문파 성장', text: '7분 동안 생존하며 중간 보스와 최종 보스를 처치하세요. 원정 보상으로 장비를 정비하고 문파를 발전시킵니다. 우측 Ⅱ 버튼으로 언제든 쉬어갈 수 있습니다.'}
  ];

  function clearMotion() {
    input = {x: 0, y: 0};
    joyId = null;
    stick.style.transform = 'translate(0,0)';
    Object.keys(keys).forEach(k => { keys[k] = false; });
  }

  function stopAudio() {
    if (audio() && audio().stopMusic) audio().stopMusic();
  }
  function resumeAudio() {
    const a = audio();
    if (!a || !running || paused || !currentMap) return;
    a.unlock();
    a.playMusic(bossSpawned && !finalBossDefeated ? 'boss' : a.mapMode(currentMap.id), true);
  }

  function snapshotScreen() {
    if (!levelupScreen.classList.contains('hidden')) return 'levelup';
    if (pendingSkillLoot) return 'skill';
    if (!itemModal.classList.contains('hidden')) return 'item';
    return 'combat';
  }

  function saveCheckpoint() {
    if (!running || !player) return false;
    try {
      const checkpoint = {
        version: 1,
        stage: currentStage,
        savedAt: Date.now(),
        screen: snapshotScreen(),
        player,
        camera,
        currentMap,
        lastMapId,
        state: {elapsed, spawnTimer, shotTimer, kills, level, xp, xpNeed, runGold,
          runSoulXp, bossesDefeated, bossSpawned, midBossSpawned, midBossDefeated,
          finalBossDefeated, stageExpired, runEvolution, bossLootGraceUntil,
          v440ChestStrikeTimer, v440PopulationTimer, v43MissionRewarded},
        world: {obstacles, chests, springs, terrainPatches, groundDecos, fogWisps, mapLandmarks, mapPaths},
        actors: {enemies, enemyBullets, bossHazards, gems, coins, lootOrbs, potions, runLoot,
          runSkills, runSkillLevels, skillCooldowns, v440Companion, v43Mission, v43MissionObjects,
          pendingSkillLoot, seenEnemyTypes: Array.from(seenEnemyTypes)}
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(checkpoint));
      saveProfile();
      return true;
    } catch (err) {
      console.warn('v4.8 checkpoint failed', err);
      return false;
    }
  }

  function readCheckpoint() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!data || data.version !== 1 || !data.player || !data.currentMap ||
          !data.state || !data.world || !data.actors) return null;
      if (!Number.isFinite(data.stage) || data.stage !== (profile.highestStage || 1)) return null;
      if (!Number.isFinite(data.state.elapsed) || data.state.elapsed < 0 ||
          data.state.elapsed > STAGE_DURATION + 300) return null;
      if (!Array.isArray(data.actors.enemies) ||
          !Array.isArray(data.world.obstacles) ||
          !Array.isArray(data.world.chests)) return null;
      return data;
    } catch (err) {
      console.warn('v4.8 checkpoint invalid', err);
      return null;
    }
  }

  function clearCheckpoint() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  }

  function syncContinue() {
    const record = readCheckpoint();
    continueButton.classList.toggle('hidden', !record);
    if (record) {
      continueButton.textContent = '↩ STAGE ' + record.stage + ' · ' +
        fmt(Math.min(STAGE_DURATION, record.state.elapsed)) + '부터 이어하기';
    }
  }

  function showPause(reason) {
    if (!running) return;
    paused = true;
    clearMotion();
    stopAudio();
    pauseOverlay.classList.remove('hidden');
    byId('v480PauseTitle').textContent = reason === 'background' ?
      '⏸ 앱 전환으로 일시정지' : reason === 'restore' ?
      '↩ 저장한 원정 복구 완료' : '⏸ 원정 일시정지';
    byId('v480PauseDetails').textContent =
      'STAGE ' + currentStage + ' · ' + fmt(Math.min(elapsed, STAGE_DURATION)) +
      ' 경과 · 처치 ' + kills + '명';
    const saved = saveCheckpoint();
    byId('v480SaveNote').textContent = saved ?
      '이 원정은 기기에 저장되었습니다. 앱을 다시 열어 이어할 수 있습니다.' :
      '진행 상태를 저장하지 못했습니다. 현재 화면에서는 계속 플레이할 수 있습니다.';
  }

  function resumeRun() {
    if (!running || pauseOverlay.classList.contains('hidden')) return;
    pauseOverlay.classList.add('hidden');
    paused = false;
    last = performance.now();
    clearMotion();
    resumeAudio();
  }

  function restoreCheckpoint() {
    const saved = readCheckpoint();
    if (!saved || running) return;
    restoring = true;
    try {
      start();
      // Start uses the game's existing initialization. Only restorable data is then reapplied.
      currentStage = saved.stage;
      currentMap = saved.currentMap;
      lastMapId = saved.lastMapId;
      player = saved.player;
      camera = saved.camera;
      const s = saved.state, w = saved.world, a = saved.actors;
      elapsed = s.elapsed; spawnTimer = s.spawnTimer; shotTimer = s.shotTimer;
      kills = s.kills; level = s.level; xp = s.xp; xpNeed = s.xpNeed;
      runGold = s.runGold; runSoulXp = s.runSoulXp;
      bossesDefeated = s.bossesDefeated; bossSpawned = s.bossSpawned;
      midBossSpawned = s.midBossSpawned; midBossDefeated = s.midBossDefeated;
      finalBossDefeated = s.finalBossDefeated; stageExpired = s.stageExpired;
      runEvolution = s.runEvolution; bossLootGraceUntil = s.bossLootGraceUntil || 0;
      v440ChestStrikeTimer = s.v440ChestStrikeTimer || 0;
      v440PopulationTimer = s.v440PopulationTimer || 0;
      v43MissionRewarded = !!s.v43MissionRewarded;
      obstacles = w.obstacles || []; chests = w.chests || []; springs = w.springs || [];
      terrainPatches = w.terrainPatches || []; groundDecos = w.groundDecos || [];
      fogWisps = w.fogWisps || []; mapLandmarks = w.mapLandmarks || [];
      mapPaths = w.mapPaths || [];
      enemies = a.enemies || []; enemyBullets = a.enemyBullets || [];
      bossHazards = a.bossHazards || []; gems = a.gems || []; coins = a.coins || [];
      lootOrbs = a.lootOrbs || []; potions = a.potions || []; runLoot = a.runLoot || [];
      runSkills = a.runSkills || []; runSkillLevels = a.runSkillLevels || {};
      skillCooldowns = a.skillCooldowns || {};
      v440Companion = a.v440Companion || null;
      v43Mission = a.v43Mission || null; v43MissionObjects = a.v43MissionObjects || [];
      pendingSkillLoot = null;
      seenEnemyTypes = new Set(a.seenEnemyTypes || []);
      bullets = []; attackEffects = []; particles = []; texts = [];
      currentWave = activeWaveAt(elapsed);
      lastWaveKey = currentWave ? String(currentWave.start) + '-' + currentWave.type : null;
      itemModalResume = false;
      byId('v480PauseButton').classList.remove('hidden');
      weaponBadge.classList.toggle('evolved', !!runEvolution);
      byId('weaponName').textContent = (weaponDefs[player.weaponType] || weaponDefs.sword).name;
      byId('weaponIcon').textContent = (weaponDefs[player.weaponType] || weaponDefs.sword).icon;
      zoneBadge.dataset.map = currentMap.id;
      zoneBadge.textContent = currentMap.icon + ' ' + currentMap.name + ' · ' + currentMap.tag;
      updateHUD(true);
      v43UpdateMissionHUD();
      last = performance.now();
      if (saved.screen === 'levelup') {
        paused = true;
        showLevelUp();
        saveCheckpoint();
      } else if (saved.screen === 'skill' && a.pendingSkillLoot && skillDefs[a.pendingSkillLoot]) {
        paused = true;
        showSkillLootModal(a.pendingSkillLoot);
        saveCheckpoint();
      } else {
        showPause('restore');
      }
    } catch (err) {
      console.warn('v4.8 restore failed', err);
      clearCheckpoint();
      if (running) {
        paused = true;
        pauseOverlay.classList.remove('hidden');
        byId('v480PauseTitle').textContent = '원정 복구 실패';
        byId('v480PauseDetails').textContent = '저장한 원정을 불러오지 못했습니다. 새 원정을 시작해 주세요.';
      }
    } finally {
      restoring = false;
      syncContinue();
    }
  }

  function showGuide(startAfter) {
    guideStep = 0;
    guideStartsRun = !!startAfter;
    renderGuide();
    guideOverlay.classList.remove('hidden');
    if (running) {
      paused = true;
      stopAudio();
    } else {
      startScreen.classList.add('hidden');
    }
  }

  function renderGuide() {
    const data = guide[guideStep];
    byId('v480GuideCounter').textContent = (guideStep + 1) + ' / ' + guide.length;
    byId('v480GuideTitle').textContent = data.title;
    byId('v480GuideText').textContent = data.text;
    byId('v480GuideNext').textContent =
      guideStep === guide.length - 1 ? (guideStartsRun ? '원정 시작' : '수련 마치기') : '다음';
  }

  function closeGuide() {
    guideOverlay.classList.add('hidden');
    if (guideStartsRun) {
      try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (_) {}
      tutorialRun = true;
      nextHint = 0;
      start();
    } else if (running) {
      if (!pauseOverlay.classList.contains('hidden')) {
        paused = true;
      } else {
        showPause();
      }
    } else {
      startScreen.classList.remove('hidden');
    }
    guideStartsRun = false;
  }

  byId('v480GuideNext').onclick = () => {
    if (guideStep >= guide.length - 1) closeGuide();
    else { guideStep++; renderGuide(); }
  };
  byId('v480GuideSkip').onclick = closeGuide;
  byId('v480Resume').onclick = resumeRun;
  pauseButton.onclick = () => {
    if (!running || !pauseOverlay.classList.contains('hidden')) return;
    if (!levelupScreen.classList.contains('hidden') || !itemModal.classList.contains('hidden')) return;
    showPause('manual');
  };
  byId('v480HelpInGame').onclick = () => showGuide(false);
  byId('v480Abandon').onclick = () => {
    if (!window.confirm('이번 원정을 포기하고 결과 화면으로 이동할까요?')) return;
    pauseOverlay.classList.add('hidden');
    finishRun(false);
  };
  continueButton.onclick = restoreCheckpoint;
  homeHow.onclick = () => showGuide(false);

  function beginNewRun() {
    if (readCheckpoint() && !window.confirm('저장한 원정이 있습니다. 새로운 원정을 시작하면 이전 원정 기록은 사라집니다. 계속할까요?')) return;
    const alreadyTrained = (() => { try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch (_) { return true; } })();
    if (!alreadyTrained && (profile.highestStage || 1) === 1 && (profile.totalKills || 0) === 0) {
      showGuide(true);
    } else {
      tutorialRun = false;
      start();
    }
  }
  byId('startBtn').onclick = beginNewRun;
  byId('retryBtn').onclick = beginNewRun;

  const previousStart = start;
  start = function() {
    if (!restoring) clearCheckpoint();
    pauseOverlay.classList.add('hidden');
    guideOverlay.classList.add('hidden');
    const result = previousStart();
    pauseButton.classList.remove('hidden');
    return result;
  };

  const previousFinish = finishRun;
  finishRun = function(cleared) {
    const result = previousFinish(cleared);
    pauseButton.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    clearCheckpoint();
    tutorialRun = false;
    syncContinue();
    return result;
  };

  // Lightweight first-run contextual help: no extra Canvas work or per-frame allocation.
  const previousUpdate = update;
  update = function(dt) {
    const result = previousUpdate(dt);
    if (tutorialRun && running && !paused) {
      if (nextHint < hintTimes.length && elapsed >= hintTimes[nextHint]) {
        showToast(hintTips[nextHint++]);
      }
    }
    return result;
  };

  // Paused overlays hide the battlefield; skip all expensive Canvas drawing while paused.
  const previousDraw = draw;
  draw = function() {
    if (running && paused) return;
    return previousDraw();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!running) return;
      if (levelupScreen.classList.contains('hidden') && itemModal.classList.contains('hidden')) {
        showPause('background');
      } else {
        saveCheckpoint();
        stopAudio();
      }
    } else if (running && paused) {
      stopAudio();
    }
  });
  window.addEventListener('pagehide', () => { if (running) saveCheckpoint(); });
  window.addEventListener('pageshow', () => {
    if (running && paused) stopAudio();
  });

  // When the phone returns during an upgrade/loot dialog, that dialog still owns the pause.
  const oldCloseItem = closeItemModal;
  closeItemModal = function() {
    const result = oldCloseItem();
    if (running && !paused) resumeAudio();
    return result;
  };
  levelupScreen.addEventListener('click', event => {
    if (event.target.closest('[data-up]')) {
      setTimeout(() => { if (running && !paused) resumeAudio(); }, 0);
    }
  });

  syncContinue();
  window.MurimUXVersion = '4.8.0';
})();
