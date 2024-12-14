const blogRouter = require('express').Router();
const Blog = require('../models/Blog');
const middleware = require('../utils/middleware');

blogRouter.get('/', middleware.userExtractor, async (request, response) => {

  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

blogRouter.post('/', middleware.userExtractor, async (request, response) => {
  if (!request.body.likes) {
    request.body.likes = 0;
  }

  if (!request.body.title || !request.body.url) {
    response.status(400).end();
    return;
  }

  const user = request.user;

  const blog = new Blog({
    title: request.body.title,
    author: user.username,
    url: request.body.url,
    likes: request.body.likes,
    user: user.id,
  });
  const result = await blog.save();
  user.blogs = user.blogs.concat(result._id);
  await user.save();
  response.status(201).json(result);
});

blogRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const user = request.user;

  const blog = await Blog.findById(request.params.id);
  if (!blog) {
    return response.status(404).json({ error: 'blog not found' });
  }

  if (blog.user.toString() !== user.id.toString()) {
    return response.status(401).json({ error: 'only the creator can delete this blog' });
  }

  await Blog.deleteOne({ _id: request.params.id });
  response.status(204).end();
});

blogRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true });
  response.json(updatedBlog);
});

module.exports = blogRouter;
