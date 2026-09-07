// ==========================================
// SUPABASE CONFIG (YAHAN APNI DETAILS DAAL)
// ==========================================
const SUPABASE_URL = "TERI_SUPABASE_URL_YAHAN";
const SUPABASE_KEY = "TERI_SUPABASE_ANON_KEY_YAHAN";

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error("Supabase init failed. URL/Key check kar!", e);
}

function getCurrentUser() {
    const user = localStorage.getItem("learnLoopUser");
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem("learnLoopUser");
    window.location.href = "index.html";
}

// ==========================================
// INDEX PAGE (Login & Signup)
// ==========================================
function openLogin() { document.getElementById("loginOverlay").style.display = "flex"; }
function closeLogin() { document.getElementById("loginOverlay").style.display = "none"; }

function showSignup() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
}

function showLogin() {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
}

// SIGNUP (Custom Auth with Bcrypt)
async function signup(event) {
    event.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    if (!supabase) { alert("Database connection failed!"); return; }

    try {
        // 1. Hash Password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // 2. Save to DB
        const { data, error } = await supabase
            .from('users')
            .insert([{ email: email, password_hash: hash }])
            .select();

        if (error) throw error;

        // 3. Set Session
        localStorage.setItem("learnLoopUser", JSON.stringify({ id: data[0].id, email: data[0].email }));
        
        alert("Account created! Welcome to LearnLoop 🚀");
        window.location.href = "onboarding.html";

    } catch (err) {
        alert("Signup Error: " + err.message);
    }
}

// LOGIN (Verify Bcrypt Hash)
async function login(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!supabase) { alert("Database connection failed!"); return; }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) throw error;
        if (users.length === 0) { alert("User not found. Please sign up."); return; }

        const user = users[0];
        const isMatch = bcrypt.compareSync(password, user.password_hash);

        if (!isMatch) { alert("Incorrect password."); return; }

        localStorage.setItem("learnLoopUser", JSON.stringify({ id: user.id, email: user.email }));
        
        // Check if onboarding done
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (!profile) {
            window.location.href = "onboarding.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (err) {
        alert("Login Error: " + err.message);
    }
}

// ==========================================
// ONBOARDING PAGE
// ==========================================
function selectSubject(btn) { btn.classList.toggle("selected"); }
function selectTime(btn) {
    document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
}

async function saveOnboarding() {
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
    const goal = document.getElementById("goal").value;
    const selectedSubjects = document.querySelectorAll(".selection-btn.selected");
    const selectedTime = document.querySelector(".time-btn.selected");

    if (year === "" || branch === "" || goal === "" || selectedSubjects.length === 0 || !selectedTime) {
        alert("Please complete all sections before continuing.");
        return;
    }

    let subjects = [];
    selectedSubjects.forEach(btn => subjects.push(btn.innerText.trim()));

    const user = getCurrentUser();
    if (!user) { window.location.href = "index.html"; return; }

    try {
        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            year: year,
            branch: branch,
            subjects: subjects,
            study_time: selectedTime.innerText,
            goal: goal,
            streak: 1
        });

        if (error) throw error;

        alert("Great! Your learning journey is personalized 🎯");
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("Error saving data: " + err.message);
    }
}

// ==========================================
// DASHBOARD PAGE
// ==========================================
async function loadDashboard() {
    const user = getCurrentUser();
    if (!user) { window.location.href = "index.html"; return; }

    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            const nameEl = document.getElementById("studentName");
            if(nameEl) nameEl.innerText = profile.full_name || "Student";
            
            const streakEl = document.getElementById("streakCount");
            if(streakEl) streakEl.innerText = profile.streak || 1;
        }
    } catch (err) {
        console.error("Dashboard load error:", err);
    }
}

// ==========================================
// LEARN PAGE
// ==========================================
function showTopics(subject) {
    const title = document.getElementById("topicTitle");
    if (!title) return;
    if (subject === "mathematics") title.innerText = "Engineering Mathematics";
    else if (subject === "physics") title.innerText = "Engineering Physics";
    else if (subject === "programming") title.innerText = "Programming";
    document.getElementById("topicsSection").scrollIntoView({ behavior: "smooth" });
}

