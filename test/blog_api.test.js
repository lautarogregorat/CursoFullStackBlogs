const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/Blog')
const User = require('../models/user')

beforeEach(async () => {
    await User.deleteMany({})
    // borrar indices
    await User.collection.dropIndexes()
    await Blog.deleteMany({})
    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
    const token = await helper.logedUser()
    await api
        .get('/api/blogs')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('verify that the unique identifier property of the blog posts is named id', async () => {
    const token = await helper.logedUser()
    const response = await api.get('/api/blogs').set('Authorization', 'Bearer ' + token)
    console.log("RESPONSE BODY",response.body)
    response.body.forEach(blog => {
        assert.ok(blog.id)
    })
})

test('a valid blog can be added', async () => {
     
    const token = await helper.logedUser()

    const newBlog = {
        title: 'New blog',
        url: 'https://www.google.com/',
        likes: 5
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', 'Bearer ' + token)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs').set('Authorization', 'Bearer ' + token)
    const contents = response.body.map(r => r.title)

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)
    assert(contents.includes('New blog'))
})

test('a invalid blog can not be added', async () => {
    const newBlog = {
        title: 'New blog',
        author: 'New Author',
        likes: 5
    }
    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
        .expect('Content-Type', /application\/json/)
})

test('if the likes property is missing, it will default to 0', async () => {
    const token = await helper.logedUser()
    const newBlog = {
        title: 'Blog without likes',
        author: 'Author without likes',
        url: 'https://www.example.com/'
    }

    const response = await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', 'Bearer ' + token)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.likes, 0)
})

test('blog without title or url is not added', async () => {
    const token = await helper.logedUser()
    const newBlogWithoutTitle = {
        author: 'Author without title',
        url: 'https://www.example.com/',
        likes: 1
    }

    await api
        .post('/api/blogs')
        .send(newBlogWithoutTitle)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)

    const newBlogWithoutUrl = {
        title: 'Blog without url',
        author: 'Author without url',
        likes: 1
    }

    await api
        .post('/api/blogs')
        .send(newBlogWithoutUrl)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
})

test('a blog can be deleted', async () => {
    const token = await helper.logedUser()
    const blogsAtStart = await helper.BlogsInDb()
    const blogToDelete = blogsAtStart[0]
    // al primer blog agregar el usuario
    const user = await User.findOne({ username: 'testuser' })
    
    blogToDelete.user = user._id
    await Blog.findByIdAndUpdate(blogToDelete.id, blogToDelete)

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', 'Bearer ' + token)
        .expect(204)

    const blogsAtEnd = await helper.BlogsInDb()

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

    const contents = blogsAtEnd.map(r => r.title)

    assert(!contents.includes(blogToDelete.title))
})

test('a blog can be updated', async () => {
    const blogsAtStart = await helper.BlogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedBlog = {
        title: 'Updated Title',
        author: 'Updated Author',
        url: 'https://www.updatedurl.com/',
        likes: 10
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .set('Authorization', 'Bearer ' + await helper.logedUser())
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.BlogsInDb()
    const updatedBlogFromDb = blogsAtEnd.find(blog => blog.id === blogToUpdate.id)

    assert.strictEqual(updatedBlogFromDb.title, updatedBlog.title)
    assert.strictEqual(updatedBlogFromDb.author, updatedBlog.author)
    assert.strictEqual(updatedBlogFromDb.url, updatedBlog.url)
    assert.strictEqual(updatedBlogFromDb.likes, updatedBlog.likes)
})

after(() => {
    mongoose.connection.close()
})
