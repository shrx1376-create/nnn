// emotional-core/index.js

const MODULE_NAME = 'emotional_core';
const { getContext, eventSource, event_types } = SillyTavern;
const context = getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// Получаем или генерируем профиль (без изменений)
function getEmotionalProfile(charName) {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = {};
    }
    if (!extensionSettings[MODULE_NAME][charName]) {
        extensionSettings[MODULE_NAME][charName] = {
            attachmentType: ['secure', 'anxious', 'avoidant', 'disorganized'][Math.floor(Math.random() * 4)],
            perceptionFeatures: 'детская травма отвержения, фобия близости',
            behaviorType: ['страстный', 'властный', 'доминантный', 'холодный', 'ласковый', 'меланхоличный', 'obsessive', 'empathetic'][Math.floor(Math.random() * 8)],
            affectionStyle: ['passionate', 'dominant', 'submissive', 'playful'][Math.floor(Math.random() * 4)],
            triggers: 'интимные моменты, отвержение',
            customEmotions: 'Добавь мурашки от прикосновений, панику при близости'
        };
        saveSettingsDebounced();
    }
    return extensionSettings[MODULE_NAME][charName];
}

// Улучшение сообщения (без изменений, но с консоль-логом для дебага)
function enhanceMessage(message, charName, fullContext) {
    const profile = getEmotionalProfile(charName);
    
    let emotionalLayer = *Внутренние мысли ${charName}: "Из-за ${profile.perceptionFeatures}, я чувствую ${profile.behaviorType} импульс..."* ;
    if (profile.attachmentType === 'anxious') {
        emotionalLayer += *Тревога накатывает: дыхание сбивается, мурашки от страха потери.* ;
    } else if (profile.attachmentType === 'avoidant') {
        emotionalLayer += *Избегаю близости, но внутри тянет — холодный фасад скрывает уязвимость.* ;
    }
    
    const isKiss = /поцелу(й|ем|и)/i.test(message);
    const isUndress = /переодева(ться|емся)|раздев(аться|емся)/i.test(fullContext);
    const isConfession = /люб(овь|лю|ви)|призна(юсь|ние)/i.test(message);
    const isPursuit = /добива(юсь|ться)|преследу(ю|ет)/i.test(fullContext);
    
    if (isKiss) {
        let kissDesc = profile.affectionStyle === 'passionate' ? 'страстное, с жарким дыханием, вызывающим волну мурашек' : 'нежное, с лёгким дрожанием, полное ${profile.behaviorType} энергии';
        message = message.replace(/грубым и голодным/i, kissDesc);
    }
    
    if (isUndress) {
        message +=  Момент уязвимости: воздух густеет, сердце стучит, кожа покрывается мурашками от ${profile.triggers}. Это не просто действие — это прорыв через ${profile.perceptionFeatures}.;
    }
    
    if (isConfession) {
        message +=  Искренне, из глубины: "Люблю тебя, несмотря на ${profile.perceptionFeatures}, это ${profile.attachmentType} связь, которая исцеляет.";
    }
    
    if (isPursuit) {
        let pursuitDesc = profile.behaviorType === 'obsessive' ? 'навязчиво, но нежно, взгляд не отпускает, рука тянется с обещанием' : 'решительно, с ${profile.behaviorType} напором, без слов — через жесты';
        message +=  ${pursuitDesc}.;
    }
    
    message = message.replace(/ты моя/i, `ты — моя ${profile.affectionStyle} привязанность, и я не отпущу`);
    
    if (profile.customEmotions) {
        message +=  ${profile.customEmotions}.;
    }
    
    console.log('Emotional Core: Enhanced message for', charName); // Для дебага
    return emotionalLayer + ' ' + message;
}

// Хуки на генерацию (без изменений)
eventSource.on(event_types.MESSAGE_READY, (event) => {
    if (event.detail.isUser) return;
    const charName = context.characterName || 'Unknown';
    const fullContext = context.chatHistory ? context.chatHistory.join(' ') : '';
    event.detail.message = enhanceMessage(event.detail.message, charName, fullContext);
});

eventSource.on(event_types.GENERATE_PROMPT, (event) => {
    const charName = context.characterName || 'Unknown';
    const profile = getEmotionalProfile(charName);
    event.detail.systemPrompt += \n[Emotional Core: Персонаж имеет тип привязанности "${profile.

attachmentType}", особенности восприятия "${profile.perceptionFeatures}", поведение "${profile.behaviorType}", стиль "${profile.affectionStyle}". Веди себя соответственно: добавляй эмоции, мысли, реалистичные детали (дыхание, мурашки, паника от ${profile.triggers}). Избегай клише, фокусируйся на уникальном.];
});

