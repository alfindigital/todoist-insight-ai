# Todoist Dashboard

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

A powerful dashboard for Todoist users that provides deep insights into task management and productivity patterns. Visualize your most productive days and times, track task completion trends over time, and gain insights into your focus areas. Built with Next.js, React, and Tailwind CSS.

## Features

- 🤖 AI Productivity Coach — personalized analysis & recommendations (powered by Claude)
- 📊 Comprehensive task analytics and insights
- 📈 Productivity scoring and trends
- 🔄 Recurring task tracking and habit analytics
- 🎯 Focus time recommendations
- 📈 Project distribution analysis
- 🖨️ Printable reports
- 🌙 Dark mode interface
- 📱 Responsive design

## Technology Stack

- **React** - A JavaScript library for building user interfaces
- **Next.js** - The React Framework for Production
- **TypeScript** - Typed superset of JavaScript
- **Tailwind CSS** - A utility-first CSS framework
- **NextAuth.js** - Authentication for Next.js
- **ECharts** - A powerful charting and visualization library
- **Anthropic Claude** - AI model powering the Productivity Coach

## Getting Started

### Prerequisites

- Node.js 18.x or later
- A Todoist account
- Todoist OAuth integration credentials

### Installation
1. Clone the repository:
```bash
git clone https://github.com/uncazzy/todoist-dashboard.git
cd todoist-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up OAuth and environment variables:

   a. Create a Todoist OAuth integration:
   - Go to [Todoist App Management Console](https://developer.todoist.com/appconsole.html)
   - Create a new app
   - Set your OAuth redirect URI to `http://localhost:3000/api/auth/callback/todoist` (for development)
   - Copy your Client ID and Client Secret

   b. Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Todoist OAuth
   TODOIST_CLIENT_ID=your-todoist-client-id
   TODOIST_CLIENT_SECRET=your-todoist-client-secret
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key

   # AI Productivity Coach — optional, enables the AI panel. Pick one provider:
   # FREE: Google Gemini — get a free key at https://aistudio.google.com/apikey
   GEMINI_API_KEY=your-gemini-api-key
   # or PAID: Anthropic Claude — https://console.anthropic.com
   # ANTHROPIC_API_KEY=your-anthropic-api-key
   ```
   Note: Generate a secure NEXTAUTH_SECRET using `openssl rand -base64 32` or another secure method. The AI coach is optional — without an AI key (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`) the dashboard still works and the AI panel simply shows a "not configured" message.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser and authenticate with your Todoist account.

## Contributing

Contributions to Todoist Dashboard are welcome! Whether it's reporting a bug, suggesting an enhancement, or submitting a code change, your help is appreciated.

Please check out [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions on how to get started.

### Test Data

For development and testing purposes, this project includes test data generators in the `/test` directory. 
Currently available generators:
- `generate_recurring_tasks.py`: Generate test data for recurring tasks with various patterns

See [test/README.md](test/README.md) for detailed usage instructions and examples.

### Development Guidelines

- Follow the existing code style and conventions
- Keep code clean and maintainable
- Update documentation as needed
- Keep commits atomic and well-described

## AI Productivity Coach

The dashboard includes an **AI Productivity Coach** that reads a compact summary of your Todoist activity and writes a short, personalized analysis with concrete recommendations. It runs **only when you click "Analyze with AI"** — so it never costs anything in the background.

It supports two AI providers — choose whichever you prefer:

- **Google Gemini (free)** — runs on Google AI Studio's free tier, so the coach costs nothing. _Recommended if you want it free._
- **Anthropic Claude (paid)** — typically the highest-quality analysis, billed per use (a fraction of a cent per click).

### Setup (free — Gemini)

1. Create a **free** API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to your `.env.local`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   # Optional model override (default: gemini-2.5-flash)
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Restart the dev server. The AI panel appears near the top of the dashboard.

### Setup (paid — Claude)

1. Create an API key at the [Anthropic Console](https://console.anthropic.com) → **API Keys**.
2. Add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) to your `.env.local`.

If **both** keys are set, Gemini is used by default; set `AI_PROVIDER=anthropic` to force Claude. If **neither** is set, the dashboard still works normally — the AI panel just shows a "not configured" message.

### Cost & privacy

- The coach runs only on click — a single API call per analysis. With Gemini's free tier this is free (subject to Google's daily limits); with Claude it's typically a fraction of a cent.
- Only an **aggregated summary** (counts, rates, top projects, and a small sample of task titles) is sent to the AI — **not** your full task history. The API key stays server-side and is never exposed to the browser.
- ⚠️ **Free-tier privacy note:** Google may use **free-tier** Gemini API prompts to improve its models (Anthropic and Google's paid/Vertex tiers do not train on your prompts). If that matters for your task titles, use Claude or a paid Gemini tier instead.

## Privacy

Todoist Dashboard respects your privacy. It accesses your Todoist data only with your explicit permission and does not store any personal data or task information beyond the active session. See the [Privacy Policy](https://todoist.azzy.cloud/legal) for more details.

## Security

If you discover any security vulnerabilities, please report them directly to [todoist-dashboard@azzy.cloud](mailto:todoist-dashboard@azzy.cloud). Your efforts in making the project more secure are greatly appreciated.

## Disclaimer

Todoist Dashboard is an independent project and is not affiliated with, sponsored by, or endorsed by Todoist or Doist. Todoist is a trademark of Doist.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software in accordance with the terms of the license. See the [LICENSE](LICENSE) file for details.