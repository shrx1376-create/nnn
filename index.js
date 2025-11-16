// emotional-core/index.js

const MODULE_NAME = 'emotional_core';
const { getContext, eventSource, event_types } = SillyTavern;
const context = getContext();
const { extensionSettings, saveSettingsDebounced } = context;

console.log('Emotional Core: Starting load...'); // Дебаг

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

// Улучшение сообщения (добавил лог)
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
    
    console.log('Emotional Core: Enhanced message for', charName); // Дебаг
    return emotionalLayer + ' ' + message;
}

// Хуки (добавил проверку на existence)
if (eventSource && event_types) {
    eventSource.on(event_types.MESSAGE_READY, (event) => {
        if (event.detail.isUser) return;
        const charName = context.characterName || 'Unknown';
        const fullContext = context.chatHistory ? context.chatHistory.join(' ') : '';
        event.detail.message = enhanceMessage(event.detail.message, charName, fullContext);
    });

    eventSource.on(event_types.GENERATE_PROMPT, (event) => {
        const charName = context.characterName || 'Unknown';
        const profile = getEmotionalProfile(charName);

        event.detail.systemPrompt += \n[Emotional Core: Персонаж имеет тип привязанности "${profile.attachmentType}", особенности восприятия "${profile.perceptionFeatures}", поведение "${profile.behaviorType}", стиль "${profile.affectionStyle}". Веди себя соответственно: добавляй эмоции, мысли, реалистичные детали (дыхание, мурашки, паника от ${profile.triggers}). Избегай клише, фокусируйся на уникальном.];
    });
} else {
    console.warn('Emotional Core: eventSource or event_types not available');
}

// Добавление кнопки: Observer + setInterval fallback
function addEmotionalCoreButton() {
    const header = document.querySelector('#chat-header');
    if (!header) {
        console.log('Emotional Core: #chat-header not found yet');
        return false;
    }

    // Удаляем старую кнопку, если есть
    const oldButton = header.querySelector('.emotional-core-char-button');
    if (oldButton) {
        oldButton.remove();
        console.log('Emotional Core: Old button removed');
    }

    const charNameContainer = header.querySelector('.char_name');
    if (!charNameContainer) {
        console.warn('Emotional Core: .char_name not found, appending to header end');
        const button = document.createElement('span');
        button.className = 'emotional-core-char-button';
        button.innerHTML = '<i class="fa-solid fa-heart" title="Emotional Core Settings"></i>';
        button.addEventListener('click', openSettingsPanel);
        header.appendChild(button); // В конец хедера
    } else {
        // Вставляем после .char_name
        const button = document.createElement('span');
        button.className = 'emotional-core-char-button';
        button.innerHTML = '<i class="fa-solid fa-heart" title="Emotional Core Settings"></i>';
        button.addEventListener('click', openSettingsPanel);
        charNameContainer.insertAdjacentElement('afterend', button);
    }

    console.log('Emotional Core: Button added to chat header');
    return true;
}

// MutationObserver
let observer;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Emotional Core: DOM loaded, setting up observer');
    observer = new MutationObserver((mutations) => {
        let shouldAdd = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.target.id === 'chat-header')) {
                shouldAdd = true;
            }
        });
        if (shouldAdd) {
            addEmotionalCoreButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Fallback: setInterval для упрямых случаев
let intervalId;
function startButtonInterval() {
    intervalId = setInterval(() => {
        if (addEmotionalCoreButton()) {
            clearInterval(intervalId);
            console.log('Emotional Core: Button added via interval');
        }
    }, 500); // Каждые 0.5 сек
}

startButtonInterval();

// Остановка interval при unload (опционально)
window.addEventListener('beforeunload', () => {
    if (intervalId) clearInterval(intervalId);
    if (observer) observer.disconnect();
});

console.log('Emotional Core loaded fully');