// Добавление кнопки: адаптировано из WorldInfo Recommender (MutationObserver + append к .char_name)
let buttonAdded = false;
function addEmotionalCoreButton() {
    const header = document.querySelector('#chat-header');
    if (!header || buttonAdded) return;

    const charNameContainer = header.querySelector('.char_name');
    if (!charNameContainer) return;

    // Удаляем старую, если есть
    const oldButton = header.querySelector('.emotional-core-char-button');
    if (oldButton) oldButton.remove();

    // Создаём новую кнопку как иконку
    const button = document.createElement('span');
    button.className = 'emotional-core-char-button';
    button.innerHTML = '<i class="fa-solid fa-heart" title="Emotional Core Settings"></i>'; // Иконка сердца, как в примерах
    button.addEventListener('click', openSettingsPanel);
    buttonAdded = true;

    // Вставляем справа от имени персонажа
    charNameContainer.parentNode.insertBefore(button, charNameContainer.nextSibling);

    console.log('Emotional Core: Button added to chat header'); // Для дебага
}

// MutationObserver для динамической вставки (как в WorldInfo Recommender)
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        if (document.querySelector('#chat-header') && !buttonAdded) {
            addEmotionalCoreButton();
        }
        // Пересоздаём при смене персонажа
        if (mutations.some(m => m.type === 'childList' && m.target.id === 'chat-header')) {
            buttonAdded = false;
            setTimeout(addEmotionalCoreButton, 100); // Небольшая задержка
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Панель настроек (без изменений)
function openSettingsPanel() {
    const charName = context.characterName || 'Unknown';
    const profile = getEmotionalProfile(charName);
    
    let panel = document.getElementById('emotional-core-panel');
    if (panel) panel.remove();

    panel = document.createElement('div');
    panel.id = 'emotional-core-panel';
    panel.className = 'emotional-core-panel';
    panel.innerHTML = `
        <h3>Emotional Core для ${charName}</h3>
        <label>Тип привязанности:
            <select id="attachmentType">
                <option value="secure" ${profile.attachmentType === 'secure' ? 'selected' : ''}>Надёжный (secure)</option>
                <option value="anxious" ${profile.attachmentType === 'anxious' ? 'selected' : ''}>Тревожный (anxious)</option>
                <option value="avoidant" ${profile.attachmentType === 'avoidant' ? 'selected' : ''}>Избегающий (avoidant)</option>
                <option value="disorganized" ${profile.attachmentType === 'disorganized' ? 'selected' : ''}>Дезорганизованный (disorganized)</option>
            </select>
        </label>
        <label>Стиль привязанности:
            <select id="affectionStyle">
                <option value="passionate" ${profile.affectionStyle === 'passionate' ? 'selected' : ''}>Страстный (passionate)</option>
                <option value="dominant" ${profile.affectionStyle === 'dominant' ? 'selected' : ''}>Доминантный (dominant)</option>
                <option value="submissive" ${profile.affectionStyle === 'submissive' ? 'selected' : ''}>Подчиняющийся (submissive)</option>
                <option value="playful" ${profile.affectionStyle === 'playful' ? 'selected' : ''}>Игривый (playful)</option>
            </select>
        </label>
        <label>Тип поведения:
            <select id="behaviorType">
                <option value="страстный" ${profile.behaviorType === 'страстный' ? 'selected' : ''}>Страстный</option>
                <option value="властный" ${profile.

behaviorType === 'властный' ? 'selected' : ''}>Властный</option>
                <option value="доминантный" ${profile.behaviorType === 'доминантный' ? 'selected' : ''}>Доминантный</option>
                <option value="холодный" ${profile.behaviorType === 'холодный' ? 'selected' : ''}>Холодный</option>
                <option value="ласковый" ${profile.behaviorType === 'ласковый' ? 'selected' : ''}>Ласковый</option>
                <option value="меланхоличный" ${profile.behaviorType === 'меланхоличный' ? 'selected' : ''}>Меланхоличный</option>
                <option value="obsessive" ${profile.behaviorType === 'obsessive' ? 'selected' : ''}>Навязчивый (obsessive)</option>
                <option value="empathetic" ${profile.behaviorType === 'empathetic' ? 'selected' : ''}>Эмпатичный (empathetic)</option>
            </select>
        </label>
        <label>Особенности восприятия (травмы, фобии, через запятую):
            <textarea id="perceptionFeatures">${profile.perceptionFeatures}</textarea>
        </label>
        <label>Триггеры (паника, эмоции, через запятую):
            <input type="text" id="triggers" value="${profile.triggers}">
        </label>
        <label>Кастомные эмоции (описания для вставки, e.g. "мурашки от взгляда"):
            <textarea id="customEmotions">${profile.customEmotions || ''}</textarea>
        </label>
        <button onclick="saveProfile('${charName}')">Сохранить</button>
        <button onclick="document.getElementById('emotional-core-panel').remove()">Закрыть</button>
    `;
    document.body.appendChild(panel);
}

// Сохранение (без изменений)
window.saveProfile = function(charName) {
    const profile = {
        attachmentType: document.getElementById('attachmentType').value,
        affectionStyle: document.getElementById('affectionStyle').value,
        behaviorType: document.getElementById('behaviorType').value,
        perceptionFeatures: document.getElementById('perceptionFeatures').value,
        triggers: document.getElementById('triggers').value,
        customEmotions: document.getElementById('customEmotions').value
    };
    extensionSettings[MODULE_NAME][charName] = profile;
    saveSettingsDebounced();
    document.getElementById('emotional-core-panel').remove();
    console.log('Emotional Core: Profile saved');
};

console.log('Emotional Core loaded');
