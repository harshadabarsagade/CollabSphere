import { useState } from "react";
import "./App.css";
import {
  getProjectFiles,
  uploadProjectFile,
  downloadProjectFile,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
} from "./api";

function App() {
  const [projectId, setProjectId] = useState("");
  const [token, setToken] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadFiles() {
    if (!projectId.trim() || !token.trim()) {
      setMessage("Enter Project ID and login token.");
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
    if (!projectId.trim() || !token.trim()) {
      setMessage("Enter Project ID and login token first.");
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

  async function handleUpload() {
    if (!projectId.trim() || !token.trim()) {
      setMessage("Enter Project ID and login token first.");
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

      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";

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
    if (!projectId.trim() || !token.trim()) {
      setMessage("Enter Project ID and login token first.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a note title.");
      return;
    }

    try {
      setLoading(true);

      if (editingNoteId) {
        await updateProjectNote(
          editingNoteId,
          title,
          content,
          token
        );
        setMessage("Note updated successfully!");
      } else {
        await createProjectNote(
          projectId,
          title,
          content,
          token
        );
        setMessage("Note created successfully!");
      }

      setTitle("");
      setContent("");
      setEditingNoteId(null);

      const data = await getProjectNotes(projectId, token);
      setNotes(data);
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
    setMessage("Edit the note and click Save Note.");
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

  return (
    <div className="app">
      <nav className="navbar">
        <h2>CollabSphere</h2>
        <span>Developer Collaboration Platform</span>
      </nav>

      <main className="container">
        <h1>Project Workspace</h1>
        <p>Manage your project files and notes in one place.</p>

        <section className="upload-panel">
          <h2>Connect to your project</h2>

          <input
            type="text"
            placeholder="Enter Project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter login token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <div className="action-row">
            <button disabled={loading} onClick={loadFiles}>
              Load Files
            </button>
            <button disabled={loading} onClick={loadNotes}>
              Load Notes
            </button>
          </div>
        </section>

        {message && <p className="message">{message}</p>}

        <section className="upload-panel">
          <h2>Upload a file</h2>

          <input
            id="fileInput"
            type="file"
            onChange={(e) =>
              setSelectedFile(e.target.files[0] || null)
            }
          />

          {selectedFile && <p>Selected: {selectedFile.name}</p>}

          <button disabled={loading} onClick={handleUpload}>
            {loading ? "Please wait..." : "Upload File"}
          </button>
        </section>

        <section className="file-list">
          <h2>Your Files</h2>

          {files.length === 0 ? (
            <p>No files loaded. Click Load Files.</p>
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
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Write your project notes here..."
            rows="5"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="action-row">
            <button disabled={loading} onClick={handleSaveNote}>
              {loading
                ? "Please wait..."
                : editingNoteId
                  ? "Update Note"
                  : "Save Note"}
            </button>

            {editingNoteId && (
              <button
                disabled={loading}
                className="secondary-button"
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
            <p>No notes loaded. Click Load Notes.</p>
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
                    disabled={loading}
                    className="secondary-button"
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