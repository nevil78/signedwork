// Test script to check work entry creation
console.log('Testing work entry creation...');

fetch('/api/auth/user', { credentials: 'include' })
  .then(res => res.json())
  .then(user => {
    console.log('Current user:', user);
    
    if (!user.user) {
      console.log('Not authenticated. Please login first.');
      return;
    }
    
    const testData = {
      title: "Test Entry from Console",
      description: "Testing work entry creation",
      startDate: "2025-01-06",
      endDate: "",
      priority: "medium",
      estimatedHours: 100,
      actualHours: 90,
      companyId: "223930bd-7686-4e4f-b49e-d39e7b613a8d"
    };
    
    console.log('Sending data:', testData);
    
    return fetch('/api/work-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(testData)
    });
  })
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response data:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
