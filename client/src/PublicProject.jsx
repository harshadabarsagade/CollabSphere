
import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

function PublicProject() {
    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadPublicProject() {
            try {
                const pathParts = window.location.pathname
                    .split("/")
                    .filter(Boolean);

                const token = pathParts[pathParts.length - 1];

                if (!token || token === "public") {
                    throw new Error("Invalid or missing share link.");
                }

                const response = await fetch(
                    `${API_URL}/api/projects/public/${encodeURIComponent(token)}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load shared project."
                    );
                }

                if (!data.project?.title) {
                    throw new Error("Project details were not found.");
                }

                if (isMounted) {
                    setProject(data.project);
                    setFiles(Array.isArray(data.files) ? data.files : []);
                    setNotes(Array.isArray(data.notes) ? data.notes : []);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Something went wrong.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadPublicProject();

        return () => {
            isMounted = false;
        };
    }, []);

    const token = window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop();

    const getPublicFileUrl = (fileId) =>
        `${API_URL}/api/files/public/${encodeURIComponent(token)}/${encodeURIComponent(fileId)}`;

    const isPreviewable = (fileName = "") =>
        /\.(pdf|png|jpe?g|gif|webp)$/i.test(fileName);

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
                {loading ? (
                    <section className="upload-panel">
                        <p>Loading shared project...</p>
                    </section>
                ) : error || !project ? (
                    <section className="upload-panel">
                        <h2>Unable to open project</h2>
                        <p>{error || "Project not found."}</p>
                    </section>
                ) : (
                    <>
                        <section className="upload-panel public-project">
                            <h1 className="public-project-title">
                                {project.title}
                            </h1>

                            <p className="public-description">
                                {project.description ||
                                    "No project description available."}
                            </p>

                            <p>
                                <strong>Shared Project · Read Only</strong>
                            </p>
                        </section>

                        <section className="upload-panel public-content-section">
                            <h2>Uploaded Files ({files.length})</h2>

                            {files.length === 0 ? (
                                <p>No files have been shared.</p>
                            ) : (
                                <ul className="public-file-list">
                                    {files.map((file) => {
                                        const fileUrl = getPublicFileUrl(
                                            file._id
                                        );

                                        return (
                                            <li
                                                key={file._id}
                                                className="public-file-item"
                                            >
                                                <span>{file.fileName}</span>

                                                <div className="public-file-actions">
                                                    {isPreviewable(
                                                        file.fileName
                                                    ) && (
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Preview
                                                        </a>
                                                    )}

                                                    <a
                                                        href={`${fileUrl}?download=true`}
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>

                        <section className="upload-panel public-content-section">
                            <h2>Project Notes ({notes.length})</h2>

                            {notes.length === 0 ? (
                                <p>No notes have been shared.</p>
                            ) : (
                                notes.map((note) => (
                                    <article
                                        key={note._id}
                                        className="public-note"
                                    >
                                        <h3>{note.title || "Untitled Note"}</h3>

                                        <p>
                                            {note.content ||
                                                "No content available."}
                                        </p>

                                        {note.updatedAt && (
                                            <small>
                                                Last updated:{" "}
                                                {new Date(
                                                    note.updatedAt
                                                ).toLocaleString()}
                                            </small>
                                        )}
                                    </article>
                                ))
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default PublicProject;
