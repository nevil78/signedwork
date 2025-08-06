// Test script to create work entry
const fetch = require('node-fetch');

async function testWorkEntryCreation() {
  try {
    console.log('1. Testing work entry creation...');
    
    // Test data - using the company ID from the database
    const workEntryData = {
      title: "Test Work Entry from Script",
      description: "Testing work entry creation directly",
      startDate: "2025-08-06",
      priority: "medium",
      status: "pending", 
      workType: "task",
      billable: false,
      companyId: "4ebef9ff-1805-4b52-a4b7-36069ca36749", // from database query
      employeeId: "c375d8d1-dadf-4119-95be-0857444938cb" // from database query
    };

    console.log('2. Work entry data:', workEntryData);
    
    // Test the insertion directly
    const response = await fetch('http://localhost:5000/api/work-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workEntryData)
    });

    console.log('3. Response status:', response.status);
    
    const result = await response.text();
    console.log('4. Response body:', result);
    
    if (response.ok) {
      console.log('✅ Work entry created successfully!');
    } else {
      console.log('❌ Work entry creation failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkEntryCreation();