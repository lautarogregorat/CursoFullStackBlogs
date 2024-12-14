const bcrypt = require('bcrypt')
const User = require('../models/user')
const mongoose = require('mongoose');
const helper = require('./test_helper')
const assert = require('assert')
const { test, describe , beforeEach, after} = require('node:test');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);


describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

})

describe('user creation validation', () => {
    beforeEach(async () => {
        await User.deleteMany({})
    
        const passwordHash = await bcrypt.hash('password123', 10)
        const user = new User({ username: 'testuser', passwordHash })
    
        await user.save()
      })

    test('creation fails with short username', async () => {
        const newUser = {
          username: 'us',
          name: 'Test User',
          password: 'password123',
        };
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)
    
        assert.strictEqual(result.body.error, 'Username must be at least 3 characters long')
        const users = await User.find({})
        assert.strictEqual(users.length, 1)
      });
    
      test('creation fails with short password', async () => {
        const newUser = {
          username: 'validuser',
          name: 'Test User',
          password: 'pw',
        };
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)
    
        assert.strictEqual(result.body.error, 'Password must be at least 3 characters long')
        const users = await User.find({})
        assert.strictEqual(users.length, 1)

      });
    
      test('creation fails if username is not unique', async () => {
        const newUser = {
          username: 'testuser',
          name: 'Duplicate User',
          password: 'password123',
        };
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)
    
        assert.strictEqual(result.body.error, 'Username must be unique')
        const users = await User.find({})
        assert.strictEqual(users.length, 1)
      })
    
      test('creation succeeds with valid data', async () => {
        const newUser = {
          username: 'newuser',
          name: 'New User',
          password: 'password123',
        };
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        const users = await User.find({})
        assert.strictEqual(users.length, 2)

      })
})

after(() => {
    mongoose.connection.close()
});