// Cloudflare Pages Function (_middleware.js)
// Handles API routes and expiration checking

// ============================================================================
// EXPIRATION CONFIG - SERVER SIDE (Students can't modify this)
// ============================================================================

const EXPIRATION_DATE = new Date('2026-06-30T23:59:59Z'); // Change this date

const EXPIRATION_DISPLAY = EXPIRATION_DATE.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
});

// ============================================================================
// QUIZ FILES LIST
// Update this list when you add new quiz files
// ============================================================================

const QUIZ_FILES = [
    '02.txt',
    '04 05.txt',
    '06 07.txt',
    '10 11.txt',
    '12 13.txt',
    '14 15.txt',
    '16 17.txt',
    '18 19.txt',
    '20 21.txt',
    '22.txt',
    '24.txt',
    '26 27.txt',
    '36 37.txt',
    '38 39.txt',
    '40.txt',
    '42 43.txt',
    '44.txt',
    '46.txt',
    '46_.txt',
    '48 50.txt'
];

// ============================================================================
// EXPIRATION CHECK
// ============================================================================

function isExpired() {
    return new Date() > EXPIRATION_DATE;
}

function getExpiredHTML() {
    return `<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplicació Caducada</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
        }
        h1 { font-size: 4rem; margin: 0 0 20px 0; }
        h2 { font-size: 2rem; margin: 0 0 30px 0; opacity: 0.9; }
        p { font-size: 1.2rem; line-height: 1.8; opacity: 0.8; }
        .date {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px 30px;
            border-radius: 10px;
            margin: 30px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⏰</h1>
        <h2>Aplicació Caducada</h2>
        <p>Aquesta versió del Quiz Study Mode ha expirat.</p>
        <div class="date">Data de caducitat: ${EXPIRATION_DISPLAY}</div>
        <p>Contacta amb el professor per obtenir accés a una nova versió.</p>
    </div>
</body>
</html>`;
}

// ============================================================================
// QUESTION PARSER
// ============================================================================

function parseQuestions(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const questions = [];
    let currentQuestion = null;

    for (let line of lines) {
        line = line.trim();

        const questionMatch = line.match(/^(\d+)\((\d+)s\)\s+(.+)$/);
        if (questionMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                id: parseInt(questionMatch[1]),
                duration: parseInt(questionMatch[2]),
                question: questionMatch[3],
                options: {},
                correct: null
            };
        }
        else if (line.match(/^[\*]?[a-d]\.\s+.+$/)) {
            const isCorrect = line.startsWith('*');
            const answerLine = isCorrect ? line.substring(1) : line;
            const answerMatch = answerLine.match(/^([a-d])\.\s+(.+)$/);

            if (answerMatch && currentQuestion) {
                const key = answerMatch[1];
                const text = answerMatch[2];
                currentQuestion.options[key] = text;

                if (isCorrect) {
                    currentQuestion.correct = key;
                }
            }
        }
    }

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return questions;
}

function getQuizName(filename) {
    return filename
        .replace(/\.txt$/, '')
        .replace(/^\d+_/, '')
        .replace(/^\d+\s+/, '')
        .split(/[_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // Check expiration for all requests
    if (isExpired()) {
        return new Response(getExpiredHTML(), {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // API: List all quizzes
    if (url.pathname === '/api/quizzes') {
        try {
            const quizzes = [];

            console.log('🚀 Starting to load quizzes...');
            console.log(`📋 Total quiz files: ${QUIZ_FILES.length}`);

            // Load each quiz file from the hardcoded list
            for (const filename of QUIZ_FILES) {
                try {
                    const fileUrl = new URL(`/questions/${filename}`, request.url);
                    console.log(`🔍 Fetching: ${fileUrl.href}`);

                    const fileResponse = await fetch(fileUrl);
                    console.log(`📡 Status for ${filename}: ${fileResponse.status}`);

                    if (fileResponse.ok) {
                        const text = await fileResponse.text();
                        const questions = parseQuestions(text);

                        console.log(`✅ Parsed ${questions.length} questions from ${filename}`);

                        quizzes.push({
                            file: filename,
                            name: getQuizName(filename),
                            questionCount: questions.length
                        });
                    } else {
                        console.log(`❌ Failed to load ${filename}: ${fileResponse.status}`);
                    }
                } catch (err) {
                    console.error(`💥 Error loading ${filename}:`, err.message);
                }
            }

            console.log(`🎉 Total quizzes loaded: ${quizzes.length}`);

            return new Response(JSON.stringify(quizzes), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            console.error('💥 Error in /api/quizzes:', error);
            return new Response(JSON.stringify({
                error: 'Error loading quizzes',
                message: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // API: Get specific quiz
    if (url.pathname.startsWith('/api/quiz/')) {
        const filename = url.pathname.replace('/api/quiz/', '');

        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new Response(JSON.stringify({ error: 'Invalid filename' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify filename is in allowed list
        if (!QUIZ_FILES.includes(filename)) {
            return new Response(JSON.stringify({ error: 'Quiz not in allowed list' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const fileUrl = new URL(`/questions/${filename}`, request.url);
            const fileResponse = await fetch(fileUrl);

            if (!fileResponse.ok) {
                return new Response(JSON.stringify({
                    error: 'Quiz not found',
                    filename: filename,
                    status: fileResponse.status
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const text = await fileResponse.text();
            const questions = parseQuestions(text);

            return new Response(JSON.stringify(questions), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            console.error('Error loading quiz:', error);
            return new Response(JSON.stringify({
                error: 'Error loading quiz',
                message: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // API: Health check
    if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
            status: 'ok',
            expiresAt: EXPIRATION_DATE.toISOString(),
            isExpired: isExpired(),
            quizCount: QUIZ_FILES.length,
            quizFiles: QUIZ_FILES
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Pass through to static assets
    return next();
}
