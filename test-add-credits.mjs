// Test script to add credits
async function addCredits() {
  try {
    const response = await fetch('http://localhost:8080/api/admin/add-credits', {
      method: 'POST',
      headers: {
        'x-admin-key': 'launchforge-admin-secret-2024',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'karim moh',
        amount: 500,
      }),
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Error:', error);
  }
}

addCredits();
