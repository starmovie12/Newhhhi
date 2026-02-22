"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Github, 
  Upload, 
  Folder, 
  File, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Terminal as TerminalIcon,
  ChevronRight,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Interface for File Log Entry
 */
interface LogEntry {
  id: string;
  path: string;
  status: "pending" | "success" | "error";
  message?: string;
  timestamp: string;
}

/**
 * Interface for Selected File
 */
interface SelectedFile {
  file: File;
  relativePath: string;
}

export default function GitHubFolderUploader() {
  // --- State Management ---
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [repo, setRepo] = useState("");
  const [repoMode, setRepoMode] = useState<"existing" | "create">("existing");
  const [isPrivate, setIsPrivate] = useState(false);
  const [targetPath, setTargetPath] = useState("");
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Load credentials from LocalStorage on mount ---
  useEffect(() => {
    const savedToken = localStorage.getItem("gitfolder_token");
    const savedUsername = localStorage.getItem("gitfolder_username");
    if (savedToken) setToken(savedToken);
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // --- Save credentials to LocalStorage when they change ---
  useEffect(() => {
    if (token) localStorage.setItem("gitfolder_token", token);
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem("gitfolder_username", username);
  }, [username]);

  // --- Auto-scroll terminal to bottom ---
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  /**
   * Helper to convert File to Base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Helper to create a new repository
   */
  const createRepository = async () => {
    const logId = Math.random().toString(36).substring(7);
    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        path: `Creating repository: ${repo}`,
        status: "pending",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repo,
          private: isPrivate,
          auto_init: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === logId
              ? {
                  ...log,
                  status: "success",
                  path: `✅ Repository '${repo}' created successfully!`,
                }
              : log
          )
        );
        return true;
      } else {
        if (data.message?.includes("already exists")) {
          throw new Error("Repository already exists. Switch to 'Existing Repository'.");
        }
        throw new Error(data.message || "Failed to create repository");
      }
    } catch (err: any) {
      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, status: "error", message: err.message }
            : log
        )
      );
      return false;
    }
  };

  /**
   * Sanitize file paths
   */
  const sanitizeFilePath = (path: string): string => {
    let decodedPath = decodeURIComponent(path);
    decodedPath = decodedPath.replace(/\\/g, "/");

    if (decodedPath.includes(":")) {
      decodedPath = decodedPath.substring(decodedPath.lastIndexOf(":") + 1);
    }

    decodedPath = decodedPath.replace(/^\/+|\/+$/g, "");
    let segments = decodedPath.split("/");

    const systemFolders = [
      "tree", "document", "primary", "home", "storage", 
      "emulated", "0", "myfiles", "documents", "download",
      "raw", "msf", "external"
    ];
    
    while (segments.length > 1) {
      const first = segments[0].toLowerCase();
      if (systemFolders.includes(first) || /^\d+$/.test(first)) {
        segments.shift();
      } else {
        break;
      }
    }

    if (segments.length > 1) {
      segments.shift();
    }

    return segments.join("/");
  };

  /**
   * Handle folder selection
   */
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.currentTarget.files;
    if (!selectedFiles) return;

    const fileArray: SelectedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const webkitRelativePath = (file as any).webkitRelativePath || file.name;
      const relativePath = sanitizeFilePath(webkitRelativePath);
      
      fileArray.push({
        file,
        relativePath,
      });
    }

    setFiles(fileArray);
    setError(null);
  };

  /**
   * Main upload function
   */
  const startUpload = async () => {
    if (!token || !username || !repo) {
      setError("Please fill in all GitHub details");
      return;
    }

    if (files.length === 0) {
      setError("Please select a folder");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setLogs([]);
    setSuccessCount(0);
    setShowSuccess(false);
    setError(null);

    try {
      // Create repository if needed
      if (repoMode === "create") {
        const created = await createRepository();
        if (!created) {
          throw new Error("Failed to create repository");
        }
      }

      // Upload files
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const { file, relativePath } = files[i];
        const logId = Math.random().toString(36).substring(7);
        const filePath = targetPath ? `${targetPath}/${relativePath}` : relativePath;

        setLogs((prev) => [
          ...prev,
          {
            id: logId,
            path: filePath,
            status: "pending",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        try {
          const base64Content = await fileToBase64(file);

          const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
            {
              method: "PUT",
              headers: {
                Authorization: `token ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: `Upload ${file.name}`,
                content: base64Content,
                branch: "main",
              }),
            }
          );

          if (response.ok) {
            uploadedCount++;
            setLogs((prev) =>
              prev.map((log) =>
                log.id === logId
                  ? { ...log, status: "success" }
                  : log
              )
            );
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Upload failed");
          }
        } catch (err: any) {
          setLogs((prev) =>
            prev.map((log) =>
              log.id === logId
                ? { ...log, status: "error", message: err.message }
                : log
            )
          );
        }

        const newProgress = Math.round(((i + 1) / files.length) * 100);
        setProgress(newProgress);
      }

      setSuccessCount(uploadedCount);
      if (uploadedCount === files.length) {
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-blue-950 to-zinc-950 py-8 px-4">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Github className="w-4 h-4" />
            <span className="text-sm font-medium text-zinc-300">GitHub Folder Uploader</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Upload Folders to GitHub
          </h1>
          <p className="text-lg text-zinc-400">
            Select a folder and upload its entire contents to your GitHub repository
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* GitHub Credentials Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">GitHub Credentials</h2>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-300 mb-2 block">Personal Access Token</span>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Get token from github.com/settings/tokens</p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-300 mb-2 block">GitHub Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </label>
              </div>
            </motion.div>

            {/* Repository Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl space-y-4"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-400" />
                Repository Settings
              </h2>

              <div className="flex gap-2">
                {(["existing", "create"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRepoMode(mode)}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm",
                      repoMode === mode
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                    )}
                  >
                    {mode === "existing" ? "Existing" : "Create New"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-sm font-medium text-zinc-300 mb-2 block">Repository Name</span>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="my-project"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </label>

              {repoMode === "create" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-sm text-zinc-400">Make repository private</span>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-zinc-300 mb-2 block">Target Path (Optional)</span>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="src/components"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1">Files will be placed in this folder in the repo</p>
              </label>
            </motion.div>

            {/* Folder Selection Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl space-y-4"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Select Folder
              </h2>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-indigo-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-zinc-800/20 hover:bg-indigo-500/5"
              >
                <Upload className="w-10 h-10 text-zinc-600 mb-4 group-hover:text-indigo-400 transition-colors" />
                <p className="text-sm text-zinc-400 font-medium">Click to select a folder</p>
                <p className="text-xs text-zinc-600 mt-1">All subdirectories will be included</p>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFolderSelect}
                  className="hidden"
                  // @ts-ignore - webkitdirectory is non-standard but widely supported
                  webkitdirectory=""
                  directory=""
                  multiple
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">{files.length} files detected</span>
                  </div>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </motion.div>

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              disabled={isUploading || files.length === 0}
              onClick={startUpload}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3",
                isUploading || files.length === 0
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98]"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  Start Upload
                </>
              )}
            </motion.button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Progress & Logs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Progress Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-semibold">Upload Progress</h2>
                </div>
                <span className="text-sm font-mono text-indigo-400">{progress}%</span>
              </div>

              <div className="space-y-4">
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  <span>{successCount} of {files.length} files uploaded</span>
                  <span>{Math.max(0, files.length - successCount - (isUploading ? 1 : 0))} remaining</span>
                </div>
              </div>

              {/* Success Section */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center gap-4"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Upload Completed Successfully!</span>
                    </div>
                    <a
                      href={`https://github.com/${username}/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                      <Github className="w-4 h-4" />
                      Open in GitHub
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Terminal Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col h-[500px] rounded-2xl bg-black border border-zinc-800 overflow-hidden shadow-2xl"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-bottom border-zinc-800">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-mono text-zinc-400">Live Log Terminal</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                </div>
              </div>

              {/* Terminal Body */}
              <div 
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-[13px] space-y-2 scrollbar-thin scrollbar-thumb-zinc-800"
              >
                {logs.length === 0 && !isUploading && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2">
                    <TerminalIcon className="w-8 h-8 opacity-20" />
                    <p>Waiting for upload to start...</p>
                  </div>
                )}
                
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {log.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                          {log.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {log.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          
                          <span className={cn(
                            "truncate",
                            log.status === "pending" && "text-indigo-400",
                            log.status === "success" && "text-zinc-300",
                            log.status === "error" && "text-red-400"
                          )}>
                            {log.status === "pending" ? "Pending" : log.status === "success" ? "Success" : "Error"}
                          </span>
                          
                          <ChevronRight className="w-3 h-3 text-zinc-700" />
                          <span className="text-zinc-500 truncate">{log.path}</span>
                        </div>
                        {log.message && (
                          <p className="text-red-500/70 text-xs mt-1 ml-5 border-l border-red-500/20 pl-2">
                            {log.message}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center border-t border-zinc-900 mt-12">
        <p className="text-zinc-600 text-sm">
          Built for developers who value speed. GitHub API v3.
        </p>
      </footer>
    </div>
  );
}

// Simple shield icon component
function ShieldCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
