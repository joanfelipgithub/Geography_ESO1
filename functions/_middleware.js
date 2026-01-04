// Cloudflare Pages Function (_middleware.js)
// This handles all server-side logic including expiration checking

// ============================================================================
// EXPIRATION CONFIG - SERVER SIDE (Students can't modify this)
// ============================================================================

// SET YOUR EXPIRATION DATE HERE
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
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function onRequest(context) {
    const { request, env } = context;
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
            // Fetch the quiz manifest (we'll create this)
            const manifestUrl = new URL('/questions/manifest.json', request.url);
            const manifestResponse = await context.env.ASSETS.fetch(manifestUrl);
            
            if (!manifestResponse.ok) {
                throw new Error('Manifest not found');
            }
            
            const manifest = await manifestResponse.json();
            const quizzes = [];
            
            for (const filename of manifest.files) {
                const fileUrl = new URL(`/questions/${filename}`, request.url);
                const fileResponse = await context.env.ASSETS.fetch(fileUrl);
                const text = await fileResponse.text();
                const questions = parseQuestions(text);
                
                quizzes.push({
                    file: filename,
                    name: getQuizName(filename),
                    questionCount: questions.length
                });
            }
            
            return new Response(JSON.stringify(quizzes), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ 
                error: 'Error loading quizzes',
                message: error.message 
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
        
        try {
            const fileUrl = new URL(`/questions/${filename}`, request.url);
            const fileResponse = await context.env.ASSETS.fetch(fileUrl);
            
            if (!fileResponse.ok) {
                return new Response(JSON.stringify({ error: 'Quiz not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const text = await fileResponse.text();
            const questions = parseQuestions(text);
            
            return new Response(JSON.stringify(questions), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ 
                error: 'Error loading quiz',
                message: error.message 
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
            isExpired: isExpired()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Serve static files
    try {
        return await env.ASSETS.fetch(request);
    } catch (error) {
        return new Response('Not Found', { status: 404 });
    }
}
