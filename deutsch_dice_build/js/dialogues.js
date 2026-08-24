import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

const SCENARIOS = [
    {
        id: 'doctor',
        title: '🏥 У лікаря (Beim Arzt)',
        desc: 'Поясніть симптоми та запишіться на прийом у Німеччині.',
        dialogue: [
            { speaker: 'Arzt', text: 'Guten Tag! Was kann ich für Sie tun?', translation: 'Доброго дня! Чим можу вам допомогти?' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Ich habe starke Kopfschmerzen und Fieber.', correct: true, response: 'Verstehe. Seit wann haben Sie diese Beschwerden?' },
                { text: 'Ich möchte ein Ticket nach Berlin kaufen.', correct: false, response: 'Das ist hier eine Arztpraxis, kein Bahnhof!' },
                { text: 'Wo ist der nächste Supermarkt?', correct: false, response: 'Bitte bleiben Sie beim Thema Ihrer Gesundheit.' }
            ]}
        ],
        secondDialogue: [
            { speaker: 'Arzt', text: 'Seit wann haben Sie diese Beschwerden?', translation: 'З коли у вас ці симптоми?' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Seit gestern Abend. Ich konnte nicht schlafen.', correct: true, response: 'Gut, ich schreibe Sie für drei Tage krank. Gute Besserung!' },
                { text: 'Morgen fliege ich nach Mallorca.', correct: false, response: 'Das hilft Ihnen jetzt nicht.' },
                { text: 'Ich liebe Pizza mit viel Käse.', correct: false, response: 'Das hat nichts mit Fieber zu tun.' }
            ]}
        ]
    },
    {
        id: 'apartment',
        title: '🏠 Оренда квартири (Wohnungssuche)',
        desc: 'Спілкування з орендодавцем (Vermieter) щодо перегляду квартири.',
        dialogue: [
            { speaker: 'Vermieter', text: 'Guten Tag! Haben Sie die Anzeige für die 3-Zimmer-Wohnung gesehen?', translation: 'Доброго дня! Ви бачили оголошення про 3-кімнатну квартиру?' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Ja, guten Tag! Ist die Wohnung noch frei und wann kann ich sie besichtigen?', correct: true, response: 'Ja, sie ist noch frei. Wie wäre es kommenden Mittwoch um 15 Uhr?' },
                { text: 'Nein, ich suche ein neues Auto.', correct: false, response: 'Hier werden nur Wohnungen vermietet.' },
                { text: 'Wie viel kostet ein Burger?', correct: false, response: 'Bitte ernster bleiben.' }
            ]}
        ],
        secondDialogue: [
            { speaker: 'Vermieter', text: 'Wie wäre es kommenden Mittwoch um 15 Uhr?', translation: 'Як щодо наступної середи о 15:00?' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Mittwoch passt perfekt! Ich werde pünktlich da sein.', correct: true, response: 'Ausgezeichnet! Ich schicke Ihnen die Adresse per E-Mail.' },
                { text: 'Nein, ich schlafe um diese Zeit immer.', correct: false, response: 'Schade, dann suchen wir einen anderen Interessenten.' },
                { text: 'Ich kann erst im nächsten Jahr.', correct: false, response: 'Das ist viel zu spät.' }
            ]}
        ]
    },
    {
        id: 'job_interview',
        title: '💼 Співбесіда (Vorstellungsgespräch)',
        desc: 'Проходження професійної співбесіди німецькою мовою для рівня B1.',
        dialogue: [
            { speaker: 'Personalchef', text: 'Guten Tag! Erzählen Sie uns bitte kurz etwas über Ihre berufliche Erfahrung.', translation: 'Доброго дня! Розкажіть нам коротко про ваш професійний досвід.' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Ich habe mehrere Jahre Erfahrung in der Webentwicklung und arbeite zuverlässig.', correct: true, response: 'Sehr gut! Was sind Ihre Stärken?' },
                { text: 'Ich koche gerne Suppe am Sonntag.', correct: false, response: 'Das ist für diese Stelle irrelevant.' },
                { text: 'Ich spiele den ganzen Tag Videospiele.', correct: false, response: 'Wir suchen professionelle Mitarbeiter.' }
            ]}
        ],
        secondDialogue: [
            { speaker: 'Personalchef', text: 'Sehr gut! Was sind Ihre Stärken?', translation: 'Дуже добре! Які ваші сильні сторони?' },
            { speaker: 'Sie (Агент)', choices: [
                { text: 'Ich bin teamfähig, lernbereit und löse komplexe Probleme strukturiert.', correct: true, response: 'Wunderbar! Wir möchten Sie gerne im Team willkommen heißen.' },
                { text: 'Ich kann sehr laut singen.', correct: false, response: 'Das brauchen wir hier eher nicht.' },
                { text: 'Ich schlafe gerne lang.', correct: false, response: 'Pünktlichkeit ist uns sehr wichtig.' }
            ]}
        ]
    }
];

let activeScenario = null;
let currentStep = 0;
let scenarioScore = 0;

