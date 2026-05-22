import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env"), quiet: true });

// Retrieve arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const eqIdx = arg.indexOf("=");
  if (eqIdx !== -1) {
    const key = arg.slice(0, eqIdx);
    const val = arg.slice(eqIdx + 1);
    args[key.replace(/^--/, "")] = val;
  }
});

const videoPath = args.video;
const youtubeUrl = args.youtube;
const analysisType = args.type || "batting";

// Path configuration relative to script location
const promptFilePath = path.join(import.meta.dirname, "..", "temp", "new-prompt.md");

// Read prompt file
let promptText = "";
try {
  promptText = fs.readFileSync(promptFilePath, "utf8");
} catch (err) {
  console.error("Error reading prompt file from temp/new-prompt.md:", err.message);
  process.exit(1);
}

// Fallback Mock data
const mockBatting = {
  "scouted_player": {
    "role": "Batter",
    "name": "Grassroots Prospect (Aliganj)",
    "player_style": "Right-hand bat"
  },
  "shot_or_delivery_name": {
    "technical": "Cover Drive",
    "colloquial": "Classic Drive"
  },
  "direction": "Covers",
  "dashboard_metrics": {
    "batting_scores": {
      "stance_and_balance": 88,
      "backlift_and_swing": 82,
      "footwork_and_execution": 85
    },
    "bowling_scores": {
      "run_up_and_stride": null,
      "release_arm_speed": null,
      "follow_through": null
    }
  },
  "biomechanics_impact": {
    "trigger_movement_or_stride": "Front foot forward stride, stable base",
    "head_alignment": "Stable",
    "contact_or_release_quality": "Sweet spot",
    "launch_or_release_angle": "Grounded",
    "confidence": 95
  },
  "delivery_data": {
    "length": "Good",
    "line": "Off",
    "deviation": "Straight",
    "confidence": 90
  },
  "outcome_stats": {
    "control_status": "In Control",
    "visible_result": "Boundary",
    "confidence": 90
  },
  "evaluation_and_feedback": {
    "quality_rating": "Good",
    "scouting_summary": "[DEMO MODE] Promising grassroots batter with exceptional balance and a high elbow during the cover drive. Stable head alignment spotted at local Lucknow maidans.",
    "outreach_pitch_hook": "[DEMO MODE] Elite cover drive execution and stable head alignment. Ready for UPCA academy trials.",
    "actionable_suggestion": "Continue keeping the front shoulder aligned towards the target and hold the follow-through pose longer.",
    "key_strengths": [
      "Stable head position at contact",
      "High front elbow lead direction",
      "Excellent weight transfer forward"
    ],
    "areas_to_improve": [
      "Backfoot heel could lift slightly earlier",
      "Follow-through extension pose duration"
    ]
  },
  "observations": [
    "Note: This is a simulated analysis because the GEMINI_API_KEY is not configured in your .env file. Add your key to enable real-time Gemini AI talent scouting."
  ]
};

