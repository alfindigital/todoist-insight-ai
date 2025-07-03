# Todoist Dashboard

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

A powerful dashboard for Todoist users that provides deep insights into task management and productivity patterns. Visualize your most productive days and times, track task completion trends over time, and gain insights into your focus areas. Built with Next.js, React, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Insights** - Intelligent analysis and recommendations powered by Google Gemini
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
   
   # Gemini AI Integration
   GEMINI_API_KEY=your-gemini-api-key
   ```
   Note: 
   - Generate a secure NEXTAUTH_SECRET using `openssl rand -base64 32` or another secure method
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser and authenticate with your Todoist account.

## AI Insights Setup

The dashboard now includes AI-powered insights using Google Gemini. For detailed setup instructions and usage guide in Indonesian, see [AI_INSIGHTS_GUIDE.md](AI_INSIGHTS_GUIDE.md).

Quick setup:
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add `GEMINI_API_KEY=your-api-key` to your `.env.local` file
3. Restart the application

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

## Privacy

Todoist Dashboard respects your privacy. It accesses your Todoist data only with your explicit permission and does not store any personal data or task information beyond the active session. See the [Privacy Policy](https://todoist.azzy.cloud/legal) for more details.

## Security

If you discover any security vulnerabilities, please report them directly to [todoist-dashboard@azzy.cloud](mailto:todoist-dashboard@azzy.cloud). Your efforts in making the project more secure are greatly appreciated.

## Disclaimer

Todoist Dashboard is an independent project and is not affiliated with, sponsored by, or endorsed by Todoist or Doist. Todoist is a trademark of Doist.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software in accordance with the terms of the license. See the [LICENSE](LICENSE) file for details.