const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendwelcomeEmail = (email, name) => {
  sgMail
    .send({
      to: email,
      from: "pritomsaha24.ps@gmail.com",
      subject: "welcome message",
      text: `hello ${name} thanks for joining us welcome to task-manager`,
    })
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error.response.body);
    });
};

const sendCanceletionEmail = (email, name) => {
  sgMail
    .send({
      to: email,
      from: "pritomsaha24.ps@gmail.com",
      subject: "cancel confirmation",
      text: `dear ${name}you have made a cancel decesion`,
    })
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error.response.body);
    });
};

module.exports = {
  sendwelcomeEmail,
  sendCanceletionEmail,
};
