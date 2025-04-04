// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default page refresh on form submission

    // Extract username and password from the form
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;

    const loginData = { username, password }; // Prepare login data

    try {
        // First attempt to log in without wallet key
        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
        });

        const result = await response.json();

        // If login fails due to location change, prompt for wallet key
        if (response.status === 401 && result.requireWalletKey) {
            const walletKey = prompt("New location detected. Please enter your wallet's private key:");

            // Try logging in again, this time with the wallet key included
            const response2 = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...loginData, walletKey }),
            });

            const result2 = await response2.json();

            if (response2.ok) {
                // ✅ Login successful — store username locally and redirect
                localStorage.setItem('username', result2.username);
                console.log("Saved username:", result2.username); // Debugging log

                window.location.href = 'user-dashboard.html';
            } else {
                // Show message if wallet key is wrong
                alert(result2.message);
            }

        } else if (response.ok) {
            // ✅ Login successful on first try — store username and redirect
            localStorage.setItem('username', result.username);
            console.log("Saved username:", result.username); // Debugging log

            window.location.href = 'user-dashboard.html';
        } else {
            // Show a generic login failure message
            alert(result.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        // Catch and show unexpected errors (e.g., server offline)
        console.error('Login error:', error);
        alert('Something went wrong during login.');
    }
});


