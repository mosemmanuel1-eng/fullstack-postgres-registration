const form = document.querySelector("#registration-form");
const nameInput = document.querySelector("#name");
const message = document.querySelector("#message");
const usersList = document.querySelector("#users-list");
const refreshButton = document.querySelector("#refresh-button");

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function loadUsers() {
  const response = await fetch("/api/users");
  const data = await response.json();
  usersList.innerHTML = "";
  if (!data.users.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "No registrations yet.";
    usersList.append(emptyItem);
    return;
  }
  for (const user of data.users) {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    const createdAt = document.createElement("time");
    name.textContent = user.name;
    createdAt.dateTime = user.created_at;
    createdAt.textContent = formatDate(user.created_at);
    item.append(name, createdAt);
    usersList.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("Saving registration...", "success");
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.value })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage(data.message || "Registration failed.", "error");
      return;
    }
    showMessage(data.message, "success");
    form.reset();
    nameInput.focus();
    await loadUsers();
  } catch {
    showMessage("Could not reach the backend server.", "error");
  }
});

refreshButton.addEventListener("click", loadUsers);
loadUsers();
