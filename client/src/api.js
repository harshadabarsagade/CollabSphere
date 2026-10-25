const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function handleResponse(response, defaultMessage) {
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid server response (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

// Authentication
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response, "Login failed");
}

export async function registerUser({ name, email, password }) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  return handleResponse(response, "Registration failed");
}

// Projects
export async function getMyProjects(token) {
  const response = await fetch(`${API_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response, "Could not load projects");
  return data.projects || [];
}

export async function createProject(project, token) {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });

  return handleResponse(response, "Could not create project");
}

export async function shareProject(projectId, token) {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse(response, "Could not share project");
}

// Files
export async function getProjectFiles(projectId, token) {
  const response = await fetch(
    `${API_URL}/api/files/project/${projectId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await handleResponse(response, "Could not load files");
  return data.files || [];
}

export async function uploadProjectFile(projectId, selectedFile, token) {
  const formData = new FormData();
  formData.append("projectId", projectId);
  formData.append("file", selectedFile);

  const response = await fetch(`${API_URL}/api/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await handleResponse(response, "Upload failed");
  return data.file;
}

export async function downloadProjectFile(fileId, token, fileName) {
  const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await handleResponse(response, "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "project-file";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}



export async function getFileContent(fileId, token) {
  const response = await fetch(
    `${API_URL}/api/files/content/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response, "Could not read file content");
}



// Notes
export async function getProjectNotes(projectId, token) {
  const response = await fetch(
    `${API_URL}/api/notes/project/${projectId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await handleResponse(response, "Could not load notes");
  return data.notes || [];
}

export async function createProjectNote(note, token) {
  const response = await fetch(`${API_URL}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(note),
  });

  return handleResponse(response, "Could not create note");
}

export async function updateProjectNote(noteId, note, token) {
  const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(note),
  });

  return handleResponse(response, "Could not update note");
}

export async function deleteProjectNote(noteId, token) {
  const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse(response, "Could not delete note");
}

// Gemini AI
export async function generateAIResponse(payload, token) {
  const response = await fetch(`${API_URL}/api/gemini`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response, "AI request failed");
}

export async function explainContent(content, token) {
  const response = await fetch(`${API_URL}/api/gemini/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await handleResponse(response, "Could not explain content");
  return data.response;
}

export async function generateProjectDocs(content, token) {
  const response = await fetch(`${API_URL}/api/gemini/docs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await handleResponse(
    response,
    "Could not generate documentation"
  );
  return data.response;
}

export async function generateProjectReadme(content, token) {
  const response = await fetch(`${API_URL}/api/gemini/readme`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await handleResponse(response, "Could not generate README");
  return data.response;
}
