const nodemailer = require("nodemailer");
const Email = require('email-templates');

const user = {
  email: 'nodemailer.d@gmail.com',
  password: 'nODE!mAILER'
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: user.email,
    pass: user.password
  }
});


// const mailObject = {
//   from: '"Fred Foo 👻" <foo@example.com>',
//   to: "bar@example.com, baz@example.com",
//   subject: "Hello ✔",
//   text: "Hello world?",
//   html: "<b>Hello world?</b>"
// }

const sendMail = async () => {

  // { from, to = "alaeddine.messadi@gmail.com", subject, text, html }

  const email = new Email({
    message: {
      from: 'niftylettuce@gmail.com'
    },
    // uncomment below to send emails in development/test env:
    // send: true
    transport: {
      ...transporter,
      jsonTransport: true
    }
  });


  email
    .send({
      template: 'mars',
      message: {
        to: 'alaeddine.messadi@gamil.com'
      },
      locals: {
        name: 'Elon'
      }
    })
    .then(console.log)
    .catch(console.error);


  // send mail with defined transport object
  //   let info = transporter.sendMail({
  //     from: '"Fred Foo 👻" <foo@example.com>',
  //     to,
  //     subject,
  //     text,
  //     html
  //   }).then(info => {
  //     console.log("Message sent ", info);
  //   }).catch(e => {
  //     console.error('Email was not sent', e);
  //   });
}


module.exports = sendMail;