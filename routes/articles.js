const express = require('express')
const Article = require('./../models/article')
const User = require("./../models/user")
const router = express.Router()

router.get('/new', function(req, res){
  res.render('articles/new', { article: new Article() })
})
router.get('/myArticle',  async (req, res) => {
     if (req.isAuthenticated()){
          const articles=await Article.find();
          const sessionID=req.session.passport.user;
          res.render("articles/myArticle",{articles:articles, sessionID:sessionID});
     } else{
          res.render("home");
     }
})
router.get('/edit/:id', async (req, res) => {
     if (req.isAuthenticated()){
          const article = await Article.findOne({ _id: req.params.id , username: req.session.passport.user})
          if (article == null) {
               res.redirect('/')
          }
          res.render('articles/edit', { article: article })
     } else{
          res.render("home");
     }

})

router.get('/:slug', async (req, res) => {
     if (req.isAuthenticated()){
          const article = await Article.findOne({ slug: req.params.slug })
          if (article == null) res.redirect('/')
          res.render('articles/show', { article: article })
     } else{
          res.render("home");
     }
})

router.post('/', async (req, res, next) => {
  req.article = new Article()
  next()
}, saveArticleAndRedirect('new'))

router.put('/:id', async (req, res, next) => {
  req.article = await Article.findById(req.params.id)
  next()
}, saveArticleAndRedirect('edit'))

router.delete('/:id', async (req, res) => {
  await Article.findByIdAndDelete(req.params.id)
  res.redirect('myArticle')
})

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;

    article.title = req.body.title
    article.description = req.body.description
    article.markdown = req.body.markdown
    article.username=req.session.passport.user;

    try {
      article = await article.save()
      res.redirect(`/articles/${article.slug}`)
    } catch (e) {
      res.render(`articles/${path}`, { article: article })
    }
  }
}

module.exports = router
