// integration.test.js — Extended testing for BlockConnect
const request = require('supertest');
const app = require('./server');
const connectToMongoDB = require('./mongo');

let db;

const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Str0ngP@ssword!'
};

let privateKey;
let createdPostId;

beforeAll(async () => {
  db = await connectToMongoDB();
});

afterAll(async () => {
  if (db) await db.client.close();
});

describe('Registration and login process', () => {
  test('should allow a user to register', async () => {
    const res = await request(app).post('/saveUserData').send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.privateKey).toBeDefined();
    privateKey = res.body.privateKey;
  });

  test('should allow login with correct credentials', async () => {
    const res = await request(app).post('/login').send({
      username: testUser.username,
      password: testUser.password
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(testUser.username);
  });

  test('should fail login if location changes and no wallet key is provided', async () => {
    const users = db.collection('users');
    await users.updateOne(
      { username: testUser.username },
      { $set: { lastLoginLocation: { city: 'Paris', country: 'FR' } } }
    );

    const res = await request(app).post('/login').send({
      username: testUser.username,
      password: testUser.password
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.requireWalletKey).toBe(true);
  });

  test('should succeed login from new location if wallet key is correct', async () => {
    const res = await request(app).post('/login').send({
      username: testUser.username,
      password: testUser.password,
      walletKey: privateKey
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(testUser.username);
  });
});

describe('Post creation, editing, deletion, and timeline', () => {
  test('should allow user to create a post', async () => {
    const res = await request(app).post('/createPost').send({
      authorUsername: testUser.username,
      content: 'This is a test post for integration testing.'
    });
    expect(res.statusCode).toBe(201);
  });

  test('should retrieve the new post from timeline', async () => {
    const res = await request(app).get('/getAllPosts');
    expect(res.statusCode).toBe(200);
    const found = res.body.find(post => post.content.includes('integration testing'));
    expect(found).toBeTruthy();
    createdPostId = found._id; // Store the post ID for later tests
  });

  test('should allow user to edit their post', async () => {
    const res = await request(app).put(`/updatePost/${createdPostId}`).send({
      content: 'This is the updated content.',
      username: testUser.username
    });
    expect(res.statusCode).toBe(200);
  });

  test('should allow user to delete their post', async () => {
    const res = await request(app).delete(`/deletePost/${createdPostId}`).send({
      username: testUser.username
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('Password reset flow', () => {
  test('should allow user to reset password with valid wallet key', async () => {
    const newPassword = 'NewP@ssword123!';
    const res = await request(app).post('/change-password').send({
      username: testUser.username,
      privateKey: privateKey,
      newPassword: newPassword
    });
    expect(res.statusCode).toBe(200);
  });

  test('should allow login with new password after reset', async () => {
    const res = await request(app).post('/login').send({
      username: testUser.username,
      password: 'NewP@ssword123!',
      walletKey: privateKey
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(testUser.username);
  });
});

describe('Wallet key email reminder', () => {
  test('should respond with success message even if email is not in system', async () => {
    const res = await request(app).post('/send-wallet-reminder').send({
      email: 'nonexistent@example.com'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/you will be sent a reminder email/i);
  });

  test('should send a wallet key reminder to registered user email', async () => {
    const res = await request(app).post('/send-wallet-reminder').send({
      email: testUser.email
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/you will be sent a reminder email/i);
  });
});
