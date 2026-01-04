// Study Mode Client
let studyState = {
    studentName: '',
    selectedQuiz: '',
    questions: [],
    currentQuestionIndex: 0,
    sessionStartTime: null,
    questionStartTime: null,
    results: [], // {questionId, question, time, correct, userAnswer, correctAnswer}
};

// DOM Elements
const screens = {
    start: document.getElementById('startScreen'),
    question: document.getElementById('questionScreen'),
    feedback: document.getElementById('feedbackScreen'),
    report: document.getElementById('reportScreen')
};

const elements = {
    studentName: document.getElementById('studentName'),
    quizSelector: document.getElementById('quizSelector'),
    quizInfo: document.getElementById('quizInfo'),
    questionCount: document.getElementById('questionCount'),
    startBtn: document.getElementById('startBtn'),
    
    progressBar: document.getElementById('progressBar'),
    currentQ: document.getElementById('currentQ'),
    totalQ: document.getElementById('totalQ'),
    elapsedTime: document.getElementById('elapsedTime'),
    questionText: document.getElementById('questionText'),
    answerA: document.getElementById('answerA'),
    answerB: document.getElementById('answerB'),
    answerC: document.getElementById('answerC'),
    answerD: document.getElementById('answerD'),
    
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    timeSpent: document.getElementById('timeSpent'),
    explanationText: document.getElementById('explanationText'),
    nextBtn: document.getElementById('nextBtn'),
    
    reportName: document.getElementById('reportName'),
    reportQuiz: document.getElementById('reportQuiz'),
    correctCount: document.getElementById('correctCount'),
    incorrectCount: document.getElementById('incorrectCount'),
    avgTime: document.getElementById('avgTime'),
    accuracy: document.getElementById('accuracy'),
    analysisSection: document.getElementById('analysisSection'),
    detailedResults: document.getElementById('detailedResults'),
    printBtn: document.getElementById('printBtn'),
    newSessionBtn: document.getElementById('newSessionBtn')
};

let timerInterval = null;

// Initialize
loadAvailableQuizzes();

// Event Listeners
elements.studentName.addEventListener('input', validateForm);
elements.quizSelector.addEventListener('change', onQuizSelected);
elements.startBtn.addEventListener('click', startSession);
elements.nextBtn.addEventListener('click', nextQuestion);
elements.printBtn.addEventListener('click', () => window.print());
elements.newSessionBtn.addEventListener('click', resetSession);

// Answer buttons
document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => submitAnswer(btn.dataset.answer));
});

// Functions
async function loadAvailableQuizzes() {
    console.log('🔍 Loading available quizzes...');
    try {
        const response = await fetch('/api/quizzes');
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const quizzes = await response.json();
        console.log('✅ Quizzes received:', quizzes);
        console.log('📊 Number of quizzes:', quizzes.length);
        
        elements.quizSelector.innerHTML = '<option value="">-- Tria un quiz --</option>';
        
        if (quizzes.length === 0) {
            console.warn('⚠️ No quizzes found!');
            elements.quizSelector.innerHTML = '<option value="">No hi ha quizzes disponibles</option>';
            return;
        }
        
        quizzes.forEach((quiz, index) => {
            console.log(`  ➕ Adding quiz ${index + 1}:`, quiz.name, `(${quiz.questionCount} preguntes)`);
            const option = document.createElement('option');
            option.value = quiz.file;
            option.textContent = quiz.name;
            option.dataset.count = quiz.questionCount;
            elements.quizSelector.appendChild(option);
        });
        
        console.log('✅ All quizzes loaded successfully into dropdown!');
    } catch (error) {
        console.error('❌ Error loading quizzes:', error);
        console.error('❌ Error details:', error.message);
        elements.quizSelector.innerHTML = '<option value="">Error carregant quizzes - Comprova consola</option>';
    }
}

function onQuizSelected() {
    const selected = elements.quizSelector.selectedOptions[0];
    if (selected && selected.value) {
        const count = selected.dataset.count || 0;
        elements.questionCount.textContent = count;
        validateForm();
    }
}

function validateForm() {
    const nameValid = elements.studentName.value.trim().length >= 2;
    const quizValid = elements.quizSelector.value !== '';
    elements.startBtn.disabled = !(nameValid && quizValid);
}

async function startSession() {
    studyState.studentName = elements.studentName.value.trim();
    studyState.selectedQuiz = elements.quizSelector.value;
    studyState.sessionStartTime = Date.now();
    studyState.results = [];
    studyState.currentQuestionIndex = 0;
    
    // Load questions
    try {
        const response = await fetch(`/api/quiz/${studyState.selectedQuiz}`);
        studyState.questions = await response.json();
        
        elements.totalQ.textContent = studyState.questions.length;
        
        showScreen('question');
        document.getElementById('questionScreen').scrollTo(0, 0);
        showQuestion();

    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Error carregant el quiz. Torna-ho a provar.');
    }
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
    setTimeout(() => {
        screens[screenName].scrollTo(0, 0);
        window.scrollTo(0, 0);
    }, 50);
}

