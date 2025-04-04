console.log("Username from localStorage:", localStorage.getItem('username'));


const username = localStorage.getItem('username');
if (!username) window.location.href = "login.html"; // Redirect if not logged in

document.getElementById('welcomeMessage').textContent = `Welcome, ${username}!`;

// Load user data: wallet key + personal posts
fetch(`http://localhost:3001/getUserData/${username}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById('walletKey').textContent = data.privateKey;

    const yourPosts = document.getElementById('yourPosts');
    yourPosts.innerHTML = data.posts.map(post => `
      <div class="card mb-3">
        <div class="card-body">
          <p class="card-text">${post.content}</p>
          <small>${new Date(post.createdAt).toLocaleString()}</small><br>
          <button class="btn btn-sm btn-outline-info mt-2" onclick="editPost('${post._id}', '${post.content.replace(/'/g, "\\'")}')">Edit</button>
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="deletePost('${post._id}')">Delete</button>
        </div>
      </div>
    `).join('');
  });

// Load timeline posts
fetch('http://localhost:3001/getAllPosts')
  .then(res => res.json())
  .then(posts => {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = posts.map(post => `
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-subtitle mb-2 text-muted">
            @${post.authorUsername}<br>
            <small class="text-secondary">🔐 ${post.publicKey}</small>
          </h6>

          <p class="card-text">${post.content}</p>
          <small>${new Date(post.createdAt).toLocaleString()}</small>
        </div>
      </div>
    `).join('');
  });

// Create post
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('postContent').value;

  const res = await fetch('http://localhost:3001/createPost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorUsername: username, content })
  });

  if (res.ok) {
    alert("Post created!");
    location.reload();
  } else {
    alert("Error creating post.");
  }
});


// Delete post
async function deletePost(id) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  const res = await fetch(`http://localhost:3001/deletePost/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  if (res.ok) {
    alert("Post deleted.");
    location.reload();
  } else {
    alert("Could not delete post.");
  }
}

// Edit post
async function editPost(id, currentContent) {
  const newContent = prompt("Edit your post:", currentContent);
  if (!newContent || newContent.trim() === currentContent) return;

  const res = await fetch(`http://localhost:3001/updatePost/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content: newContent })
  });

  if (res.ok) {
    alert("Post updated!");
    location.reload();
  } else {
    alert("Update failed.");
  }
}

function logout() {
  localStorage.removeItem('username');
}
