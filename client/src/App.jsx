import { useEffect, useState } from "react";
import "./App.css";
import PublicProject from "./PublicProject";
import ReactMarkdown from "react-markdown";

import {
  getProjectFiles,
  getFileContent,
  uploadProjectFile,
  downloadProjectFile,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  loginUser,
  registerUser,
  getMyProjects,
  createProject,
  addProjectMember,
  generateAIResponse,
  explainContent,
  shareProject,
} from "./api";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("collabsphere_token") || ""
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("collabsphere_user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);


  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");


  const [shareLink, setShareLink] = useState("");


  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const data = isRegister
        ? await registerUser({ name, email, password })
        : await loginUser({ email, password });

      const authToken = data.token;
      const authUser = data.user;

      if (!authToken || !authUser) {
        throw new Error("Authentication response is incomplete.");
      }

      console.log("Authentication response:", data);

      localStorage.setItem("collabsphere_token", authToken);
      localStorage.setItem(
        "collabsphere_user",
        JSON.stringify(authUser)
      );

      setToken(authToken);
      setUser(authUser);
      setPassword("");
      setMessage(
        isRegister
          ? "Registration successful!"
          : "Login successful!"
      );
    } catch (error) {
      setMessage(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("collabsphere_token");
    localStorage.removeItem("collabsphere_user");

    setToken("");
    setUser(null);
    setProjects([]);
    setProjectId("");
    setFiles([]);
    setNotes([]);
    setShareLink("");
    setMessage("Logged out successfully.");
  }


  async function loadProjects(authToken = token) {
    if (!authToken) return;

    try {
      setLoading(true);
      setMessage("");

      const data = await getMyProjects(authToken);
      const projectList = Array.isArray(data)
        ? data
        : data.projects || [];

      setProjects(projectList);
      console.log("Loaded projects:", projectList);
      console.log("Logged-in user:", JSON.parse(localStorage.getItem("collabsphere_user")));

      setProjectId((currentId) => {
        if (projectList.some((project) => project._id === currentId)) {
          return currentId;
        }

        return projectList[0]?._id || "";
      });

      if (projectList.length === 0) {
        setMessage("No projects found. Create your first project.");
      }
    } catch (error) {
      setMessage(error.message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (token) {
      loadProjects(token);
    }
  }, [token]);


  async function handleCreateProject(event) {
    event.preventDefault();

    if (!projectTitle.trim()) {
      setMessage("Please enter a project title.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = await createProject(
        {
          title: projectTitle.trim(),
          description: projectDescription.trim(),
        },
        token
      );

      const newProject = data.project || data;

      setProjectTitle("");
      setProjectDescription("");

      const updatedProjects = await getMyProjects(token);
      const projectList = Array.isArray(updatedProjects)
        ? updatedProjects
        : updatedProjects.projects || [];

      setProjects(projectList);
      setProjectId(newProject._id || projectList[0]?._id || "");
      setShareLink("");

      setMessage("Project created successfully!");
    } catch (error) {
      setMessage(error.message || "Could not create project.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();

    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    if (!memberEmail.trim()) {
      setMessage("Please enter the member's email.");
      return;
    }

    try {
      setMemberLoading(true);
      setMessage("");

      const data = await addProjectMember(
        projectId,
        memberEmail.trim(),
        token
      );

      setMessage(data.message || "Collaborator added successfully!");
      setMemberEmail("");

      await loadProjects(token);

    } catch (error) {
      setMessage(error.message || "Could not add collaborator.");
    } finally {
      setMemberLoading(false);
    }
  }


  function handleProjectChange(newProjectId) {
    setProjectId(newProjectId);
    setFiles([]);
    setNotes([]);
    setShareLink("");
    setMessage("");
  }

  async function handleShareProject() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = await shareProject(projectId, token);

      if (!data.shareToken) {
        throw new Error("The server did not return a share token.");
      }

      const link =
        `${window.location.origin}/public/${data.shareToken}`;

      setShareLink(link);
      setMessage("Project sharing enabled!");
    } catch (error) {
      setMessage(error.message || "Could not share project.");
    } finally {
      setLoading(false);
    }
  }


  async function handleCopyShareLink() {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setMessage("Share link copied!");
    } catch {
      setMessage(
        "Copy failed. Select the link and copy it manually."
      );
    }
  }



  async function loadFiles() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = await getProjectFiles(projectId, token);
      setFiles(Array.isArray(data) ? data : data.files || []);
    } catch (error) {
      setMessage(error.message || "Could not load files.");
    } finally {
      setLoading(false);
    }
  }


  async function handleUploadFile(event) {
    event.preventDefault();

    if (!projectId || !selectedFile) {
      setMessage("Select a project and a file first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("projectId", projectId);

      await uploadProjectFile(projectId, selectedFile, token);

      setSelectedFile(null);
      await loadFiles();
      setMessage("File uploaded successfully!");
    } catch (error) {
      setMessage(error.message || "File upload failed.");
    } finally {
      setLoading(false);
    }
  }


  async function handleDownloadFile(fileId) {
    try {
      setLoading(true);
      setMessage("");

      await downloadProjectFile(fileId, token);

      setMessage("Download requested.");
    } catch (error) {
      setMessage(error.message || "File download failed.");
    } finally {
      setLoading(false);
    }
  }


  async function handleExplainCode(fileId) {
    try {
      setLoading(true);
      setMessage("");
      setAiResponse("");

      const fileData = await getFileContent(fileId, token);

      const result = await explainContent(
        `Explain this code file named "${fileData.fileName}" in simple English. Explain its purpose, important functions, and how it works. Do not execute the code.\n\n${fileData.content}`,
        token
      );

      setAiResponse(result || "No explanation returned.");
      console.log("Complete AI Response:", result);
    } catch (error) {
      setMessage(error.message || "Could not explain this code.");
    } finally {
      setLoading(false);
    }
  }


  async function loadNotes() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = await getProjectNotes(projectId, token);
      setNotes(Array.isArray(data) ? data : data.notes || []);
    } catch (error) {
      setMessage(error.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  }


  async function handleSaveNote(event) {
    event.preventDefault();

    if (!projectId || !noteTitle.trim() || !noteContent.trim()) {
      setMessage("Enter both a note title and content.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const noteData = {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        projectId,
      };

      if (editingNoteId) {
        await updateProjectNote(editingNoteId, noteData, token);
        setMessage("Note updated successfully!");
      } else {
        await createProjectNote(noteData, token);
        setMessage("Note created successfully!");
      }

      setNoteTitle("");
      setNoteContent("");
      setEditingNoteId(null);

      const data = await getProjectNotes(projectId, token);
      setNotes(Array.isArray(data) ? data : data.notes || []);
    } catch (error) {
      setMessage(error.message || "Could not save note.");
    } finally {
      setLoading(false);
    }
  }


  function handleEditNote(note) {
    setEditingNoteId(note._id);
    setNoteTitle(note.title || "");
    setNoteContent(note.content || "");
  }


  async function handleDeleteNote(noteId) {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await deleteProjectNote(noteId, token);

      const data = await getProjectNotes(projectId, token);
      setNotes(Array.isArray(data) ? data : data.notes || []);

      setMessage("Note deleted successfully!");
    } catch (error) {
      setMessage(error.message || "Could not delete note.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAIRequest(event) {
    event.preventDefault();

    if (!aiPrompt.trim()) {
      setMessage("Enter a prompt for the AI assistant.");
      return;
    }

    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAiResponse("");

      const data = await generateAIResponse(
        {
          action: "chat",
          content: aiPrompt.trim()
        },
        token
      );

      setAiResponse(
        data.response || data.text || "No response returned."
      );
    } catch (error) {
      setMessage(error.message || "AI request failed.");
    } finally {
      setLoading(false);
    }
  }




  if (!token || !user) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="brand-text">
            <h2>
              CollabSphere<span className="brand-dot">.</span>
            </h2>
            <p>BUILD TOGETHER. GROW TOGETHER.</p>
          </div>
        </nav>

        <main className="container">
          <section className="upload-panel">
            <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>

            <form onSubmit={handleAuth}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Register"
                    : "Login"}
              </button>
            </form>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setIsRegister(!isRegister);
                setMessage("");
              }}
            >
              {isRegister
                ? "Already have an account? Login"
                : "New here? Create an account"}
            </button>

            {message && <p role="status">{message}</p>}
          </section>
        </main>
      </div>
    );
  }


  async function handleExplainNote(note, action) {
    try {
      setLoading(true);
      setMessage("");
      setAiResponse("");

      const prompt =
        action === "improve"
          ? `Suggest improvements for this note. Give practical suggestions in simple English:\n\nTitle: ${note.title}\nContent: ${note.content}`
          : `Explain this note in simple English:\n\nTitle: ${note.title}\nContent: ${note.content}`;

      const result = await explainContent(prompt, token);
      setAiResponse(result || "No response returned.");
    } catch (error) {
      setMessage(error.message || "Could not process note with AI.");
    } finally {
      setLoading(false);
    }
  }



  // Main dashboard
  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand-text">
          <h2>
            CollabSphere<span className="brand-dot">.</span>
          </h2>
          <p>BUILD TOGETHER. GROW TOGETHER.</p>
        </div>

        <div>
          <span>{user.name || user.email}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="container">
        {message && <p role="status">{message}</p>}

        {/* Create project */}
        <section className="upload-panel">
          <h2>Create Project</h2>

          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              placeholder="Project title"
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
              required
            />

            <textarea
              placeholder="Project description"
              value={projectDescription}
              onChange={(event) =>
                setProjectDescription(event.target.value)
              }
            />

            <button type="submit" disabled={loading}>
              Create Project
            </button>
          </form>
        </section>

        {/* Select and share project */}
        <section className="upload-panel">
          <h2>Select Your Project</h2>

          <select
            value={projectId}
            onChange={(event) => handleProjectChange(event.target.value)}
            disabled={loading || projects.length === 0}
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))
            )}
          </select>

          <div className="action-row">
            <button
              type="button"
              disabled={loading || !projectId}
              onClick={handleShareProject}
            >
              Share Project
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => loadProjects(token)}
            >
              Refresh Projects
            </button>
          </div>




          {/* Add Project Member */}
          <form onSubmit={handleAddMember}>
            <input
              type="email"
              placeholder="Collaborator's registered email"
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              required
            />

            <button
              type="submit"
              disabled={memberLoading || !projectId}
            >
              {memberLoading ? "Adding..." : "Add Member"}
            </button>
          </form>

          {/* Project Members List */}
          <div className="members-list">
            <h3>Project Members</h3>

            {(() => {
              const selectedProject = projects.find(
                (project) => project._id === projectId
              );

              const members = selectedProject?.members || [];
              console.log("Project members:", members);

              if (members.length === 0) {
                return <p>No members added yet.</p>;
              }

              return members.map((member) => (
                <div key={member._id || member} className="member-item">
                  <p>{member.name || "Project Member"}</p>
                  {member.email && <p>{member.email}</p>}
                </div>
              ));
            })()}
          </div>

          {/* Public Share Link */}
          {shareLink && (
            <div>
              <label htmlFor="public-share-link">Public share link</label>
              <input
                id="public-share-link"
                value={shareLink}
                readOnly
                onFocus={(event) => event.target.select()}
              />

              <button type="button" onClick={handleCopyShareLink}>
                Copy Link
              </button>
            </div>
          )}

          <div className="action-row">
            <button
              type="button"
              disabled={loading || !projectId}
              onClick={loadFiles}
            >
              Load Files
            </button>

            <button
              type="button"
              disabled={loading || !projectId}
              onClick={loadNotes}
            >
              Load Notes
            </button>
          </div>
        </section>

        {/* File upload */}
        <section className="upload-panel">
          <h2>Project Files</h2>

          <form onSubmit={handleUploadFile}>
            <input
              type="file"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] || null)
              }
              required
            />

            <button
              type="submit"
              disabled={loading || !projectId || !selectedFile}
            >
              Upload File
            </button>
          </form>


          {files.length === 0 ? (
            <p className="empty-message">No files uploaded yet.</p>
          ) : (
            files.map((file) => {
              const fileName =
                file.originalName ||
                file.filename ||
                file.fileName ||
                file.name ||
                "Untitled file";

              const fileId = file._id || file.id;

              return (
                <div key={fileId} className="action-row file-row">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{fileName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(fileId)}
                    disabled={loading || !fileId}
                  >
                    Download
                  </button>


                  <button
                    type="button"
                    onClick={() => handleExplainCode(fileId)}
                    disabled={loading || !fileId}
                  >
                    Explain This Code
                  </button>
                </div>
              );
            })
          )}
        </section>


        {/* Notes create and edit */}
        <section className="upload-panel">
          <h2>{editingNoteId ? "Edit Note" : "Project Notes"}</h2>

          <form onSubmit={handleSaveNote}>
            <input
              type="text"
              placeholder="Note title"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              required
            />

            <textarea
              placeholder="Write your note..."
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              required
            />

            <button type="submit" disabled={loading || !projectId}>
              {editingNoteId ? "Update Note" : "Create Note"}
            </button>

            {editingNoteId && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteTitle("");
                  setNoteContent("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>

          {notes.map((note) => (
            <article key={note._id}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>

              <div className="action-row">
                <button
                  type="button"
                  onClick={() => handleEditNote(note)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDeleteNote(note._id)}
                >
                  Delete
                </button>


                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExplainNote(note, "explain")}
                >
                  Explain This Note
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExplainNote(note, "improve")}
                >
                  Suggest Improvements
                </button>




              </div>
            </article>
          ))}
        </section>

        {/* AI assistant */}
        <section className="upload-panel">
          <h2>AI Assistant</h2>

          <form onSubmit={handleAIRequest}>
            <textarea
              placeholder="Ask AI something about your project..."
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate AI Response"}
            </button>
          </form>

          {loading && <p>AI is thinking... Please wait.</p>}
          {aiResponse && (
            <div>
              <h3>AI Response</h3>
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
              <button type="button" onClick={() => setAiResponse("")}>
                Clear Response
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}


function AppWrapper() {
  if (window.location.pathname.startsWith("/public/")) {
    return <PublicProject />;
  }

  return <App />;
}

export default AppWrapper;
