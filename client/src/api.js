
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getProjectFiles(projectId, token) {
  const response = await fetch(
    `${API_URL}/api/files/project/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load files");
  }

  return data.files || [];
}

export async function uploadProjectFile(projectId, selectedFile, token) {
  const formData = new FormData();
  formData.append("projectId", projectId);
  formData.append("file", selectedFile);

  const response = await fetch(`${API_URL}/api/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data.file;
}

export async function downloadProjectFile(fileId, token, fileName) {
  const response = await fetch(
    `${API_URL}/api/files/download/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "project-file";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function getProjectNotes(projectId, token) {
  const response = await fetch(
    `${API_URL}/api/notes/project/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load notes");
  }

  return data.notes || [];
}

export async function createProjectNote(projectId, title, content, token) {
  const response = await fetch(`${API_URL}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, title, content }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not create note");
  }

  return data.note;
}

export async function updateProjectNote(noteId, title, content, token) {
  const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not update note");
  }

  return data.note;
}

export async function deleteProjectNote(noteId, token) {
  const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not delete note");
  }

  return data;
}