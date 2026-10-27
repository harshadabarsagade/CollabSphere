const generateGeminiResponse = async (prompt) => {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        throw new Error("API_KEY is missing from server/.env");
    }

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 2048
                }
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("Gemini API error:", data.error?.message);

        const error = new Error(
            data.error?.message || "Gemini API request failed"
        );

        error.status = response.status;
        throw error;
    }

    const result = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!result) {
        throw new Error("Gemini returned an empty response");
    }

    return result;
};

const handleGeminiRequest = async (req, res, promptBuilder) => {
    try {
        const { content } = req.body;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                message: "Content is required"
            });
        }

        const result = await generateGeminiResponse(
            promptBuilder(content.trim())
        );

        return res.status(200).json({
            message: "Gemini response generated successfully",
            response: result
        });
    } catch (error) {
        console.error("Gemini controller error:", error.message);

        return res.status(error.status || 500).json({
            message: error.status
                ? "Gemini API request failed"
                : "Failed to generate Gemini response"
        });
    }
};

export const generateAIResponse = async (req, res) => {
    const { action } = req.body;

    const prompts = {
        summarize: (content) =>
            `Summarize in three short bullet points using simple English:\n${content}`,

        explain: (content) =>
            `Explain in simple English using 2-4 short bullet points. Keep it under 100 words:\n${content}`,

        chat: (content) => `Answer in simple English using at most 2 short sentences. Maximum 30 words. No headings, markdown, emojis, or decorative symbols. Answer directly:\n${content}`
    };

    if (!prompts[action]) {
        return res.status(400).json({
            message: "Action must be summarize, explain, or chat"
        });
    }

    return handleGeminiRequest(req, res, prompts[action]);
};

export const explainContent = (req, res) =>
    handleGeminiRequest(
        req,
        res,
        (content) =>
            `Explain the following code or content in simple English. Explain its purpose and important parts. Use short bullet points:\n${content}`
    );

export const generateDocs = (req, res) =>
    handleGeminiRequest(
        req,
        res,
        (content) =>
            `Generate clear technical documentation for this project or code. Include its purpose, features, setup instructions, and usage where applicable:\n${content}`
    );

export const generateReadme = (req, res) =>
    handleGeminiRequest(
        req,
        res,
        (content) =>
            `Create a useful README.md in Markdown for this project. Include project overview, features, technologies, installation, configuration, and usage where applicable:\n${content}`
    );
