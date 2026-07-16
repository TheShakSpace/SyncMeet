import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but was not found. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API endpoint for AI Chat Assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, chatHistory = [], meetingContext = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAiClient();

    // Prepare meeting context representation
    const roomId = meetingContext.roomId || "sm-huddle-sync";
    const participantsList = meetingContext.participants?.map((p: any) => `${p.displayName} (${p.role || 'Participant'})`).join(", ") || "None";
    const sharedFilesList = meetingContext.sharedFiles?.map((f: any) => `${f.name} (Uploaded by: ${f.uploader}, Type: ${f.type}, Size: ${f.size})`).join("\n") || "No files uploaded yet";
    
    // Construct the actual chat log text
    const meetingChatHistory = meetingContext.chatMessages?.map((m: any) => `[${m.timestamp}] ${m.senderName}: ${m.text}`).join("\n") || "No chat history yet";

    // System instruction to give the agent full workspace awareness
    const systemInstruction = `You are SyncMeet's advanced AI Meeting Assistant. You are currently assisting in an active collaborative meeting room (Room ID: ${roomId}).

ACTIVE MEETING WORKSPACE CONTEXT:
----------------------------------
Active Participants: ${participantsList}
Shared Files:
${sharedFilesList}

Chat History of the Meeting (Current):
${meetingChatHistory}
----------------------------------

YOUR CAPABILITIES:
- Answer meeting-related questions (using the context above).
- Explain uploaded documents and files.
- Summarize chat messages and discussions.
- Generate meeting notes, task lists, and action items.
- Suggest follow-up emails, draft professional messages, or translate statements.
- Answer general knowledge or technical questions.

Tone Guidelines: Keep your responses highly professional, helpful, concise, and structured with clean markdown. Avoid verbose preambles. Get straight to the value! Always respond in the light theme mood of a senior huddle scribe.`;

    // Map conversation history for Gemini's chats structure
    const contents = [];
    
    // Format previous messages in the current AI chat assistant session (not the meeting room main chat)
    for (const h of chatHistory) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred while processing your AI request." });
  }
});

// API endpoint for Meeting Summary & Analytics
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { meetingContext = {} } = req.body;
    const ai = getAiClient();

    // Prepare workspace representation
    const roomId = meetingContext.roomId || "sm-huddle-sync";
    const participantsList = meetingContext.participants?.map((p: any) => `${p.displayName} (${p.role || 'Participant'})`).join(", ") || "None";
    const sharedFilesList = meetingContext.sharedFiles?.map((f: any) => `${f.name} (Uploaded by: ${f.uploader}, Type: ${f.type}, Size: ${f.size})`).join("\n") || "No files uploaded yet";
    const meetingChatHistory = meetingContext.chatMessages?.map((m: any) => `[${m.timestamp}] ${m.senderName}: ${m.text}`).join("\n") || "No chat history yet";

    const prompt = `Analyze this active SyncMeet video huddle room (Room ID: ${roomId}). Extract critical meeting summary, action items, and chat analysis based on the actual participants list, shared files list, and chat transcript.

ACTIVE MEETING WORKSPACE DATA:
----------------------------------
Active Participants: ${participantsList}
Shared Files:
${sharedFilesList}

Chat History of the Meeting Room:
${meetingChatHistory}
----------------------------------

If there is insufficient chat history or data, extrapolate professionally to create a valuable mock-analytical projection (e.g. if the room is new, suggest typical action items for team alignment based on any file names or typical collaborative workspaces, and summarize the room startup status).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite workspace intelligence agent. Your job is to analyze real-time meeting rooms and return a detailed, structured meeting analysis report.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: "A comprehensive high-level overview summarizing what the meeting was about, the overall context, and key themes."
            },
            keyDiscussionPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of key discussion points covered during the meeting, detailing what topics were debated or discussed."
            },
            importantDecisions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of critical decisions made during the meeting, noting consensus reached by participants."
            },
            suggestedFollowup: {
              type: Type.STRING,
              description: "A suggested follow-up statement, including next meeting details, post-meeting huddles, or immediate next steps."
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING, description: "Detailed description of the task." },
                  owner: { type: Type.STRING, description: "Assigned owner of the task. If not specified or clear, use 'Unassigned' or one of the active participants." },
                  priority: { type: Type.STRING, description: "Priority level of the task, typically 'High', 'Medium', or 'Low'." },
                  deadline: { type: Type.STRING, description: "Target deadline for the task, e.g., 'Asap', 'Next Friday', '2026-07-20', or 'TBD'." }
                },
                required: ["task", "owner", "priority", "deadline"]
              },
              description: "Extracted action items from the conversation, containing the task description, owner, priority level, and deadline."
            },
            pendingTasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of other pending tasks, issues, or parking-lot items raised but not yet fully assigned or resolved."
            },
            chatAnalysis: {
              type: Type.OBJECT,
              properties: {
                frequentlyDiscussedTopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Major topics or themes frequently discussed by participants in the chat."
                },
                importantKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Crucial keywords or terms extracted from the chat log."
                },
                sentiment: {
                  type: Type.STRING,
                  description: "Overall sentiment of the meeting chat (e.g. 'Highly Positive', 'Collaborative', 'Constructive', 'Neutral')."
                },
                questionsAsked: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING, description: "The question asked." },
                      askedBy: { type: Type.STRING, description: "Name of the participant who asked it." }
                    },
                    required: ["question", "askedBy"]
                  },
                  description: "Any questions raised by participants during the chat."
                }
              },
              required: ["frequentlyDiscussedTopics", "importantKeywords", "sentiment", "questionsAsked"]
            }
          },
          required: ["overview", "keyDiscussionPoints", "importantDecisions", "suggestedFollowup", "actionItems", "pendingTasks", "chatAnalysis"]
        },
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("AI Analytics API Error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred while analyzing the meeting." });
  }
});

// Configure Vite middleware or static serving
async function setupRouting() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupRouting().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SyncMeet FullStack] Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error("Vite setup error:", err);
});
