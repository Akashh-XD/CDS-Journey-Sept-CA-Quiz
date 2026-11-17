let appState = {
    currentView: 'home',
    quizzes: [],
    config: {
        workerEndpoint: "",
        defaultMarking: { correct: 1.0, incorrect: -0.33, unattempted: 0.0 }
    },
    activeQuiz: null,
    currentQuestionIndex: 0,
    userAnswers: {},
    markedForReview: {},
    timerInterval: null,
    timeRemainingSeconds: 0,
    examResults: JSON.parse(localStorage.getItem('uw_exam_results') || '[]'),
    // Never trust browser storage as proof of Telegram membership.
    isVerified: false,
    selectedCategory: 'All'
};

const router = {
    navigate: function(viewId, param) {
        appState.currentView = viewId;
        window.scrollTo(0, 0);
        renderView(param);
    }
};

async function initApp() {
    // Load saved theme
    if (localStorage.getItem('uw_theme') === 'light') {
        document.documentElement.classList.remove('dark');
    }

    // Load saved marking config if customized by admin
    const savedMarking = localStorage.getItem('uw_marking_config');
    if (savedMarking) {
        appState.config.defaultMarking = JSON.parse(savedMarking);
    }

    // Load custom quizzes from localStorage or fetch questions.json
    const savedQuizzes = localStorage.getItem('uw_custom_quizzes');
    if (savedQuizzes) {
        appState.quizzes = JSON.parse(savedQuizzes);
    } else {
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            appState.quizzes = data.quizzes || [];
            if (data.config) {
                appState.config = { ...appState.config, ...data.config };
            }
        } catch (e) {
            console.warn("Using fallback quizzes.");
            appState.quizzes = fallbackQuizzes;
        }
    }

    // Membership is intentionally locked until signed Telegram authentication
    // and server-side channel verification are configured.
    appState.isVerified = false;
    router.navigate('home');
}