const mockBowling = {
  "scouted_player": {
    "role": "Bowler",
    "name": "Grassroots Prospect (Rajajipuram)",
    "player_style": "Right-arm fast-medium"
  },
  "shot_or_delivery_name": {
    "technical": "Outswinger",
    "colloquial": "Banana Swing"
  },
  "direction": "Unknown",
  "dashboard_metrics": {
    "batting_scores": {
      "stance_and_balance": null,
      "backlift_and_swing": null,
      "footwork_and_execution": null
    },
    "bowling_scores": {
      "run_up_and_stride": 80,
      "release_arm_speed": 84,
      "follow_through": 78
    }
  },
  "biomechanics_impact": {
    "trigger_movement_or_stride": "High arm release action",
    "head_alignment": "Stable",
    "contact_or_release_quality": "Clean release",
    "launch_or_release_angle": "High Arm",
    "confidence": 90
  },
  "delivery_data": {
    "length": "Good",
    "line": "Off",
    "deviation": "Swing",
    "confidence": 95
  },
  "outcome_stats": {
    "control_status": "In Control",
    "visible_result": "Dot",
    "confidence": 85
  },
  "evaluation_and_feedback": {
    "quality_rating": "Good",
    "scouting_summary": "[DEMO MODE] Talented outswing bowler with excellent wrist release. Consistent seam presentation and stable front foot contact.",
    "outreach_pitch_hook": "[DEMO MODE] High-velocity outswing action with clean release mechanics spotted in local nets. Strong candidate for specialized coaching under UPCA.",
    "actionable_suggestion": "Work on the follow-through momentum to keep the chest facing forward longer after release.",
    "key_strengths": [
      "Consistent upright seam alignment",
      "Strong front-foot landing brace",
      "Expressive arm acceleration"
    ],
    "areas_to_improve": [
      "Keep non-bowling arm closer to body",
      "Smooth out run-up rhythm steps"
    ]
  },
  "observations": [
    "Note: This is a simulated analysis because the GEMINI_API_KEY is not configured in your .env file. Add your key to enable real-time Gemini AI talent scouting."
  ]
};

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isSample = (youtubeUrl && (youtubeUrl.includes("mixkit.co") || youtubeUrl.includes("mock-id"))) ||
                   (videoPath && (videoPath.includes("mixkit.co") || videoPath.includes("mock-id")));
  
  // If API Key is missing or this is a sample video, fallback to Demo Mode
  if (isSample || !apiKey || apiKey.trim() === "" || apiKey.includes("your_") || apiKey.includes("key_here")) {
    // Artificial delay to simulate actual analysis network roundtrip (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(JSON.stringify(analysisType === "bowling" ? mockBowling : mockBatting, null, 2));
    process.exit(0);
  }

  // Initialize Gemini client
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    let response;
    
    if (youtubeUrl) {
      // Analyze YouTube Link
      const contents = [
        {
          fileData: {
            mimeType: "video/mp4",
            fileUri: youtubeUrl,
          },
        },
        { text: promptText }
      ];

      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
      });

    } else if (videoPath) {
      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        console.error(`Error: Video file not found at ${videoPath}`);
        process.exit(1);
      }

      // Upload file via Google File API
      const uploadResult = await ai.files.upload({
        file: videoPath,
        config: { mimeType: "video/mp4" },
      });

      // Poll file state if necessary (File API upload can sometimes be in processing state)
      let fileState = uploadResult.state;
      let activeFile = uploadResult;
      while (fileState === "PROCESSING") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        activeFile = await ai.files.get({ name: uploadResult.name });
        fileState = activeFile.state;
        if (fileState === "FAILED") {
          throw new Error("File API upload processing failed.");
        }
      }

      // Generate content with loaded video
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: createUserContent([
          createPartFromUri(activeFile.uri, activeFile.mimeType),
          promptText,
        ]),
      });

      // Cleanup uploaded file from Google File storage after query
      try {
        await ai.files.delete({ name: uploadResult.name });
      } catch (delError) {
        console.warn("Failed to delete file from Google File API:", delError.message);
      }

    } else {
      console.error("Error: Neither video path nor youtube URL was provided.");
      process.exit(1);
    }

    // Process output and handle markdown JSON block wrapping
    let rawOutput = response.text || "";
    let cleanedOutput = rawOutput.trim();
    
    // Strip markdown JSON block ```json ... ``` wrapper if present
    if (cleanedOutput.startsWith("```json")) {
      cleanedOutput = cleanedOutput.substring(7);
    } else if (cleanedOutput.startsWith("```")) {
      cleanedOutput = cleanedOutput.substring(3);
    }
    
    if (cleanedOutput.endsWith("```")) {
      cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
    }
    
    cleanedOutput = cleanedOutput.trim();

    // Verify it is parseable JSON before outputting to ensure compliance
    try {
      const parsedJson = JSON.parse(cleanedOutput);
      console.log(JSON.stringify(parsedJson, null, 2));
    } catch (jsonErr) {
      // If parsing fails, wrap the raw response in a valid JSON structure or return raw text
      console.log(JSON.stringify({
        error: "Gemini returned invalid JSON structure",
        rawResponse: rawOutput
      }, null, 2));
    }

  } catch (error) {
    console.error("Gemini API calling error:", error.message);
    process.exit(1);
  }
}

run();
