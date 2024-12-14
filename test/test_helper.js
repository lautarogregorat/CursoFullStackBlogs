const Blog = require('../models/Blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()


const initialBlogs = [
  {
    title: 'HTML is easy',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Browser can execute only Javascript',
    author: 'Edsger W. Dijkstra',
    url: 'https://www.google.com/',
    likes: 5
  }
]

const nonExistingId = async () => {
  const Blog = new Blog({ content: 'willremovethissoon' })
  await Blog.save()
  await Blog.deleteOne()

  return Blog._id.toString()
}

const BlogsInDb = async () => {
  const Blogs = await Blog.find({})
  return Blogs.map(Blog => Blog.toJSON())
}
const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const logedUser = async () =>{
  const passwordHash = await bcrypt.hash('password', 10)
  const user = new User({ username: 'testuser', passwordHash })
  await user.save()
  const userForToken = {
      username: user.username,
      id: user._id,
}

const token = jwt.sign(userForToken, process.env.SECRET)
return token
}

module.exports = {
  initialBlogs, nonExistingId, BlogsInDb, usersInDb, logedUser
}