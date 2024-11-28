# Bridge Solutions (Winner of Dotslash Hackathon 2024 under the track Grand Challenges) 
devpost result: https://devpost.com/software/bridge-ncgz7o

Bridge Solutions is a web platform that connects companies with professional curators for various tasks and projects. The platform facilitates efficient task management, submission reviews, and collaboration between companies and curators.

## Features

### For Companies

- Company dashboard with real-time statistics
- Task management and assignment
- Review and approve curator submissions
- Track completion rates and performance metrics
- Dark/light mode support

### For Curators

- Profile creation
- Task acceptance and submission
- Earning tracking and statistics
- Work history and portfolio building
- Dark/light mode support

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Template Engine**: EJS
- **Authentication**: Express Session

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bridge-solutions.git
cd dotslash1
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
dotslash1/
├── index.js              # Main application file
├── database.db           # SQLite database
├── views/               # EJS templates
│   ├── index.ejs        # Landing page
│   ├── get-started.ejs  # Registration options
│   ├── company-signup.ejs
│   ├── curator-signup.ejs
│   ├── company-dashboard.ejs
│   └── curator-dashboard.ejs
├── public/              # Static assets
└── package.json
```

## Routes

- `/` - Landing page
- `/get-started` - Registration options
- `/company-signup` - Company registration
- `/curator-signup` - Curator registration
- `/login` - Login page
- `/company-dashboard` - Company dashboard
- `/curator-dashboard` - Curator dashboard

## Acknowledgments

- Built with [Tailwind CSS](https://tailwindcss.com/)
