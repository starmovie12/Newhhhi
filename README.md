# GitHub Folder Uploader 🚀

A modern, fast, and intuitive web application to upload entire folders directly to your GitHub repository. Built with Next.js, React, and TypeScript with beautiful UI powered by Tailwind CSS and Framer Motion.

![GitHub Folder Uploader](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwind-css)

## Features ✨

- ✅ **Folder Upload**: Select any folder and upload all its contents recursively
- ✅ **Repository Management**: Create new repositories or upload to existing ones
- ✅ **Privacy Control**: Option to create private repositories
- ✅ **Progress Tracking**: Real-time upload progress with detailed logs
- ✅ **Target Path**: Optionally upload files to a specific folder path in your repo
- ✅ **Credentials Storage**: Safely store your credentials locally using browser storage
- ✅ **Beautiful UI**: Modern, dark-themed interface with smooth animations
- ✅ **Live Terminal Logs**: Real-time terminal-like logging of all operations
- ✅ **Error Handling**: Comprehensive error handling with helpful messages
- ✅ **Responsive Design**: Works seamlessly on desktop and tablet devices

## Prerequisites 📋

Before you start, you'll need:

- A GitHub account
- A Personal Access Token (PAT) from GitHub
- Node.js 16+ and npm/yarn

## Getting Started 🚀

### 1. Generate GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Select these scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
4. Generate and copy your token safely

### 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/github-folder-uploader.git
cd github-folder-uploader

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 3. Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
```

**Note**: This is only needed if you want to pre-populate the token. The app also accepts it via the UI.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Usage 📖

### Step-by-Step Guide

1. **Enter GitHub Credentials**
   - Paste your Personal Access Token
   - Enter your GitHub username

2. **Choose Repository Mode**
   - Select "Existing" to upload to an existing repository
   - Select "Create New" to create a new repository

3. **Configure Settings**
   - Enter repository name
   - (Optional) Make it private
   - (Optional) Specify a target path in the repository

4. **Select Folder**
   - Click the upload area or drag-and-drop
   - Choose the folder you want to upload

5. **Start Upload**
   - Click "Start Upload"
   - Watch the progress bar and live logs
   - Your files are being uploaded!

## Project Structure 📁

```
github-folder-uploader/
├── app/
│   ├── page.tsx           # Main component
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── lib/
│   └── utils.ts           # Utility functions
├── hooks/
│   └── use-mobile.ts      # Mobile detection hook
├── public/                # Static files
├── package.json           # Dependencies
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind configuration
└── README.md              # This file
```

## Technology Stack 🛠️

- **Framework**: Next.js 15
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **API**: GitHub REST API v3
- **Storage**: Browser LocalStorage for credentials

## Building for Production 🏗️

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Deployment 🌐

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Deploy!

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- Render
- Digital Ocean

## API Reference 📡

### GitHub API Endpoints Used

- `POST /user/repos` - Create a new repository
- `PUT /repos/{owner}/{repo}/contents/{path}` - Upload files

**Note**: All API calls require a valid GitHub Personal Access Token.

## Security Considerations 🔒

- Your token is stored in browser's LocalStorage
- Never commit your `.env.local` file
- Use a token with limited scope (only necessary permissions)
- Tokens are not sent anywhere except to GitHub API
- Clear your browser cache to remove stored credentials

## Troubleshooting 🐛

### "Repository already exists"
- Switch to "Existing Repository" mode
- Enter the correct repository name

### "Authentication failed"
- Verify your Personal Access Token is correct
- Check that your token hasn't expired
- Ensure you're using the right GitHub username

### "Failed to upload file"
- Check your internet connection
- Verify the file isn't too large (GitHub has size limits)
- Ensure you have write access to the repository

### Files not uploading
- Try uploading fewer files at a time
- Check browser console for detailed error messages
- Verify your GitHub token has `repo` scope

## Limitations ⚠️

- Single file size limit: 25 MB (GitHub API limit)
- Maximum repository size: 100 GB
- API rate limit: 5000 requests/hour with authenticated token
- Browser-based: Works best in modern browsers (Chrome, Firefox, Safari, Edge)

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

If you have any questions or run into issues:

1. Check the [Troubleshooting](#troubleshooting-) section
2. Open an issue on GitHub
3. Check existing issues for similar problems

## Roadmap 🗺️

Future enhancements planned:

- [ ] Batch upload with progress per file
- [ ] Support for .gitignore patterns
- [ ] Integration with GitHub Gists
- [ ] Support for multiple repository accounts
- [ ] Dark mode toggle
- [ ] File preview before upload
- [ ] GitHub Actions integration
- [ ] Command-line interface (CLI)

## Changelog 📝

### v1.0.0 (2026-02-22)
- Initial release
- Folder upload functionality
- Repository creation
- Real-time progress tracking
- Live terminal logs

## Credits 🙏

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)

## Disclaimer ⚠️

This tool uses the GitHub API to upload files. Ensure you have proper authorization and follow GitHub's terms of service. The developers are not responsible for any misuse of this tool.

---

**Happy Uploading!** 🎉

For more information and updates, visit the [GitHub Repository](https://github.com/yourusername/github-folder-uploader)