function openLearning(topic) {
    document.getElementById("popupIcon").innerText = "📖";
    document.getElementById("popupTitle").innerText = "Learning: " + topic;
    document.getElementById("popupMessage").innerText = "Your lesson content for " + topic + " will appear here.";
    document.getElementById("learnPopup").style.display = "flex";
}

function openNotes(topic) {
    document.getElementById("popupIcon").innerText = "📝";
    document.getElementById("popupTitle").innerText = "Handwritten Notes";
    document.getElementById("popupMessage").innerText = "Handwritten notes for " + topic + " will be available here.";
    document.getElementById("learnPopup").style.display = "flex";
}

function showResourceMessage() {
    document.getElementById("popupIcon").innerText = "🎥";
    document.getElementById("popupTitle").innerText = "Learning Resources";
    document.getElementById("popupMessage").innerText = "Useful videos and external learning resources will be added here.";
    document.getElementById("learnPopup").style.display = "flex";
}

function goToPractice() { alert("Practice section coming soon! 🧠"); }
function closeLearnPopup() { document.getElementById("learnPopup").style.display = "none"; }

// ==========================================
// AI ASSISTANT
// ==========================================
function quickQuestion(q) { document.getElementById("aiQuestion").value = q; }

function askLearnLoopAI() {
    const question = document.getElementById("aiQuestion").value.trim();
    const subject = document.getElementById("aiSubject").value;
    if (subject === "") { alert("Select a subject first."); return; }
    if (question === "") { alert("Enter your question."); return; }

    let answer = "";
    if (question.toLowerCase().includes("matrix")) answer = "A matrix is a rectangular arrangement of numbers into rows and columns.";
    else if (question.toLowerCase().includes("eigenvalue")) answer = "An eigenvalue is a special value associated with a square matrix.";
    else if (question.toLowerCase().includes("variable")) answer = "A variable in C is a named memory location used to store a value.";
    else answer = "Great question! In the final version, the AI assistant will be connected to a real AI service.";

    document.getElementById("responseText").innerText = answer;
    document.getElementById("aiResponse").style.display = "block";
}

function explainSimply() { document.getElementById("responseText").innerText = "In very simple words: break it into small parts."; }
function giveExample() { document.getElementById("responseText").innerText = "Example: Think of the concept as something you encounter in real life."; }
function givePractice() { document.getElementById("responseText").innerText = "🧠 Practice Question: Explain the concept in your own words."; }

// ==========================================
// DAILY CHALLENGE (Quiz)
// ==========================================
const challengeQuestions = [
    { subject: "Mathematics", question: "Order of a matrix having 3 rows and 2 columns?", options: ["2 × 3", "3 × 2", "3 × 3", "2 × 2"], answer: 1 },
    { subject: "Programming", question: "Which symbol ends a statement in C?", options: [":", ".", ";", ","], answer: 2 },
    { subject: "Physics", question: "SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], answer: 1 },
    { subject: "Mathematics", question: "Which is a scalar quantity?", options: ["Velocity", "Force", "Acceleration", "Temperature"], answer: 3 },
    { subject: "Programming", question: "Data type to store an integer in C?", options: ["float", "char", "int", "double"], answer: 2 }
];

let currentQuestion = 0, score = 0, selectedAnswer = null, timeLeft = 300, timerInterval;

function startQuiz() {
    currentQuestion = 0; score = 0; selectedAnswer = null; timeLeft = 300;
    document.getElementById("quizCard").style.display = "block";
    document.getElementById("resultCard").style.display = "none";
    loadQuestion(); startTimer();
}

function loadQuestion() {
    const q = challengeQuestions[currentQuestion];
    document.getElementById("questionNumber").innerText = `Question ${currentQuestion + 1} of ${challengeQuestions.length}`;
    document.getElementById("questionSubject").innerText = q.subject;
    document.getElementById("questionText").innerText = q.question;
    
    const container = document.getElementById("optionsContainer");
    container.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = String.fromCharCode(65 + i) + ". " + opt;
        btn.onclick = () => selectAnswer(i, btn);
        container.appendChild(btn);
    });

    document.getElementById("answerFeedback").innerText = "";
    selectedAnswer = null;
    document.getElementById("quizProgress").style.width = `${((currentQuestion + 1) / challengeQuestions.length) * 100}%`;
}

