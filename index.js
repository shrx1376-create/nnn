// === Emotional Core for SillyTavern ===
// Работает в 1.13.5+
// Кнопка рядом с именем персонажа

const MODULE = 'emotional_core';
const { getContext, event_types, eventSource } = SillyTavern.getContext();
let context = getContext();

// === Хранилище профилей ===
function getProfile(char) {
  if (!context.extensionSettings[MODULE]) context.extensionSettings[MODULE] = {};
  if (!context.extensionSettings[MODULE][char]) {
    context.extensionSettings[MODULE][char] = {
      attachment: 'anxious',
      style: 'passionate',
      behavior: 'ласковый',
      trauma: 'страх отвержения, потеря близких',
      triggers: 'прикосновения, признания',
      custom: 'мурашки, учащённое дыхание, дрожь в голосе'
    };
    context.saveSettingsDebounced();
  }
  return context.extensionSettings[MODULE][char];
}

// === Улучшение ответа ===
function enhance(msg, char, history) {
  const p = getProfile(char);
  let out = *${char} думает: "${p.trauma} заставляет меня..."* ;

  if (p.attachment === 'anxious') out += *Тревога: дыхание сбивается, ладони потеют...* ;
  if (p.attachment === 'avoidant') out += *Холод снаружи — буря внутри...* ;

  if (/поцелу/i.test(msg)) {
    const kiss = p.style === 'passionate'
      ? 'страстный, с жарким дыханием и дрожью'
      : 'нежный, с лёгким касанием и мурашками';
    msg = msg.replace(/грубым и голодным/i, kiss);
  }

  if (/переодева|раздев/i.test(history)) {
    msg +=  Воздух тяжёлый. Кожа покрывается мурашками. Это не просто — это ${p.triggers}.;
  }

  if (/люб/i.test(msg)) {
    msg +=  "Люблю тебя... несмотря на ${p.trauma}. Это настоящее.";
  }

  msg = msg.replace(/ты моя/i, `ты — моя ${p.style} надежда`);

  if (p.custom) msg +=  ${p.custom}.;

  return out + msg;
}

// === Хуки ===
eventSource.on(event_types.MESSAGE_RECEIVED, data => {
  if (data.is_user) return;
  const char = context.characters[context.characterId]?.name || '???';
  const history = context.chat.map(m => m.mes).join(' ');
  data.mes = enhance(data.mes, char, history);
});

eventSource.on(event_types.GENERATE, data => {
  const char = context.characters[context.characterId]?.name || '???';
  const p = getProfile(char);
  data.prompt += \n[Эмоции: ${char} — ${p.attachment} привязанность, ${p.behavior}, травма: ${p.trauma}. Реагируй реалистично: дыхание, мурашки, паника, мысли. Избегай клише.];
});

// === Кнопка рядом с именем ===
function addButton() {
  const header = document.querySelector('#chat_header');
  if (!header || document.querySelector('.emotional-core-btn')) return;

  const name = header.querySelector('.name');
  if (!name) return;

  const btn = document.createElement('span');
  btn.className = 'emotional-core-btn';
  btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
  btn.title = 'Настроить эмоции персонажа';
  btn.onclick = () => openPanel();
  name.after(btn);
}

// Пытаемся каждые 300мс
const tryAdd = setInterval(() => {
  if (addButton()) clearInterval(tryAdd);
}, 300);

// === Панель настроек ===
function openPanel() {
  const char = context.characters[context.characterId]?.name || '???';
  const p = getProfile(char);

  const panel = document.createElement('div');
  panel.className = 'emotional-core-panel';
  panel.innerHTML = `
    <h3>Эмоции: ${char}</h3>
    <label>Привязанность:
      <select id="att">
        <option value="secure" ${p.attachment==='secure'?'selected':''}>Надёжная</option>
        <option value="anxious" ${p.attachment==='anxious'?'selected':''}>Тревожная</option>
        <option value="avoidant" ${p.attachment==='avoidant'?'selected':''}>Избегающая</option>
        <option value="disorganized" ${p.attachment==='disorganized'?'selected':''}>Дезорганизованная</option>
      </select>
    </label>
    <label>Стиль любви:
      <select id="sty">
        <option value="passionate" ${p.style==='passionate'?'selected':''}>Страстный</option>
        <option value="gentle" ${p.style==='gentle'?'selected':''}>Нежный</option>
        <option value="playful" ${p.style==='playful'?'selected':''}>Игривый</option>
        <option value="dominant" ${p.

                                   style==='dominant'?'selected':''}>Доминантный</option>
      </select>
    </label>
    <label>Поведение:
      <select id="beh">
        <option value="ласковый" ${p.behavior==='ласковый'?'selected':''}>Ласковый</option>
        <option value="холодный" ${p.behavior==='холодный'?'selected':''}>Холодный</option>
        <option value="страстный" ${p.behavior==='страстный'?'selected':''}>Страстный</option>
        <option value="властный" ${p.behavior==='властный'?'selected':''}>Властный</option>
        <option value="меланхоличный" ${p.behavior==='меланхоличный'?'selected':''}>Меланхоличный</option>
      </select>
    </label>
    <label>Травмы/страхи:
      <textarea id="trauma">${p.trauma}</textarea>
    </label>
    <label>Триггеры:
      <input type="text" id="trig" value="${p.triggers}">
    </label>
    <label>Свои эмоции:
      <textarea id="cust">${p.custom}</textarea>
    </label>
    <button onclick="saveEC('${char}');this.closest('.emotional-core-panel').remove()">Сохранить</button>
    <button onclick="this.closest('.emotional-core-panel').remove()">Закрыть</button>
  `;
  document.body.appendChild(panel);
}

// === Сохранение ===
window.saveEC = function(char) {
  const p = {
    attachment: document.getElementById('att').value,
    style: document.getElementById('sty').value,
    behavior: document.getElementById('beh').value,
    trauma: document.getElementById('trauma').value.trim(),
    triggers: document.getElementById('trig').value.trim(),
    custom: document.getElementById('cust').value.trim()
  };
  context.extensionSettings[MODULE][char] = p;
  context.saveSettingsDebounced();
};

console.log('Emotional Core загружен');
