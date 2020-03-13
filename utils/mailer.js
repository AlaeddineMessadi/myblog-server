const nodemailer = require("nodemailer");
const ejs = require("ejs");

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

//Verifying the Nodemailer Transport instance
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Server Nodemailer is ready to take messages');
  }
});



const sendMail = async (objecMail, data) => {
  const { from, to, subject } = objecMail;
  const { name, activationLink, text, button } = data;

  const responseHTML = await ejs.renderFile(__dirname + "/emails/activation.ejs", { data: { name, activationLink, text, button } });

  if (!responseHTML) {
    console.log(responseHTML['error']);
  } else {
    var mainOptions = {
      from: `"MyBlog 👻"${from}`,
      to,
      subject,
      html: responseHTML
    };

    const responseSendMail = await transporter.sendMail(mainOptions);

    if (!responseSendMail) {
      console.log('EMAIL NOT SENT', responseSendMail['err']);
    } else {
      console.log('EMAIL IS SENT');
    }
  }
}


module.exports = sendMail;