function selectAnswer(index, button) {
    if (selectedAnswer !== null) return;
    selectedAnswer = index;
    const q = challengeQuestions[currentQuestion];
    const allOptions = document.querySelectorAll(".option-btn");
    allOptions.forEach(btn => btn.disabled = true);

    if (index === q.answer) {
        button.classList.add("correct"); score++;
        document.getElementById("answerFeedback").innerText = "✅ Correct! Great job!";
        document.getElementById("answerFeedback").style.color = "#16a34a";
    } else {
        button.classList.add("wrong");
        allOptions[q.answer].classList.add("correct");
        document.getElementById("answerFeedback").innerText = "❌ Correct answer is " + q.options[q.answer] + ".";
        document.getElementById("answerFeedback").style.color = "#dc2626";
    }
}

function nextQuestion() {
    if (selectedAnswer === null) { alert("Please select an answer first."); return; }
    if (currentQuestion < challengeQuestions.length - 1) { currentQuestion++; loadQuestion(); } 
    else { finishQuiz(); }
}

async function finishQuiz() {
    clearInterval(timerInterval);
    document.getElementById("quizCard").style.display = "none";
    document.getElementById("resultCard").style.display = "block";

    const total = challengeQuestions.length;
    const accuracy = Math.round((score / total) * 100);

    document.getElementById("finalScore").innerText = `${score}/${total}`;
    document.getElementById("correctAnswers").innerText = score;
    document.getElementById("wrongAnswers").innerText = total - score;
    document.getElementById("accuracy").innerText = `${accuracy}%`;

    const user = getCurrentUser();
    if (user && supabase) {
        try {
            await supabase.from('quiz_results').insert({ user_id: user.id, score: score, total_questions: total, accuracy: accuracy });
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                await supabase.from('profiles').update({ streak: (profile.streak || 1) + 1 }).eq('id', user.id);
            }
        } catch (err) { console.error("Quiz save error:", err); }
    }

    if (accuracy === 100) document.getElementById("resultMessage").innerText = "Perfect score! You're on fire! 🔥";
    else if (accuracy >= 60) document.getElementById("resultMessage").innerText = "Great work! Keep practicing. 💪";
    else document.getElementById("resultMessage").innerText = "Good attempt! Review the topics. 📚";
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(); return; }
        timeLeft--;
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById("timer").innerText = `⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
}

function restartQuiz() { startQuiz(); }
if (document.getElementById("quizCard")) { startQuiz(); }

// ==========================================
// EXAM MODE & PROFILE
// ==========================================
function selectExamSubject(btn, subject) {
    document.querySelectorAll(".exam-subject").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

function showRevision(type) {
    const overlay = document.getElementById("revisionOverlay");
    const title = document.getElementById("revisionTitle");
    const text = document.getElementById("revisionText");
    if (type === "formulas") { title.innerText = "📐 Important Formulas"; text.innerText = "Formula revision content will appear here."; }
    else if (type === "concepts") { title.innerText = "💡 Key Concepts"; text.innerText = "Important concepts for quick revision."; }
    else if (type === "mistakes") { title.innerText = "⚠️ Common Mistakes"; text.innerText = "Common mistakes made by students."; }
    overlay.style.display = "flex";
}

function closeRevision() { document.getElementById("revisionOverlay").style.display = "none"; }
function startExamPractice() { window.location.href = "challenge.html"; }
function showProfileMessage() { document.getElementById("profileOverlay").style.display = "flex"; }
function closeProfileMessage() { document.getElementById("profileOverlay").style.display = "none"; }

function goToLearn() { window.location.href = "learn.html"; }
function startChallenge() { window.location.href = "challenge.html"; }
function askAI() { window.location.href = "ai.html"; }
function examMode() { window.location.href = "exam.html"; }

// ==========================================
// PAGE LOAD SECURITY CHECK
// ==========================================
window.onload = function() {
    const user = getCurrentUser();
    const page = window.location.pathname.split("/").pop();

    if (!user && !["index.html", ""].includes(page)) {
        window.location.href = "index.html";
        return;
    }

    if (page === "dashboard.html") {
        loadDashboard();
    }
};
