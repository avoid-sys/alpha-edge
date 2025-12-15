// Simple test for localDataService
import { localDataService } from './src/services/localDataService.js';

async function testAuth() {
    console.log('Testing localDataService auth...');

    // Test setting user
    const testUser = {email: 'test@example.com', full_name: 'Test User'};
    await localDataService.setCurrentUser(testUser);
    console.log('User set:', testUser);

    // Test getting user
    const retrievedUser = await localDataService.getCurrentUser();
    console.log('User retrieved:', retrievedUser);

    // Test logout
    await localDataService.logout();
    const userAfterLogout = await localDataService.getCurrentUser();
    console.log('User after logout:', userAfterLogout);
}

testAuth();