function showQuestion() {
    const question = studyState.questions[studyState.currentQuestionIndex];
    
    // Update progress
    const progress = ((studyState.currentQuestionIndex) / studyState.questions.length) * 100;
    elements.progressBar.style.width = `${progress}%`;
    elements.currentQ.textContent = studyState.currentQuestionIndex + 1;
    
    // Display question
    elements.questionText.textContent = question.question;
    elements.answerA.textContent = question.options.a;
    elements.answerB.textContent = question.options.b;
    elements.answerC.textContent = question.options.c;
    elements.answerD.textContent = question.options.d;
    
    // Reset buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('selected');
    });
    
    // Start timer
    studyState.questionStartTime = Date.now();
    startQuestionTimer();
}

function startQuestionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - studyState.questionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        elements.elapsedTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopQuestionTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function submitAnswer(answer) {
    stopQuestionTimer();
    
    const question = studyState.questions[studyState.currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - studyState.questionStartTime) / 1000);
    const isCorrect = answer === question.correct;
    
    // Save result
    studyState.results.push({
        questionId: question.id,
        question: question.question,
        userAnswer: answer,
        correctAnswer: question.correct,
        correct: isCorrect,
        timeSeconds: timeSpent,
        options: question.options
    });
    
    // Disable buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Show feedback
    showFeedback(isCorrect, timeSpent, question);
}

function showFeedback(isCorrect, timeSpent, question) {
    showScreen('feedback');
    
    if (isCorrect) {
        elements.resultIcon.textContent = '✅';
        elements.resultTitle.textContent = 'Correcte!';
        elements.resultTitle.className = 'result-title correct';
    } else {
        elements.resultIcon.textContent = '❌';
        elements.resultTitle.textContent = 'Incorrecte';
        elements.resultTitle.className = 'result-title incorrect';
    }
    
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    elements.timeSpent.textContent = minutes > 0 
        ? `${minutes}m ${seconds}s` 
        : `${seconds} segons`;
    
    elements.explanationText.textContent = 
        `La resposta correcta és: ${question.correct.toUpperCase()} - ${question.options[question.correct]}`;
}

function nextQuestion() {
    studyState.currentQuestionIndex++;
    
    if (studyState.currentQuestionIndex < studyState.questions.length) {
        showScreen('question');
        // AÑADE ESTAS LÍNEAS ↓
        setTimeout(() => {
            screens.question.scrollTo(0, 0);
            window.scrollTo(0, 0);
        }, 50);
        showQuestion();
    } else {
        showReport();
    }
}

function showReport() {
    showScreen('report');
    
    const correct = studyState.results.filter(r => r.correct).length;
    const incorrect = studyState.results.length - correct;
    const totalTime = studyState.results.reduce((sum, r) => sum + r.timeSeconds, 0);
    const avgTime = Math.round(totalTime / studyState.results.length);
    const accuracy = Math.round((correct / studyState.results.length) * 100);
    
    // Basic stats
    elements.reportName.textContent = studyState.studentName;
    elements.reportQuiz.textContent = elements.quizSelector.selectedOptions[0].textContent;
    elements.correctCount.textContent = correct;
    elements.incorrectCount.textContent = incorrect;
    elements.avgTime.textContent = `${avgTime}s`;
    elements.accuracy.textContent = `${accuracy}%`;
    
    // Analysis
    generateAnalysis();
    generateDetailedResults();
}

function generateAnalysis() {
    const fastThreshold = 10; // segons
    const slowThreshold = 30; // segons
    
    const strengths = [];
    const needsReview = [];
    const weaknesses = [];
    
    studyState.results.forEach(result => {
        if (result.correct && result.timeSeconds <= fastThreshold) {
            strengths.push({
                text: `"${result.question}" - Resposta ràpida i correcta! (${result.timeSeconds}s)`,
                time: result.timeSeconds
            });
        } else if (result.correct && result.timeSeconds > slowThreshold) {
            needsReview.push({
                text: `"${result.question}" - Correcte però lent (${result.timeSeconds}s). Repassar per consolidar.`,
                time: result.timeSeconds
            });
        } else if (!result.correct) {
            weaknesses.push({
                text: `"${result.question}" - Incorrecte. Repassar aquest concepte.`,
                correctAnswer: result.correctAnswer,
                userAnswer: result.userAnswer,
                options: result.options
            });
        }
    });
    
    elements.analysisSection.innerHTML = '';
    
    // Strengths
    if (strengths.length > 0) {
        const strengthsDiv = document.createElement('div');
        strengthsDiv.className = 'analysis-category strengths';
        strengthsDiv.innerHTML = `
            <h3>⭐ Punts Forts (${strengths.length})</h3>
            <ul>
                ${strengths.map(s => `<li>${s.text}</li>`).join('')}
            </ul>
            <p style="margin-top: 15px; opacity: 0.8;">
                Excel·lent! Demostres coneixement sòlid en aquests temes.
            </p>
        `;
        elements.analysisSection.appendChild(strengthsDiv);
    }
    
    // Needs Review
    if (needsReview.length > 0) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'analysis-category needs-review';
        reviewDiv.innerHTML = `
            <h3>🔄 Necessita Reforç (${needsReview.length})</h3>
            <ul>
                ${needsReview.map(n => `<li>${n.text}</li>`).join('')}
            </ul>
            <p style="margin-top: 15px; opacity: 0.8;">
                <strong>Recomanació:</strong> Repassa aquests conceptes per millorar la velocitat de resposta.
                Fer exercicis addicionals t'ajudarà a interioritzar millor el coneixement.
            </p>
        `;
        elements.analysisSection.appendChild(reviewDiv);
    }
    
    // Weaknesses
    if (weaknesses.length > 0) {
        const weaknessDiv = document.createElement('div');
        weaknessDiv.className = 'analysis-category weaknesses';
        weaknessDiv.innerHTML = `
            <h3>📚 Aprendre / Repassar (${weaknesses.length})</h3>
            <ul>
                ${weaknesses.map(w => `
                    <li>
                        ${w.text}
                        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                            <strong>Has respost:</strong> ${w.userAnswer.toUpperCase()} - ${w.options[w.userAnswer]}<br>
                            <strong style="color: var(--color-correct);">Correcte:</strong> ${w.correctAnswer.toUpperCase()} - ${w.options[w.correctAnswer]}
                        </div>
                    </li>
                `).join('')}
            </ul>
            <p style="margin-top: 15px; opacity: 0.8;">
                <strong>Recomanació:</strong> Dedica temps a repassar aquests temes. 
                Consulta els apunts, busca exemples addicionals i torna a fer aquest quiz més endavant.
            </p>
        `;
        elements.analysisSection.appendChild(weaknessDiv);
    }
    
    // Overall recommendation
    const overallDiv = document.createElement('div');
    overallDiv.className = 'analysis-category';
    overallDiv.style.borderColor = 'var(--color-primary)';
    
    let recommendation = '';
    const accuracy = (studyState.results.filter(r => r.correct).length / studyState.results.length) * 100;
    
    if (accuracy >= 90) {
        recommendation = '🎉 Excel·lent domini del tema! Continua així i potser pots ajudar altres companys.';
    } else if (accuracy >= 70) {
        recommendation = '👍 Bon nivell! Amb una mica més de repàs, dominaràs completament aquests conceptes.';
    } else if (accuracy >= 50) {
        recommendation = '💪 Vas per bon camí! Dedica més temps al repàs i torna a intentar-ho. Milloraràs!';
    } else {
        recommendation = '📖 Cal repassar més aquest tema. No et desanimis! Parla amb el professor i dedica temps a l\'estudi.';
    }
    
    overallDiv.innerHTML = `
        <h3>💡 Recomanació General</h3>
        <p style="font-size: 1.1rem; line-height: 1.8;">${recommendation}</p>
    `;
    elements.analysisSection.appendChild(overallDiv);
}

function generateDetailedResults() {
    elements.detailedResults.innerHTML = '<h3>📋 Detall de Respostes</h3>';
    
    studyState.results.forEach((result, index) => {
        const div = document.createElement('div');
        div.className = `question-result ${result.correct ? 'correct' : 'incorrect'}`;
        
        div.innerHTML = `
            <div class="question-result-header">
                <span class="question-num">Pregunta ${index + 1}</span>
                <span class="question-time">⏱️ ${result.timeSeconds}s</span>
            </div>
            <div class="question-result-text">${result.question}</div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="font-weight: 600;">
                    ${result.correct ? '✅' : '❌'} 
                    ${result.userAnswer.toUpperCase()}
                </span>
                ${!result.correct ? `
                    <span style="opacity: 0.7;">
                        (Correcta: ${result.correctAnswer.toUpperCase()})
                    </span>
                ` : ''}
            </div>
        `;
        
        elements.detailedResults.appendChild(div);
    });
}

function resetSession() {
    studyState = {
        studentName: '',
        selectedQuiz: '',
        questions: [],
        currentQuestionIndex: 0,
        sessionStartTime: null,
        questionStartTime: null,
        results: []
    };
    
    elements.studentName.value = '';
    elements.studentName.disabled = false;
    elements.quizSelector.selectedIndex = 0;
    elements.startBtn.disabled = true;
    
    showScreen('start');
    loadAvailableQuizzes();
}
