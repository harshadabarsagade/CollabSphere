
export const generateAIResponse = async (req, res) => {
    try {
        const { action, content } = req.body;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                message: "Content is required"
            });
        }

        const prompts = {
            summarize: `Summarize this content in simple points:\n\n${content}`,
            explain: `Explain this code or content in beginner-friendly language with an example:\n\n${content}`,
            chat: `You are the AI assistant for CollabSphere. Help developers with coding, projects, and collaboration.\n\n${content}`
        };

        if (!prompts[action]) {
            return res.status(400).json({
                message: "Action must be summarize, explain, or chat"
            });
        }

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                message: "GROQ_API_KEY is missing from server/.env"
            });
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: prompts[action]
                        }
                    ],
                    max_completion_tokens: 1024
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API error:", data);

            return res.status(response.status).json({
                message:
                    data.error?.message ||
                    "Groq API request failed"
            });
        }

        const aiResponse =
            data.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
            return res.status(502).json({
                message: "Groq returned an empty response"
            });
        }

        return res.status(200).json({
            message: "AI response generated successfully",
            action,
            response: aiResponse
        });

    } catch (error) {
        console.error("Groq controller error:", error.message);

        return res.status(500).json({
            message: "Failed to generate AI response"
        });
    }
};
