# Gully Vision

AI-powered cricket talent scouting for grassroots players. Upload a batting, bowling, or fielding video — get a professional biomechanical scouting report and send it directly to selectors.

Built for Lucknow's cricket community, from the maidans of Aliganj and Rajajipuram to the Ekana Stadium pathway.

---

## What It Does

1. **Upload** a local video (MP4/MOV/MKV, up to 50MB) or paste a YouTube URL
2. **Analyze** — Google Gemini AI breaks down technique, biomechanics, and performance scores across batting, bowling, or fielding
3. **Scout** — view a structured report with metric scores (0–100), strengths, areas to improve, and a ready-to-send outreach pitch
4. **Reach Out** — email the report directly to UPCA selectors or local cricket academies from within the app

---

## Features

- Multi-role analysis: Batting, Bowling, Fielding
- Biomechanical breakdown: stance, backlift, footwork, run-up, release arm, follow-through, throwing accuracy, and more
- Technique naming (technical + colloquial)
- Scouting verdict and outreach pitch hook auto-generated
- Live leaderboard of top players ranked by overall score
- Demo mode — fully functional with mock data if no API key is configured
- Responsive, mobile-first UI (dark glassmorphic design)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Backend | PHP 7.4+ |
| AI | Google Gemini API via Node.js CLI bridge |
| Database | PostgreSQL |
| Email | PHP mail() |

---

## Setup

### Prerequisites

- PHP 7.4+
- Node.js 18+
- PostgreSQL 12+ on localhost:5432
- Google AI Studio API key

### 1. Clone & Install

```bash
git clone https://github.com/nippunrana/gully-vision.git
cd gully-vision
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

Without a key, the app runs in demo mode using realistic mock cricket analysis data.

### 3. Set Up the Database

```sql
CREATE DATABASE gullyvision;
CREATE USER gullyvision_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE gullyvision TO gullyvision_user;
```

Connect to the `gullyvision` database and run:

```sql
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255),
  role VARCHAR(50),
  overall_score INT,
  total_score INT,
  technique_name VARCHAR(255),
  verdict TEXT,
  raw_analysis TEXT,
  scouted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Update the database credentials in `api/leaderboard.php` and `api/analyze.php` to match.

### 4. Configure PHP

In `php.ini`:

```ini
upload_max_filesize = 50M
post_max_size = 50M
```

### 5. Run

```bash
php -S localhost:8000
```

Open `http://localhost:8000` in your browser. For production, point an Apache or Nginx virtual host at the project root.

---

## Project Structure

```
gully-vision/
├── index.html              # Single-page app shell
├── css/
│   └── style.css           # Design system (dark glassmorphic theme)
├── js/
│   ├── main.js             # UI state, video upload, modals, leaderboard, email template
│   └── api.js              # Fetch wrapper for PHP APIs
├── api/
│   ├── analyze.php         # File upload handling, Node bridge, DB writes
│   ├── analyze.js          # Gemini AI integration, JSON parsing, mock fallbacks
│   ├── leaderboard.php     # Leaderboard queries
│   ├── send-outreach.php   # Email dispatch
│   └── uploads/            # Temp video storage (auto-cleaned after analysis)
└── .env                    # GEMINI_API_KEY (git-ignored)
```

---

## How Analysis Works

```
Browser → analyze.php → Node CLI (analyze.js) → Gemini API
                                                       |
                                              JSON scouting report
                                                       |
                             leaderboard table ← analyze.php → browser dashboard
```

The PHP layer handles file validation and temp storage. Node runs the Gemini multimodal prompt and returns structured JSON. PHP persists the result to PostgreSQL and sends the response back to the frontend.

---

## License

MIT
