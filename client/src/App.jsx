import { useEffect, useState } from "react";
import "./App.css";
import {
  getProjectFiles,
  uploadProjectFile,
  downloadProjectFile,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  loginUser,
  registerUser,
  getMyProjects,
} from "./api";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("collabsphere_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("collabsphere_user") || "null");
    } catch {
      return null;
    }
  });

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      loadProjects(token);
    }
  }, []);

  async function loadProjects(authToken) {
    try {
      setLoading(true);

      const data = await getMyProjects(authToken);
      setProjects(data);

      if (data.length > 0) {
        setProjectId((currentId) =>
          data.some((project) => project._id === currentId)
            ? currentId
            : data[0]._id
        );
        setMessage(`${data.length} project(s) loaded.`);
      } else {
        setProjectId("");
        setFiles([]);
        setNotes([]);
        setMessage("No projects found. Create a project first.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      if (isRegister) {
        await registerUser(name.trim(), email.trim(), password);
        setIsRegister(false);
        setName("");
        setPassword("");
        setMessage("Registration successful! Please log in.");
      } else {
        const data = await loginUser(email.trim(), password);

        localStorage.setItem("collabsphere_token", data.token);
        localStorage.setItem("collabsphere_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);
        setPassword("");

        await loadProjects(data.token);
      }
    } catch (error) {
      setMessage(error.message);
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
    setSelectedFile(null);
    setTitle("");
    setContent("");
    setEditingNoteId(null);
    setMessage("You have logged out.");
  }

  async function loadFiles() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    try {
      setLoading(true);
      const data = await getProjectFiles(projectId, token);
      setFiles(data);
      setMessage(`${data.length} file(s) found.`);
    } catch (error) {
      setMessage(error.message);
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
      const data = await getProjectNotes(projectId, token);
      setNotes(data);
      setMessage(`${data.length} note(s) found.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProjectChange(value) {
    setProjectId(value);
    setFiles([]);
    setNotes([]);
    setEditingNoteId(null);
    setTitle("");
    setContent("");

    if (!value) return;

    try {
      setLoading(true);

      const [fileData, noteData] = await Promise.all([
        getProjectFiles(value, token),
        getProjectNotes(value, token),
      ]);

      setFiles(fileData);
      setNotes(noteData);
      setMessage("Project files and notes loaded.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    if (!selectedFile) {
      setMessage("Please select a file.");
      return;
    }

    try {
      setLoading(true);

      await uploadProjectFile(projectId, selectedFile, token);

      setSelectedFile(null);

      const input = document.getElementById("fileInput");
      if (input) input.value = "";

      const data = await getProjectFiles(projectId, token);
      setFiles(data);
      setMessage("File uploaded successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(file) {
    try {
      await downloadProjectFile(file._id, token, file.fileName);
      setMessage("Download started.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSaveNote() {
    if (!projectId) {
      setMessage("Please select a project first.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a note title.");
      return;
    }

    const wasEditing = Boolean(editingNoteId);

    try {
      setLoading(true);

      if (wasEditing) {
        await updateProjectNote(editingNoteId, title.trim(), content, token);
      } else {
        await createProjectNote(projectId, title.trim(), content, token);
      }

      setTitle("");
      setContent("");
      setEditingNoteId(null);

      const data = await getProjectNotes(projectId, token);
      setNotes(data);
      setMessage(wasEditing ? "Note updated successfully!" : "Note created successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEditNote(note) {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setContent(note.content || "");
    setMessage("Edit your note and save the changes.");
  }

  async function handleDeleteNote(noteId) {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setLoading(true);

      await deleteProjectNote(noteId, token);

      const data = await getProjectNotes(projectId, token);
      setNotes(data);
      setMessage("Note deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setMessage("");
  }

  if (!token || !user) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="brand">
           
            <div className="brand-text">
              <h2>
                CollabSphere<span className="brand-dot">.</span>
              </h2>
              <p>BUILD TOGETHER. GROW TOGETHER.</p>
            </div>
          </div>
          <div className="navbar-center">
            Developer Collaboration Platform
          </div>
        </nav>

        <main className="container">
          <section className="upload-panel">
            <h1>{isRegister ? "Create Your Account" : "Welcome Back"}</h1>
            <p>
              {isRegister
                ? "Register to start collaborating."
                : "Log in to access your project workspace."}
            </p>

            <form onSubmit={handleAuth}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Your name"
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
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            <p>
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setMessage("");
                }}
              >
                {isRegister ? "Login" : "Register"}
              </button>
            </p>

            {message && <p className="message">{message}</p>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div className="brand-text">
            <h2>
              CollabSphere<span className="brand-dot">.</span>
            </h2>
            <p>BUILD TOGETHER. GROW TOGETHER.</p>
          </div>
        </div>

        <div className="navbar-center">
          <span className="status-dot"></span>
          Developer Collaboration Platform
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          ↗ Logout
        </button>
      </nav>

      <main className="container">
        <h1>Project Workspace</h1>
        <p>
          Welcome, {user.name}! Manage your project files and notes in one place.
        </p>

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
            <button disabled={loading || !projectId} onClick={loadFiles}>
              Load Files
            </button>
            <button disabled={loading || !projectId} onClick={loadNotes}>
              Load Notes
            </button>
            <button
              className="secondary-button"
              disabled={loading}
              onClick={() => loadProjects(token)}
            >
              Refresh Projects
            </button>
          </div>
        </section>

        {message && <p className="message">{message}</p>}

        <section className="upload-panel">
          <h2>Upload a File</h2>

          <input
            id="fileInput"
            type="file"
            onChange={(event) =>
              setSelectedFile(event.target.files[0] || null)
            }
          />

          {selectedFile && <p>Selected: {selectedFile.name}</p>}

          <button
            disabled={loading || !projectId}
            onClick={handleUpload}
          >
            {loading ? "Please wait..." : "Upload File"}
          </button>
        </section>

        <section className="file-list">
          <h2>Your Files</h2>

          {files.length === 0 ? (
            <p>No files loaded for this project.</p>
          ) : (
            files.map((file) => (
              <div className="file-item" key={file._id}>
                <div>
                  <h3>📄 {file.fileName}</h3>
                  <p>
                    Uploaded:{" "}
                    {file.createdAt
                      ? new Date(file.createdAt).toLocaleDateString()
                      : "Date unavailable"}
                  </p>
                </div>

                <button
                  disabled={loading}
                  onClick={() => handleDownload(file)}
                >
                  Download
                </button>
              </div>
            ))
          )}
        </section>

        <section className="upload-panel notes-panel">
          <h2>{editingNoteId ? "Edit Note" : "Create a Note"}</h2>

          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            placeholder="Write your project notes here..."
            rows="5"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <div className="action-row">
            <button
              disabled={loading || !projectId}
              onClick={handleSaveNote}
            >
              {loading
                ? "Please wait..."
                : editingNoteId
                  ? "Update Note"
                  : "Save Note"}
            </button>

            {editingNoteId && (
              <button
                className="secondary-button"
                disabled={loading}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="file-list">
          <h2>Your Notes</h2>

          {notes.length === 0 ? (
            <p>No notes loaded for this project.</p>
          ) : (
            notes.map((note) => (
              <div className="file-item note-item" key={note._id}>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.content || "No content"}</p>
                </div>

                <div className="action-row">
                  <button
                    disabled={loading}
                    onClick={() => handleEditNote(note)}
                  >
                    Edit
                  </button>

                  <button
                    className="secondary-button"
                    disabled={loading}
                    onClick={() => handleDeleteNote(note._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;