export function openDialoguesModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderScenarioSelector();
    toggleModal("dialogues-modal", "dialogues-box", true);
}

export function closeDialoguesModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("dialogues-modal", "dialogues-box", false);
}

export function renderScenarioSelector() {
    const content = document.getElementById("dialogues-content");
    if (!content) return;

    content.innerHTML = `
        <div class="space-y-3">
            <div class="text-xs font-bold text-slate-300 text-center mb-3">Оберіть життєву ситуацію B1 та пройдіть рольовий діалог!</div>
            <div class="space-y-3">
                ${SCENARIOS.map(sc => `
                    <div onclick="startScenario('${sc.id}')" class="interactive-btn glass-panel p-4 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 cursor-pointer space-y-1.5 shadow-md">
                        <div class="text-sm font-black text-white">${sc.title}</div>
                        <div class="text-[11px] text-slate-300">${sc.desc}</div>
                        <div class="text-[10px] text-cyan-400 font-bold flex items-center gap-1 pt-1">
                            <i class="fa-solid fa-play"></i> Почати діалог (+60 XP)
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function startScenario(id) {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    activeScenario = SCENARIOS.find(s => s.id === id);
    currentStep = 0;
    scenarioScore = 0;
    renderScenarioStep();
}

export function renderScenarioStep() {
    const content = document.getElementById("dialogues-content");
    if (!content || !activeScenario) return;

    const dialogueFlow = currentStep === 0 ? activeScenario.dialogue : activeScenario.secondDialogue;
    const npcLine = dialogueFlow[0];
    const playerOptions = dialogueFlow[1].choices;

    SpeechEngine.speak(npcLine.text, currentSpeechRate);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>${activeScenario.title}</span>
                <span class="text-cyan-400">Крок ${currentStep + 1} / 2</span>
            </div>

            <!-- NPC Dialogue Box -->
            <div class="glass-panel p-4 rounded-2xl border border-cyan-500/40 space-y-2 bg-slate-950/70">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-cyan-400"><i class="fa-solid fa-user-tie mr-1"></i> ${npcLine.speaker}</span>
                    <button onclick="speakScenarioNPC('${npcLine.text.replace(/'/g, "\\'")}')" class="interactive-btn text-cyan-400 p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30"><i class="fa-solid fa-volume-high"></i></button>
                </div>
                <div class="text-sm font-black text-white">${npcLine.text}</div>
                <div class="text-xs text-emerald-400 font-bold italic">${npcLine.translation}</div>
            </div>

            <!-- Player Choices -->
            <div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Ваша реплика німецькою:</div>
            <div class="space-y-2.5">
                ${playerOptions.map((opt, idx) => `
                    <button onclick="selectScenarioChoice(${idx})" class="interactive-btn glass-panel border border-slate-700 text-slate-200 p-3.5 rounded-xl font-bold text-xs hover:border-cyan-400 text-left w-full scenario-choice-btn">
                        <span class="text-cyan-400 font-black mr-2">${idx + 1}.</span> ${opt.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function speakScenarioNPC(text) {
    SpeechEngine.speak(text, currentSpeechRate);
}

export function selectScenarioChoice(choiceIdx) {
    const dialogueFlow = currentStep === 0 ? activeScenario.dialogue : activeScenario.secondDialogue;
    const playerOptions = dialogueFlow[1].choices;
    const chosen = playerOptions[choiceIdx];

    const btns = document.querySelectorAll(".scenario-choice-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (playerOptions[idx].correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (idx === choiceIdx) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("opacity-40");
        }
    });

    if (chosen.correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        scenarioScore++;
        showToast('Чудова репліка! 🎯', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast('Не зовсім коректна відповідь для ситуації B1', 'error');
    }

    setTimeout(() => {
        if (currentStep === 0) {
            currentStep++;
            renderScenarioStep();
        } else {
            // Finished scenario
            const rewardXp = 75;
            addXp(rewardXp, 'exam');
            progressQuest('complete_exam', 1);
            checkAchievement('exam_pass', 1);
            AudioEngine.play('levelup');
            Haptics.trigger('success');

            const content = document.getElementById("dialogues-content");
            if (content) {
                content.innerHTML = `
                    <div class="text-center py-6 space-y-4">
                        <div class="text-5xl">🏆💬</div>
                        <div class="text-lg font-black text-emerald-400">СЦЕНАРІЙ УСПІШНО ПРОЙДЕНО!</div>
                        <div class="text-sm text-slate-300">Правильних реплік: <b>${scenarioScore} / 2</b></div>
                        <div class="text-xs font-bold text-pink-400">+${rewardXp} XP зароблено!</div>
                        <button onclick="openDialoguesModal()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ДО СПИСКУ СЦЕНАРІЇВ</button>
                    </div>
                `;
            }
        }
    }, 1200);
}

window.openDialoguesModal = openDialoguesModal;
window.closeDialoguesModal = closeDialoguesModal;
window.startScenario = startScenario;
window.speakScenarioNPC = speakScenarioNPC;
window.selectScenarioChoice = selectScenarioChoice;
