require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})


describe('Message API endpoints', () => {
    let testMessageId
    beforeEach((done) => {
        // Create our test message
        const testMessage = new Message({
          title: "Test Message",
          body: "This is a test",
          author: "60188c630a81f04caad72dcc"
        })
        testMessageId = testMessage._id
        testMessage.save()
          .then(() => {
            done()
        })
    })

    afterEach((done) => {
        // Delete our test message from database
        Message.deleteMany({ title: ["Test Message", 'Test Message #2'] })
          .then(() => {
            done()
          })
    })

    it('should load all messages', (done) => {
        // Check that we get our message and return a 200 response.
        chai.request(app)
          .get('/messages')
          .end((error, res) => {
            if(error) done(error)
            expect(res.body.messages).to.be.an("array")
            expect(res).to.have.status(200)
            done()
          })
    })

    it('should get one specific message', (done) => {
      chai.request(app)
        .get('/messages/' + testMessageId)
        .end((error, res) => {
          if(error) done(error)
          expect(res).to.have.status(200)
          done()
        })
    })

    it('should post a new message', (done) => {
      chai.request(app)
        .post('/messages')
        .send({
          title: "Test Message #2",
          body: "This is another test",
          author: "60188c630a81f04caad72dcc"
        })
        .end((error, res) => {
          if(error) done(error)
          expect(res.body.message).to.be.an('object')
          expect(res.body.message).to.have.property('title', 'Test Message #2')
          expect(res).to.have.status(200)

          Message.findOne({title: 'Test Message #2'}).then(message => {
              expect(message).to.be.an('object')
              done()
          })
        })
    })

    it('should update a message', (done) => {
      chai.request(app)
        .put('/messages/' + testMessageId)
        .send({
          title: "Test Message #1",
          body: "This is an updated test",
          author: "60188c630a81f04caad72dcc"
        })
        .end((error, res) => {
          if(error) done(error)
          expect(res.body.updatedMessage).to.be.an('object')
          expect(res).to.have.status(200)
          done()
        })
    })

    it('should delete a message', (done) => {
      chai.request(app)
        .delete('/messages/' + testMessageId)
        .end((error, res) => {
          if(error) done(error)
          expect(res).to.have.status(200)
          expect(res.body.msg).to.equal('The message has been successfully deleted.')
          expect(res.body._id).to.equal(testMessageId.toString())
          done()
        })
    })
})
