document.getElementById('changePasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const form = event.target;
    const username = form.username.value.trim();
    const privateKey = form.privateKey.value.trim();
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

  
    // Check that passwords match
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, privateKey, newPassword })
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert(result.message || "Password changed successfully!");
        window.location.href = "login.html";
      } else {
        alert(result.message || "An error occurred.");
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
  });

  //If the user had forgotten their private key, they can reset it here.
  document.getElementById('walletReminderForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const email = event.target.email.value.trim();
  
    try {
      const res = await fetch('http://localhost:3001/send-wallet-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
  
      const result = await res.json();
      alert(result.message);
      event.target.reset();
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
  });
  
  