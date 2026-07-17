// src/index.js

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        try {
            // Teacher Login Mock Endpoint
            if (url.pathname === '/api/teacher-login' && request.method === 'POST') {
                const body = await request.json();
                if (body.id === 'admin' && body.password === 'password') {
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(JSON.stringify({ success: false }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Fetch Results
            if (url.pathname === '/api/results' && request.method === 'GET') {
                // Mock results if KV is not setup yet
                const mockResults = [
                    { name: "Sample Student", grade: "8th Grade", school: "Sample School", score: 45, totalQuestions: 50 }
                ];
                
                // If you have KV setup:
                // const list = await env.RESULTS_KV.list();
                // const mockResults = await Promise.all(list.keys.map(k => env.RESULTS_KV.get(k.name, 'json')));
                
                return new Response(JSON.stringify({ results: mockResults }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Submit Assessment
            if (url.pathname === '/api/submit-assessment' && request.method === 'POST') {
                const body = await request.json();
                
                // Store in KV (uncomment when KV is bound)
                // const key = `${Date.now()}-${body.student.name.replace(/\s+/g, '')}`;
                // await env.RESULTS_KV.put(key, JSON.stringify(body));

                // Send to Discord
                if (env.DISCORD_WEBHOOK_URL) {
                    const discordPayload = {
                        content: `**New Assessment Submitted!**\n**Student:** ${body.student.name} (${body.student.grade}, ${body.student.school})\n**Score:** ${body.score} / ${body.totalQuestions}`,
                        embeds: [{
                            title: "Answer Sheet Details",
                            description: body.answers.map(a => 
                                `Q: ${a.questionText}\nAns: ${a.selectedOptionText} ${a.isCorrect ? '✅' : '❌'}`
                            ).join('\n\n').substring(0, 4000) // Discord embed limits
                        }]
                    };

                    await fetch(env.DISCORD_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(discordPayload)
                    });
                }

                return new Response(JSON.stringify({ success: true, message: "Assessment stored and sent to Discord" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response("Not found", { status: 404, headers: corsHeaders });
            
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