function renderView(param) {
    const container = document.getElementById('app');
    
    if (appState.currentView === 'home') {
        const totalQuestions = appState.quizzes.reduce((sum, q) => sum + (q.questions ? q.questions.length : 0), 0);
        container.innerHTML = `
            <div class="py-6 space-y-12">
                <div class="text-center max-w-3xl mx-auto space-y-4">
                    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-full uppercase tracking-wider">September 2026 Magazine Edition</span>
                    <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Where the UnKnown becomes <span class="text-emerald-600">UnForgettable.</span></h1>
                    <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300">Competitive examination practice platform engineered for CDS, NDA, AFCAT, UPSC, State PCS & SSC aspirants.</p>
                    
                    <!-- Quick Stats Bar -->
                    <div class="flex flex-wrap justify-center gap-4 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span class="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><i class="fa-solid fa-layer-group text-emerald-500 mr-1.5"></i> ${appState.quizzes.length} Quizzes Available</span>
                        <span class="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><i class="fa-solid fa-circle-question text-blue-500 mr-1.5"></i> ${totalQuestions} Curated Questions</span>
                        <span class="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><i class="fa-solid fa-check-double text-purple-500 mr-1.5"></i> ${appState.examResults.length} Completed</span>
                    </div>

                    <div class="flex flex-wrap justify-center gap-4 pt-4">
                        <button onclick="checkAuthAndNavigate('dashboard')" class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                            <i class="fa-solid fa-rocket mr-2"></i> Start Practising Now
                        </button>
                        <button onclick="router.navigate('history')" class="px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl transition">
                            <i class="fa-solid fa-clock-rotate-left mr-2"></i> My Performance
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center text-xl mb-4"><i class="fa-solid fa-bullseye"></i></div>
                        <h3 class="font-bold text-lg mb-2">Exam-Simulated Environment</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Configurable negative marking (${appState.config.defaultMarking.incorrect}), live countdown timers, question palette, and mark-for-review navigation.</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-xl mb-4"><i class="fa-solid fa-brain"></i></div>
                        <h3 class="font-bold text-lg mb-2">Magazine-Grounded Explanations</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Every question mapped directly with source page numbers, exam relevance tags, and UPSC multi-statement patterns.</p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center text-xl mb-4"><i class="fa-solid fa-chart-line"></i></div>
                        <h3 class="font-bold text-lg mb-2">Detailed Report Cards</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Immediate accuracy breakdown, topic-wise weak area detection, and printable PDF performance reports.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (appState.currentView === 'dashboard') {
        const categories = ['All', ...new Set(appState.quizzes.map(q => q.category))];
        const filteredQuizzes = appState.selectedCategory === 'All' 
            ? appState.quizzes 
            : appState.quizzes.filter(q => q.category === appState.selectedCategory);

        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">September Current Affairs Quiz Series</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Select a quiz module to begin timed examination practice.</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="text" id="quizSearch" oninput="filterQuizzes()" placeholder="Search quizzes..." class="w-full sm:w-64 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    </div>
                </div>

                <!-- Category Filter Pills -->
                <div class="flex flex-wrap gap-2">
                    ${categories.map(cat => `
                        <button onclick="setCategoryFilter('${cat}')" class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${appState.selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}">
                            ${cat}
                        </button>
                    `).join('')}
                </div>

                <div id="quizGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredQuizzes.map(q => {
                        const completed = appState.examResults.some(r => r.quizId === q.id);
                        return `
                        <div class="quiz-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm">
                            <div>
                                <div class="flex justify-between items-start mb-3">
                                    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">${q.category}</span>
                                    <span class="text-xs font-medium text-slate-400">${q.difficulty}</span>
                                </div>
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-2">${q.title}</h3>
                                <div class="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    <span><i class="fa-solid fa-list-check mr-1"></i> ${q.questions.length} Questions</span>
                                    <span><i class="fa-solid fa-clock mr-1"></i> ${q.timeLimitMinutes} Mins</span>
                                </div>
                                ${completed ? '<div class="mb-4 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check mr-1"></i> Attempted</div>' : ''}
                            </div>
                            <button onclick="showInstructions('${q.id}')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center justify-center">
                                ${completed ? 'Reattempt Quiz' : 'Start Test'} <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>
                            </button>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    } else if (appState.currentView === 'instructions') {
        const quiz = param;
        const m = appState.config.defaultMarking;
        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                <div class="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">${quiz.category}</span>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">${quiz.title}</h2>
                </div>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <p class="text-xs text-slate-500">Questions</p>
                        <p class="text-lg font-bold">${quiz.questions.length}</p>
                    </div>
                    <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <p class="text-xs text-slate-500">Duration</p>
                        <p class="text-lg font-bold">${quiz.timeLimitMinutes} Mins</p>
                    </div>
                    <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <p class="text-xs text-slate-500">Marking</p>
                        <p class="text-lg font-bold">+${m.correct} / ${m.incorrect}</p>
                    </div>
                </div>
                <ul class="text-sm text-slate-600 dark:text-slate-300 space-y-2.5 list-disc pl-5">
                    <li>The countdown timer will start immediately after clicking <strong>Begin Examination</strong>.</li>
                    <li>Each correct answer awards <strong>+${m.correct} mark</strong>; each wrong answer deducts <strong>${Math.abs(m.incorrect)} mark</strong>.</li>
                    <li>Use the Question Palette to jump between questions or mark items for review.</li>
                    <li>The test will automatically submit when the timer reaches 00:00.</li>
                </ul>
                <div class="flex justify-between pt-4">
                    <button onclick="router.navigate('dashboard')" class="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancel</button>
                    <button onclick="startQuiz('${quiz.id}')" class="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition">Begin Examination</button>
                </div>
            </div>
        `;
    } else if (appState.currentView === 'exam') {
        const q = appState.activeQuiz.questions[appState.currentQuestionIndex];
        const totalQ = appState.activeQuiz.questions.length;
        const selectedOpt = appState.userAnswers[q.id];

        container.innerHTML = `
            <div class="max-w-5xl mx-auto space-y-6">
                <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base">${appState.activeQuiz.title}</h2>
                        <p class="text-xs text-slate-500">Question ${appState.currentQuestionIndex + 1} of ${totalQ}</p>
                    </div>
                    <div class="flex items-center space-x-3 sm:space-x-4">
                        <div id="timerDisplay" class="px-3 sm:px-4 py-2 bg-rose-500/10 text-rose-600 font-mono font-bold rounded-xl text-sm flex items-center">
                            <i class="fa-solid fa-stopwatch mr-2"></i> --:--
                        </div>
                        <button onclick="confirmSubmitQuiz()" class="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-xl transition">Submit Test</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div class="lg:col-span-3 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
                        <div class="flex justify-between items-center text-xs text-slate-500">
                            <span class="font-semibold text-emerald-600 dark:text-emerald-400">Target Exam: ${q.examRelevance || 'General'}</span>
                            <span>Ref: ${q.pageRef || 'Magazine'}</span>
                        </div>
                        <h3 class="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">${q.text}</h3>

                        <div class="space-y-3 pt-2">
                            ${q.options.map((opt, idx) => `
                                <button onclick="selectOption(${idx})" class="w-full text-left p-4 rounded-xl border transition flex items-center space-x-3 ${selectedOpt === idx ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}">
                                    <span class="w-8 h-8 shrink-0 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm font-bold ${selectedOpt === idx ? 'bg-emerald-600 text-white border-emerald-600' : ''}">${String.fromCharCode(65 + idx)}</span>
                                    <span class="text-sm sm:text-base">${opt}</span>
                                </button>
                            `).join('')}
                        </div>

                        <div class="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div class="flex items-center space-x-2">
                                <button onclick="toggleMarkReview()" class="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                    <i class="fa-solid fa-flag mr-1 ${appState.markedForReview[q.id] ? 'text-amber-500' : ''}"></i> ${appState.markedForReview[q.id] ? 'Marked' : 'Mark for Review'}
                                </button>
                                ${selectedOpt !== undefined ? `<button onclick="clearResponse()" class="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-rose-500 transition">Clear</button>` : ''}
                            </div>
                            <div class="space-x-2 sm:space-x-3">
                                <button onclick="navigateQuestion(-1)" ${appState.currentQuestionIndex === 0 ? 'disabled class="opacity-50 cursor-not-allowed px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium"' : 'class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"'}>Previous</button>
                                <button onclick="navigateQuestion(1)" class="px-5 sm:px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-xl transition shadow-sm">${appState.currentQuestionIndex === totalQ - 1 ? 'Finish Test' : 'Next'}</button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm h-fit">
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">Question Palette</h4>
                        <div class="grid grid-cols-5 gap-2">
                            ${appState.activeQuiz.questions.map((item, idx) => {
                                let btnClass = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
                                if (appState.userAnswers[item.id] !== undefined) btnClass = "bg-emerald-600 text-white";
                                if (appState.markedForReview[item.id]) btnClass = "bg-amber-500 text-white";
                                if (idx === appState.currentQuestionIndex) btnClass += " ring-2 ring-slate-900 dark:ring-white";
                                return `<button onclick="jumpToQuestion(${idx})" class="quiz-palette-btn w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center ${btnClass}">${idx + 1}</button>`;
                            }).join('')}
                        </div>
                        <div class="pt-4 border-t border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-500">
                            <div class="flex items-center"><span class="w-3 h-3 bg-emerald-600 rounded mr-2"></span> Answered</div>
                            <div class="flex items-center"><span class="w-3 h-3 bg-amber-500 rounded mr-2"></span> Marked for Review</div>
                            <div class="flex items-center"><span class="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded mr-2"></span> Unanswered</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        startTimerEngine();
    } else if (appState.currentView === 'report') {
        const result = param;
        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-8">
                <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3">
                    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-semibold text-xs rounded-full">Examination Report Card</span>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">${result.quizTitle}</h2>
                    <p class="text-sm text-slate-500">Completed on ${result.date}</p>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p class="text-xs text-slate-500">Score Obtained</p>
                            <p class="text-xl sm:text-2xl font-bold text-emerald-600">${result.score} / ${result.maxScore}</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p class="text-xs text-slate-500">Accuracy</p>
                            <p class="text-xl sm:text-2xl font-bold text-blue-500">${result.accuracy}%</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p class="text-xs text-slate-500">Correct / Wrong</p>
                            <p class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">${result.correctCount} / ${result.incorrectCount}</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p class="text-xs text-slate-500">Time Taken</p>
                            <p class="text-xl sm:text-2xl font-bold text-purple-500">${result.timeTaken}</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">Question-wise Answer Analysis & Explanations</h3>
                    ${result.questions.map((q, idx) => {
                        const userAns = result.userAnswers[q.id];
                        const isCorrect = userAns === q.correctIndex;
                        const isUnattempted = userAns === undefined;
                        const m = appState.config.defaultMarking;
                        let statusBadge = isCorrect 
                            ? `<span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-lg">Correct (+${m.correct})</span>` 
                            : (isUnattempted 
                                ? `<span class="px-2.5 py-1 bg-slate-500/10 text-slate-500 text-xs font-bold rounded-lg">Unattempted (${m.unattempted})</span>` 
                                : `<span class="px-2.5 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-lg">Incorrect (${m.incorrect})</span>`);

                        return `
                            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                <div class="flex justify-between items-start">
                                    <span class="font-bold text-sm text-slate-900 dark:text-white">Q${idx + 1}. ${q.category}</span>
                                    ${statusBadge}
                                </div>
                                <p class="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">${q.text}</p>
                                <div class="space-y-2 text-sm">
                                    ${q.options.map((opt, optIdx) => {
                                        let optClass = "p-3 rounded-xl border border-slate-200 dark:border-slate-700";
                                        if (optIdx === q.correctIndex) optClass = "p-3 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold";
                                        else if (optIdx === userAns && !isCorrect) optClass = "p-3 rounded-xl border border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200";
                                        return `<div class="${optClass}"><span class="font-bold mr-2">${String.fromCharCode(65 + optIdx)}.</span> ${opt}</div>`;
                                    }).join('')}
                                </div>
                                <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                                    <p class="font-bold text-emerald-600 dark:text-emerald-400">Detailed Explanation (${q.pageRef}):</p>
                                    <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${q.explanation}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="flex justify-center space-x-4 pt-4 no-print">
                    <button onclick="router.navigate('dashboard')" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-sm">Back to Quizzes</button>
                    <button onclick="window.print()" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium rounded-xl transition"><i class="fa-solid fa-print mr-2"></i> Download / Print PDF</button>
                </div>
            </div>
        `;
    } else if (appState.currentView === 'history') {
        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">My Examination History</h2>
                    ${appState.examResults.length > 0 ? `<button onclick="clearHistory()" class="text-xs text-rose-500 hover:underline">Clear History</button>` : ''}
                </div>
                ${appState.examResults.length === 0 ? `
                    <div class="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                        <p class="text-slate-500">No quizzes attempted yet.</p>
                        <button onclick="checkAuthAndNavigate('dashboard')" class="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium">Explore Quizzes</button>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${appState.examResults.map((res, i) => `
                            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                                <div>
                                    <span class="text-xs font-semibold text-emerald-600">${res.date}</span>
                                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">${res.quizTitle}</h3>
                                    <p class="text-xs text-slate-500">Score: ${res.score} / ${res.maxScore} | Accuracy: ${res.accuracy}% | Time: ${res.timeTaken}</p>
                                </div>
                                <button onclick="viewReportByIndex(${i})" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition">View Report</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    } else if (appState.currentView === 'admin') {
        const m = appState.config.defaultMarking;
        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6">
                <div class="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard & CMS</h2>
                        <p class="text-sm text-slate-500">Configure marking schemes, import future monthly magazine JSON questions, and export updated question banks.</p>
                    </div>
                    <button onclick="exportQuizzesJson()" class="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium rounded-xl transition">
                        <i class="fa-solid fa-download mr-1.5"></i> Export questions.json
                    </button>
                </div>

                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">Configurable Marking Scheme</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">Correct Answer Marks (+)</label>
                            <input type="number" step="0.01" id="adminMarkCorrect" value="${m.correct}" class="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">Incorrect Answer Marks (-)</label>
                            <input type="number" step="0.01" id="adminMarkIncorrect" value="${m.incorrect}" class="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">Unattempted Marks</label>
                            <input type="number" step="0.01" id="adminMarkUnattempted" value="${m.unattempted}" class="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm">
                        </div>
                    </div>
                    <button onclick="saveMarkingConfig()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition">Save Marking Rules</button>
                </div>

                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white">Import Future Magazine Quizzes (JSON)</h3>
                    <p class="text-xs text-slate-500">Paste a quiz object or array of quizzes in JSON format to append new monthly series (October, November, etc.).</p>
                    <textarea id="jsonImportArea" rows="6" placeholder='{"id": "oct-quick-1", "title": "October Quick Quiz 1", "category": "National Affairs", "timeLimitMinutes": 3, "difficulty": "Moderate", "questions": [...]}' class="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                    <div class="flex space-x-3">
                        <button onclick="importQuizzesFromJson()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition">Import & Publish</button>
                        <button onclick="resetDefaultQuizzes()" class="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition">Reset to Default</button>
                    </div>
                </div>
            </div>
        `;
    }
}

function setCategoryFilter(cat) {
    appState.selectedCategory = cat;
    renderView();
}

function showInstructions(quizId) {
    const quiz = appState.quizzes.find(q => q.id === quizId);
    if (quiz) router.navigate('instructions', quiz);
}

function closeTgModal() {
    document.getElementById('tgModal').classList.add('hidden');
}

function checkAuthAndNavigate(view) {
    if (appState.isVerified) {
        router.navigate(view);
    } else {
        const savedId = localStorage.getItem('uw_saved_telegram_id');
        if (savedId) {
            const input = document.getElementById('tgUsernameInput');
            if (input) input.value = savedId;
        }
        document.getElementById('tgModal').classList.remove('hidden');
    }
}

function handleChannelJoinClick() {
    localStorage.setItem('uw_joined_clicked', 'true');
}

async function verifyAndRedirect() {
    const errorEl = document.getElementById('verifyErrorMsg');
    const btn = document.getElementById('verifyBtn');
    errorEl.textContent = "Secure Telegram verification is not configured yet. Please check back after the site administrator completes the backend setup.";
    errorEl.classList.remove('hidden');
    btn.textContent = "Verification not available yet";
    btn.disabled = true;
}

function completeVerification(userId) {
    appState.isVerified = true;
    localStorage.setItem('uw_telegram_verified', 'true');
    localStorage.setItem('uw_saved_telegram_id', userId);
    document.getElementById('tgModal').classList.add('hidden');
    router.navigate('dashboard');
}

function startQuiz(quizId) {
    const quiz = appState.quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    appState.activeQuiz = JSON.parse(JSON.stringify(quiz));
    appState.currentQuestionIndex = 0;
    appState.userAnswers = {};
    appState.markedForReview = {};
    appState.timeRemainingSeconds = quiz.timeLimitMinutes * 60;
    
    router.navigate('exam');
}

function selectOption(optIdx) {
    const q = appState.activeQuiz.questions[appState.currentQuestionIndex];
    appState.userAnswers[q.id] = optIdx;
    renderView();
}

function clearResponse() {
    const q = appState.activeQuiz.questions[appState.currentQuestionIndex];
    delete appState.userAnswers[q.id];
    renderView();
}

function toggleMarkReview() {
    const q = appState.activeQuiz.questions[appState.currentQuestionIndex];
    appState.markedForReview[q.id] = !appState.markedForReview[q.id];
    renderView();
}

function navigateQuestion(direction) {
    const newIdx = appState.currentQuestionIndex + direction;
    if (newIdx >= 0 && newIdx < appState.activeQuiz.questions.length) {
        appState.currentQuestionIndex = newIdx;
        renderView();
    } else if (newIdx >= appState.activeQuiz.questions.length) {
        confirmSubmitQuiz();
    }
}

function jumpToQuestion(idx) {
    appState.currentQuestionIndex = idx;
    renderView();
}

function startTimerEngine() {
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    
    const updateDisplay = () => {
        const mins = Math.floor(appState.timeRemainingSeconds / 60);
        const secs = appState.timeRemainingSeconds % 60;
        const display = document.getElementById('timerDisplay');
        if (display) {
            display.innerHTML = `<i class="fa-solid fa-stopwatch mr-2"></i> ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    };
    updateDisplay();

    appState.timerInterval = setInterval(() => {
        if (appState.timeRemainingSeconds <= 0) {
            clearInterval(appState.timerInterval);
            alert("Time expired! Your test is being automatically submitted.");
            submitQuiz();
            return;
        }
        appState.timeRemainingSeconds--;
        updateDisplay();
    }, 1000);
}

function confirmSubmitQuiz() {
    if (confirm("Are you sure you want to submit your examination?")) {
        submitQuiz();
    }
}

function submitQuiz() {
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    
    const quiz = appState.activeQuiz;
    const m = appState.config.defaultMarking;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    quiz.questions.forEach(q => {
        const userAns = appState.userAnswers[q.id];
        if (userAns === undefined) {
            unattemptedCount++;
        } else if (userAns === q.correctIndex) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    });

    const maxScore = quiz.questions.length * m.correct;
    const rawScore = (correctCount * m.correct) + (incorrectCount * m.incorrect) + (unattemptedCount * m.unattempted);
    const accuracy = (correctCount + incorrectCount) > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;
    const totalTimeSecs = (quiz.timeLimitMinutes * 60) - appState.timeRemainingSeconds;
    const timeTaken = `${Math.floor(totalTimeSecs / 60)}m ${totalTimeSecs % 60}s`;

    const resultRecord = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        score: rawScore.toFixed(2),
        maxScore: maxScore.toFixed(2),
        accuracy,
        correctCount,
        incorrectCount,
        unattemptedCount,
        timeTaken,
        questions: quiz.questions,
        userAnswers: appState.userAnswers
    };

    appState.examResults.unshift(resultRecord);
    localStorage.setItem('uw_exam_results', JSON.stringify(appState.examResults));

    router.navigate('report', resultRecord);
}

function viewReportByIndex(index) {
    const record = appState.examResults[index];
    router.navigate('report', record);
}

function clearHistory() {
    if (confirm("Clear all saved exam history on this device?")) {
        appState.examResults = [];
        localStorage.removeItem('uw_exam_results');
        renderView();
    }
}

function saveMarkingConfig() {
    const correct = parseFloat(document.getElementById('adminMarkCorrect').value) || 1.0;
    const incorrect = parseFloat(document.getElementById('adminMarkIncorrect').value) || -0.33;
    const unattempted = parseFloat(document.getElementById('adminMarkUnattempted').value) || 0.0;
    appState.config.defaultMarking = { correct, incorrect, unattempted };
    localStorage.setItem('uw_marking_config', JSON.stringify(appState.config.defaultMarking));
    alert("Marking rules updated successfully!");
}

function importQuizzesFromJson() {
    try {
        const raw = document.getElementById('jsonImportArea').value.trim();
        const parsed = JSON.parse(raw);
        const newItems = Array.isArray(parsed) ? parsed : (parsed.quizzes ? parsed.quizzes : [parsed]);
        appState.quizzes = [...appState.quizzes, ...newItems];
        localStorage.setItem('uw_custom_quizzes', JSON.stringify(appState.quizzes));
        alert(`Successfully imported ${newItems.length} quiz module(s)!`);
        router.navigate('dashboard');
    } catch (e) {
        alert("Invalid JSON format. Please check your syntax and try again.");
    }
}

function resetDefaultQuizzes() {
    localStorage.removeItem('uw_custom_quizzes');
    initApp();
    alert("Quizzes reset to default questions.json.");
}

function exportQuizzesJson() {
    const blob = new Blob([JSON.stringify({ config: appState.config, quizzes: appState.quizzes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.json";
    a.click();
    URL.revokeObjectURL(url);
}

function filterQuizzes() {
    const query = document.getElementById('quizSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#quizGrid > div');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(query) ? 'flex' : 'none';
    });
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('uw_theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('uw_theme', 'dark');
    }
}

const fallbackQuizzes = [
    {
        id: "sept-quick-1",
        title: "September Quick Quiz 1: Defence & Security",
        category: "Defence and Security",
        questionsCount: 1,
        timeLimitMinutes: 3,
        difficulty: "Moderate",
        questions: [
            { id: "q1", text: "India's overall defence budget reached ₹7.85 lakh crore in FY 2026-27.", options: ["True", "False"], correctIndex: 0, explanation: "Verified from September defence report.", category: "Defence", pageRef: "Page 4", examRelevance: "CDS" }
        ]
    }
];

window.onload = initApp;
