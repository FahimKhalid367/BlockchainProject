let walletKeyGlobal = ''; // Store globally so it's accessible in the copy function

// Strong password validation function
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
  }

document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
    };

    try {
        const response = await fetch('http://localhost:3001/saveUserData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            const walletKey = result.privateKey;

            // Store in global variable for access in copy button
            walletKeyGlobal = walletKey;

            // Display the key in the modal
            document.getElementById('walletKeyText').textContent = walletKey;

            // Show the modal
            $('#walletKeyModal').modal('show');

            // Optional: Clear form
            document.getElementById('signupForm').reset();
        } else if (response.status === 409) {
            alert('Username is already taken. Please choose a different one.');
        } else {
            alert('There was a problem saving your data. Please try again.');
        }
    } catch (error) {
        console.error('Request failed:', error);
        alert('Something went wrong. Please try again later.');
    }
});

// ✅ This function runs when the button is clicked — outside submit block
document.getElementById('copyKeyBtn').addEventListener('click', () => {
    if (!walletKeyGlobal) {
        alert("No wallet key to copy.");
        return;
    }

    navigator.clipboard.writeText(walletKeyGlobal).then(() => {
        alert("Private key copied to clipboard!");
    }).catch((err) => {
        console.error("Copy failed:", err);
        alert("Failed to copy. Please copy manually.");
    });
});

// ✅ Modal close logic
function closeWalletKeyModal() {
    $('#walletKeyModal').modal('hide');
    window.location.href = 'login.html';
}


