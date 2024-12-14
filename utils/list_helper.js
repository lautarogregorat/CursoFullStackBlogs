const _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) return null
    return blogs.reduce((max, blog) => max.likes > blog.likes ? max : blog)
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) return null
    const authorsCount = _.countBy(blogs, 'author')
    const author = _.maxBy(Object.keys(authorsCount), (author) => authorsCount[author])
    return { author, blogs: authorsCount[author] }
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) return null
    const likesByAuthor = _.groupBy(blogs, 'author')
    const author = _.maxBy(Object.keys(likesByAuthor), (author) => totalLikes(likesByAuthor[author]))
    return { author, likes: totalLikes(likesByAuthor[author]) }